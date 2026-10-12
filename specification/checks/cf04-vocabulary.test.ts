// CF-04 No rank vocabulary / no subtype — no folder under specification/ or
// packages/*/src is named with a rank word; no exported identifier starts with
// `Base`; no `class X extends <system component>`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RANK_WORDS, SPEC_ROOT } from './manifest';

const root = SPEC_ROOT;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { out.push(p); walk(p, out); } else out.push(p);
  }
  return out;
}

describe('CF-04 vocabulary (specification/)', () => {
  const entries = walk(root);
  const dirs = entries.filter((p) => statSync(p).isDirectory());
  const sources = entries.filter((p) => /\.(tsx?|mjs)$/.test(p));

  it('no directory is named with a rank word', () => {
    for (const d of dirs) {
      const leaf = d.split('/').pop()!.toLowerCase();
      expect(RANK_WORDS, d).not.toContain(leaf);
    }
  });

  it('no export named Base*', () => {
    for (const f of sources) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/export\s+(?:const|function|class|type|interface)\s+Base[A-Z]/);
    }
  });

  it('no class extends a system component', () => {
    for (const f of sources) {
      const src = readFileSync(f, 'utf8');
      // React.Component / Error are allowed bases; anything imported from @abmex/* or ./ is not.
      expect(src, f).not.toMatch(/class\s+\w+\s+extends\s+(?!React\.|Component\b|PureComponent\b|Error\b)[A-Z]\w*/);
    }
  });
});
