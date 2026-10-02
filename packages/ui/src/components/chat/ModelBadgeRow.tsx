import { Chip } from '@heroui/react';
import { cn } from '../../utils/cn';

export interface ModelBadgeRowProps {
  /**
   * WIRING: the display string only. Derive it from your model snapshot —
   * this row does not know what a model is.
   */
  label: string;
  className?: string;
}

/**
 * Left-aligned marker in the stream noting which model answers from here on.
 * (Was `ModelInfoRow`.)
 */
export function ModelBadgeRow({ label, className }: ModelBadgeRowProps) {
  return (
    <li className="flex justify-start">
      <div
        className={cn(
          'flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-ph-fg-muted',
          className,
        )}
      >
        <Chip size="sm" variant="secondary" className="text-xs tracking-[0.16em]">
          {label}
        </Chip>
        <span className="h-px w-10 bg-ph-surface-3" aria-hidden />
      </div>
    </li>
  );
}
