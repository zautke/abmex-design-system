// MerlynUIProvider — single React context delivering adapter ports to all
// extracted UI hooks/components. One mount point, one mock object in tests.
//
// All adapters are OPTIONAL. v0.1.0 only ChatPane's TransportDebug consumer
// runs through the seam; persistence/providers/tools/mcp/webContext/theme
// are defined as ports so consumers can wire them ahead of future controller
// hooks (useConversationsController, useThemeEditorController, etc.) without
// a contract break. Hooks that depend on a specific port read it from the
// bag and degrade gracefully when missing (e.g. ChatPane's debug panel
// hides itself when transportDebug is absent).

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { PersistenceAdapter } from './adapters/persistence';
import type { ProviderRegistryAdapter } from './adapters/providerRegistry';
import type { ToolExecutorAdapter } from './adapters/toolExecutor';
import type { McpAdapter } from './adapters/mcp';
import type { WebContextAdapter } from './adapters/webContext';
import type { ThemeTokenAdapter } from './adapters/theme';
import type { TransportDebugAdapter } from './adapters/transportDebug';

export interface MerlynUIAdapters {
  persistence?: PersistenceAdapter;
  providers?: ProviderRegistryAdapter;
  tools?: ToolExecutorAdapter;
  mcp?: McpAdapter;
  webContext?: WebContextAdapter;
  theme?: ThemeTokenAdapter;
  transportDebug?: TransportDebugAdapter;
}

const MerlynUIContext = createContext<MerlynUIAdapters | null>(null);

export interface MerlynUIProviderProps {
  value: MerlynUIAdapters;
  children: ReactNode;
}

export function MerlynUIProvider({ value, children }: MerlynUIProviderProps) {
  return (
    <MerlynUIContext.Provider value={value}>{children}</MerlynUIContext.Provider>
  );
}

/**
 * Reads the full adapter bag. Throws if called outside a MerlynUIProvider —
 * fast failure beats silent prop-drilling fallbacks.
 */
export function useMerlynAdapters(): MerlynUIAdapters {
  const ctx = useContext(MerlynUIContext);
  if (!ctx) {
    throw new Error(
      '[@merlyn/ui] useMerlynAdapters() called outside <MerlynUIProvider>. Wrap the consuming tree in <MerlynUIProvider value={adapters}>.',
    );
  }
  return ctx;
}

/**
 * Reads the adapter bag without throwing. Useful for components that only need
 * to render differently when no provider is mounted (e.g. Storybook stories).
 */
export function useMerlynAdaptersOptional(): MerlynUIAdapters | null {
  return useContext(MerlynUIContext);
}
