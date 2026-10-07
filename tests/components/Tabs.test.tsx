// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, act } from '@testing-library/react';
import { Tabs } from '@abmex/ui/tabs';

beforeEach(() => vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); delete (HTMLElement.prototype as Partial<HTMLElement>).animate; });

it('preserves React 19 callback-ref cleanup without reattaching on rerender', () => {
  const dispose = vi.fn();
  const ref = vi.fn(() => dispose);
  const view = render(<Tabs><Tabs.SheetList><Tabs.Tab value="a" ref={ref}>A</Tabs.Tab></Tabs.SheetList></Tabs>);
  view.rerender(<Tabs><Tabs.SheetList><Tabs.Tab value="a" ref={ref}>B</Tabs.Tab></Tabs.SheetList></Tabs>);
  expect(ref).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(dispose).toHaveBeenCalledTimes(1);
});

it('honors prevented selection events', () => {
  const select = vi.fn();
  const view = render(<Tabs onValueChange={select}><Tabs.SheetList><Tabs.Tab value="a" onClick={e => e.preventDefault()}>A</Tabs.Tab></Tabs.SheetList></Tabs>);
  fireEvent.click(view.getByRole('tab'));
  expect(select).not.toHaveBeenCalled();
});

it('moves the tab stop off a disabled selection and follows RTL arrow order', () => {
  const view = render(<Tabs value="a"><Tabs.SheetList style={{ direction: 'rtl' }}><Tabs.Tab value="a" disabled>A</Tabs.Tab><Tabs.Tab value="b">B</Tabs.Tab><Tabs.Tab value="c">C</Tabs.Tab></Tabs.SheetList></Tabs>);
  const [a, b, c] = view.getAllByRole('tab');
  expect(a.tabIndex).toBe(-1);
  expect(b.tabIndex).toBe(0);
  // Direction belongs to the actual keyboard interaction scope.
  view.getByRole('tablist').style.direction = 'rtl';
  b.focus();
  fireEvent.keyDown(b, { key: 'ArrowLeft' });
  expect(document.activeElement).toBe(c);
});

it('recovers focus when the focused selection becomes disabled', () => {
  const tree = (disabled: boolean) => <Tabs value="a"><Tabs.SheetList><Tabs.Tab value="a" disabled={disabled}>A</Tabs.Tab><Tabs.Tab value="b">B</Tabs.Tab></Tabs.SheetList></Tabs>;
  const view = render(tree(false));
  view.getAllByRole('tab')[0].focus();
  view.rerender(tree(true));
  expect(document.activeElement).toBe(view.getAllByRole('tab')[1]);
});

it('uses scoped duration for exit lifetime and cancels animation on reentry', () => {
  vi.useFakeTimers();
  const cancel = vi.fn();
  const animate = vi.fn(() => ({ cancel }));
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
  const tree = (visible: boolean) => <Tabs style={{ '--tab-exit-duration': '0.5s' } as React.CSSProperties}><Tabs.SheetList>{visible && <Tabs.Tab key="a" value="a">A</Tabs.Tab>}</Tabs.SheetList></Tabs>;
  const view = render(tree(true));
  view.rerender(tree(false));
  expect(animate).toHaveBeenLastCalledWith(expect.any(Array), expect.objectContaining({ duration: 500 }));
  act(() => vi.advanceTimersByTime(200));
  expect(view.getByRole('tab')).toBeTruthy();
  view.rerender(tree(true));
  expect(cancel).toHaveBeenCalled();
  view.rerender(tree(false));
  act(() => vi.advanceTimersByTime(500));
  expect(view.queryByRole('tab')).toBeNull();
  delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
});

it('cancels in-flight animation when the system requests reduced motion', () => {
  const preference = new EventTarget();
  const media = { matches: false, addEventListener: preference.addEventListener.bind(preference), removeEventListener: preference.removeEventListener.bind(preference) };
  vi.stubGlobal('matchMedia', () => media);
  const cancel = vi.fn();
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: () => ({ cancel }) });
  const tree = (visible: boolean) => <Tabs><Tabs.SheetList>{visible && <Tabs.Tab key="a" value="a">A</Tabs.Tab>}</Tabs.SheetList></Tabs>;
  const view = render(tree(true));
  view.rerender(tree(false));
  media.matches = true;
  act(() => preference.dispatchEvent(new Event('change')));
  expect(cancel).toHaveBeenCalled();
  expect(view.queryByRole('tab')).toBeNull();
});
