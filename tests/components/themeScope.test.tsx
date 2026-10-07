// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createThemeController, parseCssTime } from '@abmex/themes';
import { useThemeController } from '../../packages/ui/src/components/theme-toggle/controller';

const subscriptions = new Map<string, Set<() => void>>();
const matches = new Map<string, boolean>();
const controllers: ReturnType<typeof createThemeController>[] = [];
const create = (options: Parameters<typeof createThemeController>[0] = {}) => {
  const controller = createThemeController(options);
  controllers.push(controller);
  return controller;
};
beforeEach(() => {
  vi.useFakeTimers();
  subscriptions.clear();
  matches.clear();
  document.documentElement.className = '';
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-mode');
  document.body.innerHTML = '';
  window.matchMedia = vi.fn((query: string) => ({
    get matches() { return matches.get(query) ?? false; },
    addEventListener: (_: string, listener: () => void) => {
      if (!subscriptions.has(query)) subscriptions.set(query, new Set());
      subscriptions.get(query)!.add(listener);
    },
    removeEventListener: (_: string, listener: () => void) => subscriptions.get(query)?.delete(listener),
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  controllers.splice(0).forEach(controller => controller.destroy());
  vi.useRealTimers();
});

it('separates theme identity from resolved mode', () => {
  create({ theme: 'phosphor', initial: 'dark' });
  expect(document.documentElement.dataset.theme).toBe('phosphor');
  expect(document.documentElement.dataset.mode).toBe('dark');
});

it('keeps transitions and their duration inside the target scope', () => {
  const target = document.createElement('section');
  target.style.setProperty('--theme-transition-duration', '75ms');
  document.body.append(target);
  const controller = create({ target, initial: 'light' });
  controller.toggle();
  expect(target.classList.contains('theme-transitioning')).toBe(true);
  expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false);
  vi.advanceTimersByTime(75);
  expect(controller.getState().isTransitioning).toBe(false);
});

it('cancels a pending transition when a nonanimated update interrupts it', () => {
  document.documentElement.style.setProperty('--theme-transition-duration', '300ms');
  const controller = create({ initial: 'light' });
  controller.toggle();
  controller.setPreference('light', { transition: false });
  expect(controller.getState().isTransitioning).toBe(false);
  expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});

it('ends motion immediately when reduced motion changes live', () => {
  document.documentElement.style.setProperty('--theme-transition-duration', '300ms');
  const controller = create({ initial: 'light' });
  controller.toggle();
  const query = '(prefers-reduced-motion: reduce)';
  matches.set(query, true);
  subscriptions.get(query)?.forEach(listener => listener());
  expect(controller.getState().isTransitioning).toBe(false);
  expect(vi.getTimerCount()).toBe(0);
});

it('does not mutate DOM, attach listeners or read storage during React server rendering', () => {
  const read = vi.spyOn(Storage.prototype, 'getItem');
  function Probe() {
    const state = useThemeController({ initial: 'dark', storageKey: 'ssr-theme' });
    return <span>{state.resolved}</span>;
  }
  const before = document.documentElement.outerHTML;
  expect(renderToString(<Probe />)).toContain('dark');
  expect(document.documentElement.outerHTML).toBe(before);
  expect(read).not.toHaveBeenCalled();
  expect([...subscriptions.values()].every(set => set.size === 0)).toBe(true);
  read.mockRestore();
});

it('supports injected persistence without touching browser storage', () => {
  const storage = { getItem: vi.fn(() => '{"pref":"dark"}'), setItem: vi.fn() };
  const controller = create({ storageKey: 'theme', storage });
  expect(controller.getState().resolved).toBe('dark');
  controller.setPreference('light');
  expect(storage.setItem).toHaveBeenLastCalledWith('theme', '{"pref":"light","resolved":"light"}');
});

it('rejects malformed or negative CSS durations', () => {
  for (const value of ['-1ms', '12garbage', '1s trailing', 'Infinityms']) expect(parseCssTime(value)).toBe(0);
  expect(parseCssTime('0.25s')).toBe(250);
});
