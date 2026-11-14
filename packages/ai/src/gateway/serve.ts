import { serve } from '@hono/node-server';
import { resolve } from 'node:path';
import type { GatewayConfig } from '../config.js';
import { createApp } from './app.js';
import { startForwarder } from './forwarder.js';
import { createPostgresStore } from './postgres.js';
import { createSqliteStore } from './sqlite.js';
import type { Store } from './store.js';

export interface GatewayHandle {
  store: Store;
  url: string;
  close(): Promise<void>;
}

/** Open the configured store, mount the app, bind loopback (or the configured host), start the forwarder when an upstream is set. */
export async function startGateway(cfg: GatewayConfig, log: (line: string, data?: Record<string, unknown>) => void = (l, d) => console.info(l, d ?? '')): Promise<GatewayHandle> {
  const dataDir = resolve(cfg.ABMEX_AI_DATA_DIR);
  const store =
    cfg.ABMEX_AI_STORE === 'postgres'
      ? await createPostgresStore({ connectionString: required(cfg.DATABASE_URL, 'DATABASE_URL (ABMEX_AI_STORE=postgres)') })
      : await createSqliteStore({ file: resolve(dataDir, 'events.sqlite') });
  const forwarder =
    cfg.ABMEX_AI_UPSTREAM_URL
      ? startForwarder({ store, upstreamUrl: cfg.ABMEX_AI_UPSTREAM_URL, upstreamSecret: required(cfg.ABMEX_AI_UPSTREAM_SECRET, 'ABMEX_AI_UPSTREAM_SECRET (ABMEX_AI_UPSTREAM_URL is set)'), log })
      : undefined;
  const app = createApp({ store, secret: cfg.ABMEX_AI_SECRET, dataDir, forwarder: forwarder ? () => forwarder.status() : undefined, log });
  const server = serve({ fetch: app.fetch, hostname: cfg.ABMEX_AI_GATEWAY_HOST, port: cfg.ABMEX_AI_GATEWAY_PORT });
  const url = `http://${cfg.ABMEX_AI_GATEWAY_HOST}:${cfg.ABMEX_AI_GATEWAY_PORT}`;
  const h = await store.health();
  log('[abmex-ai gateway] listening', { url, store: h.store, durability: h.durability, dataDir, upstream: cfg.ABMEX_AI_UPSTREAM_URL ?? null });
  return {
    store,
    url,
    async close() {
      forwarder?.stop();
      await new Promise<void>((res) => server.close(() => res()));
      await store.close();
    },
  };
}

function required(value: string | undefined, what: string): string {
  if (!value) throw new Error(`config: missing ${what}`);
  return value;
}
