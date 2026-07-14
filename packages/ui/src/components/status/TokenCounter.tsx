import { ArrowBigDown, ArrowBigUp, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface TokenCounterValues {
  input: number;
  output: number;
}

export interface TokenCounterProps {
  // WIRING: the consumer accumulates these from the streaming transport's
  // usage frames. `latest` is the last roundtrip; `cumulative` is the whole
  // conversation. The view does no arithmetic beyond formatting.
  latest: TokenCounterValues | null;
  cumulative: TokenCounterValues | null;
  /** The active provider reports no usage data. */
  unavailable?: boolean;
  className?: string;
}

export function TokenCounter({
  latest,
  cumulative,
  unavailable = false,
  className,
}: TokenCounterProps) {
  if (unavailable) {
    return (
      <div
        className={cn(
          'text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400',
          className,
        )}
      >
        Tokens n/a
      </div>
    );
  }

  const latestValues = latest ?? { input: 0, output: 0 };
  const cumulativeValues = cumulative ?? { input: 0, output: 0 };

  return (
    <div className={cn('flex items-center gap-3 text-[11px] font-medium text-slate-500', className)}>
      <div className="flex items-center gap-1" aria-label="Latest roundtrip tokens">
        <ArrowUp size={12} strokeWidth={1.5} />
        <span>{formatTokenCount(latestValues.input)}</span>
        <ArrowDown size={12} strokeWidth={1.5} />
        <span>{formatTokenCount(latestValues.output)}</span>
      </div>
      <div className="flex items-center gap-1" aria-label="Cumulative conversation tokens">
        <ArrowBigUp size={13} strokeWidth={1.8} />
        <span>{formatTokenCount(cumulativeValues.input)}</span>
        <ArrowBigDown size={13} strokeWidth={1.8} />
        <span>{formatTokenCount(cumulativeValues.output)}</span>
      </div>
    </div>
  );
}

function formatTokenCount(value: number): string {
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  }

  return String(value);
}
