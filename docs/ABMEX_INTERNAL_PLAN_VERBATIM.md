---
title: abmex-standalone-ui-migration-2026-10-06
type: document
permalink: projects/design-system/plans/abmex-standalone-ui-migration-2026-10-06
kb_version: '0.1'
entity_class: Document
last_verified: '2026-10-06'
status: active
confidence: 0.95
provenance:
- source: session:2026-10-06-abmex-reviewed-migration-plan
  author: agent:codex
  confidence: 0.95
cascade_role: operation
tags:
- domain/design-systems
- abmex-ui
- consolidation
- plan
---

# ABMEX standalone design system: extraction and organization-wide migration

**Research date: October 6, 2026.** Architecture and migration/release reviews passed after amendments by two specialized **GPT-6.1 Sol low-effort reviewers**. Their approval covers this plan; implementation still requires verification below.

**Status correction, 2026-10-06:** The reviewed plan was initially delivered during Plan Mode, which prevented KB persistence. The user then explicitly instructed “Implement the plan” and developer mode changed to Default. This note now persists that reviewed plan; implementation results must be recorded separately. No implementation completion is implied.

## 1. Audit findings and source reconciliation

Extraction is already underway, but **there is no single authoritative package artifact yet**.

| Source | Observed state | Required treatment |
|---|---|---|
| Largo Merlyn | 8617c20, clean; PR16 theme-editor lane; package 0.5.0 | Integration starting point |
| PR15 Phosphor lane | 633f3ea, open against development | Preserve lineage; avoid replaying changes already in PR16 |
| feat/abmex-tabs | b448e26; six commits ahead, eighteen behind Merlyn starting point; also 0.5.0 | Reconcile tab changes explicitly |
| Adagio tab worktree | Dirty package 0.6.4; new button-group, theme-toggle, overflow and mask work | Capture separately; version does not prove artifact identity |
| Adagio mdeditor | Dirty tabs-polish lane; vendored abmex-ui-0.6.4.tgz | Compare actual tarball against source, preserve working behavior |
| Adagio Phosphor worktree | 42155ce, additional tab work | Check overlapping changes before integration |
| Adagio durable persistence | 4ce08e6 | Separate business-data lane; preserve theme persistence contracts |
| Largo design-system | a899e70, dirty; recovery worktree 741caec; separate open PR11 | Reuse proven assets/tests selectively |
| Largo phosphor | c0e48a9, dirty; competing package implementation | Donor evidence, not an automatically authoritative replacement |
| Largo braisenly-design | b860cc0; differs from historical adagio lane | Reuse validated typography/theme-editor work |
| Other consumers | mdeditor, labsupapg, react-mdveditor, multi_agent_helm, labnext, blogg, native projects | Freeze per-host dependency and artifact inventory before migration |

Older Merlyn worktrees were identified, but not every historical worktree received a fresh source-level audit. Native project files also have incomplete indexed coverage. Those gaps remain explicit prerequisites, not claims of completed verification.

The consolidation KB corpus establishes several requirements worth preserving:

- Components compose reusable parts; no artificial atomic-tier folder hierarchy.
- Previous failures included duplicated token authorities, weak consumer validation, and rebuilding instead of integrating existing work.
- mdeditor’s tab port lost substantial behavior before restoration. Preserve restored behavior and recorded intentional API changes.
- Old tab skins were intentionally removed; do not resurrect them automatically.
- Existing skipped mobile reorder coverage does not establish parity.
- Dirty worktrees must not be stashed, reset, cleaned, or overwritten.
- Paused PR merges remain paused.

### What still needs consolidation

Current package covers chat, composer, conversations, settings, status, layout, theme editing, and primitives. Merlyn still owns reusable presentation for message images, task lists, approvals, files, tool output, settings fields, and resizable settings surfaces.

Token coverage remains incomplete. Beyond colors and typography, audit must include:

- Spacing, dimensions, density, breakpoints/container behavior, layering, borders, radii, shadows, opacity, focus and disabled states.
- Duration, delay, easing, spring parameters, scale, distance, stagger, repetition, animation recipes, and reduced-motion alternatives.
- JavaScript timers coupled to CSS animation, exit lifetimes, cancellation, and preference changes.
- Fonts, icon geometry, loading indicators, scroll/overflow affordances, masks, and platform adaptations.

Concrete leaks include hardcoded tab entry/exit durations, settings slide timing, root-scoped theme selectors, Phosphor-specific names, CSS-derived editor metadata, and a purportedly framework-neutral theme controller that imports React.

## 2. Target architecture and public contracts

Create sibling repository **/Volumes/FLOUNDER/dev/abmex**. Preserve existing pnpm/Vite tooling and palette generator. Extend proven machinery; do not replace it merely to adopt newer tooling.

| Deliverable | Responsibility |
|---|---|
| @abmex/themes | Framework-neutral token data, compiled CSS, typed metadata, motion values, pure theme controller, optional font assets |
| @abmex/ui | Generic React components, headless HeroUI behavior, owned styling, optional React theme integration |
| Swift package AbmexTokens | Generated token values, theme metadata and native resources |
| Swift package AbmexUI | Composable SwiftUI counterparts using native interaction and accessibility |

Plain HTML must consume shipped CSS and tokens **without React, Tailwind, or a consumer compilation step**. React consumers also receive compiled styles; optional Tailwind integration is separate.

### Component customization

Every public component must expose the customization relevant to its actual anatomy:

- Controlled state and callbacks; uncontrolled defaults where appropriate.
- Composable children/parts, render slots, DOM props, refs, className, style, and documented token hooks.
- No mandatory Merlyn provider for ordinary leaf components.
- No WXT, Dexie, application networking, browser-extension globals, or application persistence inside reusable presentation.
- Optional services only where a real dependency exists. Prompt history and theme persistence receive injected storage; default behavior is memory-only.

Use headless HeroUI for accessible behavior. Retain required structural styles, replace default theme/component recipes, and avoid introducing a second competing primitive library.

Slot handlers run consumer logic first. defaultPrevented cancels documented cancellable actions. Ref composition supports React 19 cleanup. Component-generated accessibility relationships remain coherent; customization must preserve keyboard, focus, disabled, labeling, and selection behavior.

Keep temporary compatibility exports such as MerlynUIProvider only where needed for migration; canonical API uses generic names. Keep chat-specific presentation as reusable chat components rather than pretending every component is domain-free.

### Theme and token contract

Use one authored token authority compatible with **Design Tokens Community Group (DTCG) 2025.10**. Generated CSS, TypeScript, Swift, and editor metadata are derived artifacts.

- Theme identity: data-theme.
- Resolved mode: data-mode="light|dark".
- system remains controller preference, resolved against live platform settings.
- New explicit mode wins over legacy selectors on the same scope.
- Without a local mode, inherit nearest resolved scope.
- Legacy .light, .dark, and data-theme="light|dark" remain compatibility inputs only.
- Reserve light and dark from new theme identities.
- Re-resolve semantic aliases at every theme scope.
- Portals use an explicit themed container or reproduce the originating scope.
- Framework-neutral defaults are neutral; Merlyn explicitly selects Phosphor.
- Both neutral and Phosphor ship light/dark modes.

No import-time DOM access, storage writes, font registration, or global theme mutation. Server rendering uses caller-provided initial state; otherwise stable neutral/light defaults until mounting.

Replace CSS parsing in the theme editor with generated typed metadata. Preserve existing palette numerical output before altering generation algorithms.

Theme conversion is a lossless normalized view:

- Explicit canonical key takes precedence over legacy aliases.
- Invalid known values produce diagnostics and safe defaults.
- Unknown, invalid, and colliding original values remain preserved.
- Legacy values apply only when canonical keys are absent.
- Do not delete source records or require a database downgrade.
- Test concurrent updates, tombstones, mixed documents, idempotence, and old-reader compatibility.

Shipped themes must meet Web Content Accessibility Guidelines (WCAG) 2.2 AA for tested states. Arbitrary user overrides receive diagnostics and recovery controls; they cannot carry a universal contrast guarantee.

### Motion and native behavior

Centralize motion across CSS, Web Animations API, JavaScript lifetimes, and SwiftUI. Standard DTCG duration/easing/transition values remain distinct from project-defined spring and animation recipes.

Support standard, reduced, and none; platform reduced-motion preference caps effective motion and updates live.

Natural completion and cancellation are separate events. Reopening interrupts exit removal. Unmount clears animations, listeners, and timers without callbacks mutating unmounted state.

SwiftUI uses native environment values, styles, builders, focus, accessibility, Dynamic Type, and Reduce Motion. Freeze a counterpart matrix for **every exported family**, including callbacks, customization, platform-specific mechanics, and acceptance tests. “Not feasible” cannot silently substitute for required functionality.

Freeze existing compiler/Xcode versions and consumer deployment targets. Do not raise existing minimums. Newer APIs require availability guards and working fallbacks. Fonts remain opt-in; preserve font identity and licenses across web and native formats.

## 3. Implementation and migration sequence

### Phase A — Freeze evidence and integrate sources

1. Record each source’s host, path, branch, commit, dirty patch hash, manifest, lockfile, and packed-artifact SHA-256.
2. Compare mdeditor’s actual vendored tarball against adagio’s dirty source.
3. Build a component/token/style/motion inventory with source, public export, customization, consumers, native counterpart, and verification status.
4. Complete targeted CodeMunch inspection of unexamined worktrees and native metadata. Record index omissions instead of treating absent search results as absent code.
5. Create package history from a disposable filtered clone of the Merlyn starting point. Never filter the original repository.
6. Reconcile the six tab commits and dirty snapshot once. Preserve original-to-filtered commit mapping; attribute additional app components/tests separately.
7. Preserve donor repositories and worktrees throughout.

### Phase B — Establish package boundaries

Build framework-neutral themes first, then React UI and Swift products.

Use explicit public export maps and concrete family entries. Keep sortable tabs isolated from ordinary tabs; nonsortable consumers must not need drag dependencies.

Ship compiled CSS with correct side-effect declarations and packaged font/resource URLs. Remove mandatory consumer Tailwind/HeroUI-style requirements only after dependency and import-closure tests pass.

Keep React as a peer dependency. Preserve compatible installed versions; avoid unrelated dependency upgrades.

### Phase C — Finish component extraction

Cover all existing package families:

- **Chat:** bubbles, empty states, markdown/code, message controls, model/status metadata, streaming indicators, notices, transport presentation.
- **Composer:** input shell, attachments, send/stop controls, keyboard and history behavior.
- **Conversations:** drawer, search, rows, selection and empty states.
- **Settings:** layout, modal/sheet, tabs, fields, command/config presentation, secrets/provider/tool/MCP presentation.
- **Status/layout:** footer, connection/context/token displays, selectors, segmented controls, loaders, regions.
- **Theme/primitives:** editor, color system, toggle/controller, buttons/groups, copy/status primitives, error presentation.
- **Tabs:** full compound family, rail/sheet layouts, overflow, sortable extension, labels, metadata, close/rename, orientation and density.

Extract residual Merlyn visuals for images, tasks, approvals, file listings/download affordances, tool output, reusable settings fields, and resizable sheets.

Merlyn retains orchestration, routes/entrypoints, provider configuration, permissions, persistence, model/tool execution, and thin adapters. Remove dead chains only after reference checks and behavior verification.

### Phase D — Prove parity with real consumers

Merlyn and mdeditor are primary proof consumers. Migrate remaining active organization projects in recorded dependency order, preserving each project’s theme and behavior.

For each consumer, freeze:

- Existing commit, dependency graph, artifact checksum and lockfile.
- Required web/native surfaces and baseline behavior.
- Exact verification commands.
- Previous installable artifact and theme-state fixtures.
- Forward migration and rollback evidence.

Copied packages, .yalc, workspace links, and vendored tarballs are replaced by exact registry dependencies only after registry-installed verification. Do not remove old source before rollback succeeds.

### Phase E — Release

Use unique prerelease versions under next; 0.7.0-next.0 is provisional until registry history is checked.

1. Build and test immutable tarballs.
2. Publish those exact tarballs, themes before UI.
3. Verify registry installations before promoting consumers.
4. If publication partially fails, hold consumer promotion and latest; resolve the remaining package with a valid unique candidate.
5. Bind npm artifacts and Swift tag/revision in one checksummed release manifest.
6. Verify Swift package resolution from the tagged remote revision and actual native consumer integration.
7. Promote stable versions only after acceptance gates pass.

Repository ownership, package access, and registry history must be verified before creation/publication; none is assumed established by an unauthenticated “Not Found” response.

## 4. Acceptance and rollback gates

- **Packaging:** isolated installs outside workspace; all JavaScript, declarations, CSS and resource exports exist; production consumers use skipLibCheck: false; no duplicate React.
- **Plain HTML:** themes-only installation, no React/Tailwind; browser-computed styles, nested themes, motion, and font URLs verified.
- **Optional dependencies:** root and nonsortable imports work without drag packages; sortable entry tested with its peers.
- **Customization:** controlled/uncontrolled state, render slots, events, refs, keyboard behavior, disabled states and labels survive customization.
- **Themes:** three-level nesting, independent identities/modes, overrides, portals, color-scheme, hydration, reload and live system changes.
- **Persistence:** source snapshots, concurrent edits, deferred edits, tombstones, migration collisions and old readers preserve user state.
- **Motion:** separate standard/reduced/none baselines; interrupted entry/exit, rapid toggles, unmount and preference changes.
- **Tabs:** wheel/overflow, keyboard reorder, touch reorder, drag overlay, announcements, rename guards, close behavior, scoped IDs, filtering and focus recovery. No skipped required scenario.
- **Accessibility:** shipped-theme contrast fails with nonzero exit status; keyboard/forced-colors/RTL/narrow layouts; named VoiceOver and NVDA checks on core flows.
- **Merlyn:** focused tests plus pnpm check; Safari build and native checks for affected surfaces; preserve pinned extension identity.
- **Native:** generated values, component counterpart matrix, supported deployment targets, Dynamic Type, VoiceOver, focus and Reduce Motion; tagged package and real application verification.
- **Rollback:** reinstall exact previous artifact and lockfile; verify prior consumer reads forward-written theme state before deleting copied source.

No implementation builds or runtime acceptance tests were performed during this planning task.

## 5. Research basis and KB artifacts

Current guidance supports accessible headless primitives, owned styling, portable typed tokens, explicit motion accessibility, and testing shipped artifacts—not a wholesale framework rewrite.

- DTCG 2025.10 defines interoperable token types; it is a Final Community Group Report, not a W3C Standard. [Format specification](https://www.designtokens.org/tr/2025.10/format/)
- HeroUI documents headless styling with retained base styles. Context7 confirmed its composition and styling model. [HeroUI theming](https://heroui.com/en/docs/react/getting-started/theming)
- React Aria documents accessible composition and customization contracts underlying this approach. [Customization](https://react-aria.adobe.com/customization)
- Context7 and GitHub research confirmed existing SwiftUI/token transforms; this informs output design without requiring a generator replacement. [Style Dictionary transforms](https://github.com/style-dictionary/style-dictionary/blob/main/docs/src/content/docs/reference/Hooks/Transforms/predefined.mdx)
- GitHub searches through gh examined HeroUI motion handling and Style Dictionary implementation patterns. [HeroUI variants source](https://github.com/heroui-inc/heroui/blob/73000ea8d13ee8aba6a098c93d1d3b5946fa036f/packages/styles/variants/index.css)
- Native motion follows platform accessibility settings. [SwiftUI Reduce Motion](https://developer.apple.com/documentation/swiftui/environmentvalues/accessibilityreducemotion)
- Publication uses tested tarballs and explicit distribution tags. [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish/)

**KB destinations**, within the existing master-kb knowledge base:

- Parent: [[projects/design-system/plans]]
- Plan: [[projects/design-system/plans/abmex-standalone-ui-migration-2026-10-06]]
- Initiator prompt: [[projects/design-system/plans/abmex-opus-55-session-2026-10-06]]

Link both from the consolidation hub and Merlyn design-token hub. Include source dates, review outcomes, unresolved evidence gaps, and supersession relationships. Preserve historical notes; append corrections rather than rewriting prior evidence.

## 6. Engineered session initiator — Opus 5.5, high effort

Full prompt is persisted separately at [[projects/design-system/plans/abmex-opus-55-session-2026-10-06]], linked to this reviewed plan. It was drafted after both specialized plan-review gates.

## Relations

- part_of [[projects/design-system/plans]]
- evolves_from [[projects/design-system/design-system-consolidation-2026-10-hub]]
- relates_to [[projects/merlyn/design-tokens/merlyn-design-tokens-hub]]
- governed_by [[concept/composable-compound-components]]
- executed_with [[projects/design-system/plans/abmex-opus-55-session-2026-10-06]]

## Evolution log

- 2026-10-06 — Create: persisted complete reviewed technical plan after user “Implement the plan” authorization and exit from Plan Mode. Source: parent conversation's final proposed plan; two GPT-6.1 Sol low-effort architecture and migration/release gates passed after amendments. Introductory Plan Mode persistence restriction is retained as historical context and corrected above. Implementation status is separate. Inline-code formatting normalized without removing technical content.
- 2026-10-06 — Quality signal: corpus and branch evidence resolve competing package authorities; native/index gaps remain explicit. Revalidate frozen heads and registry facts on execution. Trigger updates when source reconciliation, release contracts, consumer acceptance, rollback evidence, or new user decisions change.

## Implementation checkpoint — 2026-10-06

- User authorized implementation after plan review. Full migration remains in progress; this is not release acceptance.
- Intended largo `/Volumes/FLOUNDER/dev/abmex` already contains an unversioned older Next.js project. It was preserved. New repository uses `/Volumes/FLOUNDER/dev/abmex-design-system`, branch `feat/standalone-design-system`; location choice was surfaced and recommended safe sibling default used while continuing.
- Original Merlyn remains clean at `8617c2068a93b19762a0ccf3054e515eaff7674a`. Dedicated consumer worktree: `.worktrees/abmex-consumer`, branch `feat/abmex-standalone-consumer`.
- Captured adagio tabs HEAD `b448e26ff9c1c59d27128ed947a89e86706bf6b9`, dirty package source/patch/status, and mdeditor actual `0.6.4` tarball (SHA-256 `83d2a6b414cf8fad01cf5d6b40a1f2b2fa17fa51a595d7c7d258191db0cd6a76`). Live mdeditor HEAD now `1c833535cf6c3568a82a15fe8257a9f933a23953`.
- Disposable filtered clone preserves package history and original-to-filtered commit map. Six tab commits reconciled with theme-editor lane; dirty snapshot replayed with explicit generator/style conflict resolution. No original worktree stashed/reset/cleaned.
- New `@abmex/themes` owns Phosphor source/generator/fonts and pure controller. React hook remains in UI. Existing UI distribution style paths are derived compatibility artifacts. Canonical mode/controller lifecycle and headless recipes are still pending.
- Verification checkpoint: 17 component suites / 155 tests pass; themes+UI build and typecheck pass; 200 contrast pairs pass; regression test verifies contrast failure exits nonzero; DOM-free themes import succeeds. These do not establish browser/native/full-tab parity.
- Dependency installation uncovered omitted native optional dependencies in captured lock data. Fresh resolution fixed graph, then direct development/runtime package versions pinned back to observed baseline (React 19.2.6, Vite 7.3.3, etc.); peer ranges retained. No npm publication or consumer cutover.
- Native audit correction: Merlyn iOS15/macOS12, Swift language5; installed Swift6.4/Xcode27.0. Merlyn uses WKWebView, not SwiftUI. Separate swift-packages now `76e50561c2fbd69055fe726c32f4e4d77a77c440`, deployment27, supplies native proof consumer. Do not raise Merlyn minimums.

### Evolution log
2026-10-06 — appended implementation evidence, safe sibling path, native minimums, and explicit remaining acceptance gaps; trigger: approved implementation began.

