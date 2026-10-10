// CF-01 Kind manifest — every component ships a manifest with the required
// fields; `kind` is one of exactly two values (CCC: atom | compound).
import { describe, expect, it } from 'vitest';
import { loadManifest } from './manifest';

describe('CF-01 kind manifest (Disclosure)', () => {
  const m = loadManifest('Disclosure');

  it('declares exactly one of the two kinds', () => {
    expect(['atom', 'compound']).toContain(m.kind);
  });

  it('carries every required field', () => {
    for (const key of [
      'name', 'package', 'entry', 'kind', 'parts', 'partMap', 'options', 'states',
      'formParticipation', 'field', 'events', 'lifecycle', 'budget', 'tokens', 'stories', 'native', 'coverage',
    ]) {
      expect(m, key).toHaveProperty(key);
    }
    expect(['draft', 'alpha', 'beta', 'stable', 'deprecated']).toContain(m.lifecycle.status);
  });

  it('a compound names its parts; partMap values ⊆ parts and Root maps to the component slot', () => {
    expect(m.kind).toBe('compound');
    expect(m.parts.length).toBeGreaterThan(1);
    for (const slot of Object.values(m.partMap)) expect(m.parts).toContain(slot);
    expect(m.partMap.Root).toBe(m.name.toLowerCase());
  });

  it('every part slot is prefixed with the component name (data-slot="<component>-<part>")', () => {
    const base = m.name.toLowerCase();
    for (const slot of m.parts) expect(slot === base || slot.startsWith(`${base}-`)).toBe(true);
  });
});
