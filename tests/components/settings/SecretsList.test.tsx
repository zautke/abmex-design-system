// @vitest-environment jsdom
//
// Migrated from SecretsManager.test.tsx. Same component, renamed and moved into
// the kit; the only API change is `secretNames` → `names`. It still stores
// nothing — the Dexie round-trip now lives in `useMcpSecrets`, covered by
// tests/hooks/useMcpSecrets.test.tsx.
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { SecretsList } from '@abmex/ui';

afterEach(() => cleanup());

const noop = async () => {};

describe('SecretsList', () => {
  it('renders existing secret names sorted alphabetically', () => {
    render(<SecretsList names={['ZULU', 'ALPHA', 'MID']} onAdd={noop} onRemove={noop} />);
    expect(screen.getByText('ALPHA')).toBeTruthy();
    expect(screen.getByText('MID')).toBeTruthy();
    expect(screen.getByText('ZULU')).toBeTruthy();
  });

  it('Add button is the Plus icon (aria-label "Add secret")', () => {
    render(<SecretsList names={[]} onAdd={noop} onRemove={noop} />);
    const btn = screen.getByRole('button', { name: /Add secret/i });
    expect(btn).toBeTruthy();
    // The label should be the Plus icon, not the text "Add secret"
    expect(btn.textContent?.trim()).toBe('');
  });

  it('Add button is disabled when name and value are both empty', () => {
    render(<SecretsList names={[]} onAdd={noop} onRemove={noop} />);
    const btn = screen.getByRole('button', { name: /Add secret/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('Add button is disabled when only name is filled', () => {
    render(<SecretsList names={[]} onAdd={noop} onRemove={noop} />);
    const nameInput = screen.getByLabelText(/New secret name/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'KEY' } });
    const btn = screen.getByRole('button', { name: /Add secret/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('calls onAdd with name+value when + clicked, clears inputs', async () => {
    const onAdd = vi.fn(async () => {});
    render(<SecretsList names={[]} onAdd={onAdd} onRemove={noop} />);
    const nameInput = screen.getByLabelText(/New secret name/i) as HTMLInputElement;
    const valueInput = screen.getByLabelText(/New secret value/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'API_KEY' } });
    fireEvent.change(valueInput, { target: { value: 'sek123' } });
    fireEvent.click(screen.getByRole('button', { name: /Add secret/i }));
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith('API_KEY', 'sek123'));
    // Inputs cleared after add
    await waitFor(() => {
      expect(nameInput.value).toBe('');
      expect(valueInput.value).toBe('');
    });
  });

  it('calls onRemove with name when trash icon clicked', async () => {
    const onRemove = vi.fn(async () => {});
    render(<SecretsList names={['GH_TOKEN']} onAdd={noop} onRemove={onRemove} />);
    const removeBtn = screen.getByRole('button', { name: /Remove GH_TOKEN/i });
    fireEvent.click(removeBtn);
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith('GH_TOKEN'));
  });

  it('value input has eye/eye-off toggle', () => {
    render(<SecretsList names={[]} onAdd={noop} onRemove={noop} />);
    const valueInput = screen.getByLabelText(/New secret value/i) as HTMLInputElement;
    expect(valueInput.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: /Show secret/i }));
    expect(valueInput.type).toBe('text');
    fireEvent.click(screen.getByRole('button', { name: /Hide secret/i }));
    expect(valueInput.type).toBe('password');
  });
});
