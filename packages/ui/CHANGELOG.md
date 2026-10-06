# @abmex/ui

## 0.5.0

The theme editor is one tier with one picker, authored in OKLCH, and every control is bound.

### Changed (breaking)

- **The `ph-` prefix is gone** (kb decision 2026-10-05 #2: every theme uses the same prefix-free token names). Roles are `--bg`, `--surface`, `--primary`, `--fg-muted`, … (were `--ph-*`). Utilities are `bg-surface`, `text-fg-muted`, `border-border`, `shadow-overlay`, `rounded-base` (radius), `ease-base` (were `bg-ph-surface`, …, `rounded-ph`, `ease-ph`). Tailwind keys are `--color-<role>`, `--shadow-<role>`, `--radius-base`, `--ease-base`; `--font-sans` / `--font-mono` are Tailwind's own keys, overridden by the theme's unlayered `:root` values. The splash keyframes are `splash-spin`. The generator (`build/build.py`) emits the new names and wraps the roles in `theme-editor: roles` markers, which `parseSemanticVariables` uses in place of the prefix. The HeroUI and shadcn adapters drop their identity mappings (`--surface: var(--surface)` would be a cycle); the theme defines those names directly. Token values are unchanged (contrast audit identical: 170 pairs, 0 failing).
- `Theme.colors` is `Record<ColorFamily, ColorLCH>` (`{ l, c, h }`, OKLCH) instead of hue/saturation. Each family is an anchor equal to the dark-twin value of the Phosphor role it drives (`DEFAULT_LCH`): slate → `--ph-fg-muted` (+ `--ph-border`, `--ph-border-strong`), teal → `--ph-primary` (+ `-hover`, `-soft`, `-soft-fg`, `--ph-focus`), rose → `--ph-danger*`, emerald → `--ph-success*`, amber → `--ph-warning*`. `ColorHS` / `DEFAULT_HS` remain only as deprecated migration inputs.
- `ThemeEditorPanel`: the hue/saturation slider cards are gone. Families and tokens share one row (text field, swatch → the full `ColorSystem` picker with HEX / RGB / HSL / OKLCH, CLEAR). Prop `handleRawChange(family, 'h'|'s', n)` is replaced by `handleFamilyChange(family, ColorLCH)`; new optional `onResetAll` performs Reset All as one write.
- `ColorSystem` holds and emits OKLCH (`oklch(L% C H)`), and ignores the echo of its own last emission, so L/C/H moves no longer quantise to 8-bit sRGB or snap back.

### Added

- `themeStylesheet(theme)`, `familyRoleVars`, `deriveRole`, `normalizeFamilyColors`, `formatOklch`, `parseColorToLch`, `FAMILY_ROLE_DEFAULTS`, `FAMILY_ANCHOR_ROLE`. A family move is transferred onto each role per twin (lightness offset, chroma ratio, hue offset, gamut-mapped to sRGB); the dark-twin anchor role becomes the pick exactly. The stylesheet re-declares roles on Phosphor's own twin selectors, so a pick never leaks into a nested `.light` scope the way an inline style on `<html>` did.

- `ROLE_VAR_PREFIX` / `roleVar(role)`: the palette tables are keyed by prefix-free role names (`primary`, `fg-muted`, …); `roleVar` is the only place a role becomes a custom property. Phosphor still ships `--ph-<role>`; the `@abmex/themes` extraction drops the prefix and changes only this constant.

### Changed

- Victor Mono is one step smaller everywhere and two steps smaller in the theme editor (user directive 2026-10-05). New size steps below Tailwind's `xs` (12px): `text-2xs` 11px/16px and `text-3xs` 10px/14px (`@theme`). Mono `text-xs` → `text-2xs`, theme editor and ColorSystem mono → `text-3xs`, code blocks 13px → 12px, inline code 0.85em → 0.78em, splash text 12px → 11px.

### Fixed

- Token pickers open on the token's live value (family edits included), not its stylesheet default.
- Out-of-sRGB picks are mapped before they are emitted. The picked anchor role is clipped per channel (`clipToSrgb`), the way Chrome paints it, so it matches the swatch and the HEX field. Derived roles are chroma-reduced (`toSrgbGamut`). `contrastRatio` measures both colors as painted (sRGB-clipped), so the fill-ink decision holds on screen.
- Palette rows: the truncated "drives --ph-…, …" line is a "drives N roles" disclosure listing every bound role (fill ink included) with its live swatch.
- Generated fill text (`--ph-primary-fg`, `-danger-fg`, `-success-fg`, `-warning-fg`) always clears WCAG 4.5:1. The tinted twin inks are used when one of them passes; for mid-luminance fills such as `#777` that neither tinted ink can serve, pure black or white is used (`fillInk`). The decision is made on the emitted (rounded) values, so a fill on the boundary cannot round below 4.5:1.

### Added

- `tabs` family (`Tabs` compound, no HeroUI / React Aria import): `Tabs` root (controlled/uncontrolled `value`, `orientation`), `Tabs.SheetList` (direction B: flexible-width folder tabs, overflow arrows, `after` slot), `Tabs.Rail` + `Tabs.RailGroup` (direction D: 280px vertical list, filter field, collapse), `Tabs.Tab` with `.Label` (middle truncation, double-click rename), `.Chip` (kind colour), `.Meta`, `.Close` (unsaved dot → ✕ on hover), `Tabs.Panel`, `Tabs.OrientationToggle` (2-segment radiogroup), `Tabs.Switcher` (direction C: caret button, filterable grouped jump list; controlled `open`/`onOpenChange`; the consumer binds the shortcut via exported `matchesShortcut`, the kit adds no global key handlers). ARIA tablist/tab/tabpanel with roving tabindex; `--ph-*` roles only.
- Tabs behaviour ported from the mdeditor tab system: focusable Close outside the `role="tab"` element ("Close {label} tab", rename input "Rename tab", `label`, `visibility`), Delete-to-close; wheel-to-horizontal scrolling; focusable overflow arrows with edge `aria-disabled`; active tab scrolled into view; enter/exit animation with `motion` (`standard`/`reduced`/`none`, honours `prefers-reduced-motion`); kind `color` fill and stripes; forced-colors styling; rename Escape/Enter/focus fixes; flexible sheet width (`tabMinWidth`/`tabMaxWidth`) and `density`; roving fallback when the selected tab is filtered out; per-root scoped ids; `disabled` tabs; separator before `after`; `data-slot` / `data-*` state attributes. New types `TabsMotion`, `TabsDensity`.
## 0.4.0

The kit's skin is now **Phosphor**: a matte instrument-panel theme, dark by default with a bone-paper light twin, from the Phosphor design system (claude.ai artifact, 2026-10-01).

### Added

- `src/styles/phosphor/` — the framework-agnostic theme: `phosphor.tokens.css` (the `--ph-*` interface for both themes), `phosphor.tailwind.css` (Tailwind v4 `dark:`/`light:` variants, `bg-ph-*`/`text-ph-*`/`border-ph-*` utilities, base styles), `adapters/heroui.css`, `adapters/shadcn.css`, `adapters/_template.css`, `phosphor.fonts.css` + `fonts/` (Rethink Sans, Victor Mono; SIL OFL 1.1). Values are generated by `build/build.py` from `build/palette.py` (170 contrast pairs, 0 failures). Shipped at `@abmex/ui/phosphor/*` for apps that want the theme without the components.
- `phosphorPrism` — a react-syntax-highlighter Prism style whose every colour is a `--ph-*` token. `CodeBlock` uses it.
- Theme scope: no class → dark; `.light` / `[data-theme="light"]` → light, on any element, nesting allowed.

### Changed

- `dist/styles.css` is `src/styles/tailwind.css` with its relative imports inlined, so one `?raw` string carries the whole theme; fonts ship in `dist/fonts/`.
- Component tokens keep their names (`--color-chat-bubble-user-bg`, …) but are `@theme inline` aliases of `--ph-*` roles. Reskin by overriding `--ph-*`.
- Every component moved from `slate`/`teal`/`rose`/… classes to Phosphor roles; text under 12px is now 12px; data is set in Victor Mono.
- `SplashLoader` is one quiet ring (orbs removed); `.icon-btn-32` is matte (`ph-surface-2` hover, `ph-primary-soft` active, `ph-focus` ring).
- `parseSemanticVariables` lists `--ph-*` as group `phosphor`, bounds the HeroUI bridge with an end marker, and skips `--color-*` aliases of `--ph-*` (overriding an inline alias has no effect). `ThemeEditorPanel` lists the Phosphor group first.

### Removed (breaking)

- Tokens no component read: `--color-tictac-*`, `--color-header-btn-*`, `--color-loader-*`, `--color-empty-*`, `--color-error-*` (except `--color-error-text`), `--color-chat-formatbtn-*`, `--color-conn-input-*`, `--color-conn-error-text`, `--color-drawer-closebtn-*`, `--color-drawer-dropdown-*`, `--color-drawer-optbtn-*`, `--color-drawer-search-icon`, `--color-drawer-search-input-*`, `--color-inputbar-sendbtn-*`, `--color-inputbar-stopbtn-*`, `--color-modelpicker-bg|border|border-focus|text`, `--color-themebtn-*`.
- `.header-gradient`, `.header-aurora`, `.header-orb*`, `.splash-orb*` and their keyframes.

## 0.3.2

Theme editor brought up to the current token surface.

### Changed

- `ThemeEditorPanel` groups the semantic variables by component prefix (Chat, Drawer, Input bar, Markdown, …) in collapsible sections with a per-group override count, adds a filter field, and lists the HeroUI v3 bridge (`--accent`, `--surface`, `--field-*`, …) as its own "HeroUI bridge" group — that block is the ~15-variable reskin seam and was not editable before. Every override input carries `aria-label="Override <token>"`.
- The panel now consumes its own `--color-themeedit-*` tokens (background, borders, title, family labels, slider track/thumb, reset button) instead of hard-coded `slate`/`teal` classes, so those tokens are no longer dead.
- `parseSemanticVariables` returns a `group` per variable and honours the `theme-editor: heroui-bridge` marker comment in `styles.css`; everything declared after the marker is exported as group `heroui`.

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
