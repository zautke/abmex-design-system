// @vitest-environment jsdom
//
// SettingsFields / ToolsPanel `sections` mode: settings described as data. The
// harness mirrors a real consumer (Merlyn's Tools tab: search backend, two token
// budgets, VFS quota, shell toggle) feeding values back through useState.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';

import {
  QUOTA_OPTIONS,
  SettingsFields,
  ToolsPanel,
  UNLIMITED_QUOTA,
  type SettingsSectionSpec,
} from '@abmex/ui';

afterEach(() => cleanup());

type Backend = 'auto' | 'duckduckgo' | 'bing-rss';
const BACKENDS: ReadonlyArray<{ id: Backend; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'duckduckgo', label: 'DuckDuckGo' },
  { id: 'bing-rss', label: 'Bing RSS' },
];
const TOKENS = [
  { id: 1000, label: '1k' },
  { id: 3000, label: '3k' },
  { id: 6000, label: '6k' },
];

interface State {
  backend: Backend;
  searchTokens: number;
  fetchTokens: number;
  quota: number;
  shell: boolean;
  baseUrl: string;
}

const INITIAL: State = {
  backend: 'auto',
  searchTokens: 3000,
  fetchTokens: 3000,
  quota: 50 * 1_048_576,
  shell: false,
  baseUrl: '',
};

function sectionsFor(s: State, set: (patch: Partial<State>) => void): SettingsSectionSpec[] {
  return [
    {
      title: 'Web',
      description: 'Keyless web tools.',
      fields: [
        {
          kind: 'segmented',
          label: 'Search backend',
          ariaLabel: 'Web search backend',
          options: BACKENDS,
          value: s.backend,
          // A narrower setter than (string | number) => void must type-check.
          onChange: (backend: Backend) => set({ backend }),
        },
        {
          kind: 'segmented',
          label: 'Search result budget',
          ariaLabel: 'Web search token budget',
          options: TOKENS,
          value: s.searchTokens,
          onChange: (searchTokens: number) => set({ searchTokens }),
        },
        {
          kind: 'segmented',
          label: 'Page fetch budget',
          ariaLabel: 'Web fetch token budget',
          options: TOKENS,
          value: s.fetchTokens,
          onChange: (fetchTokens: number) => set({ fetchTokens }),
        },
        {
          kind: 'text',
          label: 'Gateway URL',
          placeholder: 'http://host:port',
          value: s.baseUrl,
          onChange: (baseUrl) => set({ baseUrl }),
        },
      ],
    },
    {
      title: 'Virtual filesystem',
      fields: [
        {
          kind: 'segmented',
          ariaLabel: 'Virtual filesystem quota',
          options: QUOTA_OPTIONS.map((o) => ({ id: o.bytes, label: o.label })),
          value: s.quota,
          onChange: (quota: number) => set({ quota }),
        },
      ],
    },
    {
      title: 'Shell access',
      fields: [
        {
          kind: 'toggle',
          checked: s.shell,
          onChange: (shell) => set({ shell }),
          hint: 'Reload the extension after toggling.',
        },
      ],
    },
  ];
}

function Harness({
  onChange,
  initial = {},
  viaToolsPanel = false,
}: {
  onChange?: (patch: Partial<State>) => void;
  initial?: Partial<State>;
  viaToolsPanel?: boolean;
}) {
  const [state, setState] = useState<State>({ ...INITIAL, ...initial });
  const set = (patch: Partial<State>) => {
    onChange?.(patch);
    setState((s) => ({ ...s, ...patch }));
  };
  const sections = sectionsFor(state, set);
  return viaToolsPanel ? <ToolsPanel sections={sections} /> : <SettingsFields sections={sections} />;
}

const group = (name: string) => screen.getByRole('radiogroup', { name });
const checked = (groupName: string, option: string) =>
  within(group(groupName)).getByRole('radio', { name: option }).getAttribute('aria-checked');

describe('<SettingsFields />', () => {
  it('renders section titles, descriptions and field labels from data', () => {
    render(<Harness />);
    expect(screen.getByText('Web')).toBeTruthy();
    expect(screen.getByText('Keyless web tools.')).toBeTruthy();
    expect(screen.getByText('Virtual filesystem')).toBeTruthy();
    expect(screen.getByText('Shell access')).toBeTruthy();
    expect(screen.getByText('Search result budget')).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Page fetch budget' })).toBeTruthy();
  });

  it('names each segmented control by ariaLabel and reflects its value', () => {
    render(<Harness initial={{ backend: 'bing-rss', fetchTokens: 6000 }} />);
    expect(checked('Web search backend', 'Bing RSS')).toBe('true');
    expect(checked('Web search token budget', '3k')).toBe('true');
    expect(checked('Web fetch token budget', '6k')).toBe('true');
    expect(checked('Virtual filesystem quota', '50 MB')).toBe('true');
  });

  it('emits the typed value of the chosen option', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(within(group('Web search backend')).getByRole('radio', { name: 'DuckDuckGo' }));
    expect(onChange).toHaveBeenCalledWith({ backend: 'duckduckgo' });
    fireEvent.click(within(group('Web fetch token budget')).getByRole('radio', { name: '1k' }));
    expect(onChange).toHaveBeenCalledWith({ fetchTokens: 1000 });
    fireEvent.click(within(group('Virtual filesystem quota')).getByRole('radio', { name: 'Unlimited' }));
    expect(onChange).toHaveBeenCalledWith({ quota: UNLIMITED_QUOTA });
  });

  it('toggle shows state text and hint, and emits the next value', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: /Disabled/ }) as HTMLInputElement;
    expect(sw.checked).toBe(false);
    expect(screen.getByText('Reload the extension after toggling.')).toBeTruthy();
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith({ shell: true });
    expect(screen.getByRole('switch', { name: /Enabled/ })).toBeTruthy();
  });

  it('text field is labelled and emits its value', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Gateway URL' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'http://h:1' } });
    expect(onChange).toHaveBeenCalledWith({ baseUrl: 'http://h:1' });
    expect(input.value).toBe('http://h:1');
  });
});

describe('<ToolsPanel sections />', () => {
  it('renders the data-driven field set instead of the fixed one', () => {
    const onChange = vi.fn();
    render(<Harness viaToolsPanel onChange={onChange} />);
    expect(screen.queryByPlaceholderText('tvly-...')).toBeNull();
    expect(screen.queryByText('Web search')).toBeNull();
    fireEvent.click(within(group('Web search token budget')).getByRole('radio', { name: '6k' }));
    expect(onChange).toHaveBeenCalledWith({ searchTokens: 6000 });
  });
});
