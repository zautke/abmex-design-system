import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface ChatEmptyStateProps {
  children?: ReactNode;
  className?: string;
}

/** Placeholder shown in place of the message list before the first message. */
export function ChatEmptyState({
  children = 'Send a message to start chatting.',
  className,
}: ChatEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-1 items-center justify-center text-sm text-chat-empty-text',
        className,
      )}
    >
      {children}
    </div>
  );
}
