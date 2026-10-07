// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createThemeController, parseCssTime } from '../../packages/ui/src/components/theme-toggle/controller';
import { themePrePaintScript } from '../../packages/ui/src/components/theme-toggle/pre-paint';

// jsdom has no matchMedia: a controllable prefers-color-scheme stub.
let dark = false;
const listeners = new Set<() => void>();
function stubMatchMedia() {
  window.matchMedia = vi.fn((query: string) => ({
    get matches() {
      return query.includes('dark') ? dark : false;
    },
    media: query,
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
  })) as unknown as typeof window.matchMedia;
}
const flipSystem = (next: boolean) => {
  dark = next;
  listeners.forEach((l) => l());
};

const html = document.documentElement;
let style: HTMLStyleElement;

beforeEach(() => {
  dark = false;
  listeners.clear();
  stubMatchMedia();
  localStorage.clear();
  html.className = '';
  html.removeAttribute('data-theme');
  html.removeAttribute('style');
  style = document.createElement('style');
  document.head.append(style);
});
afterEach(() => style.remove());

describe('createThemeController attribute resolution', () => {
  it('explicit option wins over the CSS declaration', () => {
    style.textContent = ':root { --theme-attribute: class; }';
    const c = createThemeController({ attribute: 'data-theme', initial: 'dark' });
    expect(c.attribute).toBe('data-theme');
    expect(html.getAttribute('data-theme')).toBe('dark');
    expect(html.classList.contains('dark')).toBe(false);
    c.destroy();
  });

  it('reads the computed --theme-attribute when no option is given', () => {
    style.textContent = ':root { --theme-attribute: data-theme; }';
    const c = createThemeController({ initial: 'light' });
    expect(c.attribute).toBe('data-theme');
    expect(html.getAttribute('data-theme')).toBe('light');
    c.destroy();
  });

  it("falls back to 'class' and swaps value classes", () => {
    const c = createThemeController({ initial: 'dark', values: { light: 'is-light', dark: 'is-dark' } });
    expect(c.attribute).toBe('class');
    expect(html.classList.contains('is-dark')).toBe(true);
    c.setPreference('light', { transition: false });
    expect(html.classList.contains('is-dark')).toBe(false);
    expect(html.classList.contains('is-light')).toBe(true);
    expect(html.style.colorScheme).toBe('light');
    c.destroy();
  });
});

describe('createThemeController system preference', () => {
  it('follows the matchMedia change listener while the preference is system', () => {
    const c = createThemeController({ storageKey: 't' });
    const seen: string[] = [];
    c.subscribe(() => seen.push(c.getState().resolved));
    expect(c.getState()).toMatchObject({ preference: 'system', resolved: 'light' });
    flipSystem(true);
    expect(c.getState().resolved).toBe('dark');
    expect(html.classList.contains('dark')).toBe(true);
    expect(JSON.parse(localStorage.getItem('t')!)).toEqual({ pref: 'system', resolved: 'dark' });
    expect(seen).toContain('dark');

    c.setPreference('light', { transition: false });
    flipSystem(false);
    flipSystem(true);
    expect(c.getState()).toMatchObject({ preference: 'light', resolved: 'light' });

    c.destroy();
    expect(listeners.size).toBe(0);
  });

  it('runs the transition choreography for the computed duration', () => {
    vi.useFakeTimers();
    style.textContent = ':root { --theme-transition-duration: 300ms; }';
    const c = createThemeController({ initial: 'light' });
    c.toggle();
    expect(html.classList.contains('theme-transitioning')).toBe(true);
    expect(c.getState()).toMatchObject({ resolved: 'dark', isTransitioning: true });
    vi.advanceTimersByTime(300);
    expect(html.classList.contains('theme-transitioning')).toBe(false);
    expect(c.getState().isTransitioning).toBe(false);
    c.destroy();
    vi.useRealTimers();
  });
});

describe('theme pre-paint snippet', () => {
  it('applies the stored preference and adds no-transition', () => {
    localStorage.setItem('k', JSON.stringify({ pref: 'dark', resolved: 'dark' }));
    new Function(themePrePaintScript('k'))();
    expect(html.classList.contains('dark')).toBe(true);
    expect(html.classList.contains('no-transition')).toBe(true);
  });

  it('falls back to the system preference', () => {
    new Function(themePrePaintScript('missing', 'data-theme'))();
    expect(html.getAttribute('data-theme')).toBe('light');
  });
});

it('parseCssTime', () => {
  expect(parseCssTime(' 550ms')).toBe(550);
  expect(parseCssTime('0.5s')).toBe(500);
  expect(parseCssTime('')).toBe(0);
});
