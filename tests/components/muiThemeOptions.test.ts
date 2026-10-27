import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { muiThemeOptions } from '../../packages/themes/src/mui';

const roleNames = (family: string) => {
  const file = new URL(`../../packages/themes/src/${family === 'phosphor' ? 'phosphor/build' : `${family}/build`}/tokens.generated.json`, import.meta.url);
  return new Set<string>(JSON.parse(readFileSync(file, 'utf8')).color.tokens.map((t: { name: string }) => t.name));
};
const varsIn = (value: unknown): string[] => [...JSON.stringify(value).matchAll(/var\(--([a-z0-9-]+)\)/g)].map((m) => m[1]);
const missing = (value: unknown, names: Set<string>) => varsIn(value).filter((n) => !names.has(n) && !n.startsWith('font-'));

describe('muiThemeOptions', () => {
  it('selects the color scheme by data-mode, dark by default', () => {
    const options = muiThemeOptions();
    expect(options.cssVariables).toEqual({ colorSchemeSelector: '[data-mode="%s"]', nativeColor: true });
    expect(options.defaultColorScheme).toBe('dark');
    expect(options.colorSchemes.light.palette.primary.contrastText).toBe('var(--primary-fg)');
  });

  it('references only roles every family defines', () => {
    const palette = muiThemeOptions().colorSchemes.dark.palette;
    expect(varsIn(palette).length).toBeGreaterThan(20);
    for (const family of ['phosphor', 'cev']) expect(missing(palette, roleNames(family))).toEqual([]);
  });

  it('reports a role no family defines', () => {
    expect(missing({ main: 'var(--nope)' }, roleNames('cev'))).toEqual(['nope']);
  });
});
