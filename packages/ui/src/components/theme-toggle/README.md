# theme-toggle — animated light/dark toggle, controller, pre-paint

Port of the labsupapg ThemeToggle without GSAP. Import from `@abmex/ui` or `@abmex/ui/theme-toggle`; `theme-transition.css` ships inside `@abmex/ui/styles.css`.

```tsx
// index.html <head>: no flash, no transition on first paint
<script>{themePrePaintScript('app:theme')}</script>

// app
const { resolved, preference, isTransitioning, toggle, setPreference } =
  useThemeController({ storageKey: 'app:theme' });
useEffect(() => releaseNoTransition(), []);

{preference !== 'system' && <ThemeToggle theme={resolved} onToggle={toggle} isTransitioning={isTransitioning} />}
<ThemeTransitionSlider value={ms} onValueChange={saveMs} />
```

| Export | Notes |
|---|---|
| `createThemeController(opts)` | `target` (default `<html>`), `attribute`, `values` (`{light:'light',dark:'dark'}`), `storageKey`, `initial`. Attribute: option → computed `--theme-attribute` → `'class'`. Sets `color-scheme`, tracks `system` via `matchMedia`, adds `html.theme-transitioning` for `--theme-transition-duration`, mirrors `{pref,resolved}` to storage. |
| `useThemeController(opts)` | React binding (`useSyncExternalStore`); options read once. |
| `ThemeToggle` | `theme`, `onToggle`, `isTransitioning`, `size` (20), `duration` (300 ms). Sun↔moon SMIL path morph (`THEME_ICON_PATHS`, equal command structure); reduced motion skips it. |
| `ThemeTransitionSlider` | Native range 150–1000/25 on `--theme-transition-duration`; `value` / `onValueChange`. |
| `themePrePaintScript(key, attribute?, values?)` | Inline snippet string; `themePrePaint` is the function. Adds `html.no-transition`. |
| `releaseNoTransition()` | Removes `no-transition` after two frames. |

CSS: `[data-no-theme-transition]` opts a subtree out; `prefers-reduced-motion` sets the duration to `0ms`.

## Without `styles.css`

Apps that compose the `@abmex/ui/phosphor/*` layers instead of `styles.css` import the standalone copy in their Tailwind v4 entry:

```css
@import "tailwindcss";
@import "@abmex/ui/phosphor/theme-transition.css";
```

It is the same source that `styles.css` inlines. Importing both is safe: its plain rules are then emitted twice, identically, so the cascade result is the same (only a few hundred bytes are duplicated).
