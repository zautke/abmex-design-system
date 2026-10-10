// CF-05 Dot-notation parts only — the entry exports the compound and its parts
// hang off it; no part is exported flat.
import { describe, expect, it } from 'vitest';
import * as entry from '../prototype/Disclosure';
import { loadManifest } from './manifest';

describe('CF-05 exports (Disclosure)', () => {
  const m = loadManifest('Disclosure');
  const partNames = Object.keys(m.partMap).filter((k) => k !== 'Root');

  it('exports exactly one runtime value: the compound', () => {
    const runtime = Object.entries(entry).filter(([, v]) => typeof v === 'function' || typeof v === 'object');
    expect(runtime.map(([k]) => k)).toEqual([m.name]);
  });

  it('every manifest part is reachable as Compound.Part', () => {
    const compound = (entry as Record<string, unknown>)[m.name] as Record<string, unknown>;
    for (const part of partNames) expect(typeof compound[part], part).toBe('function');
  });

  it('no part is exported flat', () => {
    for (const part of partNames) {
      expect(entry, `${m.name}${part}`).not.toHaveProperty(`${m.name}${part}`);
      expect(entry, part).not.toHaveProperty(part);
    }
  });
});
