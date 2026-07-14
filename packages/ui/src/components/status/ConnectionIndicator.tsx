import { StatusDot } from '../../primitives/StatusDot';
import type { StatusTone } from '../../primitives/StatusDot';
import { cn } from '../../utils/cn';

export interface ConnectionIndicatorProps {
  // WIRING: the consumer probes providers and reduces the result to a count +
  // a human label ("Ollama · 3 models"). This view knows nothing about
  // providers, base URLs, or API keys — per-provider config lives in Settings.
  connectedCount: number;
  isLoading: boolean;
  label: string;
  className?: string;
}

export function ConnectionIndicator({
  connectedCount,
  isLoading,
  label,
  className,
}: ConnectionIndicatorProps) {
  const { tone, pulse, text, ariaLabel } = resolve(connectedCount, isLoading, label);

  return (
    <div className={cn('flex items-center gap-2', className)} aria-label={ariaLabel}>
      <StatusDot tone={tone} pulse={pulse} className="h-2.5 w-2.5" />
      <span className="text-xs font-medium text-conn-label">{text}</span>
    </div>
  );
}

function resolve(
  connectedCount: number,
  isLoading: boolean,
  label: string,
): { tone: StatusTone; pulse: boolean; text: string; ariaLabel: string } {
  if (isLoading) {
    return { tone: 'warning', pulse: true, text: 'Connecting…', ariaLabel: 'Connecting' };
  }
  if (connectedCount === 0) {
    return {
      tone: 'danger',
      pulse: false,
      text: 'No providers connected',
      ariaLabel: 'Disconnected',
    };
  }
  return { tone: 'success', pulse: false, text: label, ariaLabel: 'Connected' };
}
