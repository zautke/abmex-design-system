// Theme token surface. Consumers pass tokens as CSS-var name → value.
// Component code reads through CSS variables, so the runtime cost of swapping
// themes is one className flip + repaint.

export const COLOR_FAMILIES = ['slate', 'teal', 'rose', 'emerald', 'amber'] as const;
export type ColorFamily = typeof COLOR_FAMILIES[number];

export interface ColorHS {
  h: number;
  s: number;
}

export const DEFAULT_HS: Record<ColorFamily, ColorHS> = {
  slate: { h: 215, s: 16 },
  teal: { h: 173, s: 80 },
  rose: { h: 343, s: 79 },
  emerald: { h: 141, s: 79 },
  amber: { h: 38, s: 92 },
};

export const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export interface Theme {
  id: string;
  name: string;
  /** Per-family hue/saturation; lightness derived from Tailwind v4 token ramp. */
  colors: Record<ColorFamily, ColorHS>;
  /** Explicit overrides keyed by --color-* token name → CSS value. */
  overrides: Record<string, string>;
  isDefault?: boolean;
}

export const DEFAULT_THEME: Theme = {
  id: 'default',
  name: 'Default',
  colors: DEFAULT_HS,
  overrides: {},
  isDefault: true,
};
