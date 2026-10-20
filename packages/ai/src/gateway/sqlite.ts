import { createHash } from 'node:crypto';
import { mkdirSync, statSync } from 'node:fs';
import { dirname } from 'node:path';
import { DivergedError, MIGRATIONS_SQLITE, type AppendOutcome, type DigestRow, type Store, type StoreHealth, type WireEvent } from './store.js';

type BetterSqlite3Database = import('better-sqlite3').Database;

export interface SqliteStoreOptions {
  /** File path, or `:memory:` for tests. */
  file: string;
  /** darwin: also `fullfsync` + `checkpoint_fullfsync` (plan C7). */
  platform?: NodeJS.Platform;
}

/**
 * SQLite adapter: WAL + `synchronous=FULL` so a committed batch is on disk before the ack (plan C1).
 * better-sqlite3 is synchronous; the async signatures exist for the Postgres twin.
 */
export async function createSqliteStore(opts: SqliteStoreOptions): Promise<Store> {
  const { default: Database } = await import('better-sqlite3');
  if (opts.file !== ':memory:') mkdirSync(dirname(opts.file), { recursive: true });
  const db: BetterSqlite3Database = new Database(opts.file);
  const platform = opts.platform ?? process.platform;
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = FULL');
  db.pragma('busy_timeout = 5000');
  db.pragma('journal_size_limit = 67108864');
  if (platform === 'darwin') {
    db.pragma('fullfsync = ON');
    db.pragma('checkpoint_fullfsync = ON');
  }
  const migrate = db.transaction(() => {
    for (const sql of MIGRATIONS_SQLITE) db.exec(sql);
    db.prepare('INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (1, ?)').run(Date.now());
  });
  migrate();

  const selHash = db.prepare('SELECT hash FROM events WHERE origin = ? AND seq = ?');
  const ins = db.prepare(
    'INSERT OR IGNORE INTO events (origin, seq, aggregate, type, v, ts, payload, hash, received_at, ctx) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const appendTx = db.transaction((origin: string, rows: WireEvent[], ctx: string | null): AppendOutcome => {
    let inserted = 0;
    let duplicates = 0;
    let max = 0;
    const now = Date.now();
    for (const r of rows) {
      const existing = selHash.get(origin, r.seq) as { hash: string } | undefined;
      if (existing) {
        if (existing.hash !== r.hash) throw new DivergedError(origin, r.seq);
        duplicates++;
      } else {
        ins.run(origin, r.seq, r.aggregate, r.type, r.v, r.ts, JSON.stringify(r.payload ?? null), r.hash, now, ctx);
        inserted++;
      }
      if (r.seq > max) max = r.seq;
    }
    return { ackedSeq: max, inserted, duplicates };
  });

  let currentCtx: string | null = null;
  const store: Store & { withCtx(ctx: string | null): Store } = {
    kind: 'sqlite',
    withCtx(ctx) {
      currentCtx = ctx;
      return store;
    },
    async append(origin, rows) {
      // BEGIN IMMEDIATE: the whole batch commits or none of it; FULL sync fsyncs before COMMIT returns.
      return appendTx.immediate(origin, rows, currentCtx);
    },
    async readAfter(origin, after, limit) {
      const rows = db.prepare('SELECT seq, aggregate, type, v, ts, payload, hash FROM events WHERE origin = ? AND seq > ? ORDER BY seq LIMIT ?').all(origin, after, limit) as Array<Omit<WireEvent, 'payload'> & { payload: string }>;
      return rows.map((r) => ({ ...r, payload: JSON.parse(r.payload) }));
    },
    async maxSeq(origin) {
      const r = db.prepare('SELECT COALESCE(MAX(seq), 0) AS m FROM events WHERE origin = ?').get(origin) as { m: number };
      return r.m;
    },
    async digest(origin, upTo) {
      const rows = db.prepare('SELECT aggregate, seq, hash FROM events WHERE origin = ? AND seq <= ? ORDER BY seq').all(origin, upTo) as Array<{ aggregate: string; seq: number; hash: string }>;
      return digestRows(rows);
    },
    async origins() {
      return (db.prepare('SELECT DISTINCT origin FROM events ORDER BY origin').all() as Array<{ origin: string }>).map((r) => r.origin);
    },
    async getCursor(name, origin) {
      const r = db.prepare('SELECT seq FROM cursors WHERE name = ? AND origin = ?').get(name, origin) as { seq: number } | undefined;
      return r?.seq ?? 0;
    },
    async setCursor(name, origin, seq) {
      db.prepare('INSERT INTO cursors (name, origin, seq, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(name, origin) DO UPDATE SET seq = excluded.seq, updated_at = excluded.updated_at').run(name, origin, seq, Date.now());
    },
    async health() {
      const pragma = (p: string) => (db.pragma(p, { simple: true }) as string | number);
      const bytes = opts.file === ':memory:' ? 0 : safeSize(opts.file) + safeSize(`${opts.file}-wal`);
      const origins = (db.prepare('SELECT origin, MAX(seq) AS maxSeq, SUM(LENGTH(payload)) AS bytes FROM events GROUP BY origin').all() as Array<{ origin: string; maxSeq: number; bytes: number }>);
      const h: StoreHealth = {
        store: 'sqlite',
        // Read back, never echoed from config (review A6).
        durability: { journal_mode: pragma('journal_mode'), synchronous: pragma('synchronous'), fullfsync: pragma('fullfsync'), file_bytes: bytes },
        origins: origins.map((o) => ({ origin: o.origin, maxSeq: o.maxSeq, bytes: o.bytes ?? 0 })),
      };
      return h;
    },
    async close() {
      db.close();
    },
  };
  return store;
}

function safeSize(file: string): number {
  try {
    return statSync(file).size;
  } catch {
    return 0;
  }
}

/** Shared by both adapters: per-aggregate count, maxSeq, sha256 of concatenated hashes in seq order. */
export function digestRows(rows: Array<{ aggregate: string; seq: number; hash: string }>): DigestRow[] {
  const chains = new Map<string, { h: ReturnType<typeof createHash>; count: number; maxSeq: number }>();
  for (const r of rows) {
    const c = chains.get(r.aggregate) ?? { h: createHash('sha256'), count: 0, maxSeq: 0 };
    c.h.update(r.hash);
    c.count++;
    c.maxSeq = r.seq;
    chains.set(r.aggregate, c);
  }
  return [...chains]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([aggregate, c]) => ({ aggregate, count: c.count, maxSeq: c.maxSeq, sha256: c.h.digest('hex') }));
}
