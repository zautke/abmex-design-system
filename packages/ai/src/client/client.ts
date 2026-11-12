import type { EventEnvelope } from '../events.js';
import { fetchDigest, push, type PushResult, type TransportError } from './push.js';
import { Log, type Digest } from './log.js';
import type { LogChange } from './subscribe.js';
import type { OpenLogOptions } from './db.js';

export interface ClientOptions extends OpenLogOptions {
  gatewayUrl: string;
  secret: string;
  ctx: 'panel' | 'sw' | 'lab' | (string & {});
  fetch?: typeof fetch | undefined;
  log?: ((line: string, data?: Record<string, unknown>) => void) | undefined;
}

/**
 * The one object a host app holds: the log plus the push wiring. `append()` returns as soon as the
 * strict IDB transaction commits (pending); `push()` is fire-and-forget after an append and is also
 * what the service worker calls on its alarm.
 */
export interface Client {
  log: Log;
  origin(): Promise<string>;
  append(events: EventEnvelope[], opts?: { push?: boolean }): Promise<{ firstSeq: number; lastSeq: number }>;
  push(): Promise<PushResult>;
  pendingCount(aggregate?: string): Promise<number>;
  digest(upTo?: number): Promise<Digest[]>;
  /** IDB digest vs the gateway's: the stop-the-line verify (plan C15). */
  verify(): Promise<{ ok: boolean; mismatched: string[]; pending: number; local: Digest[]; remote: unknown; error?: TransportError }>;
  subscribe(cb: (c: LogChange) => void): () => void;
  close(): void;
}

export async function createClient(opts: ClientOptions): Promise<Client> {
  const log = await Log.open(opts);
  const pushOpts = { gatewayUrl: opts.gatewayUrl, secret: opts.secret, ctx: opts.ctx, fetch: opts.fetch, log: opts.log };
  const source = {
    origin: () => log.origin(),
    ackedSeq: () => log.ackedSeq(),
    readAfter: (after: number, maxBytes: number) => log.readAfter(after, maxBytes),
    setAckedSeq: (seq: number) => log.setAckedSeq(seq),
    onDiverged: async (seq: number) => {
      await log.setMeta('diverged', { seq, at: Date.now() });
      log.broadcast.post({ kind: 'diverged', seq });
    },
  };
  let inflight: Promise<PushResult> | undefined;
  const doPush = async (): Promise<PushResult> => {
    const meta = await log.meta();
    if (meta.diverged) return { pushed: 0, batches: 0, ackedSeq: meta.ackedSeq, error: { kind: 'diverged', seq: meta.diverged.seq } };
    if (!inflight) inflight = push(source, pushOpts).finally(() => (inflight = undefined));
    return inflight;
  };
  return {
    log,
    origin: () => log.origin(),
    async append(events, o) {
      const r = await log.append(events);
      if (o?.push !== false) void doPush().catch(() => undefined);
      return r;
    },
    push: doPush,
    pendingCount: (aggregate) => log.pendingCount(aggregate),
    digest: (upTo) => log.digest(upTo),
    async verify() {
      const upTo = await log.ackedSeq();
      const local = await log.digest(upTo);
      const pending = await log.pendingCount();
      const r = await fetchDigest(pushOpts, await log.origin(), upTo);
      if (!r.ok) return { ok: false, mismatched: [], pending, local, remote: undefined, error: r.error };
      const remote = r.value as { digests?: Digest[] };
      const byAgg = new Map((remote.digests ?? []).map((d) => [d.aggregate, d]));
      const mismatched: string[] = [];
      for (const d of local) {
        const o = byAgg.get(d.aggregate);
        if (!o || o.count !== d.count || o.maxSeq !== d.maxSeq || o.sha256 !== d.sha256) mismatched.push(d.aggregate);
        byAgg.delete(d.aggregate);
      }
      for (const extra of byAgg.keys()) mismatched.push(extra);
      return { ok: mismatched.length === 0 && pending === 0, mismatched, pending, local, remote };
    },
    subscribe: (cb) => log.subscribe(cb),
    close: () => log.close(),
  };
}
