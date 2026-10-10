// Completeness gate: features.json ↔ SPEC.md ↔ manifest coverage stay in sync.
// - every feature id in features.json has a `### CF-xx` section in SPEC.md
// - every `landedLayer` feature has a check file that exists
// - flag-scoped features the prototype does not exercise are listed as exempt
//   in the manifest (never silent)
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SPEC_ROOT, loadManifest } from './manifest';

const here = (p: string) => resolve(SPEC_ROOT, 'checks', p);
const features = JSON.parse(readFileSync(here('../features.json'), 'utf8')) as {
  prototype: string;
  features: Array<{ id: string; scope: string; flag?: string; status: string; check: string; landedLayer: number | null }>;
  layers: Array<{ n: number; features: string[]; exempt?: string[] }>;
};
const spec = readFileSync(here('../SPEC.md'), 'utf8');

describe('features.json ↔ SPEC.md ↔ manifest', () => {
  it('all 32 features are final', () => {
    expect(features.features).toHaveLength(32);
    for (const f of features.features) expect(f.status, f.id).toBe('final');
  });

  it('every feature has a SPEC.md section', () => {
    for (const f of features.features) expect(spec, f.id).toMatch(new RegExp(`^### ${f.id} `, 'm'));
  });

  it('every landed feature has an existing check file', () => {
    for (const f of features.features.filter((x) => x.landedLayer !== null)) {
      expect(existsSync(here(`../${f.check}`)), `${f.id} → ${f.check}`).toBe(true);
    }
  });

  it('layers reference only known feature ids and cover every id at least once', () => {
    const ids = new Set(features.features.map((f) => f.id));
    const covered = new Set<string>();
    for (const l of features.layers) for (const id of [...l.features, ...(l.exempt ?? [])]) {
      expect(ids, id).toContain(id);
      covered.add(id);
    }
    expect([...ids].filter((id) => !covered.has(id))).toEqual([]);
  });

  it('prototype manifest lists exempt rows explicitly (never silent)', () => {
    const m = loadManifest(features.prototype);
    const exempt = features.layers.flatMap((l) => l.exempt ?? []);
    for (const id of exempt) expect(Object.keys(m.coverage.exempt), id).toContain(id);
    for (const id of features.features.filter((f) => f.landedLayer === 1).map((f) => f.id)) {
      expect(m.coverage.exercises, id).toContain(id);
    }
  });
});
