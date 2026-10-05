import { Button } from '@heroui/react';
import { cn } from '../../utils/cn';

export interface ScrollResumeButtonProps {
  onPress: () => void;
  label?: string;
  className?: string;
}

/**
 * Pill that returns a frozen `MessageList` to the tail. `MessageList` renders
 * this for you; export it separately for consumers that want the affordance
 * somewhere else (e.g. pinned to a composer).
 */
export function ScrollResumeButton({
  onPress,
  label = '↓ Resume',
  className,
}: ScrollResumeButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onPress={onPress}
      className={cn(
        'absolute bottom-3 right-3 z-10 rounded-full bg-overlay text-xs text-fg-muted shadow-sm hover:text-fg-strong',
        className,
      )}
    >
      {label}
    </Button>
  );
}
