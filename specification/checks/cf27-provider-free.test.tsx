// @vitest-environment jsdom
// CF-27 Provider-free ui — the component renders its full data-slot DOM with
// zero providers mounted, and the trigger/panel aria pair resolves (CF-25
// constraint: ids come from useId, never authored here).
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Disclosure } from '../prototype/Disclosure';
import { loadManifest } from './manifest';

afterEach(cleanup);

describe('CF-27 provider-free (Disclosure)', () => {
  const m = loadManifest('Disclosure');

  it('renders every part with no provider in the tree', () => {
    const { container } = render(
      <Disclosure defaultExpanded>
        <Disclosure.Heading>
          <Disclosure.Trigger>T<Disclosure.Indicator /></Disclosure.Trigger>
        </Disclosure.Heading>
        <Disclosure.Content><Disclosure.Body>B</Disclosure.Body></Disclosure.Content>
      </Disclosure>,
    );
    for (const slot of m.parts) expect(container.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
  });

  it('aria-controls on the trigger resolves to the content panel (ids generated, not authored)', () => {
    const { container } = render(
      <Disclosure defaultExpanded>
        <Disclosure.Heading><Disclosure.Trigger>T</Disclosure.Trigger></Disclosure.Heading>
        <Disclosure.Content><Disclosure.Body>B</Disclosure.Body></Disclosure.Content>
      </Disclosure>,
    );
    const trigger = container.querySelector<HTMLElement>('[data-slot="disclosure-trigger"]')!;
    const content = container.querySelector<HTMLElement>('[data-slot="disclosure-content"]')!;
    const controls = trigger.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(content.id).toBe(controls);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });
});
