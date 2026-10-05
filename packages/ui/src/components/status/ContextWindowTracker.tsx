import { cn } from '../../utils/cn';

export interface ContextMeterValues {
  /** Model context window in tokens; undefined when unknown. */
  window?: number;
  /** Fixed prefix (system prompt + tool schemas), charged to neither side. */
  baseline: number;
  /** Prompt tokens of the newest turn, cache included. */
  used: number;
  /** Held back for the response. */
  reserved: number;
  available: number;
  percentAvailable?: number;
  /** The reading came from a tokenizer estimate, not the provider. */
  estimated: boolean;
}

export interface ContextWindowTrackerProps {
  // WIRING: the consumer computes this once (shared/usage/meter) so the bar and
  // the history trimmer cannot disagree about how full the window is.
  meter: ContextMeterValues | null;
  /** No context-window telemetry available for the active model/provider. */
  unavailable?: boolean;
  className?: string;
}

/**
 * Three segments, because a single "% left" bar hides the output reservation
 * and users are then surprised when a window declared 30%-free refuses more
 * input: used | reserved-for-output | available.
 *
 * `role="meter"` is written out rather than taken from a component: the value
 * spans three stacked widths, which a single-fill meter cannot express.
 */
export function ContextWindowTracker({
  meter,
  unavailable = false,
  className,
}: ContextWindowTrackerProps) {
  if (unavailable || !meter || meter.window === undefined) {
    return (
      <div
        className={cn(
          'text-xs font-medium uppercase tracking-[0.14em] text-fg-muted',
          className,
        )}
      >
        Context n/a
      </div>
    );
  }

  const value = clampPercent(meter.percentAvailable ?? 100);
  const usedPercent = clampPercent((meter.used / meter.window) * 100);
  const reservedPercent = clampPercent((meter.reserved / meter.window) * 100);
  const availablePercent = Math.max(0, 100 - usedPercent - reservedPercent);
  const tone = toneFor(value);

  return (
    <div
      role="meter"
      aria-label="Context window remaining"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${value}% left`}
      title={[
        `${formatTokens(meter.used)} of ${formatTokens(meter.window)} used`,
        `${formatTokens(meter.reserved)} reserved for the response`,
        `${formatTokens(meter.available)} available`,
        meter.baseline > 0 ? `${formatTokens(meter.baseline)} fixed prompt prefix` : null,
        meter.estimated ? 'estimated — the provider reported no prompt size' : null,
      ]
        .filter(Boolean)
        .join('\n')}
      className={cn('flex flex-col gap-1', className)}
    >
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-fg-muted">
        {meter.estimated ? '~' : ''}
        {value}% left
      </span>
      <div className="flex h-1 w-24 overflow-hidden rounded-full bg-surface-3">
        <div className={cn('h-full', FILL_TONE[tone])} style={{ width: `${usedPercent}%` }} />
        <div
          className={cn('h-full opacity-30', FILL_TONE[tone])}
          style={{ width: `${reservedPercent}%` }}
        />
        <div className="h-full" style={{ width: `${availablePercent}%` }} />
      </div>
    </div>
  );
}

const FILL_TONE = {
  accent: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const;

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatTokens(value: number): string {
  return value >= 1_000 ? `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k` : String(value);
}

function toneFor(percentLeft: number): keyof typeof FILL_TONE {
  if (percentLeft <= 10) return 'danger';
  if (percentLeft <= 25) return 'warning';
  return 'accent';
}
