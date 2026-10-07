// @vitest-environment jsdom
//
// Re-pointed at the package component. ScrollableTabStrip was ported to
// `@abmex/ui` byte-for-byte in behavior (it is deliberately NOT built on HeroUI
// <Tabs> — the roving tabindex, end-of-strip scroll, focusable tablist and
// chevron affordances are all load-bearing), so every assertion carries over
// unchanged.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ScrollableTabStrip } from '@abmex/ui';

describe('ScrollableTabStrip', () => {
  beforeEach(() => {
    class MockResizeObserver {
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders tabs and selects active tab', () => {
    const onTabChange = vi.fn();
    render(
      <ScrollableTabStrip
        activeTab="b"
        onTabChange={onTabChange}
        tabs={[
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' },
        ]}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Alpha' }).getAttribute('aria-selected')).toBe('false');
    expect(screen.getByRole('tab', { name: 'Beta' }).getAttribute('aria-selected')).toBe('true');

    fireEvent.click(screen.getByRole('tab', { name: 'Alpha' }));
    expect(onTabChange).toHaveBeenCalledWith('a');
  });

  it('scrolls horizontally on ArrowRight when strip container is focused', () => {
    const scrollBy = vi.fn();
    render(
      <ScrollableTabStrip
        activeTab="a"
        onTabChange={vi.fn()}
        tabs={[
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' },
          { id: 'c', label: 'Gamma' },
        ]}
      />,
    );

    const tablist = screen.getByRole('tablist');
    Object.defineProperty(tablist, 'scrollBy', { value: scrollBy, configurable: true });
    Object.defineProperty(tablist, 'scrollWidth', { value: 500, configurable: true });
    Object.defineProperty(tablist, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(tablist, 'scrollLeft', { value: 0, configurable: true });

    tablist.focus();
    fireEvent.keyDown(tablist, { key: 'ArrowRight' });

    expect(scrollBy).toHaveBeenCalledWith({ left: 80, behavior: 'smooth' });
  });

  it('shows scroll-right chevron when content overflows and hides when not', () => {
    render(
      <ScrollableTabStrip
        activeTab="a"
        onTabChange={vi.fn()}
        tabs={[
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' },
          { id: 'c', label: 'Gamma' },
          { id: 'd', label: 'Delta' },
        ]}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Scroll tabs right' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Scroll tabs left' })).toBeNull();

    const tablist = screen.getByRole('tablist');
    Object.defineProperty(tablist, 'scrollWidth', { value: 600, configurable: true });
    Object.defineProperty(tablist, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(tablist, 'scrollLeft', { value: 0, configurable: true });

    fireEvent.scroll(tablist);

    expect(screen.getByRole('button', { name: 'Scroll tabs right' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Scroll tabs left' })).toBeNull();
  });

  it('moves active tab with ArrowLeft and ArrowRight when a tab is focused', () => {
    const onTabChange = vi.fn();
    render(
      <ScrollableTabStrip
        activeTab="b"
        onTabChange={onTabChange}
        tabs={[
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' },
          { id: 'c', label: 'Gamma' },
        ]}
      />,
    );

    const beta = screen.getByRole('tab', { name: 'Beta' });
    beta.focus();
    fireEvent.keyDown(beta, { key: 'ArrowLeft' });
    expect(onTabChange).toHaveBeenCalledWith('a');

    onTabChange.mockClear();
    beta.focus();
    fireEvent.keyDown(beta, { key: 'ArrowRight' });
    expect(onTabChange).toHaveBeenCalledWith('c');
  });
});
