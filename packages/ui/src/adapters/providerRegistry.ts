// ProviderRegistryAdapter — abstract over src/providers/registry.

import type {
  ProviderConfig,
  ProviderModel,
  ProviderProbeResult,
  ProviderState,
} from '../types/provider';

export interface ProviderRegistryAdapter {
  list(): readonly ProviderState[];
  getConfig(name: string): ProviderConfig | undefined;
  setConfig(name: string, cfg: ProviderConfig): Promise<void>;
  probe(name: string): Promise<ProviderProbeResult>;
  listModels(name: string): Promise<ProviderModel[]>;
  /** Returns an unsubscribe function. */
  subscribe(cb: (states: readonly ProviderState[]) => void): () => void;
}
