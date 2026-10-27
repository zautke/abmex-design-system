# ESI-20261027-002 — R4 extraction source report

## Status and authority

- Scope is source discovery/decomposition only. This artifact and `source-events.md` are the only owned writes. No product code changed; no installs, services, product execution, browser/data operations, commits or KB writes.
- Source checkout `/Volumes/FLOUNDER/dev/labsupapg`: live `HEAD=c0b0e5f82973b8a5c929d05f58cef48463bc7b73`, branch `feat/theme-toggle-circular-reveal`, tracked tree clean; unrelated untracked `.serena/` and `docs/superpowers/` preserved. App cache index date 2026-10-21. Primary ran incremental refresh (`No changes detected`, 11.25s), but no new source-hash receipt was returned. Codemunch symbol verification earlier showed `git_sha_mismatch` for `AppSidebar` and `ThemeProvider`; therefore those bodies below are cached-source evidence, not proven current file bytes. The source commit matches requested short SHA.
- Target `/Volumes/FLOUNDER/dev/abmex-extraction-skill-iteration-002`: `feat/extraction-skill-iteration-002`, live `HEAD=0f2afaa903e5c723631dd0e23bafb5ac1b2d811c`. Primary independently verified `d187c3a..HEAD` changes only run-packet docs and production packages/Sources/tests/manifests/lockfile are unchanged. Branch-local index at `d187c3a` is therefore production-source-equivalent for this report; no claims use unmerged six-primitives `cb99fd0`.
- Contract: `/tmp/extraction-contract.md`, revision 0.9. Target ABMEX inventory provided by R2 is a live checkpoint, not independent proof. Current `inventory.md` still identifies its API-source evidence as pending; consume only claims attributed below to the index. R1 token lane may be added later as labeled evidence.

## Active sidebar and observed capability (cached evidence)

`AppSidebar` in `apps/web/src/app/dashboard/components/AppSidebar.tsx` is the active dashboard sidebar: `DashboardPage` renders it at the `/dashboard` route. `DashboardLayout` provides `ThemeProvider` around `SearchProvider`. A separate `components/Sidebar.tsx` is a static dashboard nav in another page and is not the consumer used by `DashboardPage`.

The active app composes imported `Sidebar`, `SidebarItem`, `SidebarSection`, `SidebarTrigger`, `SidebarRail`, `useSidebar`, `ToggleIcon`, and `IconPaths`, plus app `SearchForm`, `useTheme`, `useSearch`, and Heroicons. It sets collapsible+extendable, width 320/rem, min 240/rem, max 480/rem, hides the search form when collapsed, exposes three search modes (semantic/ingredients/hybrid), a theme toggle locked during theme transition, lower Analytics/Documentation/Settings rows, and a drag-resize handle. Main page is a full-height flex shell with sidebar and content.

The linked package checkout named by `apps/web/package.json` is `/Volumes/FLOUNDER/dev/design-system/ui` (`file:` dependency `@braisenly/ui`). Codemunch resolves this folder as `local/ui-95001dab` (index dated 2026-10-03) and its cache contains a `src/components/sidebar/` family matching the imports. The app cannot currently resolve `@braisenly/ui` from `apps/web` with Node (`MODULE_NOT_FOUND`); package-manager listing was also blocked because the app requests pnpm 8.15.0 while corepack provided 11.1.3. The local source folder exists, but current source/package/export identity and built artifact are not runtime-verified. This is a material evidence gap, not evidence that no implementation exists.

### Linked implementation behavior (old UI-package index; provisional)

- `Sidebar`: controlled or uncontrolled collapsed state; `defaultWidth`, min/max and collapsed width in rem; left/right; optional resize; width callbacks; `aside` root with `data-state`, `data-collapsible`, `data-extendable`, `data-side` and CSS width custom properties. Width itself has no controlled prop in the indexed interface.
- `SidebarItem`: renders a `button`, derives collapsed presentation from context, preserves icon and label, adds label as collapsed tooltip/title, `aria-current="page"` when active; active style via class variant. Consequently navigation items need host link composition; `onClick` alone is command semantics.
- `SidebarSection`: groups children with spacing and optional separators; `position="bottom"` uses absolute bottom positioning.
- `SidebarTrigger`: toggle button with `aria-label` and `aria-expanded`; indexed handler toggles first and invokes consumer `onClick` after. Must be corrected to ABMEX consumer-first/cancellable event policy when adapted.
- `SidebarRail`: mouse drag only, document-level listeners while resizing, clamps width, direct DOM width during drag then state sync on mouseup; `role="separator" aria-orientation="vertical" aria-label="Resize sidebar"`, but indexed source has no keyboard resize path or `aria-valuenow/min/max`. Accessibility/keyboard and pointer/touch behavior require fresh-source review and acceptance coverage.
- In the app’s sidebar, Analytics/Documentation/Settings rows have no handler or route prop; because package item is a button these appear inert in indexed source. Preserve as a characterized defect/stub until host destinations are supplied; do not claim completed navigation.
- Active search form is an app domain capability backed by `SearchProvider` and recipe `SearchMode` state. Keep search service calls/results, routes, Supabase/OpenAI, analytics and domain policy in host. Do not import donor `SearchContext` into the reusable package.
- Theme behavior is host-owned. Indexed `ThemeProvider` reads/writes `localStorage.theme`, falls back to system media preference, writes document-root `dark` and transition classes, uses 550ms CSS fallback, double animation frame on mount, and disables toggle during transition. Theme policy belongs to the host; package may reuse existing `@abmex/themes` controller/toggle instead. Invalid stored values and throwing storage access are candidate defects under contract 0.9 (version/validate, retain in-memory usability, typed error callback), but do not assert current-source defect until cache/source identity is reconciled.

## Dependency and resource closure

| Closure | Evidence/status |
|---|---|
| Active application consumer | `DashboardPage` → `AppSidebar`; source cache/current commit freshness conflict noted above. |
| Sidebar package | app declares `file:/Volumes/FLOUNDER/dev/design-system/ui`; source folder exists, cached sidebar modules resolve; app-level Node resolution fails and pnpm list fails on version mismatch. Installed version, exports in built dist and package consumption are **not verified**. |
| Providers/hooks | `DashboardLayout` nests `ThemeProvider` then `SearchProvider`; `AppSidebar` and its `SearchFormSection` consume `useTheme`, `useSearch`, `useSidebar`. `SearchForm` imports `SearchContext`; `SearchContext` imports recipe types. Cached dependency graph omits package edges, so not full graph proof. |
| Host page/runtime | Next.js app, React 18.3.1, Next 15.5.5. Direct sidebar deps: `@braisenly/ui` local file, `@heroicons/react` ^2.2.0. Domain deps also include Supabase/OpenAI; do not extract them. |
| CSS/build | `apps/web/src/app/globals.css` imports theme tokens and defines light/dark plus `theme-ocean`/`theme-forest`, theme-transitioning rules, and Tailwind source scan `../../node_modules/@braisenly/ui/src/**/*.tsx`. That scan path currently cannot be resolved through app `node_modules`. Build/style emission not run. |
| Fonts/assets | App `RootLayout` uses `next/font/google` Rethink Sans; theme CSS also names Rethink Sans and Victor Mono. Icons are Heroicons plus package ToggleIcon paths. No local sidebar image/font binary was found in indexed app tree. Local generated font artifacts, transitive font license/provenance, and package-generated CSS were not inspected. |
| Generated/package resources | App has Next/PostCSS/ESLint/Tailwind/Vitest configs; UI package declares JS/type/style exports and CSS side effects in its manifest. Installed build outputs/declarations are absent/unresolved in this app; not inspected. |
| Licensing | Target `@abmex/ui` metadata says MIT; donor app manifest shows no license field and indexed root tree contains no license file. Donor/local `@braisenly/ui` source and icon/font licenses remain **unknown**; clear before redistribution. |

## ABMEX responsibility and reuse matrix

Current target source evidence is branch-local index plus primary’s production-file SHA-diff check. Existing public artifacts include `LayoutContainer` and region conveniences, compound `Tabs` with a horizontal `Rail` and groups, `ConversationsDrawer` (conversation-domain), `ThemeToggle` plus `useThemeController`, `MerlynUIProvider`/adapters, `PersistenceAdapter` for conversations, and phosphor theme tokens. No vertical sidebar export is present in the checked target index. Confirm once R2 inventory and independent source checks finalize.

| Responsibility | Decision | Evidence / target fit |
|---|---|---|
| Full-height host shell and main content region | **Reuse/compose** `LayoutContainer` / `AppRootLayoutContainer` with ordinary flex layout | Existing layout has min-size, clipping, containment; it does not model navigation state or sidebar width. Keep it additive and do not turn it into a sidebar. |
| Vertical nav root + width/collapse state | **Create** as new sidebar capability | No current vertical Sidebar found. Existing horizontal `Tabs.Rail` has tab-list selection/focus/overflow behavior and is semantically different from route links; do not substitute it. |
| Item, section, trigger, resize separator | **Create/compose** parts within sidebar family | Extracted linked source parts inform shape. Use public `slots`, `slotProps`, `as`, root/named-part props/classes/styles, refs and documented merge rules from contract 0.9. Need native anchor/custom root for navigation, button for actions; keep state callbacks and keyboard/pointer interactions independent in a public hook where useful. |
| App search mode/query/search form | **Host-owned / compose as children** | `SearchMode` and `SearchProvider` are app-specific. Show/hide or filtering may use public sidebar state snapshot; do not bake recipe domain into UI. |
| Theme button/controller | **Reuse** existing `ThemeToggle`/`useThemeController` from `@abmex/themes` and host integration | Theme scope/DOM target/storage remain consumer configurable; avoid duplicate global provider or localStorage policy in Sidebar. |
| Conversations drawer / persistence adapter | **Do not reuse for sidebar** | Drawer and adapter are conversation-specific; adapting them would couple unrelated state and data. Current `PersistenceAdapter` methods are conversation CRUD/observe, not generic preference storage. |
| Local persistence for width/collapse | **Optional host adapter seam; no default persisted behavior inferred** | Donor sidebar uses controlled props/callbacks plus defaults in indexed source; no storage behavior observed there. Controlled/uncontrolled state suffices by default. If a product persists it, keep host-owned adapter/version/schema/migration/error callback; never reuse conversation DB adapter or silently discard malformed data. Cross-tab sync only if explicitly supported. |
| Icons/assets | **Compose** using consumer-supplied icon nodes/slots | Do not add Heroicons dependency to `@abmex/ui`; target peer dependencies and phosphor icon approach remain the public package’s existing authority. |

## Styling semantics mapped to ABMEX authority

Donor app uses `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-hover`, `bg-sidebar-active`, `text-sidebar-active-foreground`, `border-border`, and generic Tailwind spacing/radius/size classes. Its root CSS defines warm ivory light sidebar and near-black/dark warm active colors, plus per-mode `theme-ocean`/`theme-forest`; this donor-specific palette is evidence of visual meaning, not token authority.

Map semantic roles to current ABMEX Phosphor tokens: panel background → `--surface` (or `--surface-2` if contrast/role tests justify); primary text → `--fg`/`--fg-strong`; secondary text → `--fg-muted`; separators → `--border`; hover surface → `--surface-2`; selected nav background/text → `--primary-soft`/`--primary-soft-fg` (verify contrast in both modes); focus → `--focus`; icon sizing/gaps/radii use existing theme/utilities. Preserve state distinction and dark-mode contrast, but do not copy donor color literals or add `sidebar-*` token aliases by default. If token lane identifies a real unrepresented semantic such as selected nav surface distinct from soft primary, record a justified gap with source, affected states and contrast evidence before promotion. Avoid collision with ABMEX `--primary`, `--emphasis`, `--folder` and `--surface-*` roles by testing selected/hover states against existing semantics.

Donor theme uses global `dark` class and document-level transitions while target theme controller supports scoped target/attribute, system mode, reduced motion and CSS-read duration. Keep sidebar colors scoped to target provider/default tokens. Do not import donor global classes or duplicate the transition timer.

## Additive public, state, persistence and host seam proposal

- Public package: add sidebar root/parts, public types and independent `useSidebar` behavior export through established `@abmex/ui` root exports; only add a subpath if package convention and built artifact verification require it. Preserve all existing exports. Use native root prop/ref forwarding, typed `slots`/`slotProps`, `as`, per-part class/style channels, consumer-first cancellable events, protected state/ARIA invariants, provider → instance → slot precedence, and `unstyled` per contract 0.9.
- Sidebar state: controlled/uncontrolled collapsed state and width with callbacks; `useSidebar` exposes only public snapshot/actions and prop-getter merge requirements, not private DOM. Width bounds and collapsed width are explicit typed configuration; resize semantics include mouse/pointer/touch and keyboard adjustment plus accessible separator values. Distinguish route links (anchor/custom slot) from commands (button). Do not lock to Next/router.
- Host owns destinations, active-route derivation, nav data, search/provider state, theme controller, analytics and any persistence adapter. Caller can replace header/footer/items through parts or children without CSS-private selectors.
- Persistence: no sidebar persistence default. If needed, accept controlled state from host or a dedicated versioned sidebar preference adapter; storage read/write errors retain in-memory usability and call typed error callback, invalid payload is validated, optional migration and configurable cross-tab events. Keep `PersistenceAdapter` (conversation operations) unchanged.

## Two meaningful public compositions

1. **Complete default dashboard composition:** app shell + sidebar root; branded header/collapse trigger; useful search form content; three controlled search-mode actions; route links from host; bottom theme action; collapsed tooltips; resize; main content gets an actual route/result. Immediately usable only after public package implementation and host routes are wired. Use fixtures for mode/search results only if labeled; do not make destinations inert.
2. **Different composition:** project/file navigator with a searchable tree, group headings, active file selection, a create-file command, and a bottom workspace picker. It exercises the same vertical root/sections/items/trigger and state hook but different ownership/content semantics (hierarchical selection + command versus dashboard route/mode selection), not a color-only variant. Keep tree/search domain data in host; use supported child/slot composition.

These are design-level examples, not runnable artifacts. Composition subskill applies; no code execution or package implementation in this source task.

## Acceptance plan (not run)

1. Freeze donor live source identity, package manifest/export map, current `Sidebar`/providers/CSS bytes, source license and any changed behaviors; refresh or reconcile `git_sha_mismatch` before parity claims. Resolve installed package and build output using the project's pinned pnpm on a later authorized implementation run.
2. Capture failing/positive tests for controlled/uncontrolled collapse, width clamping, resize direction, trigger/item consumer-first cancellation, correct link/button semantics, collapsed labels, refs/slots, keyboard and pointer resize, ARIA separator min/max/current, focus, reduced-motion, two independent sidebars, provider/slot precedence, unstyled structure, scoped themes and persistence error/migration only if implemented.
3. Build public package, inspect emitted JavaScript, declarations, CSS exports and stylesheet side effects; pack/consume through public entry in an isolated app that cannot import donor or target source internals. Verify current `@abmex/ui` consumers and additive compatibility.
4. Exercise both compositions at narrow/desktop and light/dark, keyboard-only and reduced motion. Verify destinations/actions have real results, there are no new console errors, independent instances do not leak state and global theme changes remain opt-in/scoped.
5. Check CSS values resolve through Phosphor tokens; inspect light/dark selected/hover/focus contrast, generated CSS scanner inclusion, fonts loaded, and no donor sidebar token literals leak. Record exact output/license provenance. Do not mark passed from prose, index search, or build alone.

## Evidence matrix

| Check | Status | Evidence / gap |
|---|---|---|
| Active app sidebar identity | **PASS (indexed identity only)** | `/dashboard` `DashboardPage` renders `AppSidebar`; route/provider dependency references found. No browser/runtime claim. |
| Donor live revision / clean tracked tree | **PASS** | Git HEAD equals requested c0b0e5f; tracked clean; untracked dirs preserved. |
| Donor source-cache freshness | **FAIL / unresolved** | Earlier symbol verification reports `git_sha_mismatch`; primary incremental refresh says `No changes detected` but returned no new hash receipt. |
| Linked UI package source path | **PASS (path + indexed identity)** | Manifest local file path exists and indexed Sidebar family matches consumer imports. Repo index dated 2026-10-03. |
| Installed package/build/export resolution | **FAIL** | Node says `MODULE_NOT_FOUND`; pnpm list blocked (project pins 8.15.0, runtime is 11.1.3). No install/build attempted. |
| Sidebar behavior closure | **PARTIAL** | Cached linked source describes state/parts/resize; package/current source freshness, runtime behavior, CSS output and installed exports not proven. |
| Provider/route/theme/search closure | **PARTIAL** | Cached app route, contexts, SearchForm and theme behavior found; provider source freshness conflict; API/runtime not exercised. |
| Assets/fonts/licensing/generated resources | **PARTIAL / UNKNOWN** | Rethink Sans and Victor Mono identities + Heroicons dependency found; binary/font license provenance and generated outputs not inspected; donor license not found in indexed root. |
| Current target ABMEX public APIs | **PASS (branch-equivalent cached source)** | Target index is d187c3a; primary verified current production paths unchanged since then. Public root barrel, package manifest, theme controller and current components inspected via Codemunch. |
| Target generic Sidebar present | **NOT FOUND in checked baseline** | No vertical Sidebar export in root public barrel/tree; `Tabs.Rail` is tabs, drawer is conversation-scoped. R2 inventory final confirmation pending. |
| Styling/token mapping | **PARTIAL** | Donor semantics/CSS and target Phosphor CSS tokens inspected; R1 token-map collaboration is pending; no contrast/runtime evaluation. |
| Two composition source proof | **NOT RUN** | Proposed journeys documented; no runnable artifacts because implementation is outside source executor scope. |
| Browser/accessibility/build/test/public-consumer proof | **NOT RUN** | Explicitly not product-executed or authorized within this source task. |
| Source acceptance | **FAIL / not approval-ready** | Current linked package resolution, source freshness and licensing are material unresolved evidence gaps. |

## Tools/skills and friction

- Skills read: `extract-abmex-components` 0.2.1 entry, composition subskill, ABMEX profile, decision guidance, acceptance, evidence-format, session-recording, decision-matrix; frontend `extracting-reusable-components`, `design-tokens` (inspection/extend-only rule applied; no token generation), `codebase-design` (used to place seams and reject shallow wrapper reuse).
- Navigation: `mcp__jcodemunch__resolve_repo`, `plan_turn`, `get_repo_outline`, `get_file_tree`, `search_text`, `search_symbols`, `get_file_outline`, `get_file_content`, `get_dependency_graph`, `get_context_bundle`, and source verification; metadata-only `git status/rev-parse`, `realpath`; non-installing Node `require.resolve`; pnpm `list` attempt.
- Friction: `plan_turn` first recommended theme-test instead of active sidebar. Donor and linked-UI indexes older than live checkouts; source hash mismatch/reconciliation requires cautious evidence. Target cache only read after primary verified diff is docs-only. pnpm app inspection blocked by version mismatch; Node cannot resolve dependency. jCodemunch batches generally took ~15–30 seconds; large tree/context outputs required truncation. No source/build/browser/install/test run.
- Deliberately skipped: no product behavior execution, theme redesign, schema/token generation, new API implementation, app route wiring or deletion. These require implementation and later public-consumer/browser gates.
