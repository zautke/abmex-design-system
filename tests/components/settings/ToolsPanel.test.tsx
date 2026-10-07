// @vitest-environment jsdom
//
// Migrated from ToolsTab.test.tsx — the presentation half.
//
// ToolsTab owned its Dexie reads/writes; ToolsPanel is fully controlled
// (`values` in, `onChange` patch out). So the assertions that used to read
// `db.appState` after an interaction now assert the emitted patch instead. The
// Dexie side of those same assertions did not disappear — it moved to
// tests/hooks/useAppState.test.tsx (the storage primitive) and
// tests/components/settings/SettingsHost.test.tsx (the key-name contract:
// tavilyApiKey / braveApiKey / webSearchProvider / vfsQuotaBytes / bashRunEnabled).
//
// The provider and quota selectors are now SegmentedControls (HeroUI
// ToggleButtonGroup), so the active option is role="radio" + aria-checked rather
// than a button with aria-pressed.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import { ToolsPanel, UNLIMITED_QUOTA, type ToolsPanelValues } from '@abmex/ui';

afterEach(() => cleanup());

const DEFAULT_VALUES: ToolsPanelValues = {
  tavilyApiKey: '',
  braveApiKey: '',
  webSearchProvider: 'auto',
  vfsQuotaBytes: 50 * 1_048_576,
  shellEnabled: false,
};

/** Stateful harness — mirrors how SettingsHost feeds values back in. */
function Harness({
  initial = {},
  onChange,
}: {
  initial?: Partial<ToolsPanelValues>;
  onChange?: (patch: Partial<ToolsPanelValues>) => void;
}) {
  const [values, setValues] = useState<ToolsPanelValues>({ ...DEFAULT_VALUES, ...initial });
  return (
    <ToolsPanel
      values={values}
      onChange={(patch) => {
        onChange?.(patch);
        setValues((v) => ({ ...v, ...patch }));
      }}
    />
  );
}

describe('<ToolsPanel />', () => {
  it('renders the three tool sections', () => {
    render(<Harness />);
    expect(screen.getByText('Web search')).toBeTruthy();
    expect(screen.getByText('Virtual filesystem')).toBeTruthy();
    expect(screen.getByText('Shell access')).toBeTruthy();
  });

  it('emits a tavilyApiKey patch on input change', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByPlaceholderText('tvly-...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'tvly-secret-123' } });
    expect(onChange).toHaveBeenCalledWith({ tavilyApiKey: 'tvly-secret-123' });
  });

  it('emits a braveApiKey patch on input change', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByPlaceholderText('BSA...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'BSA-abc' } });
    expect(onChange).toHaveBeenCalledWith({ braveApiKey: 'BSA-abc' });
  });

  it('default provider options mark the active provider as checked', () => {
    render(<Harness />);
    const tavily = screen.getByRole('radio', { name: 'Tavily' });
    fireEvent.click(tavily);
    expect(tavily.getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Auto cascade' }).getAttribute('aria-checked')).toBe(
      'false',
    );
  });

  it('emits the chosen default provider', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Brave' }));
    expect(onChange).toHaveBeenCalledWith({ webSearchProvider: 'brave' });
  });

  it('quota selector emits the chosen byte count', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: '200 MB' }));
    expect(onChange).toHaveBeenCalledWith({ vfsQuotaBytes: 200 * 1_048_576 });
  });

  it('Unlimited quota emits the sentinel value', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Unlimited' }));
    expect(onChange).toHaveBeenCalledWith({ vfsQuotaBytes: UNLIMITED_QUOTA });
  });

  it('bash toggle emits shellEnabled', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const sw = screen.getByRole('switch') as HTMLInputElement;
    expect(sw.checked).toBe(false);
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith({ shellEnabled: true });
  });

  it('renders the values it is given', () => {
    render(
      <Harness
        initial={{
          tavilyApiKey: 'tvly-existing',
          webSearchProvider: 'tavily',
          vfsQuotaBytes: 10 * 1_048_576,
        }}
      />,
    );
    expect((screen.getByPlaceholderText('tvly-...') as HTMLInputElement).value).toBe(
      'tvly-existing',
    );
    expect(screen.getByRole('radio', { name: 'Tavily' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: '10 MB' }).getAttribute('aria-checked')).toBe('true');
  });

  it('show/hide toggles change input type between password and text', () => {
    render(<Harness />);
    const input = screen.getByPlaceholderText('tvly-...') as HTMLInputElement;
    expect(input.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Show Tavily API key' }));
    expect(input.type).toBe('text');
    fireEvent.click(screen.getByRole('button', { name: 'Hide Tavily API key' }));
    expect(input.type).toBe('password');
  });
});
