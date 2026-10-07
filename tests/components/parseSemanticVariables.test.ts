// parseSemanticVariables — regex extraction of semantic (non-family)
// --color-* custom properties from a stylesheet string (Test-Mi3).
// Package-internal helper: imported directly from source, not via the
// @abmex/ui public export surface.

import { describe, expect, it } from 'vitest';
import { HEROUI_BRIDGE_END_MARKER, HEROUI_BRIDGE_MARKER, ROLES_END_MARKER, ROLES_MARKER, parseSemanticVariables } from '@/packages/ui/src/internal/parseSemanticVariables';

describe('parseSemanticVariables', () => {
  it('extracts a semantic --color-* variable with its default value', () => {
    const css = '  --color-chat-bubble-user-bg: #3366cc;';
    expect(parseSemanticVariables(css)).toEqual([
      { name: '--color-chat-bubble-user-bg', defaultVal: '#3366cc', group: 'chat', isColor: true },
    ]);
  });

  it('excludes color-family variables (--color-{family}-*)', () => {
    const css = [
      '--color-slate-500: #64748b;',
      '--color-teal-400: #2dd4bf;',
      '--color-rose-300: #fda4af;',
      '--color-emerald-600: #059669;',
      '--color-amber-200: #fde68a;',
    ].join('\n');
    expect(parseSemanticVariables(css)).toEqual([]);
  });

  it('keeps semantic vars but drops family vars from a mixed block', () => {
    const css = [
      ':root {',
      '  --color-slate-500: #64748b;',
      '  --color-inputbar-bg: #ffffff;',
      '  --color-teal-400: #2dd4bf;',
      '  --color-chat-error-text: #e11d48;',
      '}',
    ].join('\n');
    expect(parseSemanticVariables(css)).toEqual([
      { name: '--color-inputbar-bg', defaultVal: '#ffffff', group: 'inputbar', isColor: true },
      { name: '--color-chat-error-text', defaultVal: '#e11d48', group: 'chat', isColor: true },
    ]);
  });

  it('requires a trailing semicolon (ignores incomplete declarations)', () => {
    expect(parseSemanticVariables('--color-foo-bg: #fff')).toEqual([]);
  });

  it('ignores non --color-* custom properties before the HeroUI bridge marker', () => {
    expect(parseSemanticVariables('--spacing-lg: 2rem;')).toEqual([]);
  });

  it('lists every declaration after the HeroUI bridge marker as the heroui group, deduplicated', () => {
    const css = ['--color-slate-500: #64748b;', `/* ${HEROUI_BRIDGE_MARKER} */`, ':root {', '  --radius: 0.5rem;', '  --accent: var(--color-teal-700);', '  --accent: dup;', '}'].join('\n');
    expect(parseSemanticVariables(css)).toEqual([
      { name: '--radius', defaultVal: '0.5rem', group: 'heroui', isColor: false },
      { name: '--accent', defaultVal: 'var(--color-teal-700)', group: 'heroui', isColor: true },
    ]);
  });

  it('closes the HeroUI bridge at the end marker', () => {
    const css = [`/* ${HEROUI_BRIDGE_MARKER} */`, '  --accent: var(--primary);', `/* ${HEROUI_BRIDGE_END_MARKER} */`, '  --scale-pop: 0.85;',
      `/* ${ROLES_MARKER} */`, '  --primary: oklch(0.7 0.1 170);', `/* ${ROLES_END_MARKER} */`].join('\n');
    expect(parseSemanticVariables(css).filter((v) => v.group === 'heroui')).toEqual([
      { name: '--accent', defaultVal: 'var(--primary)', group: 'heroui', isColor: true },
    ]);
  });

  it('lists the theme roles between the role markers as the phosphor group, first declaration wins', () => {
    const css = [
      `/* ${ROLES_MARKER} — generated */`,
      ':root, .dark {',
      '  --primary: oklch(0.7848 0.1370 176.88);',
      '  --shadow-overlay: 0 0 0 1px rgba(168, 191, 174, 0.06);',
      '}',
      '.light {',
      '  --primary: oklch(0.5059 0.0937 176.17);',
      '}',
      ':root {',
      '  --radius: 0.25rem;',
      '}',
      `/* ${ROLES_END_MARKER} */`,
      '  --scale-pop: 0.85;',
    ].join('\n');
    expect(parseSemanticVariables(css)).toEqual([
      { name: '--primary', defaultVal: 'oklch(0.7848 0.1370 176.88)', group: 'phosphor', isColor: true },
      { name: '--shadow-overlay', defaultVal: '0 0 0 1px rgba(168, 191, 174, 0.06)', group: 'phosphor', isColor: false },
      { name: '--radius', defaultVal: '0.25rem', group: 'phosphor', isColor: false },
    ]);
  });

  it('skips --color-* aliases of a theme role (inline theme tokens, not editable), wherever the roles appear', () => {
    const css = [
      '  --color-chat-bubble-user-bg: var(--surface-2);',
      '  --color-fg: var(--fg);',
      '  --color-header-bg: var(--not-a-role);',
      `/* ${ROLES_MARKER} */`,
      '  --surface-2: oklch(0.3 0.03 157);',
      '  --fg: oklch(0.8 0.06 110);',
      `/* ${ROLES_END_MARKER} */`,
    ].join('\n');
    expect(parseSemanticVariables(css).map((v) => v.name)).toEqual(['--color-header-bg', '--surface-2', '--fg']);
  });

  it('a prefix-free custom property outside the role markers is not a theme role', () => {
    expect(parseSemanticVariables('  --primary: oklch(0.7 0.1 170);')).toEqual([]);
  });

  it('a HeroUI bridge entry pointing at a color role is a color; one pointing at a dimension role is not', () => {
    const css = [`/* ${ROLES_MARKER} */`, '  --primary: oklch(0.7 0.1 170);', '  --radius: 0.25rem;', `/* ${ROLES_END_MARKER} */`,
      `/* ${HEROUI_BRIDGE_MARKER} */`, '  --accent: var(--primary);', '  --field-radius: calc(var(--radius) * 1.5);', `/* ${HEROUI_BRIDGE_END_MARKER} */`].join('\n');
    const byName = Object.fromEntries(parseSemanticVariables(css).map((v) => [v.name, v.isColor]));
    expect(byName).toEqual({ '--primary': true, '--radius': false, '--accent': true, '--field-radius': false });
  });

  it('tolerates leading whitespace / indentation', () => {
    const css = '\t\t  --color-overlay-scrim: rgba(0,0,0,0.5);';
    expect(parseSemanticVariables(css)).toEqual([
      { name: '--color-overlay-scrim', defaultVal: 'rgba(0,0,0,0.5)', group: 'overlay', isColor: true },
    ]);
  });

  it('returns empty for an empty string', () => {
    expect(parseSemanticVariables('')).toEqual([]);
  });

  it('does not match a --color-* property that is not at line start', () => {
    // The regex anchors with ^\s* — an inline second declaration is skipped.
    const css = '--color-a-bg: #111; --color-b-bg: #222;';
    expect(parseSemanticVariables(css)).toEqual([
      { name: '--color-a-bg', defaultVal: '#111', group: 'a', isColor: true },
    ]);
  });
});
