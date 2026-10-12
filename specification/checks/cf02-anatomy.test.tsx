// @vitest-environment jsdom
// CF-02 Anatomy before code — the union of `data-slot` values rendered across
// the state matrix equals the manifest parts (amended R1: per state ⊆, union ==).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Disclosure } from '../prototype/Disclosure';
import { loadManifest } from './manifest';

afterEach(cleanup);

const slotsIn = (el: HTMLElement) =>
  new Set(Array.from(el.querySelectorAll<HTMLElement>('[data-slot]')).map((n) => n.dataset.slot!));

function Fixture({ expanded }: { expanded: boolean }) {
  return (
    <Disclosure defaultExpanded={expanded}>
      <Disclosure.Heading>
        <Disclosure.Trigger>
          Details
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body>Body copy</Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );
}

describe('CF-02 anatomy (Disclosure)', () => {
  const m = loadManifest('Disclosure');
  const manifestSet = new Set(m.parts);

  it('per state: rendered data-slot set ⊆ manifest parts', () => {
    for (const expanded of [false, true]) {
      const { container, unmount } = render(<Fixture expanded={expanded} />);
      for (const slot of slotsIn(container)) expect(manifestSet, `state expanded=${expanded}`).toContain(slot);
      unmount();
    }
  });

  it('union across the state matrix == manifest parts', () => {
    const union = new Set<string>();
    for (const expanded of [false, true]) {
      const { container, unmount } = render(<Fixture expanded={expanded} />);
      for (const slot of slotsIn(container)) union.add(slot);
      unmount();
    }
    expect([...union].sort()).toEqual([...manifestSet].sort());
  });

  it.each([false, true])('each part renders exactly one element carrying its slot (expanded=%s)', (expanded) => {
    const { container } = render(<Fixture expanded={expanded} />);
    for (const slot of m.parts) {
      expect(container.querySelectorAll(`[data-slot="${slot}"]`).length, slot).toBe(1);
    }
  });
});
