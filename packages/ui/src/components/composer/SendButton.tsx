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
 * Teal send affordance. `variant="primary"` resolves to `--accent`, which the
 * kit's HeroUI token bridge points at `--color-teal-700` — the same teal the
 * bespoke send button used. No per-component color override needed.
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
