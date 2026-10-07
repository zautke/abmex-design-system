import { useEffect, useRef, type ComponentPropsWithRef } from 'react';
import { cn } from '../../utils/cn';
import { prefersReducedMotion } from '../../utils/motion';
import type { ResolvedTheme } from './controller';

/**
 * Sun (light) and moon (dark) re-authored from labsupapg `IconPaths.theme` with an
 * identical command sequence — 8 × `M L` dots, then `M C C C C Z` — so SMIL
 * interpolates every coordinate: the circle swells into the moon's outer arc, its last
 * segment folds in as the inner arc, and the ray dots slide onto the moon's outline.
 */
export const THEME_ICON_PATHS = {
  sun: 'M12 3L12 3M12 21L12 21M4.22 4.22L4.22 4.22M19.78 19.78L19.78 19.78M1 12L1 12M23 12L23 12M4.22 19.78L4.22 19.78M19.78 4.22L19.78 4.22M16.98 12.44C16.75 15.08 14.5 17.08 11.85 17C9.21 16.92 7.08 14.79 7 12.15C6.92 9.5 8.92 7.25 11.56 7.02C14.66 6.75 17.25 9.34 16.98 12.44Z',
  moon: 'M11.21 3L11.21 3M12.09 21.03L12.09 21.03M5.71 5.51L5.71 5.51M18.49 18.29L18.49 18.29M2.97 11.91L2.97 11.91M21 12.79L21 12.79M5.61 18.39L5.61 18.39M21 12.79L21 12.79M21 12.79C20.58 17.56 16.52 21.17 11.74 21.03C6.95 20.89 3.11 17.05 2.97 12.26C2.83 7.48 6.44 3.42 11.21 3C6.43 9.46 14.54 17.57 21 12.79Z',
} as const;

export interface ThemeToggleProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** The resolved theme shown: sun in light, moon in dark. */
  theme: ResolvedTheme;
  /** Called on click (after any `onClick`, unless it calls `preventDefault`). */
  onToggle: () => void;
  /** Disables the button while the theme transition runs. */
  isTransitioning?: boolean;
  /** Icon size in px. Default 20. */
  size?: number;
  /** Morph duration in ms. Default 300. */
  duration?: number;
}

/** Light/dark toggle (port of the labsupapg ThemeToggle): a sun↔moon SMIL path morph. */
export function ThemeToggle({
  theme,
  onToggle,
  isTransitioning = false,
  size = 20,
  duration = 300,
  className,
  onClick,
  disabled,
  ...rest
}: ThemeToggleProps) {
  const animate = useRef<SVGAnimateElement>(null);
  const shown = useRef(theme);
  const d = theme === 'light' ? THEME_ICON_PATHS.sun : THEME_ICON_PATHS.moon;
  const next = theme === 'light' ? 'dark' : 'light';

  useEffect(() => {
    const el = animate.current;
    if (!el || shown.current === theme) return; // first render: no morph
    const from = shown.current === 'light' ? THEME_ICON_PATHS.sun : THEME_ICON_PATHS.moon;
    shown.current = theme;
    // Reduced motion: from = to, so the frozen value jumps straight to the new shape.
    el.setAttribute('from', prefersReducedMotion() ? d : from);
    el.setAttribute('to', d);
    el.beginElement?.();
  }, [theme, d]);

  return (
    <button
      type="button"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      data-slot="theme-toggle"
      data-theme-value={theme}
      {...rest}
      disabled={disabled}
      // aria-disabled, not disabled, while transitioning: a disabled button drops keyboard focus.
      aria-disabled={isTransitioning || undefined}
      onClick={(e) => {
        if (isTransitioning) return;
        onClick?.(e);
        if (!e.defaultPrevented) onToggle();
      }}
      className={cn(
        'grid size-9 place-items-center rounded-[var(--radius)] transition-colors duration-[var(--duration)] ease-[var(--ease)] motion-reduce:transition-none',
        'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]',
        theme === 'dark' ? 'bg-primary-soft text-primary-soft-fg' : 'text-fg-sage hover:bg-surface-2 hover:text-fg',
        isTransitioning && 'pointer-events-none',
        'disabled:cursor-default',
        className,
      )}
    >
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={d}>
          <animate
            ref={animate}
            attributeName="d"
            begin="indefinite"
            dur={`${duration}ms`}
            fill="freeze"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.65 0 0.35 1"
          />
        </path>
      </svg>
    </button>
  );
}
