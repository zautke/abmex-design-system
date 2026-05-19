// Headless ChatPane state. Splits adapter consumption + JSON-view toggle
// out of the view component so external consumers can render the timeline
// + transport debug panel with their own layout.

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
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
  /**
   * Snapshot of the optional TransportDebug adapter's entries. Treated as
   * immutable per the adapter contract — `TransportDebugAdapter.entries()`
   * MUST return a new reference (or stable one between subscribe callbacks)
   * for `useSyncExternalStore` to detect changes. The included buffer
   * implementation enforces this; third-party adapters must do the same.
   */
  transportEntries: readonly TransportDebugEntry[];
  /** Adapter handle (undefined when no provider is mounted or no adapter supplied). */
  transportAdapter: TransportDebugAdapter | undefined;
  /** Convenience: bound clear() or undefined when adapter doesn't expose one. */
  clearTransport: (() => void) | undefined;
}

function useTransportDebugEntries(
  adapter: TransportDebugAdapter | undefined,
): readonly TransportDebugEntry[] {
  // Defense-in-depth: cache the latest snapshot so a naive adapter that
  // returns a fresh `[]` (or any new array) on every `entries()` call cannot
  // induce an infinite render loop via useSyncExternalStore. We invalidate
  // the cache only when the adapter's subscribe callback fires. This honors
  // the React store contract (identity-stable snapshot between updates)
  // even when third-party adapters do not.
  const snapshotRef = useRef<readonly TransportDebugEntry[]>(EMPTY_ENTRIES);
  const dirtyRef = useRef(true);

  const { subscribe, getSnapshot } = useMemo(() => {
    // Adapter swap: force the next getSnapshot read to pull from the new
    // adapter rather than returning the stale cached snapshot.
    dirtyRef.current = true;
    return {
      subscribe(cb: () => void) {
        if (!adapter) return () => {};
        return adapter.subscribe(() => {
          dirtyRef.current = true;
          cb();
        });
      },
      getSnapshot(): readonly TransportDebugEntry[] {
        if (!adapter) return EMPTY_ENTRIES;
        if (dirtyRef.current) {
          snapshotRef.current = adapter.entries();
          dirtyRef.current = false;
        }
        return snapshotRef.current;
      },
    };
  }, [adapter]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
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
