import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { ScrollResumeButton } from './ScrollResumeButton';

/** Distance from the tail, in px, still counted as "at the bottom". */
const AT_BOTTOM_THRESHOLD_PX = 40;

export interface MessageListScrollState {
  atBottom: boolean;
  /** True when the user scrolled away from the tail and auto-scroll is suspended. */
  frozen: boolean;
}

export interface MessageListProps {
  children: ReactNode;
  /**
   * WIRING: pass a value that changes whenever the timeline changes (the
   * history array itself, or its length). It is the auto-scroll effect's only
   * dependency — the list cannot see into `children` to know a message landed.
   */
  scrollKey?: unknown;
  /**
   * WIRING: true while the newest message is still streaming. Streaming appends
   * scroll instantly; anything else scrolls smoothly, so a settled reply doesn't
   * snap under the reader.
   */
  streaming?: boolean;
  /**
   * WIRING: true when the newest message came from the user. Sending unfreezes
   * the list and dismisses the resume pill — you always follow your own message
   * down, even if you had scrolled up to read history.
   */
  lastFromUser?: boolean;
  /** Fires whenever the user crosses the at-bottom threshold. */
  onScrollStateChange?: (state: MessageListScrollState) => void;
  /** Set false to suppress the built-in resume pill and render your own. */
  showResumeButton?: boolean;
  label?: string;
  className?: string;
}

/**
 * Scrolling log of messages. Owns the auto-scroll contract: follow the tail
 * until the user scrolls away, then hold position until they ask to resume or
 * send a message.
 */
export function MessageList({
  children,
  scrollKey,
  streaming = false,
  lastFromUser = false,
  onScrollStateChange,
  showResumeButton = true,
  label = 'Chat history',
  className,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLUListElement>(null);
  const userFrozen = useRef(false);
  const [showResume, setShowResume] = useState(false);

  // Refs, not deps: the effect must fire on timeline changes only. Including
  // these would re-scroll on unrelated re-renders and fight a frozen reader.
  const streamingRef = useRef(streaming);
  const lastFromUserRef = useRef(lastFromUser);
  streamingRef.current = streaming;
  lastFromUserRef.current = lastFromUser;

  useEffect(() => {
    if (lastFromUserRef.current) {
      userFrozen.current = false;
      setShowResume(false);
    }
    if (userFrozen.current) return;
    bottomRef.current?.scrollIntoView({
      behavior: streamingRef.current ? 'instant' : 'smooth',
    });
  }, [scrollKey]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < AT_BOTTOM_THRESHOLD_PX;
    const nowFrozen = !atBottom;
    if (nowFrozen !== userFrozen.current) {
      userFrozen.current = nowFrozen;
      setShowResume(nowFrozen);
      onScrollStateChange?.({ atBottom, frozen: nowFrozen });
    }
  };

  const resumeScroll = () => {
    userFrozen.current = false;
    setShowResume(false);
    onScrollStateChange?.({ atBottom: true, frozen: false });
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={cn('relative flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      <ul
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-label={label}
        aria-live="polite"
        className="flex min-w-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden px-3 py-4"
      >
        {children}
        <div ref={bottomRef} aria-hidden />
      </ul>
      {showResumeButton && showResume && <ScrollResumeButton onPress={resumeScroll} />}
    </div>
  );
}
