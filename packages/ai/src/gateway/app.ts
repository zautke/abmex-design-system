import { Hono } from 'hono';
import { statfsSync } from 'node:fs';
import { canonical, sha256Hex } from '../hash.js';
import { DivergedError, type Store, type WireEvent } from './store.js';

export interface AppOptions {
  store: Store;
  secret: string;
  dataDir?: string | undefined;
  /** Upstream forwarder status for /v1/health (set by `startForwarder`). */
  forwarder?: (() => { upstream: string; cursors: Record<string, number>; lag: Record<string, number>; lastError?: string | undefined; lastOkAt?: number | undefined }) | undefined;
  log?: ((line: string, data?: Record<string, unknown>) => void) | undefined;
}

const LOG_BYTES_BANDS = { moderate: 1e9, high: 5e9, critical: 10e9 } as const;

/**
 * The gateway HTTP contract (plan C7, C12, C15). Three routes plus health, bearer auth, one tx per
 * batch, hash-divergence 409, ack = batch max after commit.
 */
export function createApp(opts: AppOptions): Hono {
  const app = new Hono();
  const log = opts.log ?? ((line, data) => console.info(line, data ?? ''));

  app.use('/v1/*', async (c, next) => {
    const auth = c.req.header('authorization') ?? '';
    if (auth !== `Bearer ${opts.secret}`) return c.json({ error: 'unauthorized' }, 401);
    await next();
  });

  app.post('/v1/events', async (c) => {
    let body: { origin?: unknown; events?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'invalid json' }, 400);
    }
    const origin = typeof body.origin === 'string' && body.origin ? body.origin : undefined;
    const events = Array.isArray(body.events) ? (body.events as WireEvent[]) : undefined;
    if (!origin || !events || events.length === 0) return c.json({ error: 'origin and non-empty events[] required' }, 400);
    // Recompute every hash over the wire form: a corrupted or tampered row never enters the log.
    for (const e of events) {
      if (typeof e.seq !== 'number' || typeof e.aggregate !== 'string' || typeof e.type !== 'string' || typeof e.hash !== 'string') return c.json({ error: 'malformed event', seq: e?.seq }, 400);
      const h = await sha256Hex(canonical({ aggregate: e.aggregate, type: e.type, v: e.v, ts: e.ts, payload: e.payload }));
      if (h !== e.hash) return c.json({ error: 'hash mismatch', seq: e.seq }, 400);
    }
    const ctx = c.req.header('x-abmex-ctx') ?? null;
    const started = Date.now();
    try {
      const store = 'withCtx' in opts.store ? (opts.store as Store & { withCtx(ctx: string | null): Store }).withCtx(ctx) : opts.store;
      const r = await store.append(origin, events);
      log('[abmex-ai gateway] append', { origin, ctx, rows: events.length, inserted: r.inserted, duplicates: r.duplicates, ackedSeq: r.ackedSeq, ms: Date.now() - started });
      return c.json({ origin, ackedSeq: r.ackedSeq, inserted: r.inserted, duplicates: r.duplicates });
    } catch (e) {
      if (e instanceof DivergedError) {
        diverged.add(origin);
        log('[abmex-ai gateway] DIVERGED', { origin, seq: e.seq, ctx });
        return c.json({ error: 'diverged', origin, seq: e.seq }, 409);
      }
      log('[abmex-ai gateway] append failed', { origin, error: String((e as Error).message) });
      return c.json({ error: 'store', message: String((e as Error).message) }, 503);
    }
  });

  app.get('/v1/events', async (c) => {
    const origin = c.req.query('origin');
    if (!origin) return c.json({ error: 'origin required' }, 400);
    const after = Number(c.req.query('after') ?? 0);
    const limit = Math.min(Number(c.req.query('limit') ?? 500), 2000);
    const events = await opts.store.readAfter(origin, after, limit);
    return c.json({ origin, events, maxSeq: await opts.store.maxSeq(origin) });
  });

  app.get('/v1/digest', async (c) => {
    const origin = c.req.query('origin');
    if (!origin) return c.json({ error: 'origin required' }, 400);
    const upTo = Number(c.req.query('upTo') ?? Number.MAX_SAFE_INTEGER);
    return c.json({ origin, upTo, digests: await opts.store.digest(origin, upTo) });
  });

  app.get('/v1/health', async (c) => {
    const h = await opts.store.health();
    const totalBytes = h.origins.reduce((s, o) => s + o.bytes, 0);
    const band = totalBytes >= LOG_BYTES_BANDS.critical ? 'critical' : totalBytes >= LOG_BYTES_BANDS.high ? 'high' : totalBytes >= LOG_BYTES_BANDS.moderate ? 'moderate' : 'ok';
    let diskFreeBytes: number | undefined;
    try {
      if (opts.dataDir) {
        const s = statfsSync(opts.dataDir);
        diskFreeBytes = Number(s.bavail) * Number(s.bsize);
      }
    } catch {
      diskFreeBytes = undefined;
    }
    return c.json({
      status: 'ok',
      store: h.store,
      durability: h.durability,
      origins: h.origins,
      logBytes: { total: totalBytes, band, bands: LOG_BYTES_BANDS },
      diskFreeBytes,
      diverged: [...diverged],
      upstream: opts.forwarder?.() ?? null,
    });
  });

  const diverged = new Set<string>();
  return app;
}
