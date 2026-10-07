import { describe, expect, it } from 'vitest';
import * as culori from 'culori';
import {
  DEFAULT_LCH,
  FAMILY_ROLE_DEFAULTS,
  deriveRole,
  familyRoleVars,
  formatOklch,
  normalizeFamilyColors,
  parseColorToLch,
  themeStylesheet,
  contrastRatio,
  roleVar,
} from '@abmex/ui';

describe('themePalette', () => {
  it('the default palette writes nothing — generated --* values stay in force', () => {
    expect(themeStylesheet({ colors: DEFAULT_LCH, overrides: {} })).toBe('');
    expect(familyRoleVars(DEFAULT_LCH)).toEqual({ dark: {}, light: {} });
  });

  it('deriving a role at the default anchor reproduces the role default (identity)', () => {
    for (const [family, roles] of Object.entries(FAMILY_ROLE_DEFAULTS)) {
      for (const twins of Object.values(roles)) {
        for (const role of [twins.dark, twins.light]) {
          const d = deriveRole(DEFAULT_LCH[family as keyof typeof DEFAULT_LCH], DEFAULT_LCH[family as keyof typeof DEFAULT_LCH], role);
          expect(d.l).toBeCloseTo(role.l, 3);
          expect(d.h).toBeCloseTo(role.h, 1);
        }
      }
    }
  });

  it('a family pick sets its anchor role to exactly the picked color in the dark twin', () => {
    const pick = { l: 0.62, c: 0.14, h: 300 };
    const vars = familyRoleVars({ ...DEFAULT_LCH, teal: pick });
    expect(vars.dark[roleVar('primary')]).toBe(formatOklch(pick));
  });

  it('every role of a moved family is re-declared in BOTH twins, keeping each twin\'s lightness geometry', () => {
    const vars = familyRoleVars({ ...DEFAULT_LCH, rose: { ...DEFAULT_LCH.rose, h: 280 } });
    for (const role of Object.keys(FAMILY_ROLE_DEFAULTS.rose)) {
      expect(vars.dark[roleVar(role)]).toBeDefined();
      expect(vars.light[roleVar(role)]).toBeDefined();
    }
    // Hue-only move: the light twin's danger keeps its own lightness.
    const lightDanger = parseColorToLch(vars.light[roleVar('danger')]!)!;
    expect(lightDanger.l).toBeCloseTo(FAMILY_ROLE_DEFAULTS.rose['danger']!.light.l, 2);
    expect(lightDanger.h).toBeCloseTo(280 - 26.95 + 26.56, 0);
    // Untouched families stay silent.
    expect(vars.dark[roleVar('primary')]).toBeUndefined();
  });

  it('lightness is a real control: brighter in the dark twin, mirrored (darker) in the light twin', () => {
    const base = familyRoleVars({ ...DEFAULT_LCH, teal: { ...DEFAULT_LCH.teal, h: 200 } });
    const lighter = familyRoleVars({ ...DEFAULT_LCH, teal: { ...DEFAULT_LCH.teal, h: 200, l: DEFAULT_LCH.teal.l + 0.08 } });
    for (const role of Object.keys(FAMILY_ROLE_DEFAULTS.teal)) {
      expect(parseColorToLch(lighter.dark[roleVar(role)]!)!.l).toBeGreaterThan(parseColorToLch(base.dark[roleVar(role)]!)!.l);
      expect(parseColorToLch(lighter.light[roleVar(role)]!)!.l).toBeLessThan(parseColorToLch(base.light[roleVar(role)]!)!.l);
    }
  });

  it('soft tints follow lightness at a quarter of the move', () => {
    const vars = familyRoleVars({ ...DEFAULT_LCH, teal: { ...DEFAULT_LCH.teal, l: DEFAULT_LCH.teal.l - 0.2 } });
    const soft = parseColorToLch(vars.dark[roleVar('primary-soft')]!)!;
    expect(soft.l).toBeCloseTo(FAMILY_ROLE_DEFAULTS.teal['primary-soft']!.dark.l - 0.05, 2);
  });

  it('the fill ink flips to whichever twin ink reads better on the moved fill', () => {
    const dark = familyRoleVars({ ...DEFAULT_LCH, teal: { l: 0.35, c: 0.1, h: 180 } });
    const fill = parseColorToLch(dark.dark[roleVar('primary')]!)!;
    const ink = parseColorToLch(dark.dark[roleVar('primary-fg')]!)!;
    expect(ink.l).toBeGreaterThan(0.9); // dark fill → light ink
    expect(contrastRatio(fill, ink)).toBeGreaterThan(4.5);
  });

  it('fill text clears 4.5:1 in both twins for any fill, including mid-luminance ones no tinted ink can serve', () => {
    // #777777 ≈ oklch(56.93% 0 0): ≈3.9:1 on the dark ink and ≈4.3:1 on the light ink.
    const mid = parseColorToLch('#777777')!;
    const fills = [mid];
    for (let l = 0.3; l <= 0.9; l += 0.05) for (const h of [25, 70, 150, 180, 260, 330]) fills.push({ l, c: 0.08, h });
    for (const anchor of fills) {
      for (const family of ['teal', 'rose', 'emerald', 'amber'] as const) {
        const vars = familyRoleVars({ ...DEFAULT_LCH, [family]: anchor });
        const role = { teal: 'primary', rose: 'danger', emerald: 'success', amber: 'warning' }[family];
        for (const twin of ['dark', 'light'] as const) {
          const fill = parseColorToLch(vars[twin][roleVar(role)]!)!;
          const ink = parseColorToLch(vars[twin][roleVar(`${role}-fg`)]!)!;
          expect(contrastRatio(fill, ink), `${family} ${twin} ${formatOklch(anchor)}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('the contrast decision uses the emitted (rounded) fill, so a fill on the 4.5 boundary cannot round below it', () => {
    // l = 0.604311 clears 4.5:1 on the dark tinted ink unrounded, but is emitted as 60.43% (≈4.4998:1).
    for (const l of [0.604311, 0.60431, 0.604305, 0.604315]) {
      const vars = familyRoleVars({ ...DEFAULT_LCH, teal: { l, c: 0, h: 0 } });
      const fill = parseColorToLch(vars.dark[roleVar('primary')]!)!;
      const ink = parseColorToLch(vars.dark[roleVar('primary-fg')]!)!;
      expect(contrastRatio(fill, ink), `l=${l}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('an out-of-sRGB anchor is gamut-mapped before it is emitted, so the ink decision holds as rendered', () => {
    // oklch(45% 0.4 169): unmapped, the light tinted ink reads 4.67:1; sRGB-clipped it renders at ~4.49:1.
    for (const anchor of [{ l: 0.45, c: 0.4, h: 169 }, { l: 0.6, c: 0.37, h: 30 }, { l: 0.55, c: 0.4, h: 260 }]) {
      const vars = familyRoleVars({ ...DEFAULT_LCH, teal: anchor });
      for (const twin of ['dark', 'light'] as const) {
        const fillCss = vars[twin][roleVar('primary')]!;
        const rgb = culori.rgb(fillCss)!;
        // Emitted in sRGB up to rounding residue (< half an 8-bit step), i.e. painted as emitted.
        expect([rgb.r, rgb.g, rgb.b].every((v) => v >= -0.5 / 255 && v <= 1 + 0.5 / 255), `${twin} ${fillCss}`).toBe(true);
        const fill = parseColorToLch(fillCss)!;
        const ink = parseColorToLch(vars[twin][roleVar('primary-fg')]!)!;
        expect(contrastRatio(fill, ink), `${twin} ${fillCss}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('roles derived from an out-of-gamut pick follow the pick as painted (same hue as the anchor role)', () => {
    const vars = familyRoleVars({ ...DEFAULT_LCH, teal: { l: 0.45, c: 0.4, h: 169 } });
    const primary = parseColorToLch(vars.dark[roleVar('primary')]!)!;
    const focus = parseColorToLch(vars.dark[roleVar('focus')]!)!;
    expect(Math.abs(focus.h - primary.h)).toBeLessThan(1);
  });

  it('derived colors are gamut-mapped into sRGB', () => {
    const vars = familyRoleVars({ ...DEFAULT_LCH, teal: { l: 0.9, c: 0.4, h: 140 } });
    for (const v of Object.values(vars.light)) {
      expect(parseColorToLch(v)!.c).toBeLessThan(0.4);
    }
  });

  it('stylesheet re-declares on Phosphor twin selectors, overrides last in every twin', () => {
    const css = themeStylesheet({ colors: { ...DEFAULT_LCH, amber: { l: 0.7, c: 0.1, h: 40 } }, overrides: { '--bg': '#000' } });
    const dark = css.indexOf(':root, .dark, [data-theme="dark"] {');
    const light = css.indexOf('.light, [data-theme="light"] {');
    const any = css.indexOf(':root, .dark, [data-theme="dark"], .light, [data-theme="light"] {');
    expect(dark).toBeGreaterThanOrEqual(0);
    expect(light).toBeGreaterThan(dark);
    expect(any).toBeGreaterThan(light);
    expect(css.slice(any)).toContain('--bg: #000;');
  });

  it('normalizeFamilyColors migrates legacy {h,s} and fills gaps', () => {
    const out = normalizeFamilyColors({ teal: { h: 173, s: 80 }, rose: { h: 120, s: 60 }, amber: { l: 0.5, c: 0.1, h: 50 } });
    expect(out.teal).toEqual(DEFAULT_LCH.teal); // old default → anchor
    expect(out.rose.h).toBeGreaterThan(130); // hsl(120 60% 50%) → green
    expect(out.amber).toEqual({ l: 0.5, c: 0.1, h: 50 });
    expect(out.slate).toEqual(DEFAULT_LCH.slate);
    expect(normalizeFamilyColors(undefined)).toEqual(DEFAULT_LCH);
  });
});

describe('themePalette role naming', () => {
  it('role tables are prefix-free; the only var-name knowledge is roleVar', () => {
    for (const roles of Object.values(FAMILY_ROLE_DEFAULTS)) {
      for (const role of Object.keys(roles)) expect(role.startsWith('-')).toBe(false);
    }
    expect(roleVar('primary')).toMatch(/^--[a-z-]*primary$/);
  });
});

describe('themePalette soft tints', () => {
  it('a large lightness move never pushes a -soft wash to pure black or white', () => {
    const vars = familyRoleVars({ ...DEFAULT_LCH, teal: { ...DEFAULT_LCH.teal, l: 0.3 } });
    const lightSoft = parseColorToLch(vars.light[roleVar('primary-soft')]!)!;
    expect(lightSoft.l).toBeLessThanOrEqual(0.97);
    const up = familyRoleVars({ ...DEFAULT_LCH, teal: { ...DEFAULT_LCH.teal, l: 1 } });
    expect(parseColorToLch(up.light[roleVar('primary-soft')]!)!.l).toBeGreaterThanOrEqual(0.12);
  });
});
