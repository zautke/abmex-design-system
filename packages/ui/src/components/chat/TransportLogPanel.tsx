import { useEffect, useRef } from 'react';
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

/** Raw request/response log for the JSON view. (Was `TransportBufferPanel`.) */
export function TransportLogPanel({
  entries,
  onClear,
  title = 'Transport buffer',
  className,
}: TransportLogPanelProps) {
  const tailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [entries.length]);

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
        {onClear && (
          <Button
            variant="ghost"
            size="sm"
            onPress={onClear}
            className="text-xs uppercase tracking-[0.14em] text-chat-clearbtn-text hover:text-chat-clearbtn-text-hover"
          >
            Clear buffer
          </Button>
        )}
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
