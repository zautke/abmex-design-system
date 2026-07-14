// @abmex/ui — public API.
//
// v0.2.0 reorganises the surface into families. Presentation lives in the
// package; persistence, transports, provider registries, and browser APIs do
// not. Where a component previously reached for one of those, its props now
// carry a `// WIRING:` note naming what the consumer must supply.
//
// HeroUI v3 (`@heroui/react` + `@heroui/styles`) is a PEER dependency: the app
// installs it and imports `@heroui/styles` BEFORE `@abmex/ui/styles.css`, so a
// single copy of React Aria owns focus and portal context.

// ── Families ───────────────────────────────────────────────────────────────
export * from './components/chat';
export * from './components/composer';
export * from './components/status';
export * from './components/conversations';
export * from './components/settings';
export * from './components/theme';

// ── Primitives ─────────────────────────────────────────────────────────────
export { StatusDot } from './primitives/StatusDot';
export type { StatusDotProps, StatusTone } from './primitives/StatusDot';

export { CopyButton } from './primitives/CopyButton';
export type { CopyButtonProps } from './primitives/CopyButton';

export { cn } from './utils/cn';

// ── Layout + resilience ────────────────────────────────────────────────────
export { ErrorBoundary } from './components/ErrorBoundary';

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

// ── Deprecated (the v0.1 surface) ──────────────────────────────────────────
// Kept so the Merlyn sidepanel keeps compiling until it is rewired; removed in
// the next major. Each has a v0.2 replacement:
//
//   ChatPane    → MessageList + ChatBubble + the chat/* rows
//   InputBar    → PromptComposer (controlled; persistence is no longer built in)
//   ButtonGroup → SegmentedControl
export { ChatPane } from './components/ChatPane';
export { InputBar } from './components/InputBar';
export { ButtonGroup } from './components/ui/ButtonGroup';

// ── Hooks ──────────────────────────────────────────────────────────────────
export { useReadlineKeys } from './hooks/useReadlineKeys';
export { useTabIndent } from './hooks/useTabIndent';
export type { TabIndentSpaces } from './hooks/useTabIndent';

export { useChatPaneController } from './hooks/useChatPaneController';
export type {
  UseChatPaneControllerInput,
  UseChatPaneControllerResult,
} from './hooks/useChatPaneController';

export { useInputBarController } from './hooks/useInputBarController';
export type {
  UseInputBarControllerInput,
  UseInputBarControllerResult,
} from './hooks/useInputBarController';

// ── Provider + adapters ────────────────────────────────────────────────────
export {
  MerlynUIProvider,
  useMerlynAdapters,
  useMerlynAdaptersOptional,
} from './provider';
export type { MerlynUIAdapters, MerlynUIProviderProps } from './provider';

export type { PersistenceAdapter } from './adapters/persistence';
export type { ProviderRegistryAdapter } from './adapters/providerRegistry';
export type { ToolExecutorAdapter } from './adapters/toolExecutor';
export type { McpAdapter, McpServerInfo, McpServerStatus } from './adapters/mcp';
export type { WebContextAdapter, WebPageContent } from './adapters/webContext';
export type { ThemeTokenAdapter } from './adapters/theme';
export type {
  TransportDebugAdapter,
  TransportDebugEntry,
} from './adapters/transportDebug';

// ── Types ──────────────────────────────────────────────────────────────────
export {
  COLOR_FAMILIES,
  DEFAULT_HS,
  DEFAULT_THEME,
  SHADES,
} from './types/theme';

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
