// Theme token surface. Consumers pass tokens as CSS-var name → value.
// Component code reads through CSS variables, so the runtime cost of swapping
// themes is one className flip + repaint.

export type ColorFamily = 'slate' | 'teal' | 'rose' | 'emerald' | 'amber';

export interface ColorHS {
  h: number;
  s: number;
}

export interface Theme {
  id: string;
  name: string;
  /** Per-family hue/saturation; lightness derived from Tailwind v4 token ramp. */
  colors: Record<ColorFamily, ColorHS>;
  /** Explicit overrides keyed by --color-* token name → CSS value. */
  overrides: Record<string, string>;
  isDefault?: boolean;
}
