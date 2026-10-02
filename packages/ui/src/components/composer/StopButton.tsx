import { Button } from '@heroui/react';
import { Square } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StopButtonProps {
  onStop: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Brick stop affordance, shown in place of {@link SendButton} while streaming.
 * `variant="danger"` resolves to `--danger`, bridged to `--ph-danger` by the
 * Phosphor HeroUI adapter.
 */
export function StopButton({ onStop, disabled = false, className }: StopButtonProps) {
  return (
    <Button
      isIconOnly
      size="sm"
      variant="danger"
      isDisabled={disabled}
      onPress={onStop}
      aria-label="Stop generation"
      className={cn('h-8 w-8 rounded-lg', className)}
    >
      <Square size={16} fill="currentColor" />
    </Button>
  );
}
