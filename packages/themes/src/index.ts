export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeControllerOptions {
  /** Element that carries the theme attribute. Default `document.documentElement`. */
  target?: HTMLElement;
  /**
   * `'class'` or an attribute name such as `'data-theme'`. Default: the computed
   * `--theme-attribute` custom property on `target` (Phosphor declares `class`), else `'class'`.
   */
  attribute?: string;
  /** Attribute value / class name per resolved theme. Default `{ light: 'light', dark: 'dark' }`. */
  values?: Record<ResolvedTheme, string>;
  /** localStorage key mirrored as `{ pref, resolved }` for the pre-paint snippet. Omit to skip storage. */
  storageKey?: string;
  /** Initial preference. Default: the stored `pref`, else `'system'`. */
  initial?: ThemePreference;
}

export interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  isTransitioning: boolean;
}

export interface ThemeController {
  /** The resolved attribute (`'class'` or an attribute name). */
  readonly attribute: string;
  getState(): ThemeState;
  /** Applies a preference; animates the swap unless `transition: false` or the duration is 0. */
  setPreference(preference: ThemePreference, options?: { transition?: boolean }): void;
  /** Flips the resolved theme to an explicit light/dark preference. */
  toggle(): void;
  subscribe(listener: () => void): () => void;
  /** Removes `html.no-transition` (set by the pre-paint snippet) after two frames. */
  releaseNoTransition(): void;
  /** Detaches the system listener and pending timers. `subscribe` re-attaches the listener. */
  destroy(): void;
}

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Milliseconds from a CSS time value (`550ms`, `0.5s`); 0 when unset or unparsable. */
export function parseCssTime(value: string): number {
  const v = value.trim();
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return 0;
  return v.endsWith('ms') ? n : v.endsWith('s') ? n * 1000 : n;
}

/** Removes `no-transition` from `<html>` after first paint (double rAF). */
export function releaseNoTransition(doc: Document = document) {
  requestAnimationFrame(() => requestAnimationFrame(() => doc.documentElement.classList.remove('no-transition')));
}

function readStored(key: string | undefined): { pref?: ThemePreference } {
  if (!key) return {};
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') ?? {};
  } catch {
    return {};
  }
}

/**
 * Framework-agnostic theme controller: resolves `system` via `matchMedia`, writes the
 * class/attribute and `color-scheme`, runs the `html.theme-transitioning` choreography
 * timed from `--theme-transition-duration`, and mirrors `{ pref, resolved }` to storage.
 */
export function createThemeController(options: ThemeControllerOptions = {}): ThemeController {
  const target = options.target ?? document.documentElement;
  const root = target.ownerDocument.documentElement;
  const view = target.ownerDocument.defaultView ?? window;
  const values = options.values ?? { light: 'light', dark: 'dark' };
  const attribute =
    options.attribute || view.getComputedStyle(target).getPropertyValue('--theme-attribute').trim() || 'class';
  const media = view.matchMedia(DARK_QUERY);
  const stored = readStored(options.storageKey).pref;
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let attached = false;

  const resolve = (pref: ThemePreference): ResolvedTheme =>
    pref === 'system' ? (media.matches ? 'dark' : 'light') : pref;

  const initial: ThemePreference =
    options.initial ?? (stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system');
  let state: ThemeState = { preference: initial, resolved: resolve(initial), isTransitioning: false };

  const emit = (next: Partial<ThemeState>) => {
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  };

  const write = (resolved: ResolvedTheme) => {
    if (attribute === 'class') {
      target.classList.remove(...Object.values(values));
      target.classList.add(values[resolved]);
    } else {
      target.setAttribute(attribute, values[resolved]);
    }
    target.style.colorScheme = resolved;
  };

  const persist = () => {
    if (!options.storageKey) return;
    try {
      localStorage.setItem(options.storageKey, JSON.stringify({ pref: state.preference, resolved: state.resolved }));
    } catch {
      // Storage blocked (private mode, sandbox): the in-memory state still applies.
    }
  };

  const apply = (preference: ThemePreference, transition: boolean) => {
    const resolved = resolve(preference);
    const changed = resolved !== state.resolved;
    const duration = parseCssTime(view.getComputedStyle(root).getPropertyValue('--theme-transition-duration'));
    if (transition && changed && duration > 0) {
      clearTimeout(timer);
      root.classList.add('theme-transitioning');
      write(resolved);
      emit({ preference, resolved, isTransitioning: true });
      timer = setTimeout(() => {
        root.classList.remove('theme-transitioning');
        emit({ isTransitioning: false });
      }, duration);
    } else {
      write(resolved);
      emit({ preference, resolved });
    }
    persist();
  };

  const onSystemChange = () => {
    if (state.preference === 'system') apply('system', true);
  };
  const attach = () => {
    if (attached) return;
    attached = true;
    media.addEventListener('change', onSystemChange);
  };

  write(state.resolved);
  persist();
  attach();

  return {
    attribute,
    getState: () => state,
    setPreference: (preference, opts) => apply(preference, opts?.transition ?? true),
    toggle: () => apply(state.resolved === 'dark' ? 'light' : 'dark', true),
    subscribe(listener) {
      attach();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    releaseNoTransition: () => releaseNoTransition(target.ownerDocument),
    destroy() {
      attached = false;
      media.removeEventListener('change', onSystemChange);
      clearTimeout(timer);
      root.classList.remove('theme-transitioning');
    },
  };
}
