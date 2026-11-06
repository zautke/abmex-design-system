// @vitest-environment jsdom
//
// ModelPicker with renderModelAccessory: each model row carries the consumer's control
// (e.g. reasoning effort). Pressing the control must not select the model or close the
// picker; pressing the model button selects it and closes.
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ModelPicker, SegmentedControl } from '@abmex/ui';
import type { ProviderModel } from '@abmex/ui';

afterEach(() => cleanup());

const model = (modelId: string, providerId = 'openai', providerName = 'OpenAI') =>
  ({ id: `${providerId}::${modelId}`, providerId, providerName, modelId, displayName: modelId }) as ProviderModel;

const models = [model('gpt-a'), model('gpt-b'), model('llama', 'ollama', 'Ollama')];

describe('ModelPicker renderModelAccessory', () => {
  it('renders the accessory per row; using it neither selects nor closes', async () => {
    const onModelChange = vi.fn();
    const onEffort = vi.fn();
    render(
      <ModelPicker
        models={models}
        selectedModel={models[0]!}
        onModelChange={onModelChange}
        renderModelAccessory={(m) =>
          m.providerId === 'openai' ? (
            <SegmentedControl
              label={`${m.displayName} effort`}
              options={[{ id: 'low', label: 'low' }, { id: 'high', label: 'high' }]}
              value="low"
              onChange={(v) => onEffort(m.id, v)}
            />
          ) : null
        }
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Select model/ }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());

    expect(screen.getAllByRole('radiogroup')).toHaveLength(2); // only the two OpenAI rows
    fireEvent.click(screen.getByRole('radiogroup', { name: 'gpt-b effort' }).querySelectorAll('[role="radio"]')[1]!);
    expect(onEffort).toHaveBeenCalledWith('openai::gpt-b', 'high');
    expect(onModelChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'llama' }));
    expect(onModelChange).toHaveBeenCalledWith(models[2]);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('keyboard: focus starts on the selected model; arrows, End and type-to-find move between models', async () => {
    render(
      <ModelPicker
        models={models}
        selectedModel={models[1]!}
        onModelChange={() => {}}
        renderModelAccessory={(m) => (m.providerId === 'openai' ? <button type="button">acc {m.displayName}</button> : null)}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Select model/ }));
    await waitFor(() => expect(document.activeElement?.textContent).toBe('gpt-b'));

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(document.activeElement?.textContent).toBe('gpt-a');
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(document.activeElement?.textContent).toBe('llama');
    fireEvent.keyDown(document.activeElement!, { key: 'g' });
    expect(document.activeElement?.textContent).toBe('gpt-a');

    // Keys inside an accessory belong to the accessory.
    const acc = screen.getByRole('button', { name: 'acc gpt-a' });
    acc.focus();
    fireEvent.keyDown(acc, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(acc);
  });

  it('keeps the listbox Select when no accessory is given', () => {
    render(<ModelPicker models={models} selectedModel={null} onModelChange={() => {}} />);
    expect(screen.queryByRole('button', { name: /— Select model/ })).toBeNull();
  });
});
