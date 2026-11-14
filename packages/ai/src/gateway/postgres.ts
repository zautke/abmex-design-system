import { digestRows } from './sqlite.js';
import { DivergedError, MIGRATIONS_POSTGRES, type AppendOutcome, type Store, type StoreHealth, type WireEvent } from './store.js';

export interface PostgresStoreOptions {
  connectionString: string;
}

/** Postgres adapter: same contract as SQLite; `synchronous_commit` is asserted at open (review A7). */
export async function createPostgresStore(opts: PostgresStoreOptions): Promise<Store> {
  const { default: pg } = await import('pg');
  const pool = new pg.Pool({ connectionString: opts.connectionString, max: 4 });
  const client = await pool.connect();
  try {
    const sc = await client.query('SHOW synchronous_commit');
    const value = String(sc.rows[0]?.synchronous_commit ?? '');
    if (value !== 'on' && value !== 'remote_apply') throw new Error(`postgres synchronous_commit is '${value}'; 'on' is required for "saved" to mean fsynced`);
    await client.query('BEGIN');
    for (const sql of MIGRATIONS_POSTGRES) await client.query(sql);
    await client.query('INSERT INTO schema_migrations (id, applied_at) VALUES (1, $1) ON CONFLICT DO NOTHING', [Date.now()]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => undefined);
    client.release();
    await pool.end();
    throw e;
  }
  client.release();

  let currentCtx: string | null = null;
  const store: Store & { withCtx(ctx: string | null): Store } = {
    kind: 'postgres',
    withCtx(ctx) {
      currentCtx = ctx;
      return store;
    },
    async append(origin, rows): Promise<AppendOutcome> {
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        let inserted = 0;
        let duplicates = 0;
        let max = 0;
        const now = Date.now();
        for (const r of rows) {
          const ex = await c.query('SELECT hash FROM events WHERE origin = $1 AND seq = $2', [origin, r.seq]);
          const existing = ex.rows[0] as { hash: string } | undefined;
          if (existing) {
            if (existing.hash !== r.hash) throw new DivergedError(origin, r.seq);
            duplicates++;
          } else {
            await c.query(
              'INSERT INTO events (origin, seq, aggregate, type, v, ts, payload, hash, received_at, ctx) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING',
              [origin, r.seq, r.aggregate, r.type, r.v, r.ts, JSON.stringify(r.payload ?? null), r.hash, now, currentCtx],
            );
            inserted++;
          }
          if (r.seq > max) max = r.seq;
        }
        await c.query('COMMIT');
        return { ackedSeq: max, inserted, duplicates };
      } catch (e) {
        await c.query('ROLLBACK').catch(() => undefined);
        throw e;
      } finally {
        c.release();
      }
    },
    async readAfter(origin, after, limit) {
      const r = await pool.query('SELECT seq, aggregate, type, v, ts, payload, hash FROM events WHERE origin = $1 AND seq > $2 ORDER BY seq LIMIT $3', [origin, after, limit]);
      return r.rows.map((row: Record<string, unknown>) => ({ ...(row as unknown as WireEvent), seq: Number(row.seq), ts: Number(row.ts) }));
    },
    async maxSeq(origin) {
      const r = await pool.query('SELECT COALESCE(MAX(seq), 0) AS m FROM events WHERE origin = $1', [origin]);
      return Number(r.rows[0]?.m ?? 0);
    },
    async digest(origin, upTo) {
      const r = await pool.query('SELECT aggregate, seq, hash FROM events WHERE origin = $1 AND seq <= $2 ORDER BY seq', [origin, upTo]);
      return digestRows(r.rows.map((x: Record<string, unknown>) => ({ aggregate: String(x.aggregate), seq: Number(x.seq), hash: String(x.hash) })));
    },
    async origins() {
      const r = await pool.query('SELECT DISTINCT origin FROM events ORDER BY origin');
      return r.rows.map((x: { origin: string }) => x.origin);
    },
    async getCursor(name, origin) {
      const r = await pool.query('SELECT seq FROM cursors WHERE name = $1 AND origin = $2', [name, origin]);
      return Number(r.rows[0]?.seq ?? 0);
    },
    async setCursor(name, origin, seq) {
      await pool.query('INSERT INTO cursors (name, origin, seq, updated_at) VALUES ($1,$2,$3,$4) ON CONFLICT (name, origin) DO UPDATE SET seq = EXCLUDED.seq, updated_at = EXCLUDED.updated_at', [name, origin, seq, Date.now()]);
    },
    async health(): Promise<StoreHealth> {
      const sc = await pool.query('SHOW synchronous_commit');
      const o = await pool.query('SELECT origin, MAX(seq) AS max_seq, SUM(octet_length(payload::text)) AS bytes FROM events GROUP BY origin');
      return {
        store: 'postgres',
        durability: { synchronous_commit: String(sc.rows[0]?.synchronous_commit) },
        origins: o.rows.map((x: Record<string, unknown>) => ({ origin: String(x.origin), maxSeq: Number(x.max_seq), bytes: Number(x.bytes ?? 0) })),
      };
    },
    async close() {
      await pool.end();
    },
  };
  return store;
}
