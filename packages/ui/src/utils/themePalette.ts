// Theme palette engine: turns a theme (per-family OKLCH anchors + explicit
// overrides) into one stylesheet that re-declares the affected theme roles
// for BOTH Phosphor twins. Pure — no DOM — so the hook, the popup, and tests
// all compute the same CSS.
//
// Why a stylesheet and not `documentElement.style`: Phosphor scopes its values
// per twin (`:root, .dark, [data-theme=dark]` / `.light, [data-theme=light]`)
// and nests. An inline style on <html> beats every scope, so a dark-twin pick
// would leak into a nested `.light` region verbatim. Re-declaring on the same
// selectors keeps the twin cascade intact.

import * as culori from 'culori';
import {
  COLOR_FAMILIES,
  DEFAULT_HS,
  DEFAULT_LCH,
  type ColorFamily,
  type ColorLCH,
  type Theme,
} from '../types/theme';

export type Twin = 'dark' | 'light';

/**
 * The ONE seam where a role name becomes a CSS custom property. Every table
 * below is keyed by prefix-free role names (`primary`, `fg-muted`, …), the
 * shared vocabulary every theme will use. Phosphor still ships them as
 * `--ph-<role>`; the `@abmex/themes` extraction drops that prefix (kb:
 * "Decisions — Design System Consolidation (user, 2026-10-05)" #2). When it
 * lands, change ROLE_VAR_PREFIX to '--' and nothing else.
 */
export const ROLE_VAR_PREFIX = '--ph-';
export const roleVar = (role: string): string => `${ROLE_VAR_PREFIX}${role}`;

/** Generated defaults (from `phosphor.tokens.css`) for every role a
 * family drives. `-fg` (text ON a solid fill) is deliberately absent: it is a
 * contrast partner of the fill, not part of the family's hue. */
export const FAMILY_ROLE_DEFAULTS: Record<ColorFamily, Record<string, Record<Twin, ColorLCH>>> = {
  slate: {
    'fg-muted': { dark: { l: 0.6888, c: 0.0302, h: 158.35 }, light: { l: 0.5, c: 0.0306, h: 109.81 } },
    'border': { dark: { l: 0.3354, c: 0.0191, h: 163.55 }, light: { l: 0.8791, c: 0.0172, h: 137.03 } },
    'border-strong': { dark: { l: 0.5851, c: 0.0214, h: 162.49 }, light: { l: 0.6322, c: 0.021, h: 162.58 } },
  },
  teal: {
    'primary': { dark: { l: 0.7848, c: 0.137, h: 176.88 }, light: { l: 0.5059, c: 0.0937, h: 176.17 } },
    'primary-hover': { dark: { l: 0.8298, c: 0.1374, h: 176.69 }, light: { l: 0.4595, c: 0.0849, h: 177.06 } },
    'primary-soft': { dark: { l: 0.3385, c: 0.0374, h: 176.68 }, light: { l: 0.9224, c: 0.0158, h: 177.06 } },
    'primary-soft-fg': { dark: { l: 0.7848, c: 0.137, h: 176.88 }, light: { l: 0.4971, c: 0.0913, h: 176.61 } },
    'focus': { dark: { l: 0.7848, c: 0.137, h: 176.88 }, light: { l: 0.5059, c: 0.0937, h: 176.17 } },
  },
  rose: {
    'danger': { dark: { l: 0.7062, c: 0.1152, h: 26.95 }, light: { l: 0.5199, c: 0.1208, h: 26.56 } },
    'danger-hover': { dark: { l: 0.7506, c: 0.1147, h: 27.35 }, light: { l: 0.4748, c: 0.1204, h: 27.14 } },
    'danger-soft': { dark: { l: 0.3253, c: 0.0117, h: 26.25 }, light: { l: 0.9242, c: 0.0167, h: 26.65 } },
    'danger-soft-fg': { dark: { l: 0.7093, c: 0.115, h: 26.94 }, light: { l: 0.5199, c: 0.1208, h: 26.56 } },
  },
  emerald: {
    'success': { dark: { l: 0.6929, c: 0.1108, h: 152.21 }, light: { l: 0.4913, c: 0.0908, h: 149.56 } },
    'success-hover': { dark: { l: 0.737, c: 0.1099, h: 152.5 }, light: { l: 0.4462, c: 0.091, h: 149.88 } },
    'success-soft': { dark: { l: 0.3214, c: 0.032, h: 151.54 }, light: { l: 0.9202, c: 0.0168, h: 151.09 } },
    'success-soft-fg': { dark: { l: 0.696, c: 0.1107, h: 152.23 }, light: { l: 0.4913, c: 0.0908, h: 149.56 } },
  },
  amber: {
    'warning': { dark: { l: 0.7807, c: 0.095, h: 69.84 }, light: { l: 0.761, c: 0.1005, h: 72.19 } },
    'warning-hover': { dark: { l: 0.825, c: 0.0949, h: 69.49 }, light: { l: 0.7159, c: 0.1005, h: 72.42 } },
    'warning-soft': { dark: { l: 0.3357, c: 0.0199, h: 67.06 }, light: { l: 0.9562, c: 0.0176, h: 73.08 } },
    'warning-soft-fg': { dark: { l: 0.7807, c: 0.095, h: 69.84 }, light: { l: 0.5264, c: 0.0998, h: 71.84 } },
  },
};

/** The role a family's anchor IS (dark twin): picking the anchor sets this
 * role to exactly the picked color. */
export const FAMILY_ANCHOR_ROLE: Record<ColorFamily, string> = {
  slate: 'fg-muted',
  teal: 'primary',
  rose: 'danger',
  emerald: 'success',
  amber: 'warning',
};

const EPS = 1e-4;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const wrapHue = (h: number) => ((h % 360) + 360) % 360;
const round = (n: number, d: number) => Number(n.toFixed(d));

export function sameColor(a: ColorLCH, b: ColorLCH): boolean {
  return Math.abs(a.l - b.l) < EPS && Math.abs(a.c - b.c) < EPS && Math.abs(wrapHue(a.h) - wrapHue(b.h)) < 0.01;
}

export function isFamilyDefault(family: ColorFamily, color: ColorLCH): boolean {
  return sameColor(color, DEFAULT_LCH[family]);
}

/** `oklch(L C H)` with L as a percentage — the form Phosphor itself uses. */
export function formatOklch(c: ColorLCH): string {
  return `oklch(${round(c.l * 100, 2)}% ${round(c.c, 4)} ${round(wrapHue(c.h), 2)})`;
}

/** Parse any CSS color string to OKLCH; `null` when culori cannot read it. */
export function parseColorToLch(value: string): ColorLCH | null {
  const o = culori.oklch(value?.trim?.() ?? '');
  if (!o || !Number.isFinite(o.l)) return null;
  return { l: o.l, c: Number.isFinite(o.c) ? o.c : 0, h: Number.isFinite(o.h) ? o.h : 0 };
}

/**
 * Derive one role from the family anchor. The anchor's move away from its
 * default is transferred onto the role: chroma by ratio, hue by offset, and
 * lightness by offset with two adjustments that keep each twin coherent:
 *  - the light twin MIRRORS the lightness move (dark twin: brighter = more
 *    emphasis against a dark ground; light twin: the same emphasis is darker),
 *  - `-soft` tints follow at a quarter of the move, since they are washes
 *    that must stay near their surface.
 * The result is gamut-mapped into sRGB by chroma reduction.
 */
export function deriveRole(anchor: ColorLCH, anchorDefault: ColorLCH, roleDefault: ColorLCH, opts: { twin?: Twin; role?: string } = {}): ColorLCH {
  const weight = opts.role?.endsWith('-soft') ? 0.25 : 1;
  const sign = opts.twin === 'light' ? -1 : 1;
  const dl = (anchor.l - anchorDefault.l) * weight * sign;
  const ratio = anchorDefault.c > EPS ? anchor.c / anchorDefault.c : 1;
  const dh = anchor.h - anchorDefault.h;
  // A wash pushed to pure black/white stops being a tint; keep it in range.
  const l = opts.role?.endsWith('-soft') ? Math.min(0.97, Math.max(0.12, roleDefault.l + dl)) : clamp01(roleDefault.l + dl);
  const raw = { mode: 'oklch', l, c: Math.max(0, roleDefault.c * ratio), h: wrapHue(roleDefault.h + dh) };
  const mapped = culori.clampChroma(raw, 'oklch') ?? raw;
  return { l: mapped.l, c: Number.isFinite(mapped.c) ? mapped.c : 0, h: Number.isFinite(mapped.h) ? mapped.h : raw.h };
}

/** Text-on-fill partners (`primary-fg`, …): the generated ink of each
 * twin. After a fill moves, whichever ink reads better on it is used, so a
 * user who darkens primary in the dark twin still gets legible button text. */
export const FAMILY_FILL_INK: Partial<Record<ColorFamily, { fill: string; ink: string; inks: ColorLCH[] }>> = {
  teal: { fill: 'primary', ink: 'primary-fg', inks: [{ l: 0.2143, c: 0.0177, h: 170.07 }, { l: 0.9857, c: 0.008, h: 114.22 }] },
  rose: { fill: 'danger', ink: 'danger-fg', inks: [{ l: 0.2143, c: 0.0177, h: 170.07 }, { l: 0.9857, c: 0.008, h: 114.22 }] },
  emerald: { fill: 'success', ink: 'success-fg', inks: [{ l: 0.2143, c: 0.0177, h: 170.07 }, { l: 0.9857, c: 0.008, h: 114.22 }] },
  amber: { fill: 'warning', ink: 'warning-fg', inks: [{ l: 0.2249, c: 0.0355, h: 108.95 }, { l: 0.9857, c: 0.008, h: 114.22 }] },
};

const toCulori = (c: ColorLCH) => ({ mode: 'oklch', l: c.l, c: c.c, h: c.h });
export function contrastRatio(a: ColorLCH, b: ColorLCH): number {
  return culori.wcagContrast(toCulori(a), toCulori(b));
}

/** WCAG AA for normal text. */
export const FILL_INK_MIN_CONTRAST = 4.5;
const BLACK: ColorLCH = { l: 0, c: 0, h: 0 };
const WHITE: ColorLCH = { l: 1, c: 0, h: 0 };

/** The tinted ink that reads best on `fill`; if neither tinted ink reaches
 * 4.5:1 (mid-luminance fills such as #777), pure black or white, whichever is
 * higher. One of those two always clears it: the worst case is the luminance
 * where both tie, sqrt(1.05 * 0.05) - 0.05 ≈ 0.179, giving ≈ 4.58:1. */
export function fillInk(fill: ColorLCH, inks: ColorLCH[]): ColorLCH {
  const better = (a: ColorLCH, b: ColorLCH) => (contrastRatio(b, fill) > contrastRatio(a, fill) ? b : a);
  const tinted = inks.reduce(better);
  return contrastRatio(tinted, fill) >= FILL_INK_MIN_CONTRAST ? tinted : better(BLACK, WHITE);
}

/** Every role var a family edit writes, per twin. Untouched families write nothing. */
export function familyRoleVars(colors: Record<ColorFamily, ColorLCH>): Record<Twin, Record<string, string>> {
  const out: Record<Twin, Record<string, string>> = { dark: {}, light: {} };
  for (const family of COLOR_FAMILIES) {
    const anchor = colors[family];
    if (!anchor || isFamilyDefault(family, anchor)) continue;
    const anchorDefault = DEFAULT_LCH[family];
    for (const twin of ['dark', 'light'] as const) {
      const derived: Record<string, ColorLCH> = {};
      for (const [role, defaults] of Object.entries(FAMILY_ROLE_DEFAULTS[family])) {
        const exact = twin === 'dark' && role === FAMILY_ANCHOR_ROLE[family];
        derived[role] = exact ? anchor : deriveRole(anchor, anchorDefault, defaults[twin], { twin, role });
        out[twin][roleVar(role)] = formatOklch(derived[role]!);
      }
      const pair = FAMILY_FILL_INK[family];
      const fill = pair && derived[pair.fill];
      if (pair && fill) {
        out[twin][roleVar(pair.ink)] = formatOklch(fillInk(fill, pair.inks));
      }
    }
  }
  return out;
}

const DARK_SCOPE = ':root, .dark, [data-theme="dark"]';
const LIGHT_SCOPE = '.light, [data-theme="light"]';
const ANY_SCOPE = `${DARK_SCOPE}, ${LIGHT_SCOPE}`;

const block = (selector: string, vars: Record<string, string>) => {
  const decls = Object.entries(vars).filter(([, v]) => v).map(([k, v]) => `  ${k}: ${v};`);
  return decls.length ? `${selector} {\n${decls.join('\n')}\n}\n` : '';
};

/** The full stylesheet for a theme. Empty string for the default theme. */
export function themeStylesheet(theme: Pick<Theme, 'colors' | 'overrides'>): string {
  const roles = familyRoleVars(theme.colors);
  return [
    block(DARK_SCOPE, roles.dark),
    block(LIGHT_SCOPE, roles.light),
    // Explicit overrides win in every twin: they are a deliberate "this token is X".
    block(ANY_SCOPE, theme.overrides ?? {}),
  ].join('');
}

/**
 * Accept any stored family shape and return OKLCH anchors:
 *  - current `{l,c,h}` passes through;
 *  - pre-0.5 `{h,s}` equal to the old defaults → that family's anchor;
 *  - other `{h,s}` → `hsl(h s% 50%)` converted, so a user's old hue survives;
 *  - missing / unreadable → anchor.
 */
export function normalizeFamilyColors(input: unknown): Record<ColorFamily, ColorLCH> {
  const src = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const out = {} as Record<ColorFamily, ColorLCH>;
  for (const family of COLOR_FAMILIES) {
    const v = src[family] as Partial<ColorLCH & { s: number }> | undefined;
    if (v && typeof v.l === 'number' && typeof v.c === 'number' && typeof v.h === 'number') {
      out[family] = { l: v.l, c: v.c, h: v.h };
    } else if (v && typeof v.h === 'number' && typeof v.s === 'number') {
      const legacy = DEFAULT_HS[family];
      out[family] = v.h === legacy.h && v.s === legacy.s
        ? DEFAULT_LCH[family]
        : parseColorToLch(`hsl(${v.h} ${v.s}% 50%)`) ?? DEFAULT_LCH[family];
    } else {
      out[family] = DEFAULT_LCH[family];
    }
  }
  return out;
}
