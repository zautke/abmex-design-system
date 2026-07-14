// Settings family — presentation only. Nothing in here reads storage, talks to a
// provider registry, polls an MCP client, or touches `browser.*`. Every piece of
// plumbing the source components owned is now a prop or a callback; the `// WIRING:`
// comments throughout the folder are the consumer's integration checklist.

export { SettingsModal } from './SettingsModal';
export type { SettingsModalProps } from './SettingsModal';

export { ScrollableTabStrip } from './ScrollableTabStrip';
export type { ScrollableTabStripProps, ScrollableTabItem } from './ScrollableTabStrip';

export { ProviderSettingsPanel } from './ProviderSettingsPanel';
export type { ProviderSettingsPanelProps, ProviderTestState } from './ProviderSettingsPanel';

export { SecretKeyInput } from './SecretKeyInput';
export type { SecretKeyInputProps, SecretKeyHelpLink } from './SecretKeyInput';

export { JsonConfigEditor } from './JsonConfigEditor';
export type { JsonConfigEditorProps } from './JsonConfigEditor';

export { McpServerList, McpServerRow } from './McpServerList';
export type {
  McpServerListProps,
  McpServerRowProps,
  McpServerView,
  McpServerViewStatus,
} from './McpServerList';

export { SecretsList } from './SecretsList';
export type { SecretsListProps } from './SecretsList';

export {
  ToolsPanel,
  QUOTA_OPTIONS,
  PROVIDER_OPTIONS,
  UNLIMITED_QUOTA,
  DEFAULT_QUOTA_BYTES,
} from './ToolsPanel';
export type { ToolsPanelProps, ToolsPanelValues, WebSearchProvider } from './ToolsPanel';

export { SettingsSection, SettingsField, SettingsRow, SettingsList } from './SettingsLayout';
export type {
  SettingsSectionProps,
  SettingsFieldProps,
  SettingsRowProps,
} from './SettingsLayout';

export { CopyCommandCallout } from './CopyCommandCallout';
export type {
  CopyCommandCalloutProps,
  CalloutCommand,
  CalloutLink,
  CalloutStatus,
} from './CopyCommandCallout';
