# @abmex/ui

## 0.1.0

Initial public release. Reusable React UI extracted from Merlyn (the WXT MV3 browser extension).

### Components

- `ErrorBoundary`, `SplashLoader`, `TokenCounter`, `ConnectionIndicator`, `ContextWindowTracker`, `MarkdownRenderer` (+ `cn` helper).
- Layout primitives: `LayoutContainer` plus named region wrappers (`AppRootLayoutContainer`, `HeaderLayoutContainer`, `BodyLayoutContainer`, `ChatColumnLayoutContainer`, `ChatMainLayoutContainer`, `InputLayoutContainer`, `OverlayLayoutContainer`).
- Inputs: `ButtonGroup`, `ModelPicker`, `InputBar` + `InputBarKeyboardHandler`.
- Containers: `ChatPane`, `ConversationsDrawer`.
- Theme surface: `ColorSystem`, `ThemeEditorPanel`.
- `AppFooter` (takes a `version: string` prop).

### Hooks

- `useReadlineKeys`, `useTabIndent` for textarea composers.

### Provider / adapters

- `<MerlynUIProvider value={adapters}>` dependency-injection seam.
- Required adapter ports: `PersistenceAdapter`, `ProviderRegistryAdapter`, `ToolExecutorAdapter`. Optional: `McpAdapter`, `WebContextAdapter`, `KeyboardAdapter`, `ThemeTokenAdapter`, `TransportDebugAdapter`.

### Types

- `Conversation`, `DbConversationItem`, `ChatMessage`, `ModelInfoMessage`, `OOCMessage`, `ConversationItem`, `TokenUsage`, `ModelSnapshot`.
- `ProviderModel`, `ProviderConfig`, `ProviderProbeResult`, `ProviderState`, `ProviderStatus`.
- `Theme`, `ColorFamily`, `ColorHS` + `COLOR_FAMILIES`, `DEFAULT_HS`, `SHADES`, `DEFAULT_THEME`.
- `CanonicalTool`, `CanonicalKernelMessage`, `RuntimeEvent`, `JsonValue`.

### Styles

- `@abmex/ui/styles.css` — single `@theme` token source. Consumer apps import once; Tailwind v4 picks up the package's `@source` directive for component-level utilities.

### Notes

- Strict-ESM consumable: `MarkdownRenderer` uses an explicit prism style file specifier so raw Node ESM resolves the package without `ERR_UNSUPPORTED_DIR_IMPORT`.

Peer dependencies: React 19.2, React DOM 19.2, Tailwind CSS 4.2, `lucide-react` 0.575.
