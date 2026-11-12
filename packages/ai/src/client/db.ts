import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { EventEnvelope } from '../events.js';

/**
 * The per-origin log in IndexedDB (plan C2, C12). One object store holds every event; `seq` is the
 * autoincrement key (per-origin order), `[aggregate+seq]` is the per-aggregate log. `meta` holds the
 * identity minted in the upgrade transaction and the replication cursor.
 */
export interface LogEventRow extends EventEnvelope {
  seq: number;
  hash: string;
}

export interface LogMeta {
  installId: string;
  epoch: string;
  ackedSeq: number;
  /** Set after a `409 diverged`; `push()` refuses to run until an operator clears it. */
  diverged?: { seq: number; at: number } | undefined;
  lastFolded?: Record<string, number> | undefined;
  importV12?: { done: boolean; cursor: { table: string; key: string } | null } | undefined;
}

export interface LogSchema extends DBSchema {
  events: {
    key: number;
    value: LogEventRow;
    indexes: { 'by-aggregate': [string, number] };
  };
  meta: {
    key: keyof LogMeta;
    value: LogMeta[keyof LogMeta];
  };
}

export const DB_VERSION = 1;

export type LogDb = IDBPDatabase<LogSchema>;

export interface OpenLogOptions {
  /** IndexedDB name. Merlyn uses `abmex-ai`; the lab page uses `abmex-ai-s2`. */
  name: string;
  /**
   * The per-install id to copy into `meta` the FIRST time the DB is created. Later opens ignore it:
   * identity shares fate with the log (review R-A). Default: a fresh UUID.
   */
  installId?: string;
  /** Called when another context asks to upgrade/delete this DB; close and reload. */
  onBlocking?: () => void;
  /** Called when the browser killed the connection (e.g. the DB was deleted); callers re-open. */
  onTerminated?: () => void;
}

export async function openLogDb(opts: OpenLogOptions): Promise<LogDb> {
  return openDB<LogSchema>(opts.name, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, tx) {
      if (oldVersion === 0) {
        const events = db.createObjectStore('events', { keyPath: 'seq', autoIncrement: true });
        events.createIndex('by-aggregate', ['aggregate', 'seq']);
        const meta = db.createObjectStore('meta');
        // Minted exactly once, inside the exclusive upgrade transaction (C12).
        meta.put(opts.installId ?? crypto.randomUUID(), 'installId');
        meta.put(crypto.randomUUID(), 'epoch');
        meta.put(0, 'ackedSeq');
      }
      void tx;
    },
    blocked() {
      // An older context still holds the previous version open; nothing to do but wait.
    },
    blocking() {
      opts.onBlocking?.();
    },
    terminated() {
      opts.onTerminated?.();
    },
  });
}

export async function readMeta(db: LogDb): Promise<LogMeta> {
  const tx = db.transaction('meta', 'readonly');
  const [installId, epoch, ackedSeq, diverged, lastFolded, importV12] = await Promise.all([
    tx.store.get('installId'),
    tx.store.get('epoch'),
    tx.store.get('ackedSeq'),
    tx.store.get('diverged'),
    tx.store.get('lastFolded'),
    tx.store.get('importV12'),
  ]);
  await tx.done;
  return {
    installId: String(installId),
    epoch: String(epoch),
    ackedSeq: Number(ackedSeq ?? 0),
    diverged: diverged as LogMeta['diverged'],
    lastFolded: lastFolded as LogMeta['lastFolded'],
    importV12: importV12 as LogMeta['importV12'],
  };
}

/** `${installId}:${epoch}` — the wire origin (C12). */
export const originOf = (m: Pick<LogMeta, 'installId' | 'epoch'>): string => `${m.installId}:${m.epoch}`;
