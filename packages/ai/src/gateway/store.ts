/**
 * Gateway store contract (plan C7, C12, C15). Both adapters implement exactly this; routes never
 * branch on the store kind. Rows are stored in wire form (payload as JSON text with `{ $bytes }`).
 */
export interface WireEvent {
  seq: number;
  aggregate: string;
  type: string;
  v: number;
  ts: number;
  payload: unknown;
  hash: string;
}

export interface AppendOutcome {
  /** Max seq of THIS batch after COMMIT (never the origin's global max). */
  ackedSeq: number;
  inserted: number;
  duplicates: number;
}

export class DivergedError extends Error {
  readonly origin: string;
  readonly seq: number;
  constructor(origin: string, seq: number) {
    super(`diverged: (${origin}, ${seq}) already stored with a different hash`);
    this.name = 'DivergedError';
    this.origin = origin;
    this.seq = seq;
  }
}

export interface DigestRow {
  aggregate: string;
  count: number;
  maxSeq: number;
  sha256: string;
}

export interface StoreHealth {
  store: 'sqlite' | 'postgres';
  durability: Record<string, string | number | boolean>;
  origins: Array<{ origin: string; maxSeq: number; bytes: number }>;
}

export interface Store {
  readonly kind: 'sqlite' | 'postgres';
  /** One transaction per batch: insert-or-ignore, then any existing row with a different hash ⇒ rollback + DivergedError. */
  append(origin: string, rows: WireEvent[]): Promise<AppendOutcome>;
  readAfter(origin: string, after: number, limit: number): Promise<WireEvent[]>;
  maxSeq(origin: string): Promise<number>;
  digest(origin: string, upTo: number): Promise<DigestRow[]>;
  origins(): Promise<string[]>;
  getCursor(name: string, origin: string): Promise<number>;
  setCursor(name: string, origin: string, seq: number): Promise<void>;
  health(): Promise<StoreHealth>;
  close(): Promise<void>;
}

export const MIGRATIONS_SQLITE = [
  `CREATE TABLE IF NOT EXISTS events (
     origin TEXT NOT NULL,
     seq INTEGER NOT NULL,
     aggregate TEXT NOT NULL,
     type TEXT NOT NULL,
     v INTEGER NOT NULL,
     ts INTEGER NOT NULL,
     payload TEXT NOT NULL,
     hash TEXT NOT NULL,
     received_at INTEGER NOT NULL,
     ctx TEXT,
     PRIMARY KEY (origin, seq)
   ) WITHOUT ROWID`,
  `CREATE INDEX IF NOT EXISTS events_origin_aggregate_seq ON events (origin, aggregate, seq)`,
  `CREATE TABLE IF NOT EXISTS cursors (name TEXT NOT NULL, origin TEXT NOT NULL, seq INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (name, origin))`,
  `CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)`,
];

export const MIGRATIONS_POSTGRES = [
  `CREATE TABLE IF NOT EXISTS events (
     origin TEXT NOT NULL,
     seq BIGINT NOT NULL,
     aggregate TEXT NOT NULL,
     type TEXT NOT NULL,
     v INTEGER NOT NULL,
     ts BIGINT NOT NULL,
     payload JSONB NOT NULL,
     hash TEXT NOT NULL,
     received_at BIGINT NOT NULL,
     ctx TEXT,
     PRIMARY KEY (origin, seq)
   )`,
  `CREATE INDEX IF NOT EXISTS events_origin_aggregate_seq ON events (origin, aggregate, seq)`,
  `CREATE TABLE IF NOT EXISTS cursors (name TEXT NOT NULL, origin TEXT NOT NULL, seq BIGINT NOT NULL, updated_at BIGINT NOT NULL, PRIMARY KEY (name, origin))`,
  `CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, applied_at BIGINT NOT NULL)`,
];
