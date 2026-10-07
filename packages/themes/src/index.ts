export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;

export interface ThemeControllerOptions {
  target?: HTMLElement;
  /** Theme identity, independent of mode. Defaults to neutral. */
  theme?: string;
  /** Mode attribute; legacy consumers can explicitly select class/data-theme. */
  attribute?: string;
  values?: Record<ResolvedTheme, string>;
  /** Persistence is opt-in and uses the target document's storage by default. */
  storageKey?: string;
  storage?: ThemeStorage;
  initial?: ThemePreference;
  /** Create an inert store for rendering; mount it after commit. */
  defer?: boolean;
}
export interface ThemeState {
  theme: string;
  preference: ThemePreference;
  resolved: ResolvedTheme;
  isTransitioning: boolean;
}
export interface ThemeController {
  readonly attribute: string;
  getState(): ThemeState;
  getServerSnapshot(): ThemeState;
  mount(): void;
  setTheme(theme: string): void;
  setPreference(preference: ThemePreference, options?: { transition?: boolean }): void;
  toggle(): void;
  subscribe(listener: () => void): () => void;
  releaseNoTransition(): void;
  destroy(): void;
}

const DARK_QUERY = '(prefers-color-scheme: dark)';
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const isPreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

/** CSS time in milliseconds. Malformed and negative values disable motion. */
export function parseCssTime(value: string): number {
  const match = /^(\d+(?:\.\d+)?|\.\d+)(ms|s)?$/.exec(value.trim());
  if (!match) return 0;
  const result = Number(match[1]) * (match[2] === 's' ? 1000 : 1);
  return Number.isFinite(result) ? result : 0;
}

function afterPaint(target: HTMLElement): () => void {
  const view = target.ownerDocument.defaultView;
  if (!view?.requestAnimationFrame) {
    target.classList.remove('no-transition');
    return () => {};
  }
  let frame = view.requestAnimationFrame(() => {
    frame = view.requestAnimationFrame(() => target.classList.remove('no-transition'));
  });
  return () => view.cancelAnimationFrame(frame);
}

/** Importing this module never reads document or storage. */
export function releaseNoTransition(doc?: Document): () => void {
  const target = doc?.documentElement ?? (typeof document === 'undefined' ? undefined : document.documentElement);
  return target ? afterPaint(target) : () => {};
}

function validateTheme(theme: string): string {
  if (!theme.trim() || theme === 'light' || theme === 'dark') {
    throw new TypeError('Theme identity must be nonempty and distinct from light/dark mode.');
  }
  return theme;
}

export function createThemeController(options: ThemeControllerOptions = {}): ThemeController {
  const attribute = options.attribute ?? 'data-mode';
  const values = options.values ?? { light: 'light', dark: 'dark' };
  const initial = options.initial ?? 'system';
  if (!isPreference(initial)) throw new TypeError('Invalid theme preference.');
  const serverState: ThemeState = {
    theme: validateTheme(options.theme ?? 'neutral'), preference: initial,
    resolved: initial === 'dark' ? 'dark' : 'light', isTransitioning: false,
  };
  let state = serverState;
  let target: HTMLElement | undefined;
  let view: Window | null | undefined;
  let media: MediaQueryList | undefined;
  let reduced: MediaQueryList | undefined;
  let storage: ThemeStorage | undefined;
  let mounted = false;
  let initialized = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelPaint = () => {};
  const listeners = new Set<() => void>();
  const emit = (next: Partial<ThemeState>) => {
    state = { ...state, ...next };
    listeners.forEach(listener => listener());
  };
  const stopTransition = () => {
    clearTimeout(timer);
    timer = undefined;
    target?.classList.remove('theme-transitioning');
  };
  const write = () => {
    if (!mounted || !target) return;
    if (attribute !== 'data-theme') target.setAttribute('data-theme', state.theme);
    if (attribute === 'class') {
      target.classList.remove(...Object.values(values));
      target.classList.add(values[state.resolved]);
    } else target.setAttribute(attribute, values[state.resolved]);
    target.style.colorScheme = state.resolved;
  };
  const apply = (preference: ThemePreference, transition: boolean) => {
    if (!isPreference(preference)) throw new TypeError('Invalid theme preference.');
    const resolved = preference === 'system' ? (media?.matches ? 'dark' : 'light') : preference;
    const duration = mounted && target && view && !reduced?.matches
      ? parseCssTime(view.getComputedStyle(target).getPropertyValue('--theme-transition-duration')) : 0;
    const animate = transition && resolved !== state.resolved && duration > 0;
    stopTransition();
    state = { ...state, preference, resolved, isTransitioning: animate };
    if (animate) target?.classList.add('theme-transitioning');
    write();
    if (animate) timer = setTimeout(() => {
      stopTransition();
      emit({ isTransitioning: false });
    }, duration);
    if (mounted && options.storageKey) {
      try { storage?.setItem(options.storageKey, JSON.stringify({ pref: preference, resolved })); }
      catch { /* Storage failures leave the live in-memory preference usable. */ }
    }
    emit({});
  };
  const onSystemChange = () => {
    if (state.preference === 'system') apply('system', true);
  };
  const onMotionChange = () => {
    if (reduced?.matches && state.isTransitioning) {
      stopTransition();
      emit({ isTransitioning: false });
    }
  };
  const mount = () => {
    if (mounted) return;
    target = options.target ?? (typeof document === 'undefined' ? undefined : document.documentElement);
    if (!target) return;
    view = target.ownerDocument.defaultView;
    media = view?.matchMedia?.(DARK_QUERY);
    reduced = view?.matchMedia?.(REDUCED_QUERY);
    if (options.storageKey) {
      try { storage = options.storage ?? view?.localStorage; } catch { storage = undefined; }
    }
    let preference = state.preference;
    if (!initialized && !options.initial && options.storageKey) {
      try {
        const stored: unknown = JSON.parse(storage?.getItem(options.storageKey) ?? 'null');
        if (stored && typeof stored === 'object' && 'pref' in stored && isPreference(stored.pref)) preference = stored.pref;
      } catch { /* Malformed stored data never prevents a usable theme. */ }
    }
    initialized = mounted = true;
    media?.addEventListener('change', onSystemChange);
    reduced?.addEventListener('change', onMotionChange);
    apply(preference, false);
  };
  const controller: ThemeController = {
    attribute, getState: () => state, getServerSnapshot: () => serverState, mount,
    setTheme(theme) { state = { ...state, theme: validateTheme(theme) }; write(); emit({}); },
    setPreference: (preference, opts) => apply(preference, opts?.transition ?? true),
    toggle: () => apply(state.resolved === 'dark' ? 'light' : 'dark', true),
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    releaseNoTransition() { cancelPaint(); if (target) cancelPaint = afterPaint(target); },
    destroy() {
      mounted = false;
      media?.removeEventListener('change', onSystemChange);
      reduced?.removeEventListener('change', onMotionChange);
      cancelPaint();
      stopTransition();
      state = { ...state, isTransitioning: false };
    },
  };
  if (!options.defer) mount();
  return controller;
}
