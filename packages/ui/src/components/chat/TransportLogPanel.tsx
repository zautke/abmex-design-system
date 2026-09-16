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
        'flex min-h-0 flex-col border-t border-slate-200 bg-slate-50 px-3 py-2 text-[10px]',
        className,
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="font-medium uppercase tracking-[0.14em] text-slate-500">
          {title} ({entries.length})
        </span>
        {onClear && (
          <Button
            variant="ghost"
            size="sm"
            onPress={onClear}
            className="text-[10px] uppercase tracking-[0.14em] text-chat-clearbtn-text hover:text-chat-clearbtn-text-hover"
          >
            Clear buffer
          </Button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="text-slate-400">No transport activity yet.</p>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded border border-slate-200 bg-white p-1">
              <div className="mb-0.5 flex items-center gap-2 text-slate-400">
                <span className="tabular-nums">
                  {new Date(entry.ts).toISOString().slice(11, 23)}
                </span>
                {entry.direction && <span className="font-mono uppercase">{entry.direction}</span>}
                {entry.channel && <span className="font-mono">{entry.channel}</span>}
                {entry.label && <span className="text-slate-500">· {entry.label}</span>}
                {entry.sizeBytes !== undefined && (
                  <span className="ml-auto tabular-nums text-slate-300">{entry.sizeBytes}b</span>
                )}
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[10px] text-slate-700">
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
