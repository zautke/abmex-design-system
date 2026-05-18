// @merlyn/ui — public API.

// Components (S1).
export { ErrorBoundary } from './components/ErrorBoundary';
export { SplashLoader } from './components/SplashLoader';
export { TokenCounter } from './components/TokenCounter';
export { ConnectionIndicator } from './components/ConnectionIndicator';
export { ContextWindowTracker } from './components/ContextWindowTracker';
export { MarkdownRenderer, cn } from './components/MarkdownRenderer';

export {
  LayoutContainer,
  AppRootLayoutContainer,
  HeaderLayoutContainer,
  BodyLayoutContainer,
  ChatColumnLayoutContainer,
  ChatMainLayoutContainer,
  InputLayoutContainer,
  OverlayLayoutContainer,
} from './components/layout/LayoutContainer';

export { ButtonGroup } from './components/ui/ButtonGroup';
export type { ButtonGroupOption, ButtonGroupProps } from './components/ui/ButtonGroup';

export { AppFooter } from './components/AppFooter';

export { ModelPicker } from './components/ModelPicker';

// Adapters + Provider (S2).
export {
  MerlynUIProvider,
  useMerlynAdapters,
  useMerlynAdaptersOptional,
} from './provider';
export type { MerlynUIAdapters, MerlynUIProviderProps } from './provider';

export type { PersistenceAdapter } from './adapters/persistence';
export type { ProviderRegistryAdapter } from './adapters/providerRegistry';
export type { ToolExecutorAdapter } from './adapters/toolExecutor';
export type {
  McpAdapter,
  McpServerInfo,
  McpServerStatus,
} from './adapters/mcp';
export type { WebContextAdapter, WebPageContent } from './adapters/webContext';
export type { KeyboardAdapter } from './adapters/keyboard';
export type { ThemeTokenAdapter } from './adapters/theme';
export type {
  TransportDebugAdapter,
  TransportDebugEntry,
} from './adapters/transportDebug';

// Types.
export type {
  ChatRole,
  TokenUsage,
  ModelSnapshot,
  ChatMessage,
  ModelInfoMessage,
  OOCMessage,
  OOCMessageType,
  ConversationItem,
  Conversation,
  ConversationTitleSource,
  DbConversationItem,
} from './types/conversation';

export type {
  ProviderModel,
  ProviderStatus,
  ProviderConfig,
  ProviderProbeResult,
  ProviderState,
} from './types/provider';

export type { ColorFamily, ColorHS, Theme } from './types/theme';

export type {
  JsonValue,
  CanonicalTool,
  CanonicalToolCall,
  CanonicalKernelMessage,
  RuntimeEvent,
} from './types/kernel';
