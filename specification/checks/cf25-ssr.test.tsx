// @vitest-environment jsdom
// CF-25 SSR & id determinism — for every fixture: (1) aria id pairs resolve in
// the STATIC HTML, (2) static HTML ≡ hydrated DOM before any interaction (full
// serialisation diff, data-* included), (3) hydration emits no warnings.
//
// Engine effects that rewrite an attribute after hydration must be declared in
// the manifest (`ssr.postHydrationMutations`) — never silently ignored — and
// every declared mutation must actually occur, so the list cannot go stale.
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { fixtures } from '../prototype/Disclosure/Disclosure.fixtures';
import { loadManifest } from './manifest';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const ARIA_REFS = ['aria-controls', 'aria-labelledby', 'aria-owns', 'aria-describedby', 'aria-errormessage'];
const m = loadManifest('Disclosure');
const declared = m.ssr?.postHydrationMutations ?? [];
const roots: Root[] = [];
const occurred = new Map<string, number>(declared.map((d) => [`${d.selector}@${d.attr}`, 0]));
afterAll(() => {
  for (const [k, n] of occurred) expect(n, `declared mutation ${k} never occurred in any fixture (stale manifest entry)`).toBeGreaterThan(0);
});
afterEach(() => { for (const r of roots.splice(0)) act(() => r.unmount()); });

const parse = (html: string) => new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;

/** Serialise with declared mutation attributes removed (their values are asserted exactly, separately). */
function withoutDeclared(root: HTMLElement) {
  const clone = root.cloneNode(true) as HTMLElement;
  for (const { selector, attr } of declared) for (const el of clone.querySelectorAll(selector)) el.removeAttribute(attr);
  return clone.innerHTML;
}

describe.each(Object.entries(fixtures))('CF-25 SSR (Disclosure fixture: %s)', (_name, Fixture) => {
  const html = renderToString(<Fixture />);

  it('every aria id reference resolves inside the static HTML', () => {
    const doc = parse(html).ownerDocument;
    const refs = doc.querySelectorAll(ARIA_REFS.map((a) => `[${a}]`).join(','));
    expect(refs.length, 'fixture must contain at least one aria id pair').toBeGreaterThan(0);
    for (const el of refs) for (const attr of ARIA_REFS) {
      const v = el.getAttribute(attr);
      if (!v) continue;
      for (const id of v.split(/\s+/)) expect(doc.getElementById(id), `${attr}="${id}"`).not.toBeNull();
    }
  });

  it('hydrated DOM ≡ static HTML (declared engine mutations only), no hydration warnings', async () => {
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    const errors: unknown[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => { errors.push(a); });
    await act(async () => { roots.push(hydrateRoot(container, <Fixture />)); });
    spy.mockRestore();
    expect(errors, 'hydration warnings').toEqual([]);

    // Declared mutations: static value must be exactly as declared, hydrated value
    // must match the declared regex in full. Anything else on that attribute fails.
    const staticRoot = parse(html);
    for (const d of declared) {
      const key = `${d.selector}@${d.attr}`;
      const s = staticRoot.querySelector(d.selector)?.getAttribute(d.attr) ?? null;
      const h = container.querySelector(d.selector)?.getAttribute(d.attr) ?? null;
      if (s === null && h === null) continue; // attribute not applicable in this fixture
      expect(s, `${key} static value`).toBe(d.static);
      expect(h, `${key} hydrated value`).toMatch(new RegExp(d.hydrated));
      occurred.set(key, (occurred.get(key) ?? 0) + 1);
    }
    expect(withoutDeclared(container)).toBe(withoutDeclared(staticRoot));
    container.remove();
  });
});
