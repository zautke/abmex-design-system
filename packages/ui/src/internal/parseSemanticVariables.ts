// Internal helper — NOT part of the @merlyn/ui public API. Lives outside
// the `./components/*` export glob so it stays package-private; consumed
// only by ThemeEditorPanel. Unit-tested directly via the repo source path.

import { COLOR_FAMILIES } from '../types/theme';

export interface SemanticVariable {
  name: string;
  defaultVal: string;
}

/**
 * Extract semantic (non-color-family) CSS custom properties from a stylesheet
 * string. A line counts as a semantic variable when it declares a
 * `--color-*` custom property whose name is NOT prefixed by a known color
 * family (`--color-{family}-…`).
 */
export function parseSemanticVariables(css: string): SemanticVariable[] {
  const vars: SemanticVariable[] = [];
  const lines = css.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*(--color-[a-zA-Z0-9-]+):\s*([^;]+);/);
    if (match) {
      const name = match[1]!;
      const defaultVal = match[2]!;
      if (!COLOR_FAMILIES.some((f) => name.startsWith(`--color-${f}-`))) {
        vars.push({ name, defaultVal });
      }
    }
  }
  return vars;
}
