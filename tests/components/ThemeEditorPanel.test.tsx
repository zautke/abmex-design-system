// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DEFAULT_LCH, DEFAULT_THEME, ThemeEditorPanel } from '@abmex/ui';

afterEach(cleanup);

const css = `
@theme {
  --color-teal-500: oklch(1 0 0);
  --color-app-bg: var(--color-slate-50);
  --color-chat-bubble-user-bg: var(--color-teal-700);
  --color-chat-bubble-ai-bg: var(--color-white);
  --color-header-bg: var(--color-white);
}
/* theme-editor: heroui-bridge */
:root {
  --radius: 0.5rem;
  --accent: var(--color-teal-700);
  --surface: var(--color-white);
}
`;

function renderPanel(overrides: Record<string, string> = {}, extra: Record<string, unknown> = {}) {
  const props = {
    onClose: vi.fn(),
    cssText: css,
    colors: DEFAULT_LCH,
    setColors: vi.fn(),
    overrides,
    setOverrides: vi.fn(),
    handleFamilyChange: vi.fn(),
    handleOverrideChange: vi.fn(),
    themes: [DEFAULT_THEME],
    activeTheme: DEFAULT_THEME,
    setActiveThemeId: vi.fn(),
    saveNewTheme: vi.fn(),
    deleteTheme: vi.fn(),
    renameTheme: vi.fn(),
    ...extra,
  };
  return { ...render(<ThemeEditorPanel {...props} />), props };
}

describe('ThemeEditorPanel semantic variables', () => {
  it('groups tokens by component prefix and lists the HeroUI bridge as its own group', () => {
    renderPanel();
    const summaries = [...document.querySelectorAll('summary')].map((s) => s.textContent);
    expect(summaries.join('|')).toMatch(/App/);
    expect(summaries.join('|')).toMatch(/Chat.*2/);
    expect(summaries.join('|')).toMatch(/HeroUI bridge.*3/);
    // palette ramp entries are never listed
    expect(screen.queryByTitle('--color-teal-500')).toBeNull();
    expect(screen.getByTitle('--accent')).toBeTruthy();
  });

  it('the filter narrows the list and opens the matching groups', () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText('Filter variables'), { target: { value: 'bubble' } });
    const details = [...document.querySelectorAll<HTMLDetailsElement>('[aria-label="Semantic variable groups"] details')];
    expect(details).toHaveLength(1);
    expect(details[0]!.open).toBe(true);
    expect(screen.getByTitle('--color-chat-bubble-user-bg')).toBeTruthy();
    expect(screen.queryByTitle('--accent')).toBeNull();
    fireEvent.change(screen.getByLabelText('Filter variables'), { target: { value: 'zzz' } });
    expect(screen.getByText(/No variables match/)).toBeTruthy();
  });

  it('shows how many tokens in a group are overridden and routes edits through handleOverrideChange', () => {
    const { props } = renderPanel({ '--accent': '#ff0000' });
    expect(screen.getByText('1 set')).toBeTruthy();
    const input = screen.getByLabelText('Override --accent');
    fireEvent.change(input, { target: { value: '#00ff00' } });
    expect(props.handleOverrideChange).toHaveBeenCalledWith('--accent', '#00ff00');
  });

  it('offers the color picker only for color-valued variables: --radius is text-only', () => {
    renderPanel();
    const radiusRow = screen.getByLabelText('Override --radius').closest('div.flex-col')!;
    expect(radiusRow.querySelector('[title="Click to open Color System"]')).toBeNull();
    const accentRow = screen.getByLabelText('Override --accent').closest('div.flex-col')!;
    expect(accentRow.querySelector('[title="Click to open Color System"]')).not.toBeNull();
  });

  it('Reset All without onResetAll restores the OKLCH anchors and clears overrides', () => {
    const { props } = renderPanel({ '--accent': '#ff0000' });
    fireEvent.click(screen.getByText('Reset All'));
    expect(props.setColors).toHaveBeenCalledWith(DEFAULT_LCH);
    expect(props.setOverrides).toHaveBeenCalledWith({});
  });

  it('Reset All prefers the single-write onResetAll when supplied', () => {
    const onResetAll = vi.fn();
    const { props } = renderPanel({ '--accent': '#ff0000' }, { onResetAll });
    fireEvent.click(screen.getByText('Reset All'));
    expect(onResetAll).toHaveBeenCalledTimes(1);
    expect(props.setColors).not.toHaveBeenCalled();
    expect(props.setOverrides).not.toHaveBeenCalled();
  });
});

describe('ThemeEditorPanel palette — one tier, one picker', () => {
  it('has no hue/saturation range sliders; every family is a row with the full color picker', () => {
    renderPanel();
    expect(document.querySelectorAll('[aria-label="Palette families"] input[type="range"]')).toHaveLength(0);
    for (const family of ['slate', 'teal', 'rose', 'emerald', 'amber']) {
      expect(screen.getByRole('button', { name: `Pick color for ${family}` })).toBeTruthy();
      expect(screen.getByLabelText(`Override ${family}`)).toBeTruthy();
    }
  });

  it('typing a valid color into a family row sets the full OKLCH anchor (L included)', () => {
    const { props } = renderPanel();
    fireEvent.change(screen.getByLabelText('Override teal'), { target: { value: 'oklch(50% 0.2 300)' } });
    expect(props.handleFamilyChange).toHaveBeenCalledTimes(1);
    const [family, color] = (props.handleFamilyChange as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(family).toBe('teal');
    expect(color.l).toBeCloseTo(0.5, 3);
    expect(color.c).toBeCloseTo(0.2, 3);
    expect(color.h).toBeCloseTo(300, 1);
  });

  it('an unparseable family value stays a draft and is never committed', () => {
    const { props } = renderPanel();
    const input = screen.getByLabelText('Override teal') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'oklch(50%' } });
    expect(props.handleFamilyChange).not.toHaveBeenCalled();
    expect(input.value).toBe('oklch(50%');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('a moved family shows its value and a CLEAR that restores the anchor', () => {
    const { props } = renderPanel({}, { colors: { ...DEFAULT_LCH, rose: { l: 0.6, c: 0.2, h: 10 } } });
    expect((screen.getByLabelText('Override rose') as HTMLInputElement).value).toBe('oklch(60% 0.2 10)');
    const row = document.querySelector('[data-color-row="rose"]')!;
    fireEvent.click([...row.querySelectorAll('button')].find((b) => b.textContent === 'CLEAR')!);
    expect(props.handleFamilyChange).toHaveBeenCalledWith('rose', DEFAULT_LCH.rose);
  });
});

describe('ThemeEditorPanel palette "drives" dropdown', () => {
  it('each family shows a compact "drives N roles" toggle that lists every bound role, fill ink included', () => {
    renderPanel();
    const list = screen.getByRole('list', { name: 'Roles driven by teal' });
    const toggle = list.closest('details')!;
    expect(toggle.open).toBe(false); // collapsed: nothing runs off the panel
    const items = [...list.querySelectorAll('li')].map((li) => li.textContent);
    expect(items).toEqual(expect.arrayContaining(['--primary', '--primary-hover', '--primary-soft', '--focus', '--primary-fg']));
    expect(toggle.querySelector('summary')!.textContent).toBe(`drives ${items.length} roles`);
    fireEvent.click(toggle.querySelector('summary')!);
    expect(toggle.open).toBe(true);
  });
});
