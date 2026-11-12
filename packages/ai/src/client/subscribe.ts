/**
 * Cross-context change hints (plan C5/C14). Truth stays in IndexedDB; a missed message is harmless
 * because readers re-fold from `seq > lastFolded`. A terminated service worker never receives one,
 * which is why the worker reads IDB on its alarm instead of subscribing.
 */
export type LogChange = { kind: 'append'; aggregate: string; seq: number } | { kind: 'ack'; ackedSeq: number } | { kind: 'diverged'; seq: number };

export class Broadcast {
  private readonly channel: BroadcastChannel | undefined;
  private readonly local = new Set<(c: LogChange) => void>();

  constructor(name: string) {
    this.channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(`abmex-ai:${name}`) : undefined;
    this.channel?.addEventListener('message', (ev: MessageEvent<LogChange>) => this.emit(ev.data));
  }

  /** Delivers to this context's subscribers synchronously and to other contexts via the channel. */
  post(change: LogChange): void {
    this.emit(change);
    this.channel?.postMessage(change);
  }

  on(cb: (c: LogChange) => void): () => void {
    this.local.add(cb);
    return () => this.local.delete(cb);
  }

  close(): void {
    this.channel?.close();
    this.local.clear();
  }

  private emit(change: LogChange): void {
    for (const cb of this.local) {
      try {
        cb(change);
      } catch {
        // a subscriber's error must not break delivery to the others
      }
    }
  }
}
