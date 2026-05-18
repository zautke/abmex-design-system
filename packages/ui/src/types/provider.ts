// Provider types. Decoupled from src/providers — no transport, no SDK refs.

export interface ProviderModel {
  /** Composite key: "ollama::llama3.2", "anthropic::claude-opus-4-7" */
  id: string;
  providerId: string;
  providerName: string;
  modelId: string;
  displayName: string;
  size?: number;
  isCloud?: boolean;
  remoteHost?: string;
  remoteModel?: string;
  preferredBaseUrl?: string;
  disabled?: boolean;
  disabledReason?: string;
  contextWindowTokens?: number;
}

export type ProviderStatus = 'unconfigured' | 'probing' | 'connected' | 'disconnected';

export interface ProviderConfig {
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
}

export interface ProviderProbeResult {
  status: 'connected' | 'disconnected' | 'unconfigured';
  models: ProviderModel[];
  error?: string;
  warning?: string;
}

/**
 * Per-provider state as seen by UI: descriptive metadata + last probe outcome.
 * Mirrors the runtime ProviderState shape that components read.
 */
export interface ProviderState {
  id: string;
  name: string;
  requiresApiKey: boolean;
  supportsBaseUrl: boolean;
  defaultBaseUrl?: string;
  supportsTools: boolean;
  status: ProviderStatus;
  config: ProviderConfig;
  models: ProviderModel[];
  error?: string;
  warning?: string;
}
