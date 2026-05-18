// src/components/ConnectionIndicator.tsx
// Simplified: shows aggregate status across all providers.
// Per-provider config (base URL, API keys) moved to SettingsModal.

interface Props {
  connectedCount: number;
  isLoading: boolean;
  label: string;
}

export function ConnectionIndicator({ connectedCount, isLoading, label }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2" aria-label="Connecting">
        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-xs font-medium text-slate-500">Connecting…</span>
      </div>
    );
  }

  if (connectedCount === 0) {
    return (
      <div className="flex items-center gap-2" aria-label="Disconnected">
        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-rose-500" />
        <span className="text-xs font-medium text-slate-500">No providers connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" aria-label="Connected">
      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-500" />
      <span className="text-xs font-medium text-slate-500">{label}</span>
    </div>
  );
}
