// Theme token surface. Consumers pass tokens as CSS-var name → value.
// Component code reads through CSS variables, so the runtime cost of swapping
// themes is one stylesheet rewrite + repaint.

export const COLOR_FAMILIES = ['slate', 'teal', 'rose', 'emerald', 'amber'] as const;
export type ColorFamily = typeof COLOR_FAMILIES[number];

/** An OKLCH color: `l` lightness 0–1, `c` chroma (≈0–0.4), `h` hue in degrees. */
export interface ColorLCH {
  l: number;
  c: number;
  h: number;
}

/**
 * Each family's anchor color — the dark-twin value of the Phosphor role the
 * family drives (slate → `--fg-muted`, teal → `--primary`, rose →
 * `--danger`, emerald → `--success`, amber → `--warning`). A family at
 * its anchor writes nothing; the generated `--*` values stay in force.
 */
export const DEFAULT_LCH: Record<ColorFamily, ColorLCH> = {
  slate: { l: 0.6888, c: 0.0302, h: 158.35 },
  teal: { l: 0.7848, c: 0.137, h: 176.88 },
  rose: { l: 0.7062, c: 0.1152, h: 26.95 },
  emerald: { l: 0.6929, c: 0.1108, h: 152.21 },
  amber: { l: 0.7807, c: 0.095, h: 69.84 },
};

/** @deprecated Pre-0.5 hue/saturation family model. Kept only so stored themes
 * can be migrated (`normalizeFamilyColors`); nothing renders from it. */
export interface ColorHS {
  h: number;
  s: number;
}

/** @deprecated The pre-0.5 defaults; a stored family equal to these migrates
 * to its `DEFAULT_LCH` anchor. */
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
  /** Per-family OKLCH anchor; drives that family's `--*` roles in both twins. */
  colors: Record<ColorFamily, ColorLCH>;
  /** Explicit overrides keyed by custom-property name → CSS value. Applied last, in every twin. */
  overrides: Record<string, string>;
  isDefault?: boolean;
}

export const DEFAULT_THEME: Theme = {
  id: 'default',
  name: 'Default',
  colors: DEFAULT_LCH,
  overrides: {},
  isDefault: true,
};
