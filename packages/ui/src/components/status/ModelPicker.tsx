import { Button, Header, ListBox, Popover, Select, Separator } from '@heroui/react';
import { useState, type ReactNode } from 'react';
import type { ProviderModel } from '../../types/provider';
import { cn } from '../../utils/cn';

export interface ModelPickerProps {
  // WIRING: the consumer owns provider probing and model discovery. This view
  // takes an already-flattened, already-composite-keyed list — it never talks
  // to a provider registry, never fetches, and never persists the selection.
  models: ProviderModel[];
  selectedModel: ProviderModel | null;
  onModelChange: (model: ProviderModel) => void;
  disabled?: boolean;
  className?: string;
  /**
   * Per-model control rendered at the end of that model's row (e.g. a reasoning-effort
   * SegmentedControl). Return null for models without one. The consumer owns the state
   * and persistence; this view only places the node. When given, the picker renders as a
   * popover dialog of rows (model button + accessory) instead of a listbox, because a
   * listbox option must not contain interactive controls.
   */
  renderModelAccessory?: (model: ProviderModel) => ReactNode;
}

export function ModelPicker({
  models,
  selectedModel,
  onModelChange,
  disabled = false,
  className,
  renderModelAccessory,
}: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const enabledModels = models.filter((model) => !model.disabled);

  if (models.length === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-modelpicker-empty-border bg-modelpicker-empty-bg px-3 py-1.5 text-xs text-modelpicker-empty-text',
          className,
        )}
      >
        {disabled ? 'No connection — configure a provider in Settings…' : 'No models found'}
      </div>
    );
  }

  // Group by provider, preserving first-seen provider order.
  const groups = models.reduce<Record<string, ProviderModel[]>>((acc, model) => {
    if (!acc[model.providerId]) acc[model.providerId] = [];
    acc[model.providerId]!.push(model);
    return acc;
  }, {});

  const disabledKeys = models.filter((model) => model.disabled).map((model) => model.id);

  // Selection round-trips through the composite id ("ollama::llama3.2"), the
  // only key that is unique across providers.
  function handleChange(key: unknown): void {
    if (typeof key !== 'string') return;
    const model = models.find((candidate) => candidate.id === key);
    if (model) onModelChange(model);
  }

  const placeholder =
    enabledModels.length > 0 ? 'Select a model…' : 'No usable models — open Settings';
  const groupEntries = Object.entries(groups);

  if (renderModelAccessory) {
    return (
      <Popover isOpen={open} onOpenChange={setOpen}>
        <Button
          aria-label={`${selectedModel?.displayName ?? placeholder} — Select model`}
          className={cn('w-full justify-between text-xs', className)}
          isDisabled={disabled}
          variant="secondary"
        >
          <span className="truncate">{selectedModel?.displayName ?? placeholder}</span>
          <span aria-hidden="true">▾</span>
        </Button>
        <Popover.Content className="max-h-[70vh] w-[min(32rem,calc(100vw-1rem))] overflow-auto" placement="bottom start">
          <Popover.Dialog aria-label="Select model" className="p-1">
            {groupEntries.map(([providerId, providerModels], index) => {
              const sorted = [...providerModels].sort((a, b) =>
                a.displayName.localeCompare(b.displayName),
              );
              return (
                <section key={providerId} aria-label={providerModels[0]!.providerName}>
                  {index > 0 && <Separator />}
                  <Header className="px-2 pt-2 pb-1 text-xs font-semibold text-modelpicker-empty-text">
                    {providerModels[0]!.providerName}
                  </Header>
                  {sorted.map((model) => {
                    const accessory = renderModelAccessory(model);
                    const selected = selectedModel?.id === model.id;
                    return (
                      <div key={model.id} className="flex items-center gap-2 rounded-md px-1 py-0.5">
                        <Button
                          aria-current={selected ? 'true' : undefined}
                          className="min-w-0 flex-1 justify-start text-xs"
                          isDisabled={model.disabled}
                          size="sm"
                          variant={selected ? 'secondary' : 'ghost'}
                          onPress={() => {
                            onModelChange(model);
                            setOpen(false);
                          }}
                        >
                          <span className="truncate">{model.displayName}</span>
                          {model.disabled && model.disabledReason ? (
                            <span className="ml-2 text-xs text-modelpicker-empty-text">{model.disabledReason}</span>
                          ) : null}
                        </Button>
                        {accessory ? <div className="shrink-0">{accessory}</div> : null}
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    );
  }

  return (
    <Select
      aria-label="Select model"
      className={cn('w-full', className)}
      placeholder={placeholder}
      value={selectedModel?.id ?? null}
      onChange={handleChange}
      disabledKeys={disabledKeys}
      isDisabled={disabled}
      variant="secondary"
    >
      <Select.Trigger className="text-xs">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {groupEntries.map(([providerId, providerModels], index) => {
            const sorted = [...providerModels].sort((a, b) =>
              a.displayName.localeCompare(b.displayName),
            );
            const providerName = providerModels[0]!.providerName;

            return (
              <ListBox.Section key={providerId}>
                {index > 0 && <Separator />}
                <Header>{providerName}</Header>
                {sorted.map((model) => (
                  <ListBox.Item key={model.id} id={model.id} textValue={model.displayName}>
                    {model.displayName}
                    {/* `disabledReason` is why the option is greyed out (missing
                        API key, unsupported tools, …). The old <select> dropped
                        it; a listbox item can carry it. */}
                    {model.disabled && model.disabledReason ? (
                      <span className="block text-xs text-modelpicker-empty-text">
                        {model.disabledReason}
                      </span>
                    ) : null}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox.Section>
            );
          })}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
