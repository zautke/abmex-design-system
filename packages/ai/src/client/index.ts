// Browser entry (sidepanel, popup, service worker). No `chrome.*` here: the alarm wake and
// storage.local prefs belong to the host extension. SSR-safe: nothing touches IndexedDB at import.
export { Log, type AppendResult, type Digest } from './log.js';
export { type LogEventRow, type LogMeta, type OpenLogOptions, DB_VERSION, originOf } from './db.js';
export { Broadcast, type LogChange } from './subscribe.js';
export * from './fold.js';
export { sweepInterrupted, withTurnLock, turnLockName, type SweepResult } from './sweep.js';
export { push, fetchDigest, toWireRow, PUSH_LOCK, type PushOptions, type PushResult, type PushSource, type TransportError } from './push.js';
export { createClient, type Client, type ClientOptions } from './client.js';
