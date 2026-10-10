// Shared manifest loader for checks. Reads `<Name>.manifest.json` from the
// prototype folder and exposes the typed shape the checks assert against.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Absolute path of `specification/`. Uses cwd (vitest root) because
 *  `import.meta.url` is not a file URL under the jsdom environment. */
export const SPEC_ROOT = resolve(process.cwd(), 'specification');

export interface ComponentManifest {
  name: string;
  package: '@abmex/ui' | '@abmex/ai' | '@abmex/themes';
  entry: string;
  kind: 'atom' | 'compound';
  parts: string[];
  partMap: Record<string, string>;
  focusable?: string;
  options: Array<{ prop: string; values: string; default: string; part: string; note?: string }>;
  states: { declared: boolean } & Record<string, unknown>;
  formParticipation: boolean;
  field: false | { wiring: 'rac' | 'custom'; rationale?: string };
  events: { declared: boolean } & Record<string, unknown>;
  lifecycle: { status: 'draft' | 'alpha' | 'beta' | 'stable' | 'deprecated'; a11yReviewed: string | null };
  budget: { gzipBytes: number };
  tokens: string[];
  stories: string[];
  native: Record<string, string>;
  coverage: { exercises: string[]; exempt: Record<string, string> };
}

export const RANK_WORDS = ['atoms', 'molecules', 'organisms', 'primitives', 'core', 'patterns'];

export function loadManifest(name: string): ComponentManifest {
  const path = resolve(SPEC_ROOT, 'prototype', name, `${name}.manifest.json`);
  return JSON.parse(readFileSync(path, 'utf8')) as ComponentManifest;
}

/** Verdict vocabulary for flag-scoped rows: never silent (spec rule, R2). */
export type Verdict = 'pass' | 'fail' | 'exempt';
