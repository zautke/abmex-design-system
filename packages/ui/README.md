# @abmex/ui

Reusable React **AI-chat UI** components, built on [HeroUI v3](https://heroui.com) — extracted from [Merlyn](../../README.md), a multi-browser WXT MV3 extension that ships a sidepanel chat UI over multiple LLM providers.

This is a **presentation kit**. The components render and emit intent; they do not persist, fetch, poll, or talk to a provider. Where a component used to reach for plumbing, its props now carry a `// WIRING:` comment naming exactly what you must supply — those comments are the integration contract.

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
| primitives | `Text`, `Icon`, `Button`, `IconButton`, `BaseLayoutContainer`, `LayoutContainer`, `StatusDot`, `CopyButton`, `cn` |
| hooks | `useStreamingRate`, `useChatPaneController`, `useInputBarController`, `useReadlineKeys`, `useTabIndent` |

## Foundation primitives

All six foundation components and their named props types are exported from
`@abmex/ui`. Import `@abmex/ui/styles.css` once, or use the Tailwind compilation
alternative above. Defaults use ABMEX semantic tokens.

```tsx
import { Button, Text, BaseLayoutContainer, ComponentDefaultsProvider } from '@abmex/ui';
import type { LayoutContainerProps } from '@abmex/ui';

<ComponentDefaultsProvider defaults={{ Button: { options: { size: 'sm' } } }}>
  <BaseLayoutContainer as="section" options={{ display: 'flex', gap: 12 }}>
    <Text options={{ tone: 'muted' }}>Draft document</Text>
    <Button onAction={() => saveDocument()} options={{ variant: 'outline' }}>
      Save
    </Button>
  </BaseLayoutContainer>
</ComponentDefaultsProvider>;
```

`Text` defaults to `span` (tone/truncation options); `Icon` wraps supplied graphics
with size options and is decorative unless named. `Button` defaults to a native
`button` with `type="button"`; `IconButton` requires `label` and composes Button
with an independently replaceable `icon` part. Supply the desired SVG or icon
component as children. Buttons support size and solid/outline/ghost variants.

`BaseLayoutContainer` supplies configurable structural display, direction, gap,
overflow and containment. `LayoutContainer` preserves its existing clipping and
containment defaults; its optional `region` accepts application-specific names.
Both default to `div`.

Use `as` for target-sensitive native props and React 19 refs. `slots.root` replaces
the renderer and receives `as`; custom renderers must honor it and forward props
and refs. Custom interactive renderers own their semantics; `useButtonBehavior`
is available for independent cancellation/disabled/keyboard behavior.

`slotProps.root`, `classNames.root` and `styles.root` accept static values or
typed-state callbacks. IconButton additionally supports `slots.icon` and the
matching icon configuration/styling channels. Nested provider defaults merge
with explicit instance overrides: later recognized Tailwind utilities win,
styles merge by property, refs compose, and later event handlers run first and
can cancel earlier/default actions with `preventDefault()`.

Set disabled state on the component or static root props. Dynamic root callbacks
consume that state and cannot redefine `disabled`/`aria-disabled`: types reject
those keys and runtime ignores them from JavaScript/casts. `onAction` follows
uncancelled consumer click handlers; disabled controls suppress actions.

`unstyled` removes visual defaults while retaining semantics and interaction.
Layout min-size/display/flow structure and LayoutContainer's compatibility
containment/clipping remain structural defaults. These primitives own no durable
state and do not persist application state.

`@abmex/ui/primitive-manifest.json` and `@abmex/ui/primitive-options.schema.json`
describe the six components. The schema covers serializable finite options;
React values, callbacks, refs and CSS-valued options remain TypeScript-owned.
The repository's `packages/ui/demo/main.tsx` shows toolbar and navigation/content
compositions using the public package imports.

## Theming

The stylesheet ships a **HeroUI semantic token bridge** for existing component families. Foundation primitives use ABMEX roles such as `--primary`, `--primary-fg`, `--fg`, `--border` and `--focus`; use `<Button options={{ variant: 'solid' }}>` for the default action appearance.

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
