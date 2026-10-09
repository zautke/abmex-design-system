// @vitest-environment jsdom
// ButtonGroup contract: `joined` fuses segments (frame + dividers, context true);
// `spaced` separates with negative space only (gap, no frame, context false).
import { useContext } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { ButtonGroup, ButtonGroupContext } from '@abmex/ui';

afterEach(cleanup);

function Probe() {
  const grouped = useContext(ButtonGroupContext);
  return <button type="button" data-grouped={String(grouped)}>x</button>;
}

describe('ButtonGroup', () => {
  it('joined by default: named group, frame, dividers, segments drop their frame', () => {
    const { getByRole } = render(<ButtonGroup aria-label="Layout"><Probe /><Probe /></ButtonGroup>);
    const group = getByRole('group', { name: 'Layout' });
    expect(group.dataset.variant).toBe('joined');
    expect(group.className).toContain('ring-1');
    expect(group.className).toContain('[&>*+*]:border-l');
    expect(group.querySelector('button')?.dataset.grouped).toBe('true');
  });

  it('spaced: gap only, no frame or divider, children keep their own surface', () => {
    const { getByRole } = render(
      <ButtonGroup variant="spaced" aria-label="View options"><Probe /><Probe /></ButtonGroup>,
    );
    const group = getByRole('group', { name: 'View options' });
    expect(group.dataset.variant).toBe('spaced');
    expect(group.className).toContain('gap-2');
    expect(group.className).not.toContain('ring-1');
    expect(group.className).not.toContain('border-l');
    for (const child of Array.from(group.children)) expect(child.tagName).toBe('BUTTON');
    expect(group.querySelector('button')?.dataset.grouped).toBe('false');
  });
});
