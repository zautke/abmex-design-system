// @vitest-environment jsdom
//
// Re-pointed at the package component. Two things changed and the assertions
// follow them:
//   - the `setText` prop is now `onTextChange`
//   - the indent toggle is a SegmentedControl (HeroUI ToggleButtonGroup), so
//     "2" / "4" are role="radio", not role="button"
// Everything else — Save/Reset/Export/Import, error gating, Tab-inserts-spaces —
// is asserted exactly as before.
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { JsonConfigEditor } from '@abmex/ui';

afterEach(() => cleanup());

const baseProps = {
  text: '{\n  "mcp": {}\n}',
  onTextChange: () => {},
  error: null as string | null,
  isLoaded: true,
  onSave: () => {},
  onReset: () => {},
  onExport: () => {},
  onImport: (_f: File) => {},
  ariaLabel: 'MCP servers config JSON',
};

describe('JsonConfigEditor', () => {
  it('renders textarea + Save/Reset/Export/Import buttons + indent toggle', () => {
    render(<JsonConfigEditor {...baseProps} />);
    expect(screen.getByLabelText(/MCP servers config JSON/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Save config/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Reset/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Export/i })).toBeTruthy();
    expect(screen.getByText(/Import/i)).toBeTruthy();
    // 2 spaces / 4 spaces toggle
    expect(screen.getByRole('radio', { name: '2' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '4' })).toBeTruthy();
  });

  it('calls onSave when Save clicked', () => {
    const onSave = vi.fn();
    render(<JsonConfigEditor {...baseProps} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: /Save config/i }));
    expect(onSave).toHaveBeenCalled();
  });

  it('calls onReset when Reset clicked', () => {
    const onReset = vi.fn();
    render(<JsonConfigEditor {...baseProps} onReset={onReset} />);
    fireEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect(onReset).toHaveBeenCalled();
  });

  it('calls onExport when Export clicked', () => {
    const onExport = vi.fn();
    render(<JsonConfigEditor {...baseProps} onExport={onExport} />);
    fireEvent.click(screen.getByRole('button', { name: /Export/i }));
    expect(onExport).toHaveBeenCalled();
  });

  it('shows error text when error prop is non-null', () => {
    render(<JsonConfigEditor {...baseProps} error="Invalid JSON: bad syntax" />);
    expect(screen.getByText(/Invalid JSON/i)).toBeTruthy();
  });

  it('disables Save when error is present', () => {
    render(<JsonConfigEditor {...baseProps} error="Invalid JSON" />);
    const save = screen.getByRole('button', { name: /Save config/i }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
  });

  it('disables all buttons when isLoaded=false', () => {
    render(<JsonConfigEditor {...baseProps} isLoaded={false} />);
    const save = screen.getByRole('button', { name: /Save config/i }) as HTMLButtonElement;
    const reset = screen.getByRole('button', { name: /Reset/i }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(reset.disabled).toBe(true);
  });

  it('Tab key in textarea inserts 2 spaces (default indent)', () => {
    let current = 'abcd';
    const onTextChange = (v: string) => {
      current = v;
    };
    const { rerender } = render(
      <JsonConfigEditor {...baseProps} text={current} onTextChange={onTextChange} />,
    );
    const ta = screen.getByLabelText(/MCP servers config JSON/i) as HTMLTextAreaElement;
    ta.selectionStart = 2;
    ta.selectionEnd = 2;
    fireEvent.keyDown(ta, { key: 'Tab' });
    expect(current).toBe('ab  cd');
    rerender(<JsonConfigEditor {...baseProps} text={current} onTextChange={onTextChange} />);
  });

  it('clicking indent=4 changes Tab insert to 4 spaces', () => {
    let current = 'xy';
    const onTextChange = (v: string) => {
      current = v;
    };
    const { rerender } = render(
      <JsonConfigEditor {...baseProps} text={current} onTextChange={onTextChange} />,
    );
    fireEvent.click(screen.getByRole('radio', { name: '4' }));
    rerender(<JsonConfigEditor {...baseProps} text={current} onTextChange={onTextChange} />);
    const ta = screen.getByLabelText(/MCP servers config JSON/i) as HTMLTextAreaElement;
    ta.selectionStart = 1;
    ta.selectionEnd = 1;
    fireEvent.keyDown(ta, { key: 'Tab' });
    expect(current).toBe('x    y');
  });
});
