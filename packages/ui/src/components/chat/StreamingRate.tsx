import { cn } from '../../utils/cn';

export interface StreamingRateProps {
  value: number;
  /** Free-form so a consumer can quote tokens, words, or anything else. */
  unit: string;
  /** Renders the pulsing dot that marks the figure as sampled, not final. */
  live?: boolean;
  className?: string;
}

/**
 * Dumb readout for a generation rate. Compute the figure with
 * `useStreamingRate` (packages/ui/src/hooks/useStreamingRate.ts) — this
 * component only formats it.
 */
export function StreamingRate({ value, unit, live = false, className }: StreamingRateProps) {
  return (
    <div className={cn('mt-0.5 flex items-center gap-1.5 px-1 text-xs text-fg-muted', className)}>
      {live && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary" />}
      <span className="font-bold tabular-nums">{value.toFixed(1)}</span>
      <span className="font-medium text-fg-muted">{unit}</span>
    </div>
  );
}
