import { cn } from '../../utils/cn';

export interface ConversationEmptyStateProps {
  /** True when the list is empty because a search excluded everything. */
  filtered?: boolean;
  className?: string;
}

export function ConversationEmptyState({ filtered = false, className }: ConversationEmptyStateProps) {
  return (
    <p className={cn('mt-4 text-center text-xs text-drawer-empty-text', className)}>
      {filtered ? 'No matches found.' : 'No conversations yet.'}
    </p>
  );
}
