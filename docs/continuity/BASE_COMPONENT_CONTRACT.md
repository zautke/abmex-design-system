# Base Component Contract

Revision: 0.9 — initial policy interview complete; implementation pending, 2026-10-22.

Parent: [[projects/design-system/donor-component-extraction-parent]]
Knowledge-base record: projects/design-system/donor-component-extraction-parent/base-component-contract
Repository continuity copy: docs/continuity/BASE_COMPONENT_CONTRACT.md

## Purpose and authority

Define the common public contract for ABMEX components and their reusable parts. This contract guides new donor extractions and downstream additive alignment of existing inventory. It is a living design document: improve it throughout this effort.

User-approved principles are binding. Exact API spellings and the prototype below are provisional examples, not a finalized universal interface. Do not treat draft examples as permission to break existing consumers.

The knowledge-base note is the canonical decision record; the repository copy is its version-controlled working counterpart, not a second knowledge base. Update both in the same change, record revision and provenance, and verify the shared body. If kb is unavailable, use the established deferred-kb-sync procedure.

## Confirmed principles

Source for all entries: user interview in this conversation, 2026-10-21.

1. **Maximum Flexibility Axiom.** Decompose final components into independently reusable intermediates and primitives. Reconstruct donor capabilities from them.
2. **Additive-only extension.** Preserve existing imports, supported options, defaults, behavior, and consumer contracts. Extend compatible components rather than creating near-duplicates.
3. **Stable named public parts.** Give each component a documented public-part contract. Consumers target supported parts, not incidental internal DOM structure.
4. **Working, replaceable defaults.** Components should work when dropped in; consumers can replace applicable content, styling, behavior, state management, and integrations.
5. **Shared principles, capability-specific interfaces.** The extraction skill must be prop/functionality agnostic. Derive applicable interfaces from responsibilities rather than imposing sidebar-specific flags on every component.
6. **Public reusable layers.** Primitives and intermediates receive supported exports, documentation, and demonstrations.
7. **ABMEX token authority.** Map existing semantics first; promote missing donor semantics with provenance. Existing ABMEX semantics win conflicts; deliberate differences become named themes/variants.
8. **Instance independence.** Multiple instances may have different functions, state, and content. Shared state is explicit. User example: unrelated left and right sidebars.
9. **Persistence capability.** Stateful components support in-memory defaults, optional cross-session localStorage, and externally controlled app state. Reusable hooks are required where missing; audit inventory before creating them.
10. **Durable versus transient state.** When persistence is enabled, persist durable preferences by default; transient interaction state is excluded unless configured. Width/collapsed state are sidebar examples, not universal fields.
11. **Content lifecycle.** Collapsing preserves mounted content and state by default. Hidden content must not remain focusable or exposed incorrectly to assistive technology. Optional unmounting/restoration is capability-specific. User withdrew the word “reversible”; do not introduce undo/redo requirements.
12. **Proposal before implementation.** Every extraction explains reuse, compatible extension, composition, and creation decisions with evidence.
13. **Two-composition proof.** Verify donor fidelity and a materially different composition using the same public parts.
14. **Current platform scope.** React/TypeScript, semantic HTML, CSS, mandatory Tailwind support. Shared tokens/behavior contracts allow later platform implementations; those implementations are not authorized now.
15. **Named-part vocabulary.** Use slots for replacement and slotProps for configuration, preserving existing public interfaces additively.
16. **Polymorphism.** Promote as as the explicit underlying-element/custom-component selector; exact semantic substitution rules are under design.

## Public contract surfaces

| Surface | Guarantee | Applicability |
|---|---|---|
| Identity and semantics | Document root/part semantics, accessible naming, refs, and native attributes | Every rendered component |
| Configuration | Typed documented defaults and options; omissions preserve behavior | Components with configuration |
| Composition | Replace meaningful content, parts, or rendering without private DOM selectors | Applicable compositions |
| Prop forwarding | Root and named-part consumer props reach their intended elements | Exposed rendered parts |
| Styling | Token-based defaults, named part classes/styles, explicit merge policy | Every styled part |
| Behavior | Document event composition, cancellation, replacement, and protected invariants | Interactive components |
| State ownership | Controlled/uncontrolled contracts without competing owners | Stateful components |
| Persistence | In-memory, localStorage, or consumer-owned persisted state | Persistable state |
| Compatibility | Existing consumers continue to work after extensions | Every public change |

A capability marked not applicable needs a concrete rationale in the inventory matrix. Do not add meaningless props to stateless primitives.

## Proposed configuration and extension conventions

These conventions need further interview and implementation validation.

- Native root props and refs remain available. slotProps is adopted for named parts; top-level root prop forwarding and collision precedence remain unresolved.
- Named part props generalize examples such as InputProps. An input-containing component exposes input props; a layout need not.
- styles supplies root/part CSSProperties; classNames supplies root/part classes. Final names remain provisional.
- options contains typed behavior/presentation controls owned by the public contract, not unrestricted mutation of internals.
- Distinguish content replacement, element replacement, and behavior replacement. Their accessibility and typing obligations differ.
- Publish the stable part names and capabilities for each part. Add parts compatibly; do not silently rename or remove them.
- Define precedence for defaults, options, part props, styles, refs, and callbacks. Tailwind conflict resolution is not solved by concatenating class strings.
- Maintain semantic invariants when consumers replace parts. Document obligations for custom renderers, including forwarding props/refs and avoiding nested interactive elements.

## Proto-component: executable shape, provisional API

This TypeScript/TSX example implements a small action component, not a base class or a complete production contract. It is intentionally stateless; persistence belongs in a stateful capability example, not on every component.

It demonstrates typed options, named parts, native root props/ref, consumer styles and classes, replaceable content/root rendering, and cancellable action callbacks. Root replacement is deliberately button-compatible in this first prototype. The later polymorphic signature demonstrates the adopted as direction; runtime polymorphism and slots replacement are not implemented by this first example.

```tsx
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithRef,
  CSSProperties,
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  ReactNode,
} from "react";

type Part = "root" | "icon" | "label";
type SpanProps = Omit<HTMLAttributes<HTMLSpanElement>, "children">;
type RootProps = Omit<ComponentPropsWithRef<"button">, "children">;

export interface ProtoComponentProps {
  label: string;
  icon?: ReactNode;
  children?: ReactNode;
  options?: { density?: "compact" | "comfortable" };
  slotProps?: {
    root?: RootProps;
    icon?: SpanProps;
    label?: SpanProps;
  };
  classNames?: Partial<Record<Part, string>>;
  styles?: Partial<Record<Part, CSSProperties>>;
  onAction?: (event: MouseEvent<HTMLButtonElement>) => void;
  renderRoot?: (
    props: ComponentPropsWithRef<"button">
  ) => ReactElement;
}

const classes = (...values: Array<string | undefined>) =>
  values.filter(Boolean).join(" ");

export function ProtoComponent({
  label,
  icon,
  children,
  options,
  slotProps,
  classNames,
  styles,
  onAction,
  renderRoot,
}: ProtoComponentProps): ReactElement {
  const density = options?.density ?? "comfortable";
  const root = slotProps?.root ?? {};
  const iconProps = slotProps?.icon ?? {};
  const labelProps = slotProps?.label ?? {};

  const onClick: ButtonHTMLAttributes<HTMLButtonElement>["onClick"] =
    (event) => {
      if (root.disabled || root["aria-disabled"] === true ||
          root["aria-disabled"] === "true") {
        event.preventDefault();
        return;
      }
      root.onClick?.(event);
      if (!event.defaultPrevented) onAction?.(event);
    };

  const content = children !== undefined ? children : (
    <>
      {icon != null && (
        <span
          {...iconProps}
          data-slot="icon"
          aria-hidden="true"
          className={classes(
            "inline-flex shrink-0",
            iconProps.className,
            classNames?.icon,
          )}
          style={{ ...iconProps.style, ...styles?.icon }}
        >
          {icon}
        </span>
      )}
      <span
        {...labelProps}
        data-slot="label"
        className={classes(labelProps.className, classNames?.label)}
        style={{ ...labelProps.style, ...styles?.label }}
      >
        {label}
      </span>
    </>
  );

  const props: ComponentPropsWithRef<"button"> & {
    "data-slot": string;
    "data-density": string;
  } = {
    ...root,
    type: root.type ?? "button",
    "aria-label": root["aria-label"] ?? label,
    "data-slot": "root",
    "data-density": density,
    className: classes(
      "inline-flex items-center",
      density === "compact" ? "gap-1 p-1" : "gap-2 p-2",
      root.className,
      classNames?.root,
    ),
    style: { ...root.style, ...styles?.root },
    onClick,
    children: content,
  };

  return renderRoot ? renderRoot(props) : <button {...props} />;
}
```

### Prototype behavior and limits

- Defaults: comfortable density, native button, decorative icon, text label.
- children replaces the complete default content; null intentionally renders no content.
- styles overrides same-property values in slotProps.*.style.
- Consumer root click runs before onAction and may cancel it with preventDefault.
- Disabled or aria-disabled root suppresses the action.
- Root ref and native button props pass through slotProps.root, including to renderRoot.
- renderRoot must preserve the button-compatible semantics, supplied props, and ref. The type signature alone cannot enforce forwarding.
- data-slot and data-density are component-owned state/identity attributes in this example.
- Class concatenation preserves supplied classes but does not implement the approved conflict-resolution policy below. Production merging remains unimplemented.
- Decorative icon content must not contain interactive children. Rich multi-action rows need separate noninteractive composition.
- The prototype does not implement theme tokens, persistence, animation, focus styling, or full accessibility of arbitrary replacement content. It is a contract discussion artifact, not a shippable control.
- Validation status: strict TypeScript 5.9.3 with React 19.2.14 types passed with zero diagnostics using an in-memory compiler host; no files emitted. Browser/runtime behavior has not been tested.

## Existing inventory alignment

Create a per-component matrix rather than enforcing a universal prop bag blindly:

| Component / public part | Capability | Current support | Gap | Additive change | Existing consumers | Verification |
|---|---|---|---|---|---|---|

Allowed assessment statuses: supported; missing; inapplicable with rationale; compatible adapter required.

Do not rename existing props or change defaults to conform to the new convention. Add aliases/adapters or capabilities compatibly, documenting precedence if both old and new entry points are supplied. If a change cannot preserve the contract, redesign it; additive-only is a requirement, not permission to introduce breaking migrations.

### Approved enforcement rollout

User confirmed 2026-10-21: block new contract violations immediately once enforcement gates are implemented. Every new component must comply. Baseline existing inventory gaps explicitly and remediate them additively; modifications must not introduce new gaps or regress existing support. The baseline is tracked debt, not a claim of compliance. Gate implementation remains pending.

## Acceptance methodology

- Inventory and donor evidence support each reuse/extension/creation decision.
- Named-part props, styles, refs, and replacement behavior reach the intended target.
- Existing consumer behavior and defaults remain covered by regression evidence.
- Donor fidelity and a materially different second composition use the same public parts.
- Independent instances do not leak state, persistence keys, styling scope, or navigation behavior.
- Applicable state can be controlled by the app or managed through defaults, with one authoritative owner.
- Persistence handles unavailable storage, malformed/versioned data, server rendering, and explicit instance keys; exact hook APIs remain open.
- Hidden/collapsed content follows the declared lifecycle/accessibility contract.
- Public package imports, emitted types, compiled CSS, and Tailwind support work in real consumers.
- Test applicable behaviors; do not require every stateless primitive to implement every capability.

## Conventional extension surfaces — research 2026-10-21

Evidence: official current documentation, Context7 /mui/material-ui, and GitHub code search. These are design recommendations, not newly approved requirements or a dependency selection.

| Convention | Evidence | Proposed ABMEX application |
|---|---|---|
| Named replacements and forwarded props | [MUI structure](https://mui.com/material-ui/customization/overriding-component-structure/): slots replaces parts; slotProps configures parts, including state callbacks | Prefer one consistent named-part vocabulary; evaluate slots/slotProps over unrelated InputProps, TriggerProps, etc. Preserve existing props additively. |
| Root element/component replacement | MUI component, [Base UI render](https://base-ui.com/react/handbook/composition), [Radix asChild](https://www.radix-ui.com/primitives/docs/guides/composition) | Choose one primary replacement protocol and define semantic/ref obligations. Do not expose every library's synonym. |
| Per-part styling | [Mantine Styles API](https://mantine.dev/styles/styles-api/): classNames, styles, variable resolvers, documented selectors | Retain root className/style plus named part classes/styles; use public CSS variables tied to ABMEX tokens. |
| State-aware render/style callbacks | [React Aria customization](https://react-aria.adobe.com/customization) and [Base UI Select](https://base-ui.com/react/components/select) | Supply a typed public state snapshot to applicable children, class/style, or slot-prop callbacks, not private internals. |
| Provider-level component defaults | [MUI themed components](https://mui.com/material-ui/customization/theme-components/) | Allow scoped shared defaults, with explicit instance overrides; do not duplicate theme state per control. |
| Variants, sizes, compound variants | [Chakra slot recipes](https://chakra-ui.com/docs/theming/slot-recipes) | Use typed variant recipes spanning named parts and existing ABMEX tokens; only expose relevant axes. |
| Unstyled rendering | [Mantine unstyled](https://mantine.dev/styles/unstyled/) | Consider an opt-in presentational-style escape hatch while retaining essential behavior/accessibility. Define which structural styles are necessary. |
| Prop/ref composition | [Base UI useRender](https://base-ui.com/react/utils/use-render); Context7 MUI mergeSlotProps | Explicitly compose refs/events and merge styles/classes; object spread is insufficient. |

### Recommended additional knobs and contracts

- **Named slots and slotProps:** replace a public part separately from configuring it. Callback slot props may depend on public state.
- **State-aware children/render callbacks:** customize content without reimplementing internal state tracking.
- **variant, size, tone/density:** consistent typed presentation axes where meaningful, not mandatory props on every component.
- **Unstyled mode:** optional control over presentation, with a documented boundary around necessary interaction/layout behavior.
- **Scoped defaults:** set shared defaults once for an application region; instances can override them.
- **Public state attributes:** stable data-slot and applicable state attributes for CSS/Tailwind selection and tests; avoid reliance on incidental DOM nesting.
- **Controlled/default/change triples:** derive state interfaces from each capability, e.g. value/defaultValue/onValueChange or open/defaultOpen/onOpenChange. Our persistence requirement layers onto these; no claim that these libraries universally provide persistence.
- **Lifecycle/overlay capabilities:** where relevant, document mounted/unmounted behavior, portal target, focus restoration, dismissal, and motion options. These are capability audit prompts, not universal base props.
- **Direction/localization capabilities:** preserve native lang/dir and expose configurable user-facing labels where needed; keep message ownership explicit.

### Recommendations for the prototype's next iteration

1. Adopted subsequently: slots for replacement and slotProps for configuration. The unpublished prototype now uses slotProps; production interfaces must retain existing aliases.
2. Add distinct slots/content replacement and state-aware callback examples to show replacement of intermediates, not only the root.
3. Keep ordinary native props accessible and type custom element props correctly; avoid any-based escape hatches.
4. Document class/style/token/variant precedence and event/ref composition before expanding the prototype.
5. Keep options typed and scoped to coherent capabilities. Do not turn it into an arbitrary deep-merge access path to implementation internals.
6. Prefer CSS/Tailwind/token controls over introducing an sx-style runtime merely to imitate MUI. An sx equivalent remains a tradeoff to evaluate, not a requirement.
7. Do not assume every library's replacement API preserves semantics automatically. React Aria specifically requires the expected underlying element type in its render contract.
8. MUI documents a custom-slot typing limitation; borrowed conventions still need ABMEX type-level tests.

GitHub evidence: [MUI useSlot source](https://github.com/mui/material-ui/blob/9b5bd2b3b5eae3e73c6e462ea6f50440ad5c09e9/packages/mui-material/src/utils/useSlot.ts). Context7 confirmed object/state-callback slot props and special merging for handlers, classes, styles, and sx. No library was installed or selected by this research.

## Polymorphism and enforcement — research 2026-10-21

### Confirmed additions

- User adopted **slots** for named part replacement and **slotProps** for configuring those parts. Existing public component-specific prop names must remain compatible.
- User requested/promoted **as** for polymorphic rendering.
- User requested enforceable types and schema-driven information sharing by integrated development environments (IDEs). Interpretation pending: editor autocomplete, validation, documentation, and generation/refactoring rather than the ReScript programming language.

### Polymorphic contract recommendation

Use as to select an underlying element or compatible custom component while retaining the ABMEX part's styling and documented behavior. Infer the selected target's native/custom props, event target, and ref. Preserve required custom-component props.

An action rendered as an anchor must acquire appropriate link behavior rather than carrying invalid button-only attributes onto it. Types alone cannot supply native keyboard semantics, forward a ref, or prove that a custom component spreads props. Each behavioral component must document and test supported semantic substitutions. Structural primitives can generally accept a broader set of targets.

Avoid silent conflicts between as and slots.root.

### Approved root selection rule — revision 0.7

User confirmed 2026-10-22: when both `as` and `slots.root` are supplied, the custom root receives and honors `as`. If that combination is incompatible, reject it explicitly; do not silently ignore either input. This resolves precedence in the public contract. Type-level diagnostics, runtime forwarding, and compatibility evidence are proposed enforcement work and are not implemented by this revision.

Research:
- [Chakra composition](https://chakra-ui.com/docs/components/concepts/composition) supports as but explicitly does not infer underlying target props. Context7 /websites/chakra-ui confirmed this limitation.
- [Mantine polymorphism](https://mantine.dev/guides/polymorphic/) supports component-based polymorphism and renderRoot for cases such as generic router components; it documents editor/type-server overhead. A fallback render contract may be useful, but is not universally equivalent to as.
- [MUI OverridableComponent source](https://github.com/mui/material-ui/blob/2a8f217d7919d80d8760a7b63d6d97a70530deaf/packages/mui-material/src/OverridableComponent/index.ts) separates explicit-target and default-target signatures and derives target props while omitting owned keys.
- [MUI structure guide](https://mui.com/material-ui/customization/overriding-component-structure/) documents limitations inferring props of replaced slots. ABMEX must test its own slot inference rather than assuming an established library solves every case.

### Type-system prototype: target-sensitive public signature

This is a separate declaration-level example, not the runtime implementation of the earlier action prototype. It demonstrates an enforcement building block and compile-time examples. Requires TypeScript 5.4+ for NoInfer; the repository test uses 5.9.3. Type support floors still need a public compatibility decision.

```tsx
import type {
  ComponentPropsWithRef,
  ElementType,
  ReactElement,
  Ref,
} from "react";

type TargetProps<C extends ElementType, Own extends object> =
  Omit<ComponentPropsWithRef<C>, keyof Own | "as">;

export interface PolymorphicComponent<
  Default extends ElementType,
  Own extends object,
> {
  <C extends ElementType>(
    props: Own & { as: C } & TargetProps<NoInfer<C>, Own>
  ): ReactElement | null;

  (
    props: Own & { as?: never } & TargetProps<Default, Own>
  ): ReactElement | null;
}

declare const Surface: PolymorphicComponent<
  "div",
  { tone?: "neutral" | "accent" }
>;

declare const anchorRef: Ref<HTMLAnchorElement>;
declare const buttonRef: Ref<HTMLButtonElement>;
declare function AppLink(props: {
  to: string;
  children?: string;
  ref?: Ref<HTMLAnchorElement>;
}): ReactElement;

<Surface id="panel" tone="neutral" />;
<Surface as="a" href="/docs" ref={anchorRef}
  onClick={(event) => { event.currentTarget.href; }} />;
<Surface as="button" type="button" ref={buttonRef} />;
<Surface as={AppLink} to="/docs" />;

// @ts-expect-error Default div does not accept href.
<Surface href="/docs" />;
// @ts-expect-error Anchor refs must match the selected target.
<Surface as="a" href="/docs" ref={buttonRef} />;
// @ts-expect-error Preserve required props of custom components.
<Surface as={AppLink} />;
// @ts-expect-error Unsupported public option.
<Surface tone="unregistered" />;
```

Own props deliberately win name collisions in this example. This is not blanket permission to shadow native meanings; per-component review must resolve collisions. Union-valued targets, generic router components, slot replacement inference, and actual runtime prop forwarding need further fixtures. No any-based public escape hatch is demonstrated.

### Enforcement architecture recommendation

Use a small family of composable types and utilities, backed by generated metadata and verification. A giant base interface or inheritance hierarchy cannot prove runtime conformance.

| Layer | Proposed enforcement | What it cannot prove |
|---|---|---|
| Shared types | Named slot map; slotProps derived from slot contracts; target-aware as; typed public state/options; capability-specific state interfaces | Actual ref/prop forwarding or accessible runtime behavior |
| Compiler fixtures | Positive examples plus expected errors for invalid props, missing required props, wrong refs, invalid slot names, and conflicting modes | Runtime semantics or unchanged visual defaults |
| Typed component descriptor | Stable identifier, export path, part names, defaults, capability declarations, tokens, and links to examples/tests | Claims are true without verification |
| Generated outputs | .d.ts, documentation metadata, component manifest, and JSON Schema for serializable configuration | JSON cannot encode executable React components, refs, or callbacks |
| Continuous integration checks | Export/descriptor coverage, generated-output drift, declarations/API baseline, previous consumer fixtures, runtime interaction tests, two compositions | Complete behavioral equivalence through type compatibility alone |
| Inventory rollout | Baseline existing gaps; require conformance for new components and additive remediation of existing ones; prevent new gaps | Existing components are not compliant merely because they were registered |

The enforcement tool must consume the public export graph and descriptors; a source regex requiring a particular interface name is not adequate. TypeScript uses structural typing, so explicitly extending a named base interface is not itself proof of conformance.

Prefer an existing checker/test tool where available. API Extractor is an evaluated option, not a selected or installed dependency. Its [API reports](https://api-extractor.com/pages/overview/demo_api_report/) surface public signature changes for review; they do not automatically prove additive behavior.

### One authored contract, multiple generated views

Approved authoring model (user confirmation, 2026-10-21):
- TypeScript implementation/public types own executable React relationships, target-specific props, events, refs, and callbacks.
- A co-located typed descriptor owns information types cannot reliably express: named parts, documented defaults, capabilities, token links, and example/test references.
- Define shared defaults and slot identifiers once as exported/internal constants as appropriate; descriptors and runtime consume the same values where feasible.
- Generate documentation, the portable manifest, and serializable configuration schemas from those sources. Do not hand-maintain competing prop lists in JSON and TypeScript.
- Cross-check descriptor keys against exported props/parts and verify runtime claims through conformance tests.
- Emit only supported JSON Schema projections. Functions/components/refs remain named references to TypeScript symbols, not fake JSON representations.

### Editor and agent behavior

- Publish declaration files and documentation comments through the package's public exports for native TypeScript/React completion, hover help, and validation. [TypeScript publishing](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html)
- Declaration maps improve navigation when their referenced source files are actually available. [declarationMap](https://www.typescriptlang.org/tsconfig/declarationMap.html)
- Publish versioned JSON Schema and a generated component manifest for configuration tools and agents. Associate supported config files with their schema; [VS Code JSON support](https://code.visualstudio.com/docs/languages/json) provides schema-based validation and completion.
- A JSON Schema does not automatically add JSX completion or safe refactoring to every editor. JSX uses the TypeScript language service; code generation/refactoring requires a schema consumer or AST-aware codemod with validation.
- Schema scope is serializable data; [JSON Schema types](https://json-schema.org/understanding-json-schema/reference/type) do not include React functions or refs.
- Package version, contract revision, and manifest/schema version should be explicit so tools do not silently apply the wrong contract.
- Do not build a custom language server or editor extension until an actual integration gap requires one.

### Next enforcement decisions

- Type-level diagnostics and runtime verification for the approved as + slots.root rule.
- Slot replacement inference, ref composition, event order/cancellation, and native-prop collision policy.
- Descriptor format and schema scope. TypeScript plus co-located typed metadata as the authored source is approved; exact field ownership and generation mechanics remain to be specified.
- Release/type compatibility floor and editor-performance budget.
- Existing inventory baseline and gate activation sequence.
- Interpretation of the user's “rescript by schema” wording.

## Approved override and presentation policies

User confirmations following revision 0.5, captured 2026-10-21:

- **Consumer-first events:** consumer handlers run first and may prevent the component's default action. Required cleanup and state consistency remain protected. Specific event composition utilities and cancellation mappings still need implementation.
- **State-aware overrides:** slotProps, styling, and content overrides accept static values or callbacks receiving typed public component state. Internal implementation details are not exposed. State shapes are capability-specific.
- **Scoped precedence:** configuration inherits scoped provider defaults; explicit instance settings and named-slot overrides take precedence. Events, refs, classes, and styles require their documented merge rules, not blind replacement. This does not authorize a slot override to contradict the component's authoritative controlled state.
- **Unstyled:** every styled component offers an unstyled option that removes visual defaults while preserving accessibility and essential interaction behavior. Required structural styles must be documented separately.

The first proto-component predates these approvals and demonstrates only a subset. It is not evidence that callbacks, provider merging, slots replacement, or unstyled behavior have been implemented.

## Approved replacement ownership and public behavior hooks — revision 0.8

User confirmed 2026-10-22:

- TypeScript enforces expressible interface compatibility: props, callback/event signatures, public state shapes, slot types, required target props, and target-specific refs. It cannot prove a replacement uses those inputs correctly.
- React 19 function components receive ref as a prop; a forwardRef wrapper is not required. Receiving a ref does not attach it to an element. ABMEX implementations must connect or expose the documented target/handle. Source checked 2026-10-22: [React 19 ref as a prop](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop).
- ABMEX owns runtime, accessibility, and contract verification for its shipped components and supported behavior. Consumers own implementation behavior and accessibility of their custom replacements; no mandatory consumer certification or conformance-test gate.
- The revision 0.7 root rule rejects detectable type incompatibilities. ABMEX passes as to a custom slots.root; the consumer must honor it. Do not claim types prove forwarding, semantic equivalence, or arbitrary replacement correctness.
- Export reusable behavior hooks through supported public imports wherever behavior meaningfully operates independently of rendering. Document state, callbacks, refs, and any prop-getter merge requirements. Consumers can reuse these hooks in custom renderers; hook use is optional. Do not invent a hook for every trivial component.
- Earlier conformance-test requirements apply to ABMEX-owned inventory, not arbitrary consumer implementations. Existing examples remain illustrative subsets; no new runtime enforcement or hooks were implemented here.

## Approved styling and persistence policies — revision 0.9

User approved both policies on 2026-10-22. Initial contract policy interview is closed; the contract remains a living document.

1. Consumer styling wins within a documented styling channel: resolve recognized Tailwind utility conflicts by override precedence; shallow-merge inline styles by property; preserve unrelated classes. Normal CSS cascade still governs across channels. Scoped tokens remain defaults, and unstyled removes visual defaults. Custom Tailwind utilities require compatible conflict configuration rather than a promise to infer arbitrary CSS.
2. Persistence failures should leave components usable in memory and surface a typed error callback; never silently delete unreadable stored data. Stored state is versioned and validated, with an optional migration adapter. Cross-tab synchronization should be configurable, with external controlled state remaining authoritative. Exact hook names and storage mechanics belong to implementation design.

Keep implementation mechanics tracked below rather than requiring additional yes/no approval for every helper. Next requested work is a full property audit of the Tailwind theme imported into or implemented in ../wxt-prompt against current ABMEX inventory: establish provenance, enumerate properties and variants, and classify matches, missing properties, conflicts, and app-specific values. Do not assume which repository owns the theme before tracing it.

## Implementation work remaining

1. Root prop forwarding and precedence; compatibility aliases for existing inventory. slots/slotProps naming is settled.
2. Style/token/variant/class precedence and Tailwind conflict handling.
3. Typed options boundaries, extension typing, and invalid-combination handling.
4. Implement typed replacement interfaces and document consumer ownership; export applicable independent behavior hooks.
5. Event composition, cancellation, ref composition, and protected semantic attributes.
6. State snapshot/change contracts and public persistence hook/adaptor APIs.
7. Persistence schema versioning, cross-tab synchronization, storage errors, and migration policy.
8. Inventory rollout sequence and acceptance evidence.
9. Prototype compile/runtime validation and production-quality accessibility/styling.
10. Exact skill resources/scripts and composition-subskill packaging.

## Maintenance protocol

- Update this document throughout extraction design, implementation, and subsequent imports.
- Record user approvals separately from assistant proposals and observed implementation evidence.
- Update the matching kb child and repository copy together; compare their body and revision.
- Append dated evolution entries with reason, source, affected contract, and verification.
- Preserve history; explicitly supersede outdated proposals or decisions.
- Add child references only when supporting artifacts exist.
- Review the contract when a new donor exposes a gap, an extension risks compatibility, a substitution fails, or an existing component cannot conform additively.

## Relations

- part_of [[projects/design-system/donor-component-extraction-parent]]

## Evolution log

- 2026-10-22 — Revision 0.9: user approved consumer styling precedence and persistence fallback/error/version/migration/synchronization policies. Initial policy interview closed. Production implementation and full theme audit remain separate work. User explicitly waived per-revision commits; no commits created for these revisions.

- 2026-10-22 — Revision 0.8: user approved public independent behavior hooks and consumer ownership of custom replacement behavior. Clarified React 19 ref props and the limits of static enforcement; scoped runtime conformance to ABMEX-owned components. Recorded two final policy questions and the requested wxt-prompt theme audit as next work. No runtime implementation changed.

- 2026-10-21 — Create revision 0.1. User required additive-only extension, approved stable named public parts, and requested both a kb child and a new living continuity document.
- 2026-10-21 — Added proto-component code block at the user's explicit request. API is provisional; no production component was added.
- Quality signal: the interview drifted into sidebar-specific props; user corrected the methodology toward principles and capability-derived contracts. Sidebar remains a worked example.
- 2026-10-21 — Revision 0.2: added current MUI, Mantine, Base UI, Radix, React Aria, and Chakra extension-pattern research at the user's request. Recommendations remain proposals. Prototype strict TypeScript check passed; runtime checks remain pending.

- 2026-10-21 — Revision 0.3: user adopted slots/slotProps and promoted as polymorphism. Added current-source polymorphism research, a target-sensitive type example, and proposed type/schema/editor/compatibility enforcement. Existing action prototype now uses slotProps. Enforcement infrastructure is not implemented.
- Verification: both TSX blocks pass strict TypeScript 5.9.3 checking. Removing the four expected-error directives from the polymorphic example produces exactly four diagnostics. No files emitted. Runtime forwarding/accessibility and editor performance remain untested.
- 2026-10-21 — Revision 0.4: user approved TypeScript plus co-located typed metadata as the authored contract source, generating schemas, manifests, and documentation. Exact tooling and descriptor format remain open; no enforcement infrastructure was implemented.
- 2026-10-21 — Revision 0.5: user approved immediate blocking of new violations, mandatory compliance for new components, and tracked additive remediation of existing inventory gaps. No enforcement tooling was implemented by this documentation update.
- 2026-10-21 — Revision 0.6: user approved consumer-first cancellable events, static/state-callback overrides, scoped provider-to-instance-to-slot precedence, and unstyled support. Runtime implementations and the expanded prototype remain pending.
- 2026-10-22 — Revision 0.7: user resolved root selection: when both `as` and `slots.root` are supplied, the custom root receives and honors `as`; reject incompatible combinations. Type/runtime enforcement remains proposed and unimplemented.

## Executable foundation checkpoint — 2026-10-26

Policy revision remains 0.9; these are implementation mechanics and bounded evidence, not new user approvals or whole-inventory compliance. The six-primitives candidate lives in `feat/six-primitives` at `/Volumes/FLOUNDER/dev/abmex-design-system-six-primitives` (base ba6551a, uncommitted at checkpoint).

- Public exports: Text, Icon, Button, IconButton, BaseLayoutContainer and existing LayoutContainer with their named props types. `as` preserves target-specific native props/refs; custom `slots.root` receives `as` and must honor/forward it. Consumer replacement correctness remains consumer-owned.
- Named channels: root on each primitive, plus independent icon replacement/configuration/styling on IconButton. Provider defaults inherit through nesting; instance/slot layers merge class conflicts through existing `cn`, shallow style properties, cancellable override-first handlers and composed React19 refs. Undefined channels do not erase inherited defaults.
- State ownership: Button/IconButton derive disabled state before evaluating state callbacks. Static component/root inputs establish state; dynamic root callbacks consume it and cannot redefine `disabled`/`aria-disabled`. Public types forbid those dynamic keys, including extra-key variables; runtime guards ignore conflicting keys from JavaScript/casts. All rendering callbacks use the same snapshot. This applies the existing authoritative-state policy without introducing callback fixed-point evaluation.
- Presentation/structure: unstyled removes visual defaults while retaining semantics. BaseLayoutContainer retains min-size/display/flow structure; LayoutContainer preserves legacy clipping/containment defaults additively. Arbitrary custom components must implement their declared root semantics; types alone do not prove their DOM behavior.
- Executable independent behavior: public `useButtonBehavior` supports cancellation, disabled suppression and structural-root keyboard activation. No persistence hook is added to stateless components; durable-state foundation remains separately required where applicable.
- Enforcement delivered for this candidate: public positive/negative declaration fixtures, runtime/provider/ref/semantics regressions, generated six-component manifest and intentionally narrow serializable-options schema, public package CSS/metadata checks. Functions/refs/components and CSS-valued options remain TypeScript-owned; no universal schema or inventory-conformance claim.
- Verification: 198 tests/22files, built declaration gate, three artifact checks, normal source-package prepack/pack and a fresh local-tarball consumer passed. Live rebuilt demo in designated work Chrome exercised two compositions, disabled merge, navigation, light/dark, Enter/Space and reset with screenshot chain and no captured console warnings/errors. See EXTRACT-20261025-003 and its local evidence document for hashes, provenance and limitations. Publication/integration and theme swap work remain separate.

These mechanics supersede earlier 'unimplemented' statements only for the six tested candidate components. They do not retroactively certify existing inventory, arbitrary consumer replacements, full donor Sidebar extraction or general persistence facilities.
