// Internal helper — NOT part of the @abmex/ui public API. Lives outside
// the `./components/*` export glob so it stays package-private; consumed
// only by ThemeEditorPanel. Unit-tested directly via the repo source path.

import { COLOR_FAMILIES } from '../types/theme';

export interface SemanticVariable {
  name: string;
  defaultVal: string;
  /** Component group derived from the token name: `--color-chat-bubble-user-bg`
   * → `chat`; HeroUI bridge variables → `heroui`. */
  group: string;
  /** False for dimensional bridge tokens such as `--radius`; the editor then
   * offers the text field only, never the color picker. */
  isColor: boolean;
}

/** Marker comment in the kit stylesheet; every `--*` declaration after it is
 * the HeroUI v3 semantic bridge (`--accent`, `--surface`, `--field-*`, …) — the
 * ~15-variable reskin seam, which the theme editor exposes as one group. */
export const HEROUI_BRIDGE_MARKER = 'theme-editor: heroui-bridge';

const DECLARATION = /^\s*(--[a-zA-Z][a-zA-Z0-9-]*):\s*([^;]+);/;

const COLOR_VALUE = /var\(--color-|color-mix\(|oklch\(|oklab\(|hsla?\(|rgba?\(|#[0-9a-f]{3,8}\b|\btransparent\b|\bwhite\b|\bblack\b/i;

export function isColorVariable(name: string, defaultVal: string): boolean {
  return name.startsWith('--color-') || COLOR_VALUE.test(defaultVal);
}

export function groupOf(name: string): string {
  const bare = name.replace(/^--color-/, '');
  return bare.split('-')[0] ?? bare;
}

/**
 * Extract the editable semantic variables from a stylesheet string:
 *  - every `--color-*` custom property that is not a palette ramp entry
 *    (`--color-{family}-…`), and
 *  - every custom property declared after {@link HEROUI_BRIDGE_MARKER}.
 */
export function parseSemanticVariables(css: string): SemanticVariable[] {
  const vars: SemanticVariable[] = [];
  const seen = new Set<string>();
  let inBridge = false;
  for (const line of css.split('\n')) {
    if (line.includes(HEROUI_BRIDGE_MARKER)) inBridge = true;
    const match = line.match(DECLARATION);
    if (!match) continue;
    const name = match[1]!;
    const defaultVal = match[2]!.trim();
    if (seen.has(name)) continue;
    if (inBridge) {
      seen.add(name);
      vars.push({ name, defaultVal, group: 'heroui', isColor: isColorVariable(name, defaultVal) });
    } else if (name.startsWith('--color-') && !COLOR_FAMILIES.some((f) => name.startsWith(`--color-${f}-`))) {
      seen.add(name);
      vars.push({ name, defaultVal, group: groupOf(name), isColor: true });
    }
  }
  return vars;
}
