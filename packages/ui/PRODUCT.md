# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: developers building an AI-chat surface into a web app — anyone who needs a ready-made presentation layer for a chat UI over LLM providers, independent of Merlyn. They adopt `@abmex/ui` from npm and compose it from props and callbacks.

Secondary: the Merlyn team and sibling `@abmex` packages, which consume the kit as its reference consumer and donor app.

## Product Purpose

Deliver a reusable React presentation kit for AI-chat interfaces, built on HeroUI v3, so the chat UI exists once and is consumed by many apps — including the Merlyn WXT MV3 extension it was extracted from.

Success is **one shared source of truth**: the kit publishes, consumers pin it (Merlyn and future apps alike), and no chat UI is duplicated between them.

## Positioning

A **presentation-only** kit: components render and emit intent; they never persist, fetch, poll, or talk to a provider. Where a component would have reached for plumbing, its props carry a `// WIRING:` comment naming exactly what the consumer must supply — those comments *are* the integration contract. HeroUI v3 is a **peer**, not a dependency, so exactly one copy of React Aria owns focus, portals, and overlays. The kit holds zero business logic; a consumer with no database, no extension APIs, and no provider registry can mount the whole surface from plain `useState`.

## Operating Context

- Consumed two ways: as a published npm package, and in-repo as a pnpm workspace package that resolves to `packages/ui/dist` — source edits are invisible to consumers and to vitest until `pnpm build:ui` (`check:ui`) runs.
- Integration recipe: install the peers, then import `@heroui/styles` **before** `@abmex/ui/styles.css` (that order is load-bearing), and `@source` the package for Tailwind v4.
- Reference consumer: `examples/consumer` drives the entire surface from `useState`, with no DB, extension API, registry, or transport.
- The donor and reference app is Merlyn, the multi-browser WXT MV3 extension in this repo.

## Capabilities and Constraints

**Capabilities (component families):** `chat` (MessageList, ChatBubble, StreamingCursor, StreamingRate, ScrollResumeButton, SystemNoticeRow, ModelBadgeRow, JsonInspectorRow, TransportLogPanel, ChatEmptyState, MessageViewToggle, MarkdownRenderer, CodeBlock); `composer` (PromptComposer, SendButton, StopButton, InputBarKeyboardHandler, AttachmentStrip/ComposerAttachment); `status` (ModelPicker, ConnectionIndicator, ContextWindowTracker, TokenCounter, SegmentedControl, SplashLoader, AppFooter); `conversations` (ConversationsDrawer, ConversationListItem, ConversationSearchField, ConversationEmptyState); `settings` (SettingsModal, ProviderSettingsPanel, SecretKeyInput, JsonConfigEditor, McpServerList, SecretsList, ToolsPanel, SettingsSection/Field/Row/List, CopyCommandCallout); `theme` (ThemeEditorPanel, ColorSystem, ThemeEditorButton); primitives (StatusDot, CopyButton, `cn`); hooks (useStreamingRate, useChatPaneController, useInputBarController, useReadlineKeys, useTabIndent).

**Constraints:**

- ESM-only (`"type": "module"`, `formats: ['es']`); Node ≥ 18 and modern bundlers. CommonJS consumers hit `ERR_REQUIRE_ESM`.
- React 19.2 · HeroUI v3 (React Aria) · Tailwind v4 · TypeScript 5.9 strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`) · Vite 7 library mode.
- HeroUI v3 + `@heroui/styles` are peers on purpose: two bundled copies of React Aria break focus, portals, and overlays.
- The kit carries no persistence, transport, provider registry, or browser-extension API.

## Brand Commitments

Name: `@abmex/ui`, public and MIT-licensed. The Merlyn chat skin (Tic Tac orange accent; Rethink Sans / Playfair Display / Victor Mono type) is a **reskin-able default only, not a binding identity** — consumers are expected to reskin by overriding the ~15-variable HeroUI semantic token bridge (`--accent`, `--surface`, `--danger`, `--field-*`, `--radius`), not by forking the ~120 `--color-*` component tokens. No logo or wordmark is committed.

## Evidence on Hand

- The live package: `packages/ui/package.json` (`@abmex/ui` 0.3.2), `README.md`, and a full `CHANGELOG.md` version history (0.1.0 → 0.3.2).
- A working reference consumer at `examples/consumer/src/App.tsx`.
- The donor app in-repo: Merlyn — `entrypoints/sidepanel/ChatTimeline.tsx` is the worked example of mapping a domain model onto the primitives.
- The `// WIRING:` comments (36 at v0.2.0) are the documented integration contract.

Absences that future work must not fabricate: no external testimonial, no published adoption metrics, and no brand asset beyond the type/accent tokens above.

## Product Principles

1. **Presentation only** — the kit renders and emits intent; persistence, transport, and provider registries are the consumer's job.
2. **The wiring contract is the API** — every dependency that was removed becomes a named prop, never hidden glue.
3. **One source, many consumers** — a change lands once and every pinned consumer receives it.
4. **Peers for shared runtimes** — never bundle a second copy of React or React Aria.
5. **Reskin by tokens, not forks** — override the semantic bridge; reach for component tokens second.

## Accessibility & Inclusion

HeroUI / React Aria is the accessibility substrate, and the kit's v0.2.0 rework fixed real defects through it: conversation rows are real buttons, the overflow menu is a proper dropdown (roles, arrow keys, Escape, focus return), the drawer gained Escape-to-close and `inert` when off-screen. Motion tokens are applied under `motion-safe:` so `prefers-reduced-motion` users get instant state changes. No further product-specific standard or user need was established at init.
