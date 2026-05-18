import type { ProviderModel } from '../types/provider';

interface Props {
  models: ProviderModel[];
  selectedModel: ProviderModel | null;
  onModelChange: (model: ProviderModel) => void;
  disabled: boolean;
  className?: string;
}

export function ModelPicker({ models, selectedModel, onModelChange, disabled, className }: Props) {
  const enabledModels = models.filter((model) => !model.disabled);

  if (models.length === 0) {
    return (
      <div
        className={['rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400', className]
          .filter(Boolean)
          .join(' ')}
      >
        {disabled ? 'No connection — configure a provider in Settings…' : 'No models found'}
      </div>
    );
  }

  // Group models by provider
  const groups = models.reduce<Record<string, ProviderModel[]>>((acc, m) => {
    if (!acc[m.providerId]) acc[m.providerId] = [];
    acc[m.providerId]!.push(m);
    return acc;
  }, {});

  const handleChange = (compositeId: string) => {
    const model = models.find((m) => m.id === compositeId);
    if (model) onModelChange(model);
  };

  return (
    <select
      className={['w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60', className]
        .filter(Boolean)
        .join(' ')}
      value={selectedModel?.id ?? ''}
      onChange={(e) => handleChange(e.target.value)}
      disabled={disabled}
      aria-label="Select model"
    >
      {!selectedModel && (
        <option value="" disabled>
          {enabledModels.length > 0 ? 'Select a model…' : 'No usable models — open Settings'}
        </option>
      )}
      {Object.entries(groups).map(([providerId, providerModels]) => {
        const sorted = [...providerModels].sort((a, b) =>
          a.displayName.localeCompare(b.displayName),
        );
        const providerName = providerModels[0]!.providerName;

        return (
          <optgroup key={providerId} label={providerName}>
            {sorted.map((m) => (
              <option key={m.id} value={m.id} disabled={m.disabled}>
                {m.displayName}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}
