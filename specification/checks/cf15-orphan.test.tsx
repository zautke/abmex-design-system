// @vitest-environment jsdom
// CF-15 Orphan-part error — a part rendered outside its Root throws a NAMED
// error with a stable code; parts render in JSX order and are individually
// removable.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Disclosure } from '../prototype/Disclosure';
import { ORPHAN_PART, OrphanPartError } from '../prototype/errors';
import { loadManifest } from './manifest';

afterEach(cleanup);

describe('CF-15 orphan-part error (Disclosure)', () => {
  const m = loadManifest('Disclosure');
  const parts = Object.keys(m.partMap).filter((p) => p !== 'Root') as Array<keyof typeof Disclosure>;

  it.each(parts)('%s outside <Disclosure> throws OrphanPartError with code', (name) => {
    const Part = Disclosure[name] as (p: Record<string, unknown>) => JSX.Element;
    const silence = vi.spyOn(console, 'error').mockImplementation(() => {});
    let caught: unknown;
    try { render(<Part />); } catch (e) { caught = e; }
    silence.mockRestore();
    expect(caught).toBeInstanceOf(OrphanPartError);
    const err = caught as OrphanPartError;
    expect(err.name).toBe('OrphanPartError');
    expect(err.code).toBe(ORPHAN_PART);
    expect(err.component).toBe('Disclosure');
    expect(err.part).toBe(name);
    expect(err.message).toContain(`Disclosure.${name}`);
  });

  it('parts render in JSX order (Content before Heading stays Content-first)', () => {
    const { container } = render(
      <Disclosure defaultExpanded>
        <Disclosure.Content><Disclosure.Body>B</Disclosure.Body></Disclosure.Content>
        <Disclosure.Heading><Disclosure.Trigger>T</Disclosure.Trigger></Disclosure.Heading>
      </Disclosure>,
    );
    const root = container.querySelector('[data-slot="disclosure"]')!;
    const slots = [...root.children].map((c) => c.getAttribute('data-slot'));
    expect(slots).toEqual(['disclosure-content', 'disclosure-heading']);
  });

  it('parts are individually removable (no Indicator, no Body)', () => {
    const { container } = render(
      <Disclosure defaultExpanded>
        <Disclosure.Heading><Disclosure.Trigger>T</Disclosure.Trigger></Disclosure.Heading>
        <Disclosure.Content>plain</Disclosure.Content>
      </Disclosure>,
    );
    expect(container.querySelector('[data-slot="disclosure-indicator"]')).toBeNull();
    expect(container.querySelector('[data-slot="disclosure-body"]')).toBeNull();
    expect(container.querySelector('[data-slot="disclosure-content"]')!.textContent).toBe('plain');
  });
});
