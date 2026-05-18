// TransportDebugAdapter — abstract over src/core/transport/debugBuffer so
// ChatPane's optional debug panel does not pull extension internals.

export interface TransportDebugEntry {
  id: string;
  ts: number;
  provider: string;
  payload: unknown;
}

export interface TransportDebugAdapter {
  entries(): readonly TransportDebugEntry[];
  /** Returns an unsubscribe function. */
  subscribe(cb: (entries: readonly TransportDebugEntry[]) => void): () => void;
}
