// ToolsPanel — was ToolsTab.
//
// The source owned `useAppStateString` / `useAppStateNumber`, which read and
// wrote Dexie's `appState` table on every keystroke and toggle. Those hooks do
// NOT come with us: the panel is now fully controlled — `values` in, `onChange`
// patches out. Where the values live (Dexie, chrome.storage, a server, a story's
// useState) is entirely the consumer's problem.
//
// What DID come with us are the option constants. Quota tiers, the web-search
// provider list, the copy — that is presentation data, it was tuned here, and
// re-deriving it in every consumer would be the actual duplication.

import { useState, type ReactNode } from 'react';
import { Switch } from '@heroui/react';
import { SecretKeyInput } from './SecretKeyInput';
import { SettingsField, SettingsSection } from './SettingsLayout';
import { SegmentedControl } from '../status/SegmentedControl';
import { cn } from '../../utils/cn';

export type WebSearchProvider = 'auto' | 'tavily' | 'brave' | 'duckduckgo';

export const UNLIMITED_QUOTA = Number.MAX_SAFE_INTEGER;
export const DEFAULT_QUOTA_BYTES = 50 * 1_048_576;

export const QUOTA_OPTIONS: ReadonlyArray<{ label: string; bytes: number }> = [
  { label: '10 MB', bytes: 10 * 1_048_576 },
  { label: '50 MB', bytes: 50 * 1_048_576 },
  { label: '200 MB', bytes: 200 * 1_048_576 },
  { label: '1 GB', bytes: 1024 * 1_048_576 },
  { label: 'Unlimited', bytes: UNLIMITED_QUOTA },
];

export const PROVIDER_OPTIONS: ReadonlyArray<{ id: WebSearchProvider; label: string }> = [
  { id: 'auto', label: 'Auto cascade' },
  { id: 'tavily', label: 'Tavily' },
  { id: 'brave', label: 'Brave' },
  { id: 'duckduckgo', label: 'DuckDuckGo' },
];

export interface ToolsPanelValues {
  tavilyApiKey: string;
  braveApiKey: string;
  webSearchProvider: WebSearchProvider;
  vfsQuotaBytes: number;
  shellEnabled: boolean;
}

export interface ToolsPanelProps {
  values: ToolsPanelValues;
  /**
   * WIRING: a patch of changed fields. The consumer persists them — the storage
   * keys the source used (`tavilyApiKey`, `braveApiKey`, `webSearchProvider`,
   * `vfsQuotaBytes`, `bashRunEnabled`) are app contracts and stay in the app.
   */
  onChange: (patch: Partial<ToolsPanelValues>) => void;

  /** Which key fields are revealed, by field name. */
  revealed?: { tavily?: boolean; brave?: boolean };
  /** WIRING: toggle reveal for one key field. Omit to let the panel manage it. */
  onToggleReveal?: (field: 'tavily' | 'brave') => void;

  /**
   * WIRING: shell-access copy. The default is deliberately generic — the source's
   * text names the Merlyn gateway (`pnpm sync:up`, `MERLYN_GATEWAY_EXEC`), which
   * are Merlyn facts, not kit facts. Pass your own to say them.
   */
  shellDescription?: ReactNode;
  className?: string;
}

export function ToolsPanel({
  values,
  onChange,
  revealed,
  onToggleReveal,
  shellDescription,
  className,
}: ToolsPanelProps) {
  // Reveal is uncontrolled unless the consumer opts in — it is pure porcelain
  // and most consumers do not want to own it.
  const [localReveal, setLocalReveal] = useState<{ tavily: boolean; brave: boolean }>({
    tavily: false,
    brave: false,
  });

  const isRevealed = (field: 'tavily' | 'brave'): boolean =>
    revealed?.[field] ?? localReveal[field];

  const toggleReveal = (field: 'tavily' | 'brave') => {
    if (onToggleReveal) onToggleReveal(field);
    else setLocalReveal((r) => ({ ...r, [field]: !r[field] }));
  };

  return (
    <div className={cn('space-y-6', className)}>
      <SettingsSection
        title="Web search"
        description="API keys for premium providers. Without a key the agent falls back to DuckDuckGo HTML scrape."
      >
        <div className="space-y-3">
          <SecretKeyInput
            label="Tavily API key"
            placeholder="tvly-..."
            value={values.tavilyApiKey}
            onChange={(tavilyApiKey) => onChange({ tavilyApiKey })}
            revealed={isRevealed('tavily')}
            onToggleReveal={() => toggleReveal('tavily')}
            helpLink={{ label: 'tavily.com', url: 'https://tavily.com/' }}
          />

          <SecretKeyInput
            label="Brave Search API key"
            placeholder="BSA..."
            value={values.braveApiKey}
            onChange={(braveApiKey) => onChange({ braveApiKey })}
            revealed={isRevealed('brave')}
            onToggleReveal={() => toggleReveal('brave')}
            helpLink={{ label: 'brave.com/search/api', url: 'https://brave.com/search/api/' }}
          />

          <SettingsField label="Default provider">
            <SegmentedControl
              options={PROVIDER_OPTIONS}
              value={values.webSearchProvider}
              onChange={(webSearchProvider) => onChange({ webSearchProvider })}
              label="Default provider"
            />
          </SettingsField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Virtual filesystem"
        description="Total storage cap for agent-written files. Per-file cap is fixed at 1 MB."
      >
        <SegmentedControl
          options={QUOTA_OPTIONS.map((o) => ({ id: o.bytes, label: o.label }))}
          value={values.vfsQuotaBytes}
          onChange={(vfsQuotaBytes) => onChange({ vfsQuotaBytes })}
          label="Virtual filesystem quota"
        />
      </SettingsSection>

      <SettingsSection
        title="Shell access"
        description={
          shellDescription ??
          'Enables shell command execution through a local gateway service, which must be running.'
        }
      >
        <Switch
          isSelected={values.shellEnabled}
          onChange={(shellEnabled) => onChange({ shellEnabled })}
        >
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-fg">
                {values.shellEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <span className="text-xs text-fg-muted">Reload the extension after toggling.</span>
            </span>
          </Switch.Content>
        </Switch>
      </SettingsSection>
    </div>
  );
}
