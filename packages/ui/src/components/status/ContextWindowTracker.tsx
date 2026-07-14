import { Meter } from '@heroui/react';
import { cn } from '../../utils/cn';

export interface ContextWindowTrackerProps {
  // WIRING: the consumer computes remaining context from the model's
  // `contextWindowTokens` and the live token usage. `null` renders as 100%.
  percentLeft: number | null;
  /** No context-window telemetry available for the active model/provider. */
  unavailable?: boolean;
  className?: string;
}

/**
 * Semantically a meter (a value within a known range), not a progress bar —
 * nothing is progressing toward completion. HeroUI's Meter gives the ARIA
 * `role="meter"` + `aria-valuenow`/`aria-valuetext` wiring for free.
 */
export function ContextWindowTracker({
  percentLeft,
  unavailable = false,
  className,
}: ContextWindowTrackerProps) {
  if (unavailable) {
    return (
      <div
        className={cn(
          'text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400',
          className,
        )}
      >
        Context n/a
      </div>
    );
  }

  const value = clampPercent(percentLeft ?? 100);

  return (
    <Meter
      aria-label="Context window remaining"
      value={value}
      minValue={0}
      maxValue={100}
      size="sm"
      color={toneFor(value)}
      className={cn('flex flex-col gap-1', className)}
    >
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
        {value}% left
      </span>
      <Meter.Track>
        <Meter.Fill />
      </Meter.Track>
    </Meter>
  );
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function toneFor(percentLeft: number): 'accent' | 'warning' | 'danger' {
  if (percentLeft <= 10) return 'danger';
  if (percentLeft <= 25) return 'warning';
  return 'accent';
}
