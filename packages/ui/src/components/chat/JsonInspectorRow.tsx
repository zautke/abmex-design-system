import { cn } from '../../utils/cn';

export interface JsonInspectorRowProps {
  /**
   * WIRING: caller derives this. It was `item.kind`; it is now whatever you
   * want to head the row with.
   */
  label: string;
  /** WIRING: secondary caption — was `item.role` on chat rows. */
  sublabel?: string;
  /** WIRING: caller chooses what to serialize (e.g. `item.raw ?? item`). */
  data: unknown;
  className?: string;
}

/** Verbatim JSON view of one timeline entry. (Was `JsonRow`.) */
export function JsonInspectorRow({ label, sublabel, data, className }: JsonInspectorRowProps) {
  return (
    <li className="flex w-full min-w-0 flex-col">
      <div className={cn('rounded-md border border-ph-border bg-ph-surface px-2 py-1', className)}>
        <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-ph-fg-muted">
          <span className="font-mono text-2xs">{label}</span>
          {sublabel && <span>· {sublabel}</span>}
        </div>
        <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words font-mono text-2xs text-ph-fg">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </li>
  );
}
