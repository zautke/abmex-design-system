# @abmex/ui

Reusable React UI components, including AI-chat families built on [HeroUI v3](https://heroui.com) and independent ABMEX primitives and Sidebar parts. Chat families originate in [Merlyn](../../README.md); the [Sidebar guide](./Sidebar.md) covers public parts, working compositions, styling and state ownership.

Chat components render and emit intent rather than owning provider plumbing. Their `// WIRING:` comments identify host integrations. Sidebar state adds optional durable preferences and replaceable storage; its demos provide explicit local fixtures and accept host search/navigation adapters. No application-specific provider is required by the reusable Sidebar library.

## Install

```bash
pnpm add @abmex/ui
# Peer dependencies:
pnpm add react react-dom lucide-react @heroui/react
```

HeroUI is a **peer**, not a dependency, on purpose: two copies of React Aria in one bundle means two focus/portal contexts, and menus and overlays break in ways that are miserable to debug.

## Use

```tsx
import {
  MessageList,
  ChatBubble,
  PromptComposer,
  ModelPicker,
  SegmentedControl,
} from '@abmex/ui';
```

```css
@import '@abmex/ui/styles.css';
```

`styles.css` is compiled and includes the required HeroUI styles. No Tailwind
compiler or separate HeroUI stylesheet is needed. Do not import both stylesheets.

For consumers integrating their own Tailwind v4 compilation, install the optional
`tailwindcss` and `@heroui/styles` peers and use this alternative:

```css
@import '@heroui/styles';
@import '@abmex/ui/tailwind.css';
@source '../src';
```

Family entrypoints such as `@abmex/ui/components/chat` and `@abmex/ui/tabs`
allow narrower imports. Sortable tabs require the optional `@dnd-kit` peers and
are available separately at `@abmex/ui/tabs/sortable`.

Everything is driven by props and callbacks, so a consumer with no database, no extension APIs, and no provider registry can mount the entire surface from plain `useState`. See `examples/consumer/src/App.tsx`, which does exactly that.

`<MerlynUIProvider value={adapters}>` remains available for the components that genuinely want an injected port (theme tokens, transport debug), but most of the kit no longer needs it.

## Families

| Family | Components |
|---|---|
| `chat` | `MessageList`, `ChatBubble`, `StreamingCursor`, `StreamingRate`, `ScrollResumeButton`, `SystemNoticeRow`, `ModelBadgeRow`, `JsonInspectorRow`, `TransportLogPanel`, `ChatEmptyState`, `MessageViewToggle`, `MarkdownRenderer`, `CodeBlock` |
| `composer` | `PromptComposer`, `SendButton`, `StopButton`, `InputBarKeyboardHandler` |
| `status` | `ModelPicker`, `ConnectionIndicator`, `ContextWindowTracker`, `TokenCounter`, `SegmentedControl`, `SplashLoader`, `AppFooter` |
| `conversations` | `ConversationsDrawer`, `ConversationListItem`, `ConversationSearchField`, `ConversationEmptyState` |
| `settings` | `SettingsModal`, `ScrollableTabStrip`, `ProviderSettingsPanel`, `SecretKeyInput`, `JsonConfigEditor`, `McpServerList`, `SecretsList`, `ToolsPanel`, `SettingsSection`/`Field`/`Row`/`List`, `CopyCommandCallout` |
| `theme` | `ThemeEditorPanel`, `ColorSystem`, `ThemeEditorButton` |
| primitives | `StatusDot`, `CopyButton`, `cn` |
| hooks | `useStreamingRate`, `useChatPaneController`, `useInputBarController`, `useReadlineKeys`, `useTabIndent` |

## Theming

The stylesheet ships a **HeroUI semantic token bridge**: ~15 variables map HeroUI's surface onto this kit's palette, so a bare `<Button variant="primary">` already looks like the chat skin.

To reskin the library, override those:

```css
:root {
  --accent: oklch(0.62 0.19 254);
  --accent-foreground: white;
  --surface: white;
  --danger: crimson;
}
```

Do **not** fork the ~120 `--color-*` component tokens (`--color-chat-bubble-user-bg`, …). Those exist so you can nudge one surface without disturbing the system — reach for them second, not first.

## Module format

**ESM-only.** `"type": "module"`, `formats: ['es']`. Targets Node ≥ 18 and modern bundlers (Vite ≥ 5, Webpack 5 + native ESM, Rolldown, esbuild). CommonJS consumers (Jest without `--experimental-vm-modules`, Next.js `pages/api`, classic `require`) will hit `ERR_REQUIRE_ESM`.

## Stack

React 19.2 · HeroUI v3 (React Aria) · Tailwind v4 · TypeScript 5.9 (strict + `noUncheckedIndexedAccess` + `verbatimModuleSyntax`) · Vite 7 library mode · `vite-plugin-dts`.

## Peer dependencies

| Peer | Range |
|---|---|
| `react` | `^19.2.0` |
| `react-dom` | `^19.2.0` |
| `tailwindcss` (optional compiler integration) | `^4.3.0` |
| `lucide-react` | `^0.575.0` |
| `@heroui/react` | `^3.2.2` |
| `@heroui/styles` (optional compiler integration) | `^3.2.2` |
