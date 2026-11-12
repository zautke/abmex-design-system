import { push, type PushResult, type PushSource } from '../client/push.js';
import type { Store } from './store.js';

export interface ForwarderOptions {
  store: Store;
  upstreamUrl: string;
  upstreamSecret: string;
  intervalMs?: number | undefined;
  fetch?: typeof fetch | undefined;
  log?: ((line: string, data?: Record<string, unknown>) => void) | undefined;
}

export interface ForwarderStatus {
  upstream: string;
  cursors: Record<string, number>;
  lag: Record<string, number>;
  lastError?: string | undefined;
  lastOkAt?: number | undefined;
}

const CURSOR = 'upstream';

/**
 * The gateway as a client of the next gateway (plan C3, G10): the same `push()` with the local
 * store as source and a per-origin cursor committed only after upstream acks.
 */
export function startForwarder(opts: ForwarderOptions): { status(): ForwarderStatus; runOnce(): Promise<Record<string, PushResult>>; stop(): void } {
  const status: ForwarderStatus = { upstream: opts.upstreamUrl, cursors: {}, lag: {} };
  let timer: ReturnType<typeof setInterval> | undefined;
  let running = false;

  const sourceFor = (origin: string): PushSource => ({
    origin: async () => origin,
    ackedSeq: () => opts.store.getCursor(CURSOR, origin),
    readAfter: async (after, _maxBytes) => opts.store.readAfter(origin, after, 500),
    setAckedSeq: (seq) => opts.store.setCursor(CURSOR, origin, seq),
    onDiverged: async (seq) => {
      status.lastError = `diverged at (${origin}, ${seq})`;
    },
  });

  async function runOnce(): Promise<Record<string, PushResult>> {
    if (running) return {};
    running = true;
    const results: Record<string, PushResult> = {};
    try {
      for (const origin of await opts.store.origins()) {
        const r = await push(sourceFor(origin), { gatewayUrl: opts.upstreamUrl, secret: opts.upstreamSecret, ctx: 'gateway', fetch: opts.fetch, log: opts.log });
        results[origin] = r;
        status.cursors[origin] = r.ackedSeq;
        status.lag[origin] = Math.max(0, (await opts.store.maxSeq(origin)) - r.ackedSeq);
        if (r.error) status.lastError = `${origin}: ${r.error.kind}`;
        else status.lastOkAt = Date.now();
      }
    } finally {
      running = false;
    }
    return results;
  }

  timer = setInterval(() => void runOnce().catch(() => undefined), opts.intervalMs ?? 60_000);
  void runOnce().catch(() => undefined);
  return { status: () => status, runOnce, stop: () => clearInterval(timer) };
}
