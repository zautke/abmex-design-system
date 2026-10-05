import { Button } from '@heroui/react';
import { ArrowUp } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SendButtonProps {
  onSend: () => void;
  /** Disable when the composer is empty or the transport is unavailable. */
  disabled?: boolean;
  className?: string;
}

/**
 * Mint send affordance. `variant="primary"` resolves to `--accent`, which the
 * Phosphor HeroUI adapter points at `--primary`. No per-component color
 * override needed.
 */
export function SendButton({ onSend, disabled = false, className }: SendButtonProps) {
  return (
    <Button
      isIconOnly
      size="sm"
      variant="primary"
      isDisabled={disabled}
      onPress={onSend}
      aria-label="Send message"
      className={cn('h-8 w-8 rounded-lg', className)}
    >
      <ArrowUp size={18} />
    </Button>
  );
}
