import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { cn } from '../../utils/cn';

/**
 * The view's own entry shape. Deliberately declared here rather than imported
 * from `../../adapters/transportDebug` — the panel is the consumer of a shape,
 * not of an adapter. `TransportDebugEntry` structurally satisfies this type, so
 * an adapter's entries can be passed straight in with no mapping.
 */
export interface TransportLogEntry {
  /** Stable React key. */
  id: string;
  /** Wall-clock ms timestamp. */
  ts: number;
  payload: unknown;
  direction?: string;
  channel?: string;
  label?: string;
  sizeBytes?: number;
}

export interface TransportLogPanelProps {
  /**
   * WIRING: snapshot of the transport buffer. Subscribe to your own transport
   * source and pass the entries down — the panel neither fetches nor subscribes.
   */
  entries: readonly TransportLogEntry[];
  /** WIRING: omit when the underlying buffer is read-only; the button hides. */
  onClear?: (() => void) | undefined;
  title?: string;
  className?: string;
}

/** Raw request/response log for the JSON view. (Was `TransportBufferPanel`.)
 *
 * Clear is a two-state confirm: Clear buffer swaps to an inline
 * "Clear? [Clear] [Cancel]" cluster. Escape, Tab/click away or ~4s of
 * inactivity disarm it — only the explicit Clear button calls `onClear`.
 */
export function TransportLogPanel({
  entries,
  onClear,
  title = 'Transport buffer',
  className,
}: TransportLogPanelProps) {
  const tailRef = useRef<HTMLDivElement>(null);
  const [pendingClear, setPendingClear] = useState(false);
  const clearGroupRef = useRef<HTMLDivElement>(null);
  const clearConfirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [entries.length]);

  useEffect(() => {
    if (!pendingClear) return;
    clearConfirmRef.current?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!clearGroupRef.current?.contains(e.target as Node)) setPendingClear(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    const timer = window.setTimeout(() => setPendingClear(false), 4000);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.clearTimeout(timer);
    };
  }, [pendingClear]);

  const confirmClear = () => {
    setPendingClear(false);
    onClear?.();
  };

  return (
    <section
      className={cn(
        'flex min-h-0 flex-col border-t border-ph-border bg-ph-surface px-3 py-2 text-xs',
        className,
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="font-medium uppercase tracking-[0.14em] text-ph-fg-muted">
          {title} ({entries.length})
        </span>
        {onClear ? (
          pendingClear ? (
            <div
              ref={clearGroupRef}
              role="group"
              aria-label="Confirm clear transport buffer"
              className="flex items-center gap-1"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  setPendingClear(false);
                }
              }}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setPendingClear(false);
                }
              }}
            >
              <span className="text-xs text-ph-danger-soft-fg">Clear?</span>
              <Button
                ref={clearConfirmRef}
                variant="ghost"
                size="sm"
                onPress={confirmClear}
                className="text-xs uppercase tracking-[0.14em] text-ph-danger-soft-fg"
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setPendingClear(false)}
                className="text-xs uppercase tracking-[0.14em] text-chat-clearbtn-text"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setPendingClear(true)}
              className="text-xs uppercase tracking-[0.14em] text-chat-clearbtn-text hover:text-chat-clearbtn-text-hover"
            >
              Clear buffer
            </Button>
          )
        ) : null}
      </div>
      {entries.length === 0 ? (
        <p className="text-ph-fg-muted">No transport activity yet.</p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded border border-ph-border bg-ph-surface-2 p-1">
              <div className="mb-0.5 flex items-center gap-2 text-ph-fg-muted">
                <span className="tabular-nums">
                  {new Date(entry.ts).toISOString().slice(11, 23)}
                </span>
                {entry.direction && <span className="font-mono uppercase">{entry.direction}</span>}
                {entry.channel && <span className="font-mono">{entry.channel}</span>}
                {entry.label && <span className="text-ph-fg-muted">· {entry.label}</span>}
                {entry.sizeBytes !== undefined && (
                  <span className="ml-auto tabular-nums text-ph-fg-disabled">{entry.sizeBytes}b</span>
                )}
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-ph-fg">
                {JSON.stringify(entry.payload, null, 2)}
              </pre>
            </li>
          ))}
          <div ref={tailRef} aria-hidden />
        </ul>
      )}
    </section>
  );
}
