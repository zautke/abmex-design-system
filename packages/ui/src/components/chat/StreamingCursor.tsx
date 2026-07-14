import { cn } from '../../utils/cn';

export interface StreamingCursorProps {
  className?: string;
}

/** Blinking block caret shown at the tail of a message that is still streaming. */
export function StreamingCursor({ className }: StreamingCursorProps) {
  return (
    <span
      aria-hidden
      className={cn('ml-0.5 inline-block animate-[blink_1s_step-end_infinite]', className)}
    >
      ▋
    </span>
  );
}
