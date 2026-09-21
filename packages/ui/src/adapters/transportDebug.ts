// TransportDebugAdapter — abstract over the extension's transport debug
// buffer so ChatPane's optional JSON-view panel does not pull extension
// internals.

export type TransportDebugDirection = 'request' | 'response' | 'tool-call';
export type TransportDebugChannel = 'sse' | 'ndjson' | 'json' | 'tool';

export interface TransportDebugEntry {
  /** Stable key for React lists; synthesized when the source has no id. */
  id: string;
  /** Wall-clock ms timestamp. */
  ts: number;
  payload: unknown;
  direction?: TransportDebugDirection;
  channel?: TransportDebugChannel;
  /** Optional human-readable label (provider id, tool name, etc.). */
  label?: string;
  sizeBytes?: number;
  /**
   * Optional owner of this entry — a conversation, a session, whatever the host
   * scopes traffic by. The buffer behind the adapter is global, so without this
   * a panel shows every scope's traffic at once. Entries that leave it unset are
   * unattributable and are always shown.
   */
  scopeId?: string;
}

export interface TransportDebugAdapter {
  entries(): readonly TransportDebugEntry[];
  /** Returns an unsubscribe function. */
  subscribe(cb: (entries: readonly TransportDebugEntry[]) => void): () => void;
  /** Optional buffer clear; omit if the underlying source is read-only. */
  clear?(): void;
}
