// ScrollableTabStrip — a horizontally scrollable `role="tablist"` with a full
// keyboard and pointer contract. Ported byte-for-byte in behavior from the
// Merlyn settings panel; only the class strings were re-expressed through `cn`.
//
// Deliberately NOT built on HeroUI <Tabs>. The contract below is wider than
// what a stock tabs component gives you, and every part of it is load-bearing
// in a 320px-wide side panel where the strip always overflows:
//
//   - roving tabindex (active tab is the only tab stop)
//   - ArrowLeft/ArrowRight move selection; at the ends they *scroll* instead of
//     wrapping, so a partially clipped neighbour can still be revealed
//   - the tablist itself is focusable and arrow keys scroll it
//   - vertical wheel is translated to horizontal scroll (non-passive listener,
//     so preventDefault actually holds)
//   - ResizeObserver keeps the chevron affordances honest
//   - focus and active-tab changes scroll the tab into view
//
// Trading any of that for a logo would be a regression, so this stays bespoke.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ScrollableTabItem {
  id: string;
  label: string;
  /** Absolutely-positioned decoration (e.g. a status pip). Rendered inside the tab. */
  adornment?: ReactNode;
}

export interface ScrollableTabStripProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  tabs: ScrollableTabItem[];
  ariaLabel?: string;
  className?: string;
}

const SCROLL_STEP_PX = 120;
const KEY_SCROLL_STEP_PX = 80;

export function ScrollableTabStrip({
  activeTab,
  onTabChange,
  tabs,
  ariaLabel = 'Settings sections',
  className,
}: ScrollableTabStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollState, { passive: true });
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) return;
      event.preventDefault();
      el.scrollBy({ left: event.deltaY });
    };
    // Non-passive: preventDefault on a passive wheel listener is a no-op.
    el.addEventListener('wheel', onWheel, { passive: false });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      el.removeEventListener('wheel', onWheel);
      observer.disconnect();
    };
  }, [tabs, updateScrollState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const activeButton = el.querySelector<HTMLButtonElement>(`[data-tab-id="${activeTab}"]`);
    activeButton?.scrollIntoView?.({ inline: 'nearest', block: 'nearest' });
  }, [activeTab, tabs]);

  const scrollBy = useCallback((delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  const focusTabAt = useCallback(
    (index: number) => {
      const tab = tabs[index];
      if (!tab) return;
      onTabChange(tab.id);
      const el = scrollRef.current?.querySelector<HTMLButtonElement>(`[data-tab-id="${tab.id}"]`);
      el?.focus();
    },
    [onTabChange, tabs],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    const target = event.target as HTMLElement;
    const isTab = target.getAttribute('role') === 'tab';
    const isTabList = target === scrollRef.current;

    if (isTab) {
      event.preventDefault();
      const index = tabs.findIndex((tab) => tab.id === target.getAttribute('data-tab-id'));
      if (index < 0) return;
      if (event.key === 'ArrowLeft') {
        if (index > 0) focusTabAt(index - 1);
        else scrollBy(-KEY_SCROLL_STEP_PX);
      } else if (index < tabs.length - 1) {
        focusTabAt(index + 1);
      } else {
        scrollBy(KEY_SCROLL_STEP_PX);
      }
      return;
    }

    if (isTabList) {
      event.preventDefault();
      if (event.key === 'ArrowLeft') scrollBy(-KEY_SCROLL_STEP_PX);
      else scrollBy(KEY_SCROLL_STEP_PX);
      return;
    }

    if (event.key === 'ArrowLeft' && activeIndex > 0) {
      event.preventDefault();
      focusTabAt(activeIndex - 1);
    } else if (event.key === 'ArrowRight' && activeIndex >= 0 && activeIndex < tabs.length - 1) {
      event.preventDefault();
      focusTabAt(activeIndex + 1);
    }
  };

  return (
    <div
      className={cn(
        'flex min-w-0 flex-shrink-0 items-stretch border-b border-border bg-surface',
        className,
      )}
    >
      {canScrollLeft ? (
        <button
          type="button"
          aria-label="Scroll tabs left"
          tabIndex={0}
          onClick={() => scrollBy(-SCROLL_STEP_PX)}
          className="flex flex-shrink-0 items-center justify-center px-1 text-fg-muted transition-colors hover:text-fg-strong"
        >
          <ChevronLeft size={14} />
        </button>
      ) : null}

      <div
        ref={scrollRef}
        role="tablist"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="scrollbar-none flex min-w-0 flex-1 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              role="tab"
              data-tab-id={tab.id}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onFocus={(e) => e.currentTarget.scrollIntoView?.({ inline: 'nearest', block: 'nearest' })}
              className={cn(
                'relative flex-shrink-0 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors',
                isActive
                  ? '-mb-px border-b-2 border-primary bg-surface-2 text-fg-strong'
                  : 'text-fg-sage hover:bg-surface-2 hover:text-fg-strong',
              )}
            >
              {tab.label}
              {tab.adornment}
            </button>
          );
        })}
      </div>

      {canScrollRight ? (
        <button
          type="button"
          aria-label="Scroll tabs right"
          tabIndex={0}
          onClick={() => scrollBy(SCROLL_STEP_PX)}
          className="flex flex-shrink-0 items-center justify-center px-1 text-fg-muted transition-colors hover:text-fg-strong"
        >
          <ChevronRight size={14} />
        </button>
      ) : null}
    </div>
  );
}
