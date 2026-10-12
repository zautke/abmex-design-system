# ABMEX Composable Compound Component Specification

**Status:** living specification, v1.0.0 of the feature set (32 features ruled `final` 2026-10-10). Layers land on the prototype one at a time; each layer's section is rewritten from "pending" to "landed" with the worked code in the same commit.
**Authority:** this file + `features.json` are the single source of truth for what every `@abmex` component must satisfy and how it is checked. The kb working record (`projects/design-system/ssot-component-spec/`) holds the research, the verbatim peer ledgers and the user rulings that produced it.
**Readers:** humans and consuming agents. Every feature section ends with *Instructions for consuming agents* — read those before touching a component.

---

## 0. Foundations

### 0.1 Governing principle — Composable Compound Components (CCC)

Only two kinds of component exist:

- **atom** — irreducible; contains no other component from the system.
- **compound** — composed of atoms and compounds.

Depth is emergent from composition and is never declared. Acyclicity replaces rank: a compound may compose anything that does not compose it back. No rank vocabularies (`atoms/molecules/organisms`, `primitives/components/core`, `primitives/patterns/complex`) and no subtype mechanics (`Base*` prefixes, `extends`, variant-as-subtype). Compound parts are exposed and recomposable by dot notation. **Placement determinism:** for any element, the rules in this document answer what it is and where it belongs without a human judgement call; if a person must arbitrate, the spec has a hole and the hole is filed as a defect.

### 0.2 Package model

```
@abmex/themes  ←  @abmex/ui  ←  @abmex/ai  ←  consumers (Merlyn, mdeditor, …)
```

- `@abmex/themes` — framework-neutral tokens (DTCG), compiled CSS entries per theme, pure theme controller. No React.
- `@abmex/ui` — generic, **plumbing-free** web components. The only package that imports `@heroui/*`. Renders fully with zero providers.
- `@abmex/ai` — still-generic AI components. **Must compose `@abmex/ui`.** May ship opinionated drop-in plumbing (model provider, token counting, persistence) behind injectable seams: every core part renders with zero adapters; defaults live under `@abmex/ai/adapters/*`.
- Placement between `ui` and `ai` is decided by the lexicon + deletion test (CF-20), not by taste.

### 0.3 Engine

HeroUI v3 (React Aria Components underneath, Tailwind v4) is the fixed base library. abmex components wrap HeroUI parts and emit **abmex's own contract**: the conventions below are chosen for the seam, not the engine. HeroUI already emits `data-slot="<component>-<part>"`, RAC `data-*` state attributes, `tv` slot recipes fanned through context, and preserves `className` as a render-prop function — the spec leans on those facts rather than fighting them. Base-library churn is a diagnosed failure mode; this spec does not reopen it.

### 0.4 Enforcement doctrine

A principle written as prose is advisory; a principle expressed as a check that fails CI is binding. **Every feature below names a mechanical check.** Rows scoped by a manifest flag report an explicit `exempt` verdict on components where the flag is absent — never silence. The prototype proves the exemption path.

### 0.5 How to read a feature section

Each `### CF-xx` section has: **Contract** (final wording as ruled), **Scope**, **Check** (file + what it asserts), **Status on prototype** (`pending layer N` | `landed layer N`), **Worked code** (once landed), **Instructions for consuming agents**.

### 0.6 The prototype and what it does not certify

The prototype is `Disclosure` (`prototype/Disclosure/`): `Disclosure` (Root) · `.Heading` · `.Trigger` · `.Content` · `.Body` · `.Indicator`; one boolean state. It was chosen because HeroUI ships a 1:1 reference DOM, it exercises the whole compound pipeline (dot notation, context fan-out, orphan detection, refs, provider twin) and defers selection, positioning and multi-reason change details to component #2 (Tabs or Select).

**Coverage disclaimer (required by R2):** Disclosure ships `formParticipation: false` and `field: false`. CF-26 and CF-29 are therefore **`exempt`**, not passed. CF-21 is `ai`-only and not exercised by a `ui` prototype. "Disclosure passes `pnpm spec:check`" must never be read as full coverage of the 32 features; certification of the exempt rows defers to the first value-holding / input-like component.

### 0.7 Layer plan

| Layer | Title | Lands | Notes |
|---|---|---|---|
| 1 | structure + `data-slot` | CF-01, 02, 04, 05, 27, 32 | CF-25 applied as a design constraint (`useId` only) |
| 2 | context + orphan errors | CF-15, 25 | hydration diff + aria-pair lint become regression gates |
| 3 | controlled state + details | CF-13, 24, 28 | `states` block + closed-world reason enum authored |
| 4 | render prop + refs | CF-11, 12 | re-run 24/25/28 |
| 5 | styling surface | CF-06, 07, 08, 09, 10, 30, 31 | first CSS appears here |
| 6 | motion | CF-22 | |
| 7 | final gates | CF-03, 14, 16, 17, 18, 19, 20, 23 | re-run 24/25/32; CF-21/26/29 `exempt` |

One commit per layer: `spec(<layer-lead-id>): …`. Each commit contains the layer's code, its checks, and the rewritten SPEC sections.

---

## 1. Features

### CF-01 Kind manifest

**Contract.** Every component ships `<Name>.manifest.json` colocated with its source: `kind: atom | compound`, `parts` (slot names), `partMap` (Part → slot), options table (prop / values / default / part), `states` block (or `declared: false`), `formParticipation`, `field`, `events`, `lifecycle { status, a11yReviewed }`, `budget`, `tokens`, `stories`, `native`, `coverage { exercises, exempt }`. Docs, status pages, parity tables and several checks are generated from it; the manifest is the countable unit of the component grind.
**Scope.** common.
**Check.** `checks/cf01-manifest.test.ts` — required fields present; `kind` ∈ {atom, compound}; `partMap` values ⊆ `parts`; `Root` maps to `<component>`; every slot is `<component>` or `<component>-<part>`.
**Status on prototype.** landed layer 1.
**Worked code.** `prototype/Disclosure/Disclosure.manifest.json`.
**Instructions for consuming agents.** Author the manifest *before* the component file. If you cannot fill `kind` or `parts` without debating, stop: the spec has a placement hole — file it, do not guess. Never hand-edit `lifecycle.status` (see CF-17). Flag-scoped rows (`formParticipation`, `field`, `states`, `events`) default to `false`/`declared:false`; declare them truthfully — exemptions are visible in CI.

### CF-02 Anatomy before code (data-slot)

**Contract.** Parts are declared in the manifest first. Every part renders exactly one element carrying `data-slot="<component>-<part>"` (Root carries `data-slot="<component>"`). This is the HeroUI/shadcn convention, so engine parts and abmex parts share one vocabulary. *Amended R1:* the check is state-matrix aware — per rendered state, rendered `data-slot` set ⊆ manifest parts; the **union across the state matrix == manifest parts** (parts may mount conditionally).
**Scope.** common.
**Check.** `checks/cf02-anatomy.test.tsx` — renders the component in every declared state; asserts per-state subset, union equality, and one element per slot.
**Status on prototype.** landed layer 1.
**Worked code.** Layer 1 wraps HeroUI's `Disclosure.*`, which already emits the six slots; the check pins them to the manifest.
**Instructions for consuming agents.** Style and test by `[data-slot="…"]`, never by class name or DOM position. When adding a part: manifest first, then the element, then the check turns green. A consumer element passed through `render` (CF-11) must still receive the slot attribute.

### CF-03 Acyclic composition, directional packages

**Contract.** Atoms import no system component. The component graph inside each package is a DAG. Package edges are `ai → ui → themes` only; `ui` never imports `ai`; **only `ui` imports `@heroui/*`**; `ai` components compose `ui` components (no raw intrinsic element where a `ui` part exists; layout wrappers allow-listed).
**Scope.** common.
**Check.** `checks/cf03-depcruise.mjs` — dependency-cruiser `no-circular` + forbidden-edge rules; JSX lint in `ai` for intrinsic elements with a `ui` counterpart.
**Status on prototype.** pending layer 7.
**Instructions for consuming agents.** Before importing across packages ask: does the edge point toward `themes`? If not, the design is wrong, not the lint. In `ai`, reach for a `ui` part first; if none exists, the generic part is missing from `ui` — add it there.

### CF-04 No rank vocabulary / no subtype

**Contract.** No directory named `atoms|molecules|organisms|primitives|core|patterns`. No exported identifier `Base*`. No `class … extends <system component>`. No variant modelled as a subtype.
**Scope.** common.
**Check.** `checks/cf04-vocabulary.test.ts` — directory denylist, export regex, `extends` scan over `specification/`; extends to `packages/*/src` when migration starts.
**Status on prototype.** landed layer 1.
**Instructions for consuming agents.** The current `packages/ui/src/primitives/` folder violates this and is scheduled for removal under the migration plan. Do not create new rank folders "for now".

### CF-05 Dot-notation parts only

**Contract.** A compound's parts are reachable only as `Compound.Part`. No part is exported flat beside its root. The compound is the single runtime export of its entry.
**Scope.** common.
**Check.** `checks/cf05-exports.test.ts` — entry has exactly one runtime export; every manifest part is a function on it; no `<Name><Part>` or bare `<Part>` export.
**Status on prototype.** landed layer 1.
**Worked code.** `export const Disclosure = Object.assign(Root, { Heading, Trigger, Content, Body, Indicator })`.
**Instructions for consuming agents.** HeroUI exports parts flat *and* as a compound; abmex re-exports only the compound. Types for part props are exported (`Disclosure<Part>Props`) — types are not runtime exports.

### CF-06 Dual styling: import-level unstyled

**Contract.** With no abmex/HeroUI CSS imported, every component renders, is interactive and axe-clean. Styled defaults are a **separate CSS entry per theme**. *Amended R1:* class-name emission (tv recipes) may remain in unstyled mode — structure and state live in `data-slot`/`data-*`; **the styled seam is the per-theme CSS entry, not classes.** There is **no per-part `unstyled` prop** (the Panda partial-unstyled trap).
**Scope.** common.
**Check.** `checks/cf06-unstyled.test.tsx` — CI job renders each component with all style entries stripped: render ok, `data-*` fire on interaction, axe passes.
**Status on prototype.** pending layer 5.
**Instructions for consuming agents.** To go headless: do not import the theme CSS. Do not add an `unstyled` prop; do not strip classes at runtime.

### CF-07 Styling surface

**Contract.** Consumer styling surfaces are exactly: `className` (string **or** `(state) => string`, RAC/HeroUI-native), `style` (object or `(state) => object`), and `classNames<Part>` on Root. State is addressed via `data-*` only. No bespoke `*ClassName`/`*Style` props. Consumer classes merge last.
**Scope.** common.
**Check.** `checks/cf07-styling-surface.test.tsx` — type-level lint on prop names; merge-order test (consumer wins).
**Status on prototype.** pending layer 5.
**Instructions for consuming agents.** Prefer `[data-slot][data-state]` CSS over render-prop className; use the function form only when a class depends on interaction state the engine exposes.

### CF-08 State vocabulary

**Contract.** *Amended R1:* **`aria-*` is the semantic source of truth** (`aria-disabled`, `aria-expanded`, …). `data-*` is the styling mirror with a fixed vocabulary: RAC `hovered, pressed, focus-visible, focused, disabled, pending, selected, invalid, entering, exiting`, plus boolean part states serialised as `data-<state>="true|false"` (HeroUI `dataAttr`, e.g. `data-expanded`). No bespoke state classes.
**Scope.** common.
**Check.** `checks/cf08-state-vocab.test.tsx` — lint on `data-` attribute names against the vocabulary; state-matrix snapshot asserts both boolean values reachable.
**Status on prototype.** pending layer 5.
**Instructions for consuming agents.** Test behaviour through `aria-*`; style through `data-*`. Never invent `data-open` when the engine emits `data-expanded`.

### CF-09 Variants at Root via `tv`, fanned by slots

**Contract.** Variants and sizes are defined once with a `tailwind-variants` slot recipe on Root; parts read their slot through context; variant props exist **only on Root**; every anatomy part has a recipe slot (silent drift is a known failure: Chakra).
**Scope.** common.
**Check.** `checks/cf09-variants.test.tsx` — tsd: part props exclude variant keys; validator: manifest parts ⊆ recipe slots.
**Status on prototype.** pending layer 5.
**Instructions for consuming agents.** Extend variants by `tv({ extend })` at Root only. Never add a `variant` prop to a part.

### CF-10 Tokens only, with lifecycle

**Contract.** No hex/px/shadow literals in component or theme source (allow `0`, `transparent`, `currentColor`). Tokens come from `@abmex/themes` (components consume Layer 2 only). Token lifecycle: deprecated → warn, soft-deleted → error, with autofix.
**Scope.** common.
**Check.** `checks/cf10-tokens.mjs` — eslint + stylelint rules; token lifecycle table from themes.
**Status on prototype.** pending layer 5.
**Instructions for consuming agents.** If a value you need has no token, add the token in `themes` first (both layers), then use it. Spacing, radius, breakpoints, opacity are tokens too — the categories every prior attempt skipped.

### CF-11 Polymorphism = `render` only

**Contract.** `render?: ReactElement | (props, state) => ReactElement` with the RAC contract: single root, the expected element type, all domProps forwarded. **No `asChild`.** Dev warning when `children` and `render` are both set (the overwrite footgun).
**Scope.** common.
**Check.** `checks/cf11-render.test.tsx` — tagName unchanged, props/ref forwarded, `data-slot` present on the rendered element, warning fires.
**Status on prototype.** pending layer 4.
**Instructions for consuming agents.** To integrate a router link or motion element, use `render`, spread the provided props, keep the element type. Do not reach for Radix `Slot`.

### CF-12 Refs

**Contract.** Every part forwards its ref to its own DOM node. *Amended R1:* **atom Root = the single focusable element; compound Root = its wrapper node;** `focus()` lives on the focusable parts (e.g. `Disclosure.Trigger`), never redirected from Root.
**Scope.** common.
**Check.** `checks/cf12-refs.test.tsx` — generated `ref.current instanceof <expected>` per part.
**Status on prototype.** pending layer 4.
**Instructions for consuming agents.** Need to focus a compound? Ref the focusable part, not Root.

### CF-13 Controllable state with details

**Contract.** Every state exposes the triple `value` / `defaultValue` / `onValueChange(value, details)` where `details = { reason, nativeEvent, cancel() }`. `reason` is `'unknown'` where RAC cannot supply one. `cancel()` is the only supported way to veto a change (wrapper-gated commit over RAC callbacks).
**Scope.** common.
**Check.** `checks/cf13-controllable.test.tsx` — per-reason interaction tests (e.g. Escape → `'escape-key'`); controlled vs uncontrolled parity.
**Status on prototype.** pending layer 3.
**Instructions for consuming agents.** Never keep consumer-invisible internal state. If you find yourself needing `preventDefault` to stop a change, use `details.cancel()`.

### CF-14 Root provider escape hatch

**Contract.** Each compound offers `use<Name>(options)` + `<Name.RootProvider value>` so state and methods are reachable outside the tree (required by `ai` drop-in plumbing). Declarative and provider-driven renders produce identical DOM.
**Scope.** common.
**Check.** `checks/cf14-root-provider.test.tsx` — twin render diff.
**Status on prototype.** pending layer 7.
**Instructions for consuming agents.** Reach for `RootProvider` only when something outside the compound must drive it; otherwise stay declarative.

### CF-15 Orphan-part error

**Contract.** A part rendered outside its Root throws a **named error with a code** (dev and prod). Parts render in JSX order and are individually removable.
**Scope.** common.
**Check.** `checks/cf15-orphan.test.tsx` — orphan render expects the named error; shuffled/omitted parts render in JSX order.
**Status on prototype.** landed layer 2.
**Worked code.** `prototype/errors.ts` defines `OrphanPartError` (`name: 'OrphanPartError'`, `code: 'ABMEX_ORPHAN_PART'`, `component`, `part`). `prototype/Disclosure/Disclosure.tsx` creates its own `DisclosureContext` (a presence flag, nothing else); `Root` provides it, every other part calls `usePart('<Part>')` which throws when the flag is absent. The engine's context is deliberately not reused for this: its failure mode is silent or cryptic, which is what this row forbids. The manifest lists the error under `errors[]`.
**Check result.** `cf15-orphan.test.tsx`: each of the five non-root parts rendered alone throws an `OrphanPartError` whose `name`, `code`, `component`, `part` and message are asserted; `Content` before `Heading` serialises Content-first (JSX order); a composition without `Indicator`/`Body` renders.
**Instructions for consuming agents.** The error code is a docs lookup key; do not catch and swallow it. Every component owns one presence context; the hook is `usePart(name)` and it is the first statement of every non-root part. Do not put layout or state in this context — that is layer 3's job and lives in the engine. Add each thrown code to the manifest `errors[]`.

### CF-16 A11y floor

**Contract.** axe-clean in styled **and** unstyled modes on every story/state; keyboard map per ARIA APG; *amended R1:* "visible focus" applies to the styled layer; **unstyled floor = axe-clean + focus outline not suppressed** (no `outline: none` without a fallback). `a11yReviewed` (date | null) is tracked in the manifest separately from lifecycle status.
**Scope.** common.
**Check.** `checks/cf16-a11y.test.tsx` — jest-axe ×2 modes; keyboard tests; manifest field.
**Status on prototype.** pending layer 7.
**Instructions for consuming agents.** HeroUI/RAC underneath do not make a composition WCAG-compliant; audit the composition.

### CF-17 Lifecycle status with gates

**Contract.** `draft → alpha → beta → stable → deprecated`. Alpha already requires CF-06/08/10/16 + VRT + unit tests. Entrypoints segregate `/experimental` and `/deprecated`. Deprecate before remove, with a dev-only `warning()` and at least one minor of deprecation.
**Scope.** common.
**Check.** `checks/cf17-lifecycle.mjs` — the transition script is the only path that changes `lifecycle.status` (it verifies the gate list); lint forbids deleting an export that was never `deprecated`.
**Status on prototype.** pending layer 7.
**Instructions for consuming agents.** Run the transition script; never edit `status` by hand.

### CF-18 Per-component test + story floor

**Contract.** RTL tests covering the entire public API; a story with controls per option (`className`/`children` hidden from controls); VRT of every story; axe on every story; required test ids present.
**Scope.** common.
**Check.** `checks/cf18-spec-matrix.mjs` — meta-lint over test descriptors; story coverage vs manifest options.
**Status on prototype.** pending layer 7.
**Instructions for consuming agents.** A component without its matrix is not done, whatever the build says.

### CF-19 Docs generated + agent instructions

**Contract.** Reference docs are generated from manifest + types; each component carries an "instructions for consuming agents" section; CI fails on drift.
**Scope.** common.
**Check.** `checks/cf19-docs-drift.mjs`.
**Status on prototype.** pending layer 7.
**Instructions for consuming agents.** Do not write narrative session notes into component docs. Edit the manifest or the instructions section; everything else is generated.

### CF-20 Placement gate (ui vs ai)

**Contract.** A versioned AI lexicon (JSON, **semver**) is grepped over exported `.d.ts` identifiers and default-rendered strings; any hit → `ai`; the deletion test then splits shell → `ui`, wiring → `ai`. *Amended R1:* lexicon changes route through placement-lane review.
**Scope.** common.
**Check.** `checks/cf20-boundary-vocab.mjs`.
**Status on prototype.** pending layer 7.
**Instructions for consuming agents.** You do not decide where a component goes. Run the gate. If the result feels wrong, propose a lexicon change — with a semver bump.

### CF-21 `ai` plumbing seam

**Contract.** `@abmex/ai` core parts are props-first with abmex-owned types (own `role` enum — not `UIMessage["role"]`); every core part renders with zero providers; opinionated drop-in defaults (model provider, token counting, persistence) ship behind optional context/adapters under `@abmex/ai/adapters/*`; core forbids importing `ai` or any runtime SDK.
**Scope.** ai.
**Check.** `checks/cf21-ai-seam.test.tsx` — empty-tree render per `ai` export; import lint; adapters only via subpath exports.
**Status on prototype.** `exempt` (ui prototype).
**Instructions for consuming agents.** Mine AI Elements/assistant-ui for part taxonomy only, never styling or coupling. "Missing runtime context" must never be a crash mode here.

### CF-22 Motion + popup hooks

**Contract.** Enter/exit exposed via RAC `data-entering`/`data-exiting`; reduced motion honoured (motion tokens, `motion-reduce`); positioned popups expose `--available-height`/`--anchor-width`.
**Scope.** common.
**Check.** `checks/cf22-motion.test.tsx` — attribute presence during transitions; computed-style test under constrained viewport.
**Status on prototype.** pending layer 6.

### CF-23 Cross-platform parity declared

**Contract.** The manifest lists the native (SwiftUI) counterpart status; a parity table is generated. Parity is a declared status, not a promise.
**Scope.** common.
**Check.** `checks/cf23-parity.mjs`.
**Status on prototype.** pending layer 7.

### CF-24 Declared state machine

**Contract.** *Amended R2:* the manifest `states` block (states, events, transitions) is machine-readable; **`details.reason` is a closed-world enum declared in the manifest** and the TS union derives from it; no undeclared transition is reachable. Components without a `states` block pass vacuously.
**Scope.** common (flag: `states`).
**Check.** `checks/cf24-state-machine.test.tsx` — model-based walk covers 100 % of manifest transitions; undeclared DOM state fails. Harness shared with CF-28.
**Status on prototype.** pending layer 3.

### CF-25 SSR & id determinism

**Contract.** All generated ids via `useId`; *amended R2:* **static HTML ≡ hydrated DOM before any interaction (full serialisation diff)** including initial `data-*`; aria id pairs (`aria-controls`, `aria-labelledby`, `aria-owns`) resolve in static HTML. The "no client-only effects in first paint" intent is covered by this gate.
**Scope.** common.
**Check.** `checks/cf25-ssr.test.tsx` — hydration diff per story; static-HTML aria-pair lint.
**Status on prototype.** gate landed layer 2; re-run after layer 6 (motion) and at layer 7.
**Worked code.** `prototype/Disclosure/Disclosure.fixtures.tsx` exports `fixtures` (`collapsed`, `expanded`, `disabled`), full compositions in distinct initial states; stories (CF-18) will import these. `cf25-ssr.test.tsx` runs per fixture: `renderToString` → (1) every `aria-controls|labelledby|owns|describedby|errormessage` reference resolves by id inside the static HTML; (2) `hydrateRoot` into that HTML under `act` with `console.error` captured → zero hydration warnings; (3) full `innerHTML` equality static vs hydrated.
**Finding (engine).** Hydration is warning-free and every id/aria/`data-*` value is identical, but the engine rewrites two attributes on `disclosure-content` in layout effects after hydration: RAC sets `hidden="until-found"` (not server-renderable; static carries `hidden=""`), and HeroUI writes inline `--disclosure-panel-width/height` for its height animation. These are **declared** in the manifest under `ssr.postHydrationMutations` as exact values — `static` (server-rendered value, `null` = absent) and `hydrated` (a full-match regex) plus a reason. The check asserts both values per fixture, then diffs the remaining serialisation; an attribute that drifts from the declared values fails, and a declared mutation that never occurs in any fixture fails (no stale allowlist). The `style` entry is motion territory and is re-evaluated at layer 6.
**Instructions for consuming agents.** Never author an id; take it from `useId`/the engine. Add a fixture for every distinct initial state. If the hydration diff fails: first look for a client-only effect you introduced (that is a bug, fix it); only an engine effect you cannot avoid goes into `ssr.postHydrationMutations`, with exact `static`/`hydrated` values and a reason; it must occur in at least one fixture or the check fails.

### CF-26 Form participation

**Contract.** *Amended R2:* owns **submission semantics only** — components with `formParticipation: true` accept `name`, append to `FormData`, exclude disabled parts. Invalid wiring belongs to CF-29.
**Scope.** flag `formParticipation`.
**Check.** `checks/cf26-form.test.tsx` — jsdom submit FormData snapshot; disabled-exclusion test; `exempt` when flag false.
**Status on prototype.** `exempt` (`formParticipation: false`).

### CF-27 Provider-free `ui`

**Contract.** Every `ui` component renders its full `data-slot` DOM with zero providers; providers only inject defaults, tokens or recipes — never required for state or accessibility. (CF-21 restated one level down; kept separate so neither row is merged away.)
**Scope.** ui package.
**Check.** `checks/cf27-provider-free.test.tsx` — empty-tree render asserts every slot; aria pair resolves with generated ids.
**Status on prototype.** landed layer 1.
**Worked code.** `prototype/Disclosure/Disclosure.tsx` — no provider, no context of its own at layer 1.
**Instructions for consuming agents.** If a `ui` component needs a provider to render, the plumbing is in the wrong package.

### CF-28 Event composition order

**Contract.** Consumer handlers are always invoked; *amended R2:* the manifest declares **`eventOrder` per part (`internal-first | consumer-first`)** and the implementation must match; `details.cancel()` is the only suppression path; consumer `preventDefault` must not desync internal state (state after consumer `preventDefault` ≡ state with no handler unless `cancel()` was called).
**Scope.** common (flag: `events`).
**Check.** `checks/cf28-event-order.test.tsx` — spy-order test vs manifest; preventDefault-desync test.
**Status on prototype.** pending layer 3.

### CF-29 Field & error wiring

**Contract.** Input-like components (`field: { wiring: 'rac' | 'custom' }`) consume RAC field contexts (Label/Description/FieldError) or, with `wiring: 'custom'` and a recorded rationale, ship equivalent parts that pass the same checks; invalid sets `data-invalid` + `aria-errormessage`/`aria-describedby`.
**Scope.** flag `field`.
**Check.** `checks/cf29-field.test.tsx` — id-resolution test; error story axe-clean; `exempt` when `field: false`.
**Status on prototype.** `exempt` (`field: false`).

### CF-30 RTL & locale

**Contract.** Logical CSS properties only; direction/locale inherited from RAC `I18nProvider`; no hard-coded direction. *Amended R2:* exemptions require `/* abmex-rtl-exempt: <reason> */` and are **counted in CI, ratcheting to zero**.
**Scope.** common (package-level lint over themes + any ui CSS).
**Check.** `checks/cf30-rtl.mjs` — stylelint logical-properties; RTL snapshot per component.
**Status on prototype.** pending layer 5.

### CF-31 Theme application & namespace

**Contract.** A theme is a CSS entry keyed on `[data-theme]` inside `@layer`; all theme classes are `abmex-` prefixed; no global element selectors; switching themes is an attribute swap. *Amended R2:* check adds a **render-count probe = 0 and node identity preserved** on swap. Component-side obligation is `data-slot` stability.
**Scope.** themes package.
**Check.** `checks/cf31-theme-entry.test.tsx` — selector lint (prefix + layer); computed-style swap test with render-count probe.
**Status on prototype.** pending layer 5.

### CF-32 Per-component entry & budget

**Contract.** `@abmex/ui/<Name>` subpath export per component; ESM-only; `sideEffects: false` with a `"**/*.css"` carve-out if `ui` ever ships CSS (themes-only CSS preferred); *amended R2:* the manifest carries a **`budget`** and size-limit CI fails on exceed; importing one component excludes the others.
**Scope.** common (build-level + manifest).
**Check.** `checks/cf32-entry-budget.test.ts` — layer 1: entry scaffold (index, manifest budget, no colocated CSS); packaging layer: treeshake + size-limit.
**Status on prototype.** scaffold landed layer 1; treeshake/size-limit pending packaging.
**Instructions for consuming agents.** Import `@abmex/ui/Disclosure`, not the root barrel, when bundle size matters.

---

## 2. Layer log

### Layer 1 — structure + `data-slot` (landed)

- Files: `prototype/Disclosure/{Disclosure.tsx,index.ts,Disclosure.manifest.json}`, `checks/{manifest.ts,cf01,cf02,cf04,cf05,cf27,cf32,features-vs-spec}`.
- Engine: `@heroui/react` `Disclosure.{Root,Heading,Trigger,Content,Body,Indicator}` (RAC Disclosure underneath). HeroUI already emits the six `data-slot` values and the `aria-controls`/`aria-expanded` pair via `useId`; layer 1 pins the public shape (compound only) and the anatomy to the manifest.
- Deliberately absent (later layers): own context, orphan errors, `onValueChange(details)`, `render`, refs policy, styling surface, motion.
- Run: `pnpm spec:check`.

### Layer 2 — context + orphan errors (landed)

- Files: `prototype/errors.ts`, `prototype/Disclosure/{Disclosure.tsx,Disclosure.fixtures.tsx,Disclosure.manifest.json}`, `checks/{cf15-orphan.test.tsx,cf25-ssr.test.tsx,manifest.ts}`.
- Own presence context + `usePart` per part → `OrphanPartError` (`ABMEX_ORPHAN_PART`). Manifest gains `errors[]`, `fixtures[]`, `ssr.postHydrationMutations[]`.
- CF-25 gate found two engine post-hydration mutations on the content panel (`hidden` → `until-found`; motion CSS vars); declared, not silenced; `style` entry revisited at layer 6.
- Deliberately absent (later layers): controlled state + `details` (3), `render` + refs (4), styling surface (5), motion (6).
- Run: `pnpm spec:check` — 9 files / 39 tests.
- Review follow-up (PR #7, Codex + Copilot): JSON schemas `features.schema.json` + `checks/manifest.schema.json` now exist and are validated with ajv (CF-01, completeness gate); completeness gate covers every landed layer; CF-02 uniqueness per state; CF-05 compares all runtime keys; CF-25 asserts exact `static`/`hydrated` values instead of stripping attributes.
