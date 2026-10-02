// ProviderSettingsPanel — was `ProviderTab` in the app's SettingsModal.
//
// The source component reached into the provider registry, ran the connectivity
// probe itself, interpreted the probe result, and owned the 4s "flash the
// outcome then go idle" timer. None of that crosses the boundary. This panel
// renders `state`, keeps the two text drafts it needs to support commit-on-blur,
// and emits intent (`onConfigChange`, `onTest`). Everything else is a prop.

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Button, Input, Label, Switch, TextField } from '@heroui/react';
import { CheckCircle, Loader2, TriangleAlert, XCircle } from 'lucide-react';
import { StatusDot, type StatusTone } from '../../primitives/StatusDot';
import type { ProviderConfig, ProviderState, ProviderStatus } from '../../types/provider';
import { SecretKeyInput, type SecretKeyHelpLink } from './SecretKeyInput';
import { cn } from '../../utils/cn';

export type ProviderTestState = 'idle' | 'testing' | 'success' | 'warning' | 'error';

export interface ProviderSettingsPanelProps {
  state: ProviderState;
  /** Emitted on blur for text fields, immediately for the enable switch. */
  onConfigChange: (patch: Partial<ProviderConfig>) => void;
  /**
   * WIRING: run the connectivity probe. The panel does not know how — the
   * consumer probes and reflects the outcome back through `testState` /
   * `testMessage`, including resetting them to 'idle' when the flash expires.
   */
  onTest: () => void;
  testState: ProviderTestState;
  /** Error or warning text for a failed/degraded test. Shown only in those states. */
  testMessage?: string | null;

  /**
   * WIRING: whether to show the API-key field. Defaults to `state.requiresApiKey`.
   * The app overrides this to `true` for Ollama, where a key is optional but
   * accepted — that "optional for local hosts" nuance is provider knowledge and
   * stays in the app.
   */
  showApiKey?: boolean;
  /** WIRING: label override, e.g. "API Key (optional for local hosts)". */
  apiKeyLabel?: string;
  /** WIRING: e.g. "sk-…", "ollama_…", or "From .env.local" when a seed exists. */
  apiKeyPlaceholder?: string;
  /** WIRING: per-provider console URL. The panel has no link table. */
  apiKeyHelpLink?: SecretKeyHelpLink;
  /**
   * WIRING: provider-specific callouts (the Ollama base-URL explainer, a
   * CopyCommandCallout for a CORS 403). Rendered under the URL field. Keeping
   * this a slot is what lets the panel stay ignorant of any one provider.
   */
  children?: ReactNode;
  className?: string;
}

function statusTone(status: ProviderStatus, warning?: string): StatusTone {
  if (status === 'connected') return warning ? 'warning' : 'success';
  if (status === 'probing') return 'warning';
  if (status === 'disconnected') return 'danger';
  return 'neutral';
}

function statusText(state: ProviderState): string {
  const modelCount = state.models.length;
  if (state.status === 'connected') {
    return state.warning
      ? `Connected with warning — ${state.warning}`
      : `Connected — ${modelCount} model${modelCount !== 1 ? 's' : ''}`;
  }
  if (state.status === 'probing') return 'Connecting…';
  if (state.status === 'unconfigured') {
    return `Not configured${state.error ? `: ${state.error}` : ''}`;
  }
  return `Disconnected${state.error ? `: ${state.error}` : ''}`;
}

function TestIcon({ testState }: { testState: ProviderTestState }) {
  if (testState === 'testing') return <Loader2 size={11} className="animate-spin" />;
  if (testState === 'success') return <CheckCircle size={11} className="text-conn-connected" />;
  if (testState === 'warning') return <TriangleAlert size={11} className="text-conn-probing" />;
  if (testState === 'error') return <XCircle size={11} className="text-conn-disconnected" />;
  return null;
}

export function ProviderSettingsPanel({
  state,
  onConfigChange,
  onTest,
  testState,
  testMessage,
  showApiKey,
  apiKeyLabel = 'API Key',
  apiKeyPlaceholder,
  apiKeyHelpLink,
  children,
  className,
}: ProviderSettingsPanelProps) {
  const defaultBaseUrl = state.defaultBaseUrl ?? '';
  const [apiKeyDraft, setApiKeyDraft] = useState(state.config.apiKey ?? '');
  const [baseUrlDraft, setBaseUrlDraft] = useState(state.config.baseUrl ?? defaultBaseUrl);
  const [revealed, setRevealed] = useState(false);

  // The config can change under us (another surface saved, a probe rewrote the
  // URL). Drafts follow the source of truth rather than stranding stale text.
  useEffect(() => {
    setApiKeyDraft(state.config.apiKey ?? '');
  }, [state.config.apiKey]);

  useEffect(() => {
    setBaseUrlDraft(state.config.baseUrl ?? defaultBaseUrl);
  }, [state.config.baseUrl, defaultBaseUrl]);

  const enabled = state.config.enabled;

  const handleApiKeyBlur = useCallback(() => {
    const trimmed = apiKeyDraft.trim();
    if (trimmed !== (state.config.apiKey ?? '')) {
      onConfigChange({ apiKey: trimmed || undefined });
    }
  }, [apiKeyDraft, state.config.apiKey, onConfigChange]);

  const handleBaseUrlBlur = useCallback(() => {
    const trimmed = baseUrlDraft.trim();
    if (trimmed !== (state.config.baseUrl ?? '')) {
      onConfigChange({ baseUrl: trimmed || undefined });
    }
  }, [baseUrlDraft, state.config.baseUrl, onConfigChange]);

  const showKeyField = showApiKey ?? state.requiresApiKey;

  return (
    <div className={cn('space-y-4', className)}>
      <Switch
        isSelected={enabled}
        onChange={(isSelected) => onConfigChange({ enabled: isSelected })}
      >
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <span className="text-sm font-medium text-ph-fg">Enable {state.name}</span>
        </Switch.Content>
      </Switch>

      {state.supportsBaseUrl ? (
        <TextField
          className="w-full"
          value={baseUrlDraft}
          onChange={setBaseUrlDraft}
          isDisabled={!enabled}
          aria-label={`${state.name} server URL`}
        >
          <Label className="text-xs font-medium text-ph-fg">Server URL</Label>
          <Input
            className="w-full text-xs"
            spellCheck={false}
            placeholder={defaultBaseUrl || undefined}
            onBlur={handleBaseUrlBlur}
          />
        </TextField>
      ) : null}

      {children}

      {showKeyField ? (
        <SecretKeyInput
          label={apiKeyLabel}
          placeholder={apiKeyPlaceholder}
          value={apiKeyDraft}
          onChange={setApiKeyDraft}
          onBlur={handleApiKeyBlur}
          revealed={revealed}
          onToggleReveal={() => setRevealed((v) => !v)}
          helpLink={apiKeyHelpLink}
          isDisabled={!enabled}
        />
      ) : null}

      <div className="flex items-center justify-between border-t border-ph-border pt-1">
        <div className="flex min-w-0 items-center gap-2">
          <StatusDot
            tone={statusTone(state.status, state.warning)}
            pulse={state.status === 'probing'}
          />
          <span className="truncate text-xs text-ph-fg-muted">{statusText(state)}</span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="ml-2 flex-shrink-0 gap-1.5"
          aria-label={`Test ${state.name}`}
          isDisabled={!enabled || testState === 'testing'}
          onPress={onTest}
        >
          <TestIcon testState={testState} />
          Test
        </Button>
      </div>

      {(testState === 'error' || testState === 'warning') && testMessage ? (
        <p
          className={cn(
            'truncate text-xs',
            testState === 'warning' ? 'text-conn-probing' : 'text-conn-disconnected',
          )}
        >
          {testMessage}
        </p>
      ) : null}
    </div>
  );
}
