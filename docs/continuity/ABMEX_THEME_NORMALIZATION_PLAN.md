# ABMEX default theme normalization and Merlyn adoption — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task after design review. Parallel work is optional only when authorized; keep generator/consumer changes sequential where they share a public contract.

**Goal:** Make the complete Tailwind 4.3.0 foundation plus ABMEX semantic theme the shared default imported by Merlyn, preserving existing visuals, public imports, and saved user themes.

**Architecture:** Pin upstream defaults; author ABMEX values in @abmex/themes; generate runtime CSS, Tailwind bindings, and a typed property manifest. @abmex/ui supplies component bindings and presentation, while Merlyn owns app persistence/integration. Source-compiled and precompiled consumption paths share the same generated inputs.

**Tech Stack:** React 19, TypeScript 5.9.3, Tailwind CSS 4.3.0, CSS custom properties, existing Python/Node token generation, Vite, WXT, Vitest.

**Spec:** [Tailwind 4.3 default reference](TAILWIND_4_3_DEFAULT_THEME.md), [existing source audit](THEME_PROPERTY_AUDIT.md), [base contract revision 0.9](BASE_COMPONENT_CONTRACT.md).

**Review:** Fresh builder review completed 2026-10-22; no material blocker found. Review covered these documents only; import/cascade behavior still requires implementation tests.

**Status:** Proposed implementation plan and collision discussion, researched 2026-10-22. Research/code examples are delivered; package and Merlyn migration have not run. Proposed decisions below are recommendations, not user-approved deviations.

## Global constraints

- Additive-only public extension. Preserve existing imports, meaningful defaults, utility names, stored values, and component behavior.
- @abmex/themes is the authority for shared values; generated output and docs are not competing hand-authored stores.
- Full Tailwind support is mandatory. Keep all 419 upstream declarations/compatibility entries available; do not reset namespaces to initial.
- Preserve current ABMEX appearance as the initial default profile. Tailwind conformance concerns vocabulary and resolution, not replacing Phosphor colors with stock colors.
- Existing user-selected themes override the default. No automatic reset, deletion, or rewriting of stored data on load.
- Stateless helpers remain framework-neutral. Keep React hooks/components in UI; portable palette model/generator moves to themes through additive UI re-exports.
- No local models, browser downloads, or Playwright. Disk-check before builds/archives expected to write over 50 MB. No automatic registry publishing, app deployment, or pushing.
- The contract's memory fallback/error callback policy applies to reusable persistence capabilities. Do not silently rewrite Merlyn's durable-write semantics while moving theme ownership.
- No per-contract-revision commits required. Preserve current dirty files and avoid unrelated changes.

## Approaches and recommendation

1. **Compatibility-first composition (recommended):** retain the complete pinned Tailwind foundation and current ABMEX values; normalize mappings, ownership, editor coverage, and import paths. Adds shared coverage without changing existing visual meaning.
2. **Semantic-only reset:** remove stock palettes/scales and rebuild a minimal theme. This breaks existing utility usage and conflicts with additive requirements; rejected for Merlyn migration.
3. **Keep compiled UI CSS plus an independent second theme/Tailwind entry:** least initial editing, but leaves duplicate theme/Preflight/variant ownership and cannot reliably supply newly requested semantic utilities. Retain existing compiled entry for noncompiler consumers; prefer one source compilation in Merlyn.

The user requested research, planning, and discussion of collisions before applying this migration. This document supplies that concrete design; no unreviewed runtime change is implied.

## What the existing audit means against the full default

| Surface | Current evidence | Classification and target |
|---|---|---|
| 26 upstream color ramps / 288 colors | Tailwind dependency supplies defaults; authored ABMEX adds semantic roles | Inherit all stock colors. Five palette-editor families are ABMEX semantic controls, not replacements for Tailwind slate/teal/rose/emerald/amber ramps. |
| ABMEX identities and colors | 77 identity names; 59 semantic colors in CSS | Preserve values. Generate all roles and references from the existing authored palette source. |
| Catalog coverage | tokens.json has only 55 of 59 color roles | Add folder, paper, folder-edge, page to the generated catalog; keep role declarations and source metadata synchronized. |
| Fonts | Rethink Sans + Victor Mono; font-display/font-code; upstream serif inherited | Preserve defaults and font files; avoid duplicate font-face output. Measure font fallback and layout at load. |
| Typography | 10 catalog recipes, UI 2xs/3xs, inherited xs–9xl | Add generated recipe tokens/classes; do not redefine text-base as 12px. Include family/style beyond size/weight/leading/tracking. |
| Spacing | Seven px catalog values; upstream --spacing is 0.25rem | Generate named semantic variables/mappings; preserve numeric scale. Pixel catalog values and rem scale are not globally interchangeable at custom root font sizes. |
| Radius | Tailwind radius-sm 4px; catalog radius-sm 2px; shadcn radius-sm 2.4px | Three meanings: retain core Tailwind scale, retain adapter behavior under an explicit adapter profile, add unambiguous semantic names. Never globally choose one and silently change all consumers. |
| Shadows | 3 ABMEX effects; upstream box/inset/drop/text families | Add semantic names while keeping all default effect scales. Do not equate box shadow, filter shadow, and text shadow. |
| Motion | 12 theme properties; UI duplicates pop settings | Alias old public UI names to shared values; generate supported --transition-duration-* bindings and --ease-* / --animate-* recipes. Keep 140ms ABMEX base distinct from 150ms upstream default. |
| Responsive/sizing/effects | Upstream breakpoints/container/aspect/blur/perspective exist | Explicitly inherit; no donor-driven renaming. Verify viewport and container thresholds separately. |
| Component customization | 76 @theme inline color aliases point straight at semantic roles | Keep utility names; insert optional runtime component variables with role fallbacks. Avoid eager root aliases that resolve before a nested scope. |
| Editor | 129 source-parser entries; omitted motion/non-color values | Replace implicit comment-marker completeness with generated metadata; keep old cssText parser as backward-compatible fallback. |
| Theme switching | Core recognizes data-mode; variants/palette generator differ | One mode/scoping policy across generated selectors, controllers, injected overrides, and utility variants. |
| Public imports | Merlyn uses compiled styles plus a separate Tailwind compile | Add a source-only UI entry and complete theme entry; use one compilation in Merlyn. Keep old compiled entry intact for existing consumers. |

## Collision and deviation decisions

### Preserve semantic meaning rather than forcing equal values

ABMEX is allowed to differ from stock Tailwind in its named semantic roles, fonts, component density, motion, and theme modes. That is a theme, not drift. Drift is an unintended disagreement between authored values, generated artifacts, editor metadata, aliases, or consumers.

Recommended deviations: retain Phosphor dark/bone-paper twins and existing default mode; retain Rethink Sans/Victor Mono; retain 2xs/3xs and named compact recipes; retain matte semantic shadows and existing animation values. Keep upstream scales available. Changing tiny text sizes for readability is a separate visible design decision, not a prerequisite for normalization.

### Adapter collisions

HeroUI accent is a strong brand fill, shadcn accent is a subtle hover fill. HeroUI muted is text, shadcn muted is a surface. Retain HeroUI for Merlyn. Do not import the shadcn adapter into Merlyn's root by default. Expose alternative adapter profiles/scopes and test them separately. The shadcn sidebar vocabulary already exists but does not supply sidebar behavior.

The bare --radius overlaps a deprecated upstream default and adapter conventions. Do not rename it. Keep its compatibility meaning and use distinct semantic names for new radius recipes. Do not redefine --radius-sm globally to reconcile the catalog.

### Layers, imports, utility availability

A compiled stylesheet does not carry usable @theme registrations/@custom-variant definitions back into a second compiler pass. Existing compiled utilities may happen to cover a class, but newly authored app candidates need the source registry. Preserve the compiled path for noncompiler apps; Merlyn should consume source entries with one Tailwind invocation.

Use one Preflight and one canonical layer order. Treat HeroUI's own imports/layers as part of the package fixture. Existing unlayered defaults cannot be made reliably consumer-overridable solely by moving imports; capture actual cascade evidence before changing layers. Retain generated font asset URLs relative to public package output.

### Mode and saved-theme ownership

Use data-mode as the authoritative new mode signal and data-theme for theme identity; retain current .dark/.light and data-theme=dark/light compatibility when data-mode is absent. All layers must agree on the nearest active scope, including three-level nesting and mixed legacy selectors. No unconditional global .dark override wins over a nested light scope.

ABMEX default is the initial/fallback theme, not a forced replacement for a saved theme. Keep Merlyn's theme IDs, active selection, synchronization, durable-write queue, and existing override precedence. Add versioned migration adapters that preserve unknown properties for round-trip compatibility. Old ineffective --color-component overrides must not suddenly become active through an automatic rewrite: expose any repair as a deliberate migration/preview.

### Compiler/docs discrepancy

For pinned 4.3.0, named --zoom-* and --tab-size-* did not generate named utilities in the local compiler test, despite current documentation listing them. Numeric forms work. Do not add unverified named tokens to the required default. An explicit tested @utility is possible if Merlyn needs a named value; otherwise no new abstraction.

## Review focus and acceptance risks

- Nested dark/light scopes, portals outside a scope, and class/data-mode disagreement: effective colors and state variants must agree.
- Existing saved themes including unknown keys, old ph- names, malformed values, storage failures, and two app windows: preserve data and predictable ownership.
- New app-only semantic utilities not used inside the UI package: emitted in the source consumer path; legacy compiled path remains working.
- Nondefault root font size, zoom, reduced motion, system preference changes, and late fonts: no accidental fixed/rem reinterpretation or animation regression.
- Rebuilt/published assets and version skew: check installed package contents, relative font URLs, duplicate layers/Preflight, and old public imports.

## Property manifest contract

Extend the current generator rather than creating a separate styling engine. Produce one typed metadata projection with schema version, upstream package/version/hash, ABMEX theme ID, and property entries. Each entry records canonical name, CSS name, kind, mode/default values or reference, ownership, scope, provenance, supported utility bindings, compatibility aliases, and editor support. Mark inherited upstream values explicitly; do not duplicate their authoring into a second JSON inventory.

Example type (proposed; primitive type spellings are implementation choices):

```ts
export interface ThemePropertyDescriptor {
  name: string;
  cssName: `--${string}`;
  kind: "color" | "length" | "number" | "font" | "shadow"
    | "duration" | "easing" | "animation" | "recipe" | "configuration";
  owner: "tailwind" | "abmex" | "adapter" | "component";
  source: string;
  modes?: Readonly<Record<"dark" | "light", string>>;
  value?: string;
  bindings: readonly string[];
  aliases?: readonly string[];
  editable: boolean;
}
```

All fields except mode/value are mandatory; exactly one value representation must be validated by the generator. Breakpoint values can be documented but are not offered as live runtime mode overrides. Serializable metadata does not encode React callbacks or component refs. Consumer-side raw CSS input remains validated according to property kind; unknown extension entries remain round-trippable.

## Task 1 — pin baseline and prove current package provenance

**Files:** root package.json/pnpm-lock.yaml; packages/themes/package.json; packages/ui/package.json; ../wxt-prompt/package.json/pnpm-lock.yaml; existing tests/package-css.test.mjs. New test: tests/theme-default.test.ts.

**Produces:** pinned 4.3.0 baseline evidence and old-vs-new consumer fixture.

- [ ] Read package exports, lockfile resolutions, installed styles, and generator inputs through CodeMunch; explicitly index the referenced packages/themes/src/phosphor/build/palette.py, build.py, and tokens.generated.json if excluded by generic build-directory filtering. These paths are referenced by code but their source was not validated in this research turn.
- [ ] Add a failing baseline fixture asserting the expected full token registry, namespace membership, new neutral ramps, static emission, numeric/arbitrary utility behavior, and no unsupported named zoom/tab assumptions.
- [ ] Run pnpm exec vitest run tests/theme-default.test.ts and record actual failures.
- [ ] Keep existing exact 4.3.0 pin; align only mismatched toolchain entries with it. Do not upgrade unrelated packages.
- [ ] Compare installed packages to versioned source outputs; matching next.7 version strings are insufficient.
- [ ] Rerun the focused test. Capture existing Merlyn screenshots/computed values in installed Chrome using permitted tooling, without Playwright or downloads.

## Task 2 — normalize authored tokens and generated coverage

**Files:** packages/themes/src/phosphor/build/palette.py and build.py (inspect first); packages/themes/scripts/generate-platforms.mjs; packages/themes/src/motion.tokens.json; generated packages/themes/src/phosphor/tokens.json, runtime CSS, and new packages/themes/src/default.extensions.css / default.generated.ts. Test: tests/theme-default.test.ts.

**Consumes:** pinned registry and audited catalog. **Produces:** one generated manifest and complete semantic extension output.

- [ ] Add failing tests for the four missing color roles, every catalog spacing/radius/typography entry, valid references, duplicate semantic names, and all 12 motion mappings.
- [ ] Run focused tests and confirm coverage failures before edits.
- [ ] Extend existing authored source/generator; remove duplicate authored values only where replacement preserves their exact defaults. Never patch generated CSS as the source of truth.
- [ ] Generate inherited-upstream metadata from the pinned package; generate ABMEX values from authored source. Decide explicit semantic radius names without reassigning existing upstream/adapter names.
- [ ] Generate all typography recipe aspects, including family and style, while preserving current UI 2xs/3xs.
- [ ] Add compatibility aliases for existing pop timing/easing names and named transition-duration bindings; preserve reduced-motion behavior.
- [ ] Validate generated text as actual CSS/TypeScript, checking newlines and stale artifacts, not merely file existence. Run generation twice and assert no second diff.
- [ ] Rerun focused tests and pnpm --filter @abmex/themes build. Confirm existing platform generation outputs still match source; do not expand native feature scope.

## Task 3 — effective component overrides and consistent scope

**Files:** packages/ui/src/styles/tailwind.css; packages/ui/src/utils/themePalette.ts; packages/themes/src/phosphor generation sources; packages/themes/src/index.ts; tests/components/themePalette.test.ts; themeController.test.ts; themeScope.test.tsx; tests/theme-default.test.ts.

**Produces:** component variables with nearest-scope fallbacks and one mode-selection contract.

- [ ] Add failing compiler assertions proving drawer-only override leaves sibling surfaces unchanged and nested mode values remain effective.
- [ ] Add failing scope fixtures for both nesting orders, three levels, data-mode precedence, legacy compatibility, system changes, portals, and reduced motion.
- [ ] Change bindings additively to optional runtime component variables; preserve utility names and unconfigured output.
- [ ] Unify generated mode selection and runtime palette selectors. Prefer shared selector generation/constants over hand-maintained string copies.
- [ ] Keep existing global behavior available for apps that request it; provide explicit scope targeting for composed components.
- [ ] Rerun compiler/unit tests; verify actual computed styles and variants in installed Chrome. DOM-only tests cannot establish CSS cascade correctness.

## Task 4 — portable theme model and complete editor metadata

**Files:** packages/ui/src/types/theme.ts; utils/themePalette.ts; components/theme/ThemeEditorPanel.tsx; internal/parseSemanticVariables.ts; packages/themes/src/index.ts and new portable theme model/palette modules as needed; tests/components/ThemeEditorPanel.test.tsx; parseSemanticVariables.test.ts; themePalette.test.ts; tests/package-types.ts.

**Produces:** public themes-owned portable model/generator, backward-compatible UI re-exports, optional typed editor manifest input.

- [ ] Add tests for legacy UI imports, identical default palette output, all property kinds, mode-specific defaults, and unknown extension round-tripping.
- [ ] Move only portable code and values; React/editor rendering stays in UI. Assess culori ownership explicitly; do not make a framework-neutral package depend on React.
- [ ] Add optional manifest input to ThemeEditorPanel. Keep cssText and its existing parser as a supported fallback; do not break required-prop callers or existing callbacks.
- [ ] Render color/non-color editors from property kinds; mark structural/compiler-only fields noneditable at runtime. Preserve custom overrides and validation.
- [ ] Run focused tests and pnpm test:types. Verify no import cycle between themes and UI.

## Task 5 — complete default exports and one compiler path

**Files:** packages/themes/package.json; scripts/copy-styles.mjs; new packages/themes/src/default.tailwind.css; packages/ui/package.json; src/styles/tailwind.css; new src/styles/components.tailwind.css; scripts/copy-css.mjs and build-css.mjs; tests/package-css.test.mjs; tests/theme-default.test.ts.

**Produces (proposed names):** @abmex/themes/default.tailwind.css and @abmex/ui/components.tailwind.css; retains all existing exports.

- [ ] Add package fixtures exercising the exact import recipe in the reference doc, app-only semantic classes, all font assets, base layers, no duplicate Preflight, and correct scan paths after installation.
- [ ] Keep Tailwind source definitions in the compiler path and CSS-only output in the compiled path. Both derive from identical defaults/bindings.
- [ ] Include a static complete-default entry for the requested full variable surface; keep an optional demand-driven entry so other consumers need not emit unused defaults.
- [ ] Ensure the source-only UI entry includes distributed package @source directives and required mask/transition styles. Do not make consumer source paths depend on checkout layout.
- [ ] Preserve old @abmex/ui/styles.css and tailwind.css behavior and tests. Bundle HeroUI once in each selected path; no root shadcn adapter in Merlyn profile.
- [ ] Run pnpm check, including existing package-CSS and type checks. Measure generated size and duplicate declarations; do not change defaults solely to reduce bytes.
- [ ] Package locally for installation verification after disk check. Publication is a separate external step.

## Task 6 — adopt ABMEX default in Merlyn

**Files:** ../wxt-prompt/src/styles/tailwind.css; package.json/pnpm-lock.yaml; src/hooks/useThemeColors.ts; entrypoints/sidepanel/App.tsx; entrypoints/popup/App.tsx; .design-sync/config.json and ds-entry.css; existing theme tests; new tests/components/ThemeDefault.test.tsx. Inspect entrypoints/sidepanel/main.tsx, popup/main.tsx, uat/main.tsx, normalize.css, and sidepanel.css for conflicting defaults before edits.

**Consumes:** built/tested public exports and manifest. **Produces:** Merlyn consuming the complete ABMEX default without a local duplicated palette.

- [ ] Add tests for fresh start, saved theme preservation, explicit reset to shared default, legacy keys, unknown keys, malformed values, and two-window synchronization.
- [ ] Switch the shared consumer stylesheet to the tested single-compile recipe. Keep source scanning for src and entrypoints. Existing Vite Tailwind plugin stays.
- [ ] Replace raw compiled-CSS-as-editor-schema usage with the public manifest; retain compatibility callbacks and app-owned durable writes.
- [ ] Resolve each local style collision explicitly: shared design semantics move to themes; app layout/navigation stays local; intentional product exceptions receive documented overrides.
- [ ] Update design-sync paths: its current extraFonts path points at src/styles/phosphor and token ownership is configured as '..'. Resolve against new public themes exports and verify actual tooling support; do not assume string substitution alone works.
- [ ] Preserve active theme records and IDs. No storage deletion, mass default overwrite, or automatic activation of previously ineffective aliases.
- [ ] Run pnpm exec vitest run tests/components/ThemeEditorPanel.test.tsx tests/components/ThemeDefault.test.tsx and pnpm typecheck. Adjust only file selection to the existing test runner configuration, not scope.
- [ ] Disk-check, then run pnpm exec wxt build -b chrome and -b firefox to validate bundles without invoking release archive/deploy scripts.
- [ ] Inspect sidepanel, popup, and user-acceptance-test (UAT) entrypoints in installed browsers; verify editor, nested light/dark, drawer-only override, fonts, reduced motion, keyboard focus, root-font-size changes, and no-preference fresh launch.
- [ ] If package installation changes are needed, use local verified artifacts during development; a registry release/cutover is separately reviewable. User does not run these chores.

## Completion and rollback evidence

Completion requires built public packages and Merlyn consuming them, not merely a Markdown example or passing source parser. Record package versions/hashes, generated property coverage, source/compiled fixture results, saved-theme outcomes, browser evidence, and remaining deviations.

Rollback restores prior package pins and CSS import path. It must not require reversing destructive theme data migrations: preserve original records and unknown values throughout. Keep compatibility exports/aliases in the new package as required by additive extension.

## Research delivered versus implementation pending

Delivered: full pinned upstream code reference, namespace/semantics map, complete audited source declaration inventory, normalization mapping, collision register, phased file/test plan, and in-memory compiler evidence.

Pending: generated manifest implementation, package source entry, scope repair, editor upgrade, published/local installed artifact proof, Merlyn import change, builds, and browser acceptance. No runtime implementation claimed.

## Relations

- part_of [[projects/design-system/donor-component-extraction-parent]]
- depends_on [[projects/design-system/donor-component-extraction-parent/tailwind-4.3-default-theme-abmex-sso-t-reference]]

