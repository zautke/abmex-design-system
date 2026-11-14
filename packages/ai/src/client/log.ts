import { EventEnvelopeSchema, type EventEnvelope } from '../events.js';
import { hashEvent, sha256Hex } from '../hash.js';
import { openLogDb, originOf, readMeta, type LogDb, type LogEventRow, type LogMeta, type OpenLogOptions } from './db.js';
import { Broadcast, type LogChange } from './subscribe.js';
import * as v from 'valibot';

export interface AppendResult {
  firstSeq: number;
  lastSeq: number;
}

export interface Digest {
  aggregate: string;
  count: number;
  maxSeq: number;
  sha256: string;
}

/**
 * The log handle: append (strict tx, C1), ranged reads, cursor, pending count and digest. Folds,
 * sweep and push are separate modules that take a `Log`.
 */
export class Log {
  readonly name: string;
  readonly broadcast: Broadcast;
  private db: LogDb;
  private metaCache: LogMeta | undefined;

  private constructor(name: string, db: LogDb, broadcast: Broadcast) {
    this.name = name;
    this.db = db;
    this.broadcast = broadcast;
  }

  static async open(opts: OpenLogOptions & { broadcast?: Broadcast }): Promise<Log> {
    const db = await openLogDb(opts);
    const log = new Log(opts.name, db, opts.broadcast ?? new Broadcast(opts.name));
    // Not awaited and never blocking: eviction protection is best-effort (plan §B2 gotcha 5).
    void globalThis.navigator?.storage?.persist?.().catch(() => undefined);
    return log;
  }

  async meta(): Promise<LogMeta> {
    return (this.metaCache ??= await readMeta(this.db));
  }

  async origin(): Promise<string> {
    return originOf(await this.meta());
  }

  /**
   * Append validated envelopes in ONE transaction with `durability: 'strict'`: either every event is
   * on disk or none is. Hashes are computed before the transaction opens (WebCrypto is async and an
   * IDB transaction auto-commits across non-IDB awaits). Posts one broadcast per aggregate after commit.
   */
  async append(events: EventEnvelope[]): Promise<AppendResult> {
    if (events.length === 0) throw new Error('append: no events');
    const rows: Array<Omit<LogEventRow, 'seq'>> = [];
    for (const e of events) {
      const parsed = v.parse(EventEnvelopeSchema, e);
      rows.push({ ...parsed, hash: parsed.hash ?? (await hashEvent(parsed)) });
    }
    const tx = this.db.transaction('events', 'readwrite', { durability: 'strict' });
    const seqs: number[] = [];
    for (const row of rows) seqs.push((await tx.store.add(row as LogEventRow)) as number);
    await tx.done;
    const firstSeq = seqs[0]!;
    const lastSeq = seqs[seqs.length - 1]!;
    const touched = new Map<string, number>();
    rows.forEach((r, i) => touched.set(r.aggregate, seqs[i]!));
    for (const [aggregate, seq] of touched) this.broadcast.post({ kind: 'append', aggregate, seq });
    return { firstSeq, lastSeq };
  }

  /** Events of one aggregate with `seq > after`, ascending. */
  async readAggregate(aggregate: string, after = 0, limit = Infinity): Promise<LogEventRow[]> {
    const range = IDBKeyRange.bound([aggregate, after + 1], [aggregate, Number.MAX_SAFE_INTEGER]);
    const out: LogEventRow[] = [];
    let cursor = await this.db.transaction('events').store.index('by-aggregate').openCursor(range);
    while (cursor && out.length < limit) {
      out.push(cursor.value);
      cursor = await cursor.continue();
    }
    return out;
  }

  /** Events with `seq > after` across aggregates, ascending, byte-capped for a push batch. */
  async readAfter(after: number, maxBytes: number, maxCount = 2000): Promise<LogEventRow[]> {
    const out: LogEventRow[] = [];
    let bytes = 0;
    let cursor = await this.db.transaction('events').store.openCursor(IDBKeyRange.lowerBound(after, true));
    while (cursor && out.length < maxCount) {
      const row = cursor.value;
      const size = approxBytes(row);
      if (out.length > 0 && bytes + size > maxBytes) break;
      out.push(row);
      bytes += size;
      cursor = await cursor.continue();
    }
    return out;
  }

  /** Every aggregate id that has at least one event (for list folds). */
  async aggregates(prefix = ''): Promise<string[]> {
    const seen = new Set<string>();
    const idx = this.db.transaction('events').store.index('by-aggregate');
    let cursor = await idx.openKeyCursor(prefix ? IDBKeyRange.bound([prefix, 0], [prefix + '￿', Number.MAX_SAFE_INTEGER]) : undefined);
    while (cursor) {
      const agg = cursor.key[0];
      if (!seen.has(agg)) seen.add(agg);
      // Jump to the next aggregate instead of walking every event.
      cursor = await cursor.continue([agg + '\0', 0]);
    }
    return [...seen];
  }

  async maxSeq(): Promise<number> {
    const cursor = await this.db.transaction('events').store.openKeyCursor(null, 'prev');
    return cursor ? (cursor.key as number) : 0;
  }

  async ackedSeq(): Promise<number> {
    return (await this.meta()).ackedSeq;
  }

  /** Honest pending count (C1): events not yet acked by the gateway, optionally per aggregate. */
  async pendingCount(aggregate?: string): Promise<number> {
    const acked = await this.ackedSeq();
    if (aggregate) {
      return this.db.transaction('events').store.index('by-aggregate').count(IDBKeyRange.bound([aggregate, acked + 1], [aggregate, Number.MAX_SAFE_INTEGER]));
    }
    return this.db.transaction('events').store.count(IDBKeyRange.lowerBound(acked, true));
  }

  /** Advance the replication cursor in a strict tx; never moves backwards. */
  async setAckedSeq(seq: number): Promise<void> {
    const tx = this.db.transaction('meta', 'readwrite', { durability: 'strict' });
    const current = Number((await tx.store.get('ackedSeq')) ?? 0);
    if (seq > current) await tx.store.put(seq, 'ackedSeq');
    await tx.done;
    if (seq > current) {
      if (this.metaCache) this.metaCache.ackedSeq = seq;
      this.broadcast.post({ kind: 'ack', ackedSeq: seq });
    }
  }

  async setMeta<K extends keyof LogMeta>(key: K, value: LogMeta[K]): Promise<void> {
    const tx = this.db.transaction('meta', 'readwrite', { durability: 'strict' });
    await tx.store.put(value, key);
    await tx.done;
    if (this.metaCache) this.metaCache[key] = value;
  }

  /**
   * Verify contract (C15): per aggregate over `seq <= upTo`, count, maxSeq and sha256 of the
   * concatenated event hashes in seq order. The gateway computes the same over its copy.
   */
  async digest(upTo?: number): Promise<Digest[]> {
    const limit = upTo ?? (await this.ackedSeq());
    const chains = new Map<string, { hashes: string[]; maxSeq: number }>();
    let cursor = await this.db.transaction('events').store.openCursor(IDBKeyRange.upperBound(limit));
    while (cursor) {
      const row = cursor.value;
      const c = chains.get(row.aggregate) ?? { hashes: [], maxSeq: 0 };
      c.hashes.push(row.hash);
      c.maxSeq = row.seq;
      chains.set(row.aggregate, c);
      cursor = await cursor.continue();
    }
    const out: Digest[] = [];
    for (const [aggregate, c] of [...chains].sort(([a], [b]) => (a < b ? -1 : 1))) {
      out.push({ aggregate, count: c.hashes.length, maxSeq: c.maxSeq, sha256: await sha256Hex(c.hashes.join('')) });
    }
    return out;
  }

  /** Subscribe to appends/acks from any context of this origin; returns an unsubscribe fn. */
  subscribe(cb: (change: LogChange) => void): () => void {
    return this.broadcast.on(cb);
  }

  close(): void {
    this.db.close();
    this.broadcast.close();
  }

  /** Delete the whole database (lab/negative tests only). A later open mints a NEW origin. */
  static async destroy(name: string): Promise<void> {
    const { deleteDB } = await import('idb');
    await deleteDB(name);
  }
}

function approxBytes(row: LogEventRow): number {
  const p = row.payload as { bytes?: Uint8Array } | undefined;
  const inline = p && p.bytes instanceof Uint8Array ? p.bytes.byteLength * 1.34 : 0;
  return 200 + inline + (inline ? 0 : JSON.stringify(row.payload ?? null).length);
}
