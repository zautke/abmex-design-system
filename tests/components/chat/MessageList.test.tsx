// @vitest-environment jsdom
//
// The scroll contract, lifted out of ChatPane.test.tsx.
//
// ChatPane's tests only ever asserted the role="log" landmark; the rest of the
// auto-scroll behavior — the at-bottom threshold, freeze-on-user-scroll, the
// resume pill, instant-vs-smooth, follow-your-own-message — was carried by the
// component and covered by nothing. It now lives in the kit's MessageList, which
// owns it explicitly, so it is asserted explicitly here.
//
// jsdom does no layout: scrollHeight/scrollTop/clientHeight are all 0 and
// Element.scrollTo does not exist. Both are supplied below, which is what lets the
// 40px threshold be tested at all.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { MessageList } from '@abmex/ui';

/** Distance from the tail still counted as "at the bottom" (MessageList's own constant). */
const AT_BOTTOM_THRESHOLD_PX = 40;

const VIEWPORT_H = 200;
const CONTENT_H = 1000;
/** scrollTop values either side of the threshold. */
const AT_BOTTOM_TOP = CONTENT_H - VIEWPORT_H - (AT_BOTTOM_THRESHOLD_PX - 20); // 20px from tail
const SCROLLED_AWAY_TOP = CONTENT_H - VIEWPORT_H - 100; // 100px from tail

// Typed to the options overload of Element.prototype.scrollTo; `mock.contexts`
// records which element was scrolled.
type ElementScrollTo = (this: Element, options?: ScrollToOptions) => void;

let scrollToSpy: ReturnType<typeof vi.fn<ElementScrollTo>>;

beforeEach(() => {
  scrollToSpy = vi.fn<ElementScrollTo>();
  Element.prototype.scrollTo = scrollToSpy as unknown as Element['scrollTo'];
});

const scrolledWith = (behavior: ScrollBehavior) => expect.objectContaining({ behavior });

afterEach(() => cleanup());

/** Give the log element a layout jsdom will not compute on its own. */
function setScrollMetrics(el: HTMLElement, scrollTop: number) {
  Object.defineProperty(el, 'scrollHeight', { value: CONTENT_H, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: VIEWPORT_H, configurable: true });
  Object.defineProperty(el, 'scrollTop', { value: scrollTop, configurable: true });
}

function scrollTo(el: HTMLElement, scrollTop: number) {
  setScrollMetrics(el, scrollTop);
  fireEvent.scroll(el);
}

describe('MessageList — landmark', () => {
  it('exposes role="log", an aria-label and a polite live region', () => {
    render(
      <MessageList label="Chat history">
        <li>hello</li>
      </MessageList>,
    );
    const log = screen.getByRole('log');
    expect(log.tagName.toLowerCase()).toBe('ul');
    expect(log.getAttribute('aria-label')).toBe('Chat history');
    expect(log.getAttribute('aria-live')).toBe('polite');
  });
});

describe('MessageList — auto-scroll', () => {
  // Regression, 2026-10-12: the tail used to be reached with scrollIntoView,
  // which also scrolled the host's overflow:hidden ancestors and pushed the
  // whole log above the viewport. Only the log itself may move.
  it('scrolls the log itself to its full height, never an ancestor', () => {
    const { rerender } = render(
      <div>
        <MessageList scrollKey={1}>
          <li>one</li>
        </MessageList>
      </div>,
    );
    const log = screen.getByRole('log');
    setScrollMetrics(log, 0);
    scrollToSpy.mockClear();

    rerender(
      <div>
        <MessageList scrollKey={2}>
          <li>one</li>
          <li>two</li>
        </MessageList>
      </div>,
    );

    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(scrollToSpy.mock.contexts[0]).toBe(log);
    expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({ top: CONTENT_H }));
  });

  it('is the containing block of absolutely positioned descendants', () => {
    // jsdom has no layout, so this guards the class only: without `relative`
    // an sr-only child resolves against the wrapper, escapes the log's clip
    // and inflates overflow:hidden ancestors.
    render(
      <MessageList>
        <li>one</li>
      </MessageList>,
    );
    expect(screen.getByRole('log').className).toMatch(/(^|\s)relative(\s|$)/);
  });

  it('scrolls to the tail smoothly when the timeline changes', () => {
    const { rerender } = render(
      <MessageList scrollKey={1}>
        <li>one</li>
      </MessageList>,
    );
    scrollToSpy.mockClear();

    rerender(
      <MessageList scrollKey={2}>
        <li>one</li>
        <li>two</li>
      </MessageList>,
    );

    expect(scrollToSpy).toHaveBeenCalledWith(scrolledWith('smooth'));
  });

  it('scrolls instantly while streaming, so appends do not animate under the reader', () => {
    const { rerender } = render(
      <MessageList scrollKey={1} streaming>
        <li>one</li>
      </MessageList>,
    );
    scrollToSpy.mockClear();

    rerender(
      <MessageList scrollKey={2} streaming>
        <li>one…</li>
      </MessageList>,
    );

    expect(scrollToSpy).toHaveBeenCalledWith(scrolledWith('instant'));
  });
});

describe('MessageList — freeze on user scroll', () => {
  it('does NOT freeze while the user stays within the at-bottom threshold', () => {
    const onScrollStateChange = vi.fn();
    render(
      <MessageList scrollKey={1} onScrollStateChange={onScrollStateChange}>
        <li>one</li>
      </MessageList>,
    );

    scrollTo(screen.getByRole('log'), AT_BOTTOM_TOP);

    expect(onScrollStateChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Resume/i })).toBeNull();
  });

  it('freezes and shows the resume pill once the user scrolls past the threshold', () => {
    const onScrollStateChange = vi.fn();
    render(
      <MessageList scrollKey={1} onScrollStateChange={onScrollStateChange}>
        <li>one</li>
      </MessageList>,
    );

    scrollTo(screen.getByRole('log'), SCROLLED_AWAY_TOP);

    expect(onScrollStateChange).toHaveBeenCalledWith({ atBottom: false, frozen: true });
    expect(screen.getByRole('button', { name: /Resume/i })).toBeTruthy();
  });

  it('holds position: a new message does not scroll a frozen list', () => {
    const { rerender } = render(
      <MessageList scrollKey={1}>
        <li>one</li>
      </MessageList>,
    );
    scrollTo(screen.getByRole('log'), SCROLLED_AWAY_TOP);
    scrollToSpy.mockClear();

    rerender(
      <MessageList scrollKey={2}>
        <li>one</li>
        <li>two</li>
      </MessageList>,
    );

    expect(scrollToSpy).not.toHaveBeenCalled();
    // Still frozen, so the pill stays up.
    expect(screen.getByRole('button', { name: /Resume/i })).toBeTruthy();
  });

  it('the resume pill returns to the tail and dismisses itself', () => {
    const onScrollStateChange = vi.fn();
    render(
      <MessageList scrollKey={1} onScrollStateChange={onScrollStateChange}>
        <li>one</li>
      </MessageList>,
    );
    scrollTo(screen.getByRole('log'), SCROLLED_AWAY_TOP);
    scrollToSpy.mockClear();
    onScrollStateChange.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /Resume/i }));

    expect(scrollToSpy).toHaveBeenCalledWith(scrolledWith('smooth'));
    expect(onScrollStateChange).toHaveBeenCalledWith({ atBottom: true, frozen: false });
    expect(screen.queryByRole('button', { name: /Resume/i })).toBeNull();
  });

  it('sending a message unfreezes the list — you always follow your own message down', () => {
    const { rerender } = render(
      <MessageList scrollKey={1}>
        <li>one</li>
      </MessageList>,
    );
    scrollTo(screen.getByRole('log'), SCROLLED_AWAY_TOP);
    expect(screen.getByRole('button', { name: /Resume/i })).toBeTruthy();
    scrollToSpy.mockClear();

    // The user sends: lastFromUser flips true as the timeline changes.
    rerender(
      <MessageList scrollKey={2} lastFromUser>
        <li>one</li>
        <li>mine</li>
      </MessageList>,
    );

    expect(scrollToSpy).toHaveBeenCalledWith(scrolledWith('smooth'));
    expect(screen.queryByRole('button', { name: /Resume/i })).toBeNull();
  });

  it('showResumeButton=false suppresses the built-in pill but still reports the state', () => {
    const onScrollStateChange = vi.fn();
    render(
      <MessageList scrollKey={1} showResumeButton={false} onScrollStateChange={onScrollStateChange}>
        <li>one</li>
      </MessageList>,
    );

    scrollTo(screen.getByRole('log'), SCROLLED_AWAY_TOP);

    expect(onScrollStateChange).toHaveBeenCalledWith({ atBottom: false, frozen: true });
    expect(screen.queryByRole('button', { name: /Resume/i })).toBeNull();
  });
});
