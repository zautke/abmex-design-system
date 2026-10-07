# Native component delivery matrix

The Swift package targets iOS 15 and macOS 12. `AbmexTokens` contains generated catalog values; `AbmexUI` consumes them without duplicated color literals. Native views use system text styles for Dynamic Type. Consumers provide content, bindings, actions and application services. No browser, storage, speech, network or model controller enters the design system.

This is an initial native foundation, not full React/native parity. Pending rows remain required migration work. Merlyn's native host renders a WKWebView: use the web package inside that view. VoiceCommandUI is a separate SwiftUI proof consumer; its controller stays in its existing package.

| React exported family / surface | Native current status | Consumer callbacks / state | Tests still required for parity |
| --- | --- | --- | --- |
| Chat: ChatBubble, MessageList, MarkdownRenderer, CodeBlock, JsonInspectorRow, ChatEmptyState, MessageViewToggle, ModelBadgeRow, ScrollResumeButton, StreamingCursor, StreamingRate, TransportLogPanel | Pending. Generic `AbmexNotice` can present notices; no chat renderer exists. | Messages, streaming state, copy, retry, scroll resume, view selection, transport entries | Markdown/code rendering, streaming updates, scroll anchoring, long content, copy, accessibility |
| Chat: SystemNoticeRow | Partial: `AbmexNotice<Content, Actions>` and `AbmexTone` implement semantic notice presentation. | Content builder and optional actions builder; caller owns dismiss action | Error/success/info screenshots, dismissal interaction, VoiceOver reading order |
| Composer: PromptComposer, AttachmentStrip, SendButton, StopButton, InputBarKeyboardHandler | Pending. `AbmexButtonStyle` styles native buttons only. | Draft binding, submit/stop, attachment add/remove, keyboard commands | Multiline edit, composition input, submit/stop, attachments, keyboard focus |
| Conversations: ConversationsDrawer, ConversationListItem, ConversationSearchField, ConversationEmptyState | Pending | Selection, query binding, create, rename, delete, dismissal | Filtering, selection, rename/delete confirmation, large lists, keyboard navigation |
| Settings: SettingsLayout, SettingsModal, ProviderSettingsPanel, McpServerList, ToolsPanel, SecretsList, SecretKeyInput, JsonConfigEditor, CopyCommandCallout, ScrollableTabStrip | Pending | Configuration bindings, validate/save/cancel, provider probe, tool/server toggle, copy | Validation, save/cancel, focus, list edits, scrolling, platform presentation |
| Status: ConnectionIndicator | Partial: `AbmexStatus<Label>` supports semantic text and symbol status; no provider-specific indicator. | Caller supplies label and tone | Connection state mapping, text alternatives, long labels |
| Status: AppFooter, ContextWindowTracker, ModelPicker, SegmentedControl, SplashLoader, TokenCounter | Pending | Model selection, context usage, loading state, segment binding | Selection, overflow, loading, usage math, accessibility |
| Layout: LayoutContainer, AppRootLayoutContainer, HeaderLayoutContainer, BodyLayoutContainer, ChatColumnLayoutContainer, ChatMainLayoutContainer, InputLayoutContainer, OverlayLayoutContainer | Partial: `AbmexSurface<Content>` supports generic semantic containers. App layouts pending. | Content builder; host owns presentation and placement | Compact/regular layouts, safe areas, window resizing, overlay focus |
| Theme: ColorSystem, ThemeEditorButton, ThemeEditorPanel | Partial: `AbmexTheme` environment resolves generated semantic colors by system scheme, with scoped overrides. Editor/palette controls pending. | Theme value, color/dimension/duration overrides; editor save/reset pending | Editor interactions, contrast, persistence adapter, mode switching screenshots |
| Theme toggle: ThemeToggle, ThemeTransitionSlider and controller/pre-paint helpers | Partial: native system color scheme supported; `AbmexTheme.animation(_:reduceMotion:)` supports opt-out. Toggle/transition controls pending. | Preferred color scheme, motion token and environment Reduce Motion setting | User preference binding, transition interruption, reduced motion |
| Tabs: Tabs, Switcher, Sortable exports | Pending | Selection, item order, close/add/reorder callbacks | Keyboard selection, drag reorder, overflow, focus restoration |
| Primitive: StatusDot | Partial: `AbmexStatus` deliberately includes text and symbol. Standalone dot pending. | Tone and accessible label | Every tone, noncolor indication, assistive technology |
| Primitive: CopyButton | Pending | Copy action and completion/error state; host owns pasteboard | Copy success/failure, repeated activation, announcements |
| Primitive: ButtonGroup | Partial: native `Button` + `AbmexButtonStyle` supports primary/secondary/destructive/disabled/pressed appearance. Group layout pending. | Native action closure and disabled state | Action delivery, keyboard activation, focus ring, touch targets, grouped layout |
| Resilience: ErrorBoundary | Pending native error presentation contract; SwiftUI does not catch render errors like React. | Host error value and recovery closure | Recoverable failure rendering and recovery action |
| Hooks, adapters and domain types | Pending native domain API where required; application controllers stay outside design system. | Host owns persistence, provider registry, tool execution, web context, transport debug | Consumer contract tests and dependency boundary checks |

## Delivered contract tests

`tests/AbmexUITests/AbmexThemeTests.swift` checks both color modes, override isolation, environment assignment, required token coverage and reduced-motion suppression. A macOS hosting test composes surfaces, status, optional notice actions and native buttons at an accessibility text size. These tests do not substitute for keyboard, VoiceOver, visual or device interaction tests.

## VoiceCommand composition seam

The host can render `AbmexStatus(tone: .success) { Text(statusText) }` inside `AbmexSurface(role: "overlay")`, then `AbmexNotice(tone: .danger)` with a caller-supplied dismiss `Button` for an error. Transcript, countdown, listening phase and error dismissal remain consumer state. Apply `.abmexTheme(theme)` at the subtree root. If animating phase changes, read `accessibilityReduceMotion` and pass it to `theme.animation` using a duration key in the generated catalog. No animation is required by the primitives.

Native token dimensions use points. System typography intentionally follows Dynamic Type; web font assets are not installed by this package. Custom role names must exist either in the generated catalog or in that mode's theme overrides; missing required roles fail explicitly instead of silently changing appearance.
