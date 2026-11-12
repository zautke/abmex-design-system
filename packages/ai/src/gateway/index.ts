// Node-only entry (plan C7). Never imported by a browser bundle: the exports map gives it only a
// `node` condition.
export { createApp, type AppOptions } from './app.js';
export { createSqliteStore, digestRows, type SqliteStoreOptions } from './sqlite.js';
export { createPostgresStore, type PostgresStoreOptions } from './postgres.js';
export { startForwarder, type ForwarderOptions, type ForwarderStatus } from './forwarder.js';
export { DivergedError, type Store, type WireEvent, type AppendOutcome, type DigestRow, type StoreHealth } from './store.js';
export { startGateway, type GatewayHandle } from './serve.js';
