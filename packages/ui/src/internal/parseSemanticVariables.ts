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

/** Marker comments in the kit stylesheet; every `--*` declaration between them
 * is the HeroUI v3 semantic bridge (`--accent`, `--background`, `--field-*`, …),
 * which the theme editor exposes as one group. */
export const HEROUI_BRIDGE_MARKER = 'theme-editor: heroui-bridge';
export const HEROUI_BRIDGE_END_MARKER = 'theme-editor: heroui-bridge-end';

/** Marker comments around the theme's role declarations (generated into
 * phosphor.tokens.css). Roles carry no prefix, so the markers are how the
 * editor tells a theme role (`--surface`, `--primary`, …) from any other
 * custom property. */
export const ROLES_MARKER = 'theme-editor: roles';
export const ROLES_END_MARKER = 'theme-editor: roles-end';

/** Marker comments around the theme's Layer 1 identities (`--mint`, `--bone`,
 * …). Roles alias them with `var()`; the editor resolves a role to its
 * identity's literal so the picker shows a color, and never lists an identity
 * itself — components consume roles only. */
export const IDENTITIES_MARKER = 'theme-editor: identities';
export const IDENTITIES_END_MARKER = 'theme-editor: identities-end';

const DECLARATION = /^\s*(--[a-zA-Z][a-zA-Z0-9-]*):\s*([^;]+);/;
const VAR_REF = /^var\((--[a-z0-9-]+)\)$/;
const LITERAL_COLOR = /color-mix\(|oklch\(|oklab\(|hsla?\(|rgba?\(|#[0-9a-f]{3,8}\b|\btransparent\b|\bwhite\b|\bblack\b/i;
/** Non-color roles (dimensions, type, motion, shadows). */
const NON_COLOR_ROLE = /^--(radius|border-width|ring-|font-|display-|duration|ease|shadow)/;

export function isColorVariable(name: string, defaultVal: string, colorRoles: ReadonlySet<string> = new Set()): boolean {
  if (name.startsWith('--color-') || LITERAL_COLOR.test(defaultVal) || defaultVal.includes('var(--color-')) return true;
  const ref = defaultVal.match(/var\((--[a-z0-9-]+)/);
  return !!ref && colorRoles.has(ref[1]!);
}

/** `var(--mint)` → the identity's literal when `--mint` is a known identity;
 * anything else unchanged. */
function resolveIdentity(value: string, identities: ReadonlyMap<string, string>): string {
  const ref = value.match(VAR_REF);
  return (ref && identities.get(ref[1]!)) ?? value;
}

export function groupOf(name: string): string {
  const bare = name.replace(/^--color-/, '');
  return bare.split('-')[0] ?? bare;
}

/**
 * Extract the editable semantic variables from a stylesheet string:
 *  - the theme's roles: every declaration between {@link ROLES_MARKER} and
 *    {@link ROLES_END_MARKER} (group `phosphor`; the first declaration — the
 *    dark default — wins),
 *  - every custom property between {@link HEROUI_BRIDGE_MARKER} and
 *    {@link HEROUI_BRIDGE_END_MARKER}, and
 *  - every `--color-*` custom property that is neither a palette ramp entry
 *    (`--color-{family}-…`) nor a bare alias of a theme role (`@theme inline`
 *    aliases: utilities read the role directly, so overriding the alias would
 *    change nothing — the editor lists the role instead).
 */
export function parseSemanticVariables(css: string): SemanticVariable[] {
  const lines = css.split('\n');
  // Pass 1: the theme's roles, so aliases and color-ness can be resolved
  // wherever they appear in the sheet.
  const identities = new Map<string, string>();
  const roles = new Map<string, string>();
  let inRoles = false;
  let inIdentities = false;
  for (const line of lines) {
    if (line.includes(IDENTITIES_END_MARKER)) { inIdentities = false; continue; }
    if (line.includes(IDENTITIES_MARKER)) { inIdentities = true; continue; }
    if (line.includes(ROLES_END_MARKER)) { inRoles = false; continue; }
    if (line.includes(ROLES_MARKER)) { inRoles = true; continue; }
    const m = (inRoles || inIdentities) && line.match(DECLARATION);
    if (!m) continue;
    const target = inIdentities ? identities : roles;
    if (!target.has(m[1]!)) target.set(m[1]!, resolveIdentity(m[2]!.trim(), identities));
  }
  const colorRoles = new Set([...roles].filter(([n, v]) => !NON_COLOR_ROLE.test(n) && isColorVariable(n, v)).map(([n]) => n));

  const vars: SemanticVariable[] = [];
  const seen = new Set<string>();
  let inBridge = false;
  inRoles = false;
  inIdentities = false;
  for (const line of lines) {
    if (line.includes(IDENTITIES_END_MARKER)) inIdentities = false;
    else if (line.includes(IDENTITIES_MARKER)) inIdentities = true;
    if (line.includes(ROLES_END_MARKER)) inRoles = false;
    else if (line.includes(ROLES_MARKER)) inRoles = true;
    if (line.includes(HEROUI_BRIDGE_END_MARKER)) inBridge = false;
    else if (line.includes(HEROUI_BRIDGE_MARKER)) inBridge = true;
    const match = line.match(DECLARATION);
    if (!match) continue;
    const name = match[1]!;
    const defaultVal = resolveIdentity(match[2]!.trim(), identities);
    if (seen.has(name)) continue;
    if (inIdentities) continue;
    if (inRoles) {
      seen.add(name);
      vars.push({ name, defaultVal, group: 'phosphor', isColor: colorRoles.has(name) });
    } else if (inBridge) {
      seen.add(name);
      vars.push({ name, defaultVal, group: 'heroui', isColor: isColorVariable(name, defaultVal, colorRoles) });
    } else if (
      name.startsWith('--color-') &&
      !(VAR_REF.test(defaultVal) && roles.has(defaultVal.match(VAR_REF)![1]!)) &&
      !COLOR_FAMILIES.some((f) => name.startsWith(`--color-${f}-`))
    ) {
      seen.add(name);
      vars.push({ name, defaultVal, group: groupOf(name), isColor: true });
    }
  }
  return vars;
}
