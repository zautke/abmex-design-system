# @abmex/ui

## 0.3.0

Image attachments in the composer — presentation only, as always.

### Added

- `PromptComposer` gains `attachments`, `onFiles`, `onRemoveAttachment`. With `onFiles` wired, pasting (Ctrl/Cmd+V) or dropping image files hands the `File`s to the host; the composer claims the paste only when it carried an image, so plain text keeps landing in the textarea. A dashed border marks an active drag. Send is enabled for image-only messages once every chip is `ready`, and blocked while any chip is `pending`.
- `AttachmentStrip` + `ComposerAttachment` — the pending chips (56 px thumbnails, spinner, error ring, hover ×). The host owns ingest, storage and the preview object URLs.
- `imageFilesFromDataTransfer(dt)` — the paste/drop extraction rule (`files` when present, else image `items`; never both), exported for hosts with their own drop zones.
- `useInputBarController().submit({ allowEmpty })` — lets an image-only send through with empty text; nothing is written to prompt history for it.
- `OOCMessageType` gains `'images_dropped'`.

## 0.2.0

Rebuilt on **HeroUI v3**, reorganised into families, and stripped of business logic. The package is now a presentation kit: it renders and it emits intent, and it does nothing else.

### Breaking

- **`@heroui/react` + `@heroui/styles` are new peer dependencies.** Consumers install them and import `@heroui/styles` **before** `@abmex/ui/styles.css` — that order is load-bearing, or HeroUI's stock accent wins the cascade. They are peers (not dependencies) so exactly one copy of React Aria owns focus and portal context; two copies silently break menus, overlays, and focus traps.
- `ButtonGroup` → **`SegmentedControl`**. The old name described HeroUI's layout wrapper, not what this actually is. `ButtonGroupOption` / `ButtonGroupProps` remain as deprecated type aliases.
- **`ChatPane`, `InputBar`, and `ButtonGroup` are removed.** Merlyn was cut over and the originals deleted in the same release, so no consumer was left stranded on them. Replacements: `MessageList` + `ChatBubble` + the `chat/*` rows; `PromptComposer`; `SegmentedControl`.
- `InputBar`'s built-in prompt-history persistence (`promptHistoryStorageKey`, `onStoragePersist`) does **not** carry over to `PromptComposer`, which is fully controlled. History remains available via the headless `useInputBarController` hook, which the consumer opts into.
- `ChatPane` has no drop-in replacement **by design**: it knew how to read a `DbConversationItem` union, which is a persistence shape. Mapping your domain onto `ChatBubble` / `ModelBadgeRow` / `SystemNoticeRow` / `JsonInspectorRow` is now the consumer's job — see `entrypoints/sidepanel/ChatTimeline.tsx` in the Merlyn repo for a worked example.

### Added — the chat elements

Components that existed only as private functions inside `ChatPane.tsx` and `MarkdownRenderer.tsx` are now first-class and reusable:

- `ChatBubble` (now takes `role`/`content` primitives, not a persistence row type), `StreamingCursor`, `StreamingRate`, `MessageList`, `ScrollResumeButton`, `SystemNoticeRow`, `ModelBadgeRow`, `JsonInspectorRow`, `TransportLogPanel`, `ChatEmptyState`, `MessageViewToggle`, `CodeBlock`.
- `useStreamingRate` — the live tokens/sec computation, split out of the view it used to be fused with. The anti-jitter constants (minimum observation window, minimum chars, chars-per-token) came with it.

### Added — settings, previously app-only

`SettingsModal`, `ScrollableTabStrip`, `ProviderSettingsPanel`, `SecretKeyInput`, `JsonConfigEditor`, `McpServerList` / `McpServerRow`, `SecretsList`, `ToolsPanel`, `SettingsSection` / `SettingsField` / `SettingsRow` / `SettingsList`, `CopyCommandCallout`.

`ToolsPanel` is the sharpest example of the boundary: its source wrote Dexie's `appState` table on every keystroke. It is now fully controlled — `values` in, `onChange` out — and where those values live is entirely the consumer's problem.

### Added — conversations, primitives, theme

- `ConversationsDrawer`, `ConversationListItem`, `ConversationSearchField`, `ConversationEmptyState`.
- `StatusDot` and `CopyButton` — extracted from five separate hand-rolled copies (`statusDot` in `SettingsModal`, `statusColor` in `McpSection`, the dot in `ConnectionIndicator`, copy logic in `CodeBlock` and `OllamaOriginsHelper`). `CopyButton` takes an injectable `onCopy`, so it survives non-secure contexts where `navigator.clipboard` is undefined.
- `ThemeEditorButton`, plus `cn` promoted out of `MarkdownRenderer.tsx` into `utils/cn`.

### Accessibility

HeroUI's React Aria foundation fixed real defects rather than merely restyling:

- Conversation rows were `<div onClick>` — unreachable by keyboard, announced as nothing. They are real buttons now.
- The conversation overflow menu was a hand-rolled div with a document-level `mousedown` listener: no menu roles, no arrow keys, no Escape, no focus return. It is now a HeroUI `Dropdown`.
- The drawer gained Escape-to-close and `inert` when off-screen; it previously had no keyboard dismissal and kept its controls in the tab order while hidden.
- `ScrollableTabStrip` kept its bespoke implementation deliberately: its roving tabindex, wheel-to-horizontal-scroll, and edge-scroll behavior are richer than the stock tabs, and a11y was not traded for a logo.

### Styling

`styles.css` gained a **HeroUI semantic token bridge**: ~15 variables map HeroUI's surface (`--accent`, `--surface`, `--danger`, `--field-*`, `--radius`) onto the kit's palette. Reskin the whole library by overriding those — not by forking the ~120 `--color-*` component tokens, which exist for nudging one surface without disturbing the system.

### Notes

- Every prop that replaced a piece of plumbing carries a `// WIRING:` comment naming what the consumer must supply and why. There are 36 of them; together they are the integration contract.
- HeroUI is externalized in the build output (bare `from "@heroui/react"`, zero React Aria bundled).

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
