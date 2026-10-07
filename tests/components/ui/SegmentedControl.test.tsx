// @vitest-environment jsdom
//
// Migrated from ButtonGroup.test.tsx. `ButtonGroup` is a deprecated alias for
// `SegmentedControl`, whose options/value/onChange/label API is unchanged.
//
// The a11y contract DID change, because SegmentedControl is built on HeroUI's
// ToggleButtonGroup (React Aria): a single-select group of toggles is exposed as
// role="radiogroup" containing role="radio", with aria-checked marking the
// selection — not role="group" + aria-pressed as the hand-rolled buttons were.
// The assertions below track the accessible semantics, not the old DOM.
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { SegmentedControl } from '@abmex/ui';

afterEach(() => cleanup());

describe('SegmentedControl', () => {
  const opts = [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' },
    { id: 'c', label: 'Gamma' },
  ];

  it('renders one option per entry with the right label', () => {
    render(<SegmentedControl options={opts} value={'a'} onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'Alpha' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Beta' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Gamma' })).toBeTruthy();
  });

  it('marks the active option as checked', () => {
    render(<SegmentedControl options={opts} value={'b'} onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: 'Alpha' }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('radio', { name: 'Beta' }).getAttribute('aria-checked')).toBe('true');
  });

  it('fires onChange with the option id when an inactive option is clicked', () => {
    const onChange = vi.fn();
    render(<SegmentedControl options={opts} value={'a'} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('numeric option ids work too — onChange returns the number, not its key string', () => {
    const numOpts = [
      { id: 2, label: '2' },
      { id: 4, label: '4' },
    ];
    const onChange = vi.fn();
    render(<SegmentedControl options={numOpts} value={2} onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: '4' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('exposes a single-select group with the optional label as its accessible name', () => {
    render(
      <SegmentedControl options={opts} value={'a'} onChange={() => {}} label="Choose one" />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Choose one' })).toBeTruthy();
  });
});
