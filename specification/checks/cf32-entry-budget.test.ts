// CF-32 Per-component entry & budget — layer 1 lands the scaffold: one entry
// folder per component with an index, a manifest `budget`, and no CSS colocated
// (themes-only CSS). Treeshake + size-limit CI land when the component is
// packaged under @abmex/ui/<Name>.
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SPEC_ROOT, loadManifest } from './manifest';

const dir = (name: string) => resolve(SPEC_ROOT, 'prototype', name) + '/';

describe('CF-32 entry scaffold (Disclosure)', () => {
  const m = loadManifest('Disclosure');

  it('entry name matches the package subpath convention', () => {
    expect(m.entry).toBe(`${m.package}/${m.name}`);
  });

  it('has an index entry and a manifest, and no colocated CSS', () => {
    const files = readdirSync(dir(m.name));
    expect(existsSync(dir(m.name) + 'index.ts')).toBe(true);
    expect(files).toContain(`${m.name}.manifest.json`);
    expect(files.filter((f) => f.endsWith('.css'))).toEqual([]);
  });

  it('declares a positive gzip budget', () => {
    expect(m.budget.gzipBytes).toBeGreaterThan(0);
  });
});
