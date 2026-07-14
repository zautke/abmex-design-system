import { cn } from '../utils/cn';

/**
 * Presentation-only status tone. Callers map their domain status
 * (provider `ProviderStatus`, MCP `McpServerStatus`, …) onto a tone —
 * the dot itself knows nothing about providers, servers, or transports.
 */
export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

export interface StatusDotProps {
  tone: StatusTone;
  /** Pulse to signal an in-flight/settling state (probing, connecting). */
  pulse?: boolean;
  /** Accessible description. Omit only when an adjacent label already names the state. */
  label?: string;
  className?: string;
}

const TONE_CLASS: Record<StatusTone, string> = {
  success: 'bg-conn-connected',
  warning: 'bg-conn-probing',
  danger: 'bg-conn-disconnected',
  neutral: 'bg-slate-300',
};

export function StatusDot({ tone, pulse = false, label, className }: StatusDotProps) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        'h-2 w-2 shrink-0 rounded-full',
        TONE_CLASS[tone],
        pulse && 'animate-pulse',
        className,
      )}
    />
  );
}
