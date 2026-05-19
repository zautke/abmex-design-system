// Headless ChatPane state. Splits adapter consumption + JSON-view toggle
// out of the view component so external consumers can render the timeline
// + transport debug panel with their own layout.

import { useCallback, useState, useSyncExternalStore } from 'react';
import type { TransportDebugAdapter, TransportDebugEntry } from '../adapters/transportDebug';
import type { DbConversationItem } from '../types/conversation';
import { useMerlynAdaptersOptional } from '../provider';

const EMPTY_ENTRIES: readonly TransportDebugEntry[] = Object.freeze([]);

export interface UseChatPaneControllerInput {
  history: DbConversationItem[];
}

export interface UseChatPaneControllerResult {
  history: DbConversationItem[];
  /** True when the user toggled the verbatim JSON view. */
  isJsonFormat: boolean;
  toggleJsonFormat: () => void;
  /** Snapshot of the optional TransportDebug adapter's entries (frozen). */
  transportEntries: readonly TransportDebugEntry[];
  /** Adapter handle (undefined when no provider is mounted or no adapter supplied). */
  transportAdapter: TransportDebugAdapter | undefined;
  /** Convenience: bound clear() or undefined when adapter doesn't expose one. */
  clearTransport: (() => void) | undefined;
}

function useTransportDebugEntries(
  adapter: TransportDebugAdapter | undefined,
): readonly TransportDebugEntry[] {
  return useSyncExternalStore(
    (cb) => (adapter ? adapter.subscribe(() => cb()) : () => {}),
    () => (adapter ? adapter.entries() : EMPTY_ENTRIES),
    () => (adapter ? adapter.entries() : EMPTY_ENTRIES),
  );
}

/**
 * Controller hook for ChatPane. Wraps adapter consumption + view-toggle state.
 * Scroll-anchor refs stay in the view itself — they're DOM-coupled and pulling
 * them into the hook would force consumers to plumb refs back into JSX.
 */
export function useChatPaneController(
  input: UseChatPaneControllerInput,
): UseChatPaneControllerResult {
  const { history } = input;
  const [isJsonFormat, setIsJsonFormat] = useState(false);

  const adapters = useMerlynAdaptersOptional();
  const transportAdapter = adapters?.transportDebug;
  const transportEntries = useTransportDebugEntries(transportAdapter);

  const toggleJsonFormat = useCallback(() => {
    setIsJsonFormat((v) => !v);
  }, []);

  const clearTransport = transportAdapter?.clear
    ? transportAdapter.clear.bind(transportAdapter)
    : undefined;

  return {
    history,
    isJsonFormat,
    toggleJsonFormat,
    transportEntries,
    transportAdapter,
    clearTransport,
  };
}
