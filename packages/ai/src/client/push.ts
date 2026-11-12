import { toWireValue } from '../hash.js';
import type { LogEventRow } from './db.js';
import type { Log } from './log.js';

/**
 * Replication (plan C3, C5, C12): ship `events where seq > ackedSeq` to the gateway, idempotent by
 * `(origin, seq)`. One function, two call sites: the browser client (source = IDB) and the gateway's
 * upstream forwarder (source = SQLite). This module is the generic `push()`; `Log` adapts IDB to it.
 */

export type TransportError =
  | { kind: 'unreachable'; cause: unknown }
  | { kind: 'timeout'; ms: number }
  | { kind: 'aborted' }
  | { kind: 'http'; status: number; body?: unknown }
  | { kind: 'decode'; message: string }
  | { kind: 'diverged'; seq: number };

export interface PushSource {
  origin(): Promise<string>;
  ackedSeq(): Promise<number>;
  readAfter(after: number, maxBytes: number): Promise<LogEventRow[]>;
  setAckedSeq(seq: number): Promise<void>;
  onDiverged?(seq: number): Promise<void>;
}

export interface PushOptions {
  gatewayUrl: string;
  secret: string;
  /** `panel` | `sw` | `lab` | `gateway` — logged by the gateway per batch (review R-E). */
  ctx: string;
  fetch?: typeof fetch | undefined;
  timeoutMs?: number | undefined;
  maxBatchBytes?: number | undefined;
  signal?: AbortSignal | undefined;
  log?: ((line: string, data?: Record<string, unknown>) => void) | undefined;
}

export interface PushResult {
  pushed: number;
  batches: number;
  ackedSeq: number;
  error?: TransportError;
}

export const PUSH_LOCK = 'abmex-ai:push';

/** Wire row: `seq`, envelope fields, `hash`; payload in wire form (bytes as `{ $bytes }`). */
export function toWireRow(row: LogEventRow): Record<string, unknown> {
  return { seq: row.seq, aggregate: row.aggregate, type: row.type, v: row.v, ts: row.ts, payload: toWireValue(row.payload), hash: row.hash };
}

/**
 * Drain the source once (all batches) under the Web Lock when available. Returns rather than throws:
 * the caller decides whether a transport error is a badge, a retry or a log line.
 */
export async function push(source: PushSource, opts: PushOptions): Promise<PushResult> {
  const run = () => drain(source, opts);
  if (typeof navigator !== 'undefined' && navigator.locks) {
    const r = await navigator.locks.request(PUSH_LOCK, { ifAvailable: true }, async (lock) => (lock ? run() : undefined));
    return r ?? { pushed: 0, batches: 0, ackedSeq: await source.ackedSeq() };
  }
  return run();
}

async function drain(source: PushSource, opts: PushOptions): Promise<PushResult> {
  const f = opts.fetch ?? globalThis.fetch;
  const maxBytes = opts.maxBatchBytes ?? 1_000_000;
  const origin = await source.origin();
  let acked = await source.ackedSeq();
  let pushed = 0;
  let batches = 0;
  for (;;) {
    const rows = await source.readAfter(acked, maxBytes);
    if (rows.length === 0) return { pushed, batches, ackedSeq: acked };
    const sentMax = rows[rows.length - 1]!.seq;
    const started = Date.now();
    const res = await request(f, `${opts.gatewayUrl.replace(/\/$/, '')}/v1/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${opts.secret}`, 'x-abmex-ctx': opts.ctx },
      body: JSON.stringify({ origin, events: rows.map(toWireRow) }),
      timeoutMs: opts.timeoutMs ?? 10_000,
      signal: opts.signal,
    });
    if (!res.ok) {
      if (res.error.kind === 'http' && res.error.status === 409) {
        const body = res.error.body as { seq?: number } | undefined;
        const seq = Number(body?.seq ?? rows[0]!.seq);
        opts.log?.('[abmex-ai] push diverged', { origin, seq });
        await source.onDiverged?.(seq);
        return { pushed, batches, ackedSeq: acked, error: { kind: 'diverged', seq } };
      }
      opts.log?.('[abmex-ai] push failed', { origin, after: acked, rows: rows.length, error: res.error });
      return { pushed, batches, ackedSeq: acked, error: res.error };
    }
    const body = res.value as { ackedSeq?: number };
    // Never trust an ack larger than what was sent (C12).
    const next = Math.min(Number(body.ackedSeq ?? sentMax), sentMax);
    if (next > acked) await source.setAckedSeq(next);
    opts.log?.('[abmex-ai] push ok', { origin, rows: rows.length, ackedSeq: next, ms: Date.now() - started, ctx: opts.ctx });
    pushed += rows.length;
    batches += 1;
    acked = next;
    if (next < sentMax) return { pushed, batches, ackedSeq: acked, error: { kind: 'decode', message: `gateway acked ${next} < sent ${sentMax}` } };
  }
}

type Result<T> = { ok: true; value: T } | { ok: false; error: TransportError };

async function request(f: typeof fetch, url: string, init: { method: string; headers: Record<string, string>; body?: string; timeoutMs: number; signal?: AbortSignal | undefined }): Promise<Result<unknown>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new Error('timeout')), init.timeoutMs);
  const onAbort = () => ctrl.abort(new Error('aborted'));
  init.signal?.addEventListener('abort', onAbort, { once: true });
  try {
    const r = await f(url, { method: init.method, headers: init.headers, ...(init.body !== undefined ? { body: init.body } : {}), signal: ctrl.signal });
    const text = await r.text();
    let body: unknown = undefined;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = text;
    }
    if (!r.ok) return { ok: false, error: { kind: 'http', status: r.status, body } };
    return { ok: true, value: body };
  } catch (e) {
    if (init.signal?.aborted) return { ok: false, error: { kind: 'aborted' } };
    if (ctrl.signal.aborted) return { ok: false, error: { kind: 'timeout', ms: init.timeoutMs } };
    return { ok: false, error: { kind: 'unreachable', cause: e } };
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', onAbort);
  }
}

/** GET /v1/digest for `pnpm verify` and the health UI. */
export async function fetchDigest(opts: Pick<PushOptions, 'gatewayUrl' | 'secret' | 'fetch'>, origin: string, upTo: number): Promise<Result<unknown>> {
  const f = opts.fetch ?? globalThis.fetch;
  const u = `${opts.gatewayUrl.replace(/\/$/, '')}/v1/digest?origin=${encodeURIComponent(origin)}&upTo=${upTo}`;
  return request(f, u, { method: 'GET', headers: { authorization: `Bearer ${opts.secret}` }, timeoutMs: 10_000 });
}
