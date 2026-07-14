import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { StreamingCursor } from './StreamingCursor';

export interface ChatBubbleProps {
  role: 'user' | 'assistant';
  /**
   * The rendered message body. Pass a `MarkdownRenderer`, plain text, or any
   * node — the bubble deliberately knows nothing about message shape.
   */
  children?: ReactNode;
  streaming?: boolean;
  /** Error text rendered under the body; also dims the bubble. */
  error?: string;
  /**
   * Slot below the bubble, aligned to the same edge. This is where the
   * assistant's `StreamingRate` goes.
   */
  footer?: ReactNode;
  className?: string;
}

function isEmpty(children: ReactNode): boolean {
  return children == null || children === '' || children === false;
}

/**
 * One chat message. Bespoke rather than HeroUI `Card` — the tail-radius +
 * role-mirrored layout is the identity of the surface, and the
 * `--color-chat-bubble-*` tokens already theme it.
 */
export function ChatBubble({
  role,
  children,
  streaming = false,
  error,
  footer,
  className,
}: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <li
      className={cn(
        'flex w-full min-w-0 flex-col',
        isUser ? 'items-end' : 'items-start',
        className,
      )}
    >
      <div
        className={cn(
          'min-w-0 max-w-[85%] overflow-hidden rounded-2xl px-3 py-2 text-sm leading-relaxed [overflow-wrap:anywhere]',
          isUser
            ? 'rounded-br-sm bg-chat-bubble-user-bg text-chat-bubble-user-text'
            : 'rounded-bl-sm border border-chat-bubble-ai-border bg-chat-bubble-ai-bg text-chat-bubble-ai-text',
          error ? 'opacity-70' : '',
        )}
      >
        <div className="flex min-w-0 max-w-full flex-col">
          {/* An empty, settled message is a message the model never filled in — say so
              with an ellipsis rather than collapsing the bubble to nothing. */}
          {isEmpty(children) ? (streaming ? null : '…') : children}
          {streaming && <StreamingCursor />}
          {error && <span className="mt-1 block text-xs text-chat-error-text">{error}</span>}
        </div>
      </div>
      {footer}
    </li>
  );
}
