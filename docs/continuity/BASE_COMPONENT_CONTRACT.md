# Base Component Contract

Revision: 0.2 — evolving draft, 2026-10-21.

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

- Native root props and refs should remain available. Whether the standard uses top-level native props, rootProps, or partProps.root is unresolved.
- Named part props generalize examples such as InputProps. An input-containing component exposes input props; a layout need not.
- styles supplies root/part CSSProperties; classNames supplies root/part classes. Final names remain provisional.
- options contains typed behavior/presentation controls owned by the public contract, not unrestricted mutation of internals.
- Distinguish content replacement, element replacement, and behavior replacement. Their accessibility and typing obligations differ.
- Publish the stable part names and capabilities for each part. Add parts compatibly; do not silently rename or remove them.
- Define precedence for defaults, options, part props, styles, refs, and callbacks. Tailwind conflict resolution is not solved by concatenating class strings.
- Maintain semantic invariants when consumers replace parts. Document obligations for custom renderers, including forwarding props/refs and avoiding nested interactive elements.

## Proto-component: executable shape, provisional API

This TypeScript/TSX example implements a small action component, not a base class or a complete production contract. It is intentionally stateless; persistence belongs in a stateful capability example, not on every component.

It demonstrates typed options, named parts, native root props/ref, consumer styles and classes, replaceable content/root rendering, and cancellable action callbacks. Root replacement is deliberately button-compatible in this prototype; link polymorphism is still a separate contract decision.

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
  partProps?: {
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
  partProps,
  classNames,
  styles,
  onAction,
  renderRoot,
}: ProtoComponentProps): ReactElement {
  const density = options?.density ?? "comfortable";
  const root = partProps?.root ?? {};
  const iconProps = partProps?.icon ?? {};
  const labelProps = partProps?.label ?? {};

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
- styles overrides same-property values in partProps.*.style.
- Consumer root click runs before onAction and may cancel it with preventDefault.
- Disabled or aria-disabled root suppresses the action.
- Root ref and native button props pass through partProps.root, including to renderRoot.
- renderRoot must preserve the button-compatible semantics, supplied props, and ref. The type signature alone cannot enforce forwarding.
- data-slot and data-density are component-owned state/identity attributes in this example.
- Class concatenation preserves supplied classes but does not guarantee that the last conflicting Tailwind utility wins. Production merge policy is unresolved.
- Decorative icon content must not contain interactive children. Rich multi-action rows need separate noninteractive composition.
- The prototype does not implement theme tokens, persistence, animation, focus styling, or full accessibility of arbitrary replacement content. It is a contract discussion artifact, not a shippable control.
- Validation status: strict TypeScript 5.9.3 with React 19.2.14 types passed with zero diagnostics using an in-memory compiler host; no files emitted. Browser/runtime behavior has not been tested.

## Existing inventory alignment

Create a per-component matrix rather than enforcing a universal prop bag blindly:

| Component / public part | Capability | Current support | Gap | Additive change | Existing consumers | Verification |
|---|---|---|---|---|---|---|

Allowed assessment statuses: supported; missing; inapplicable with rationale; compatible adapter required.

Do not rename existing props or change defaults to conform to the new convention. Add aliases/adapters or capabilities compatibly, documenting precedence if both old and new entry points are supplied. If a change cannot preserve the contract, redesign it; additive-only is a requirement, not permission to introduce breaking migrations.

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

1. Evaluate renaming draft partProps to slotProps before it becomes public; no existing API has been released.
2. Add distinct slots/content replacement and state-aware callback examples to show replacement of intermediates, not only the root.
3. Keep ordinary native props accessible and type custom element props correctly; avoid any-based escape hatches.
4. Document class/style/token/variant precedence and event/ref composition before expanding the prototype.
5. Keep options typed and scoped to coherent capabilities. Do not turn it into an arbitrary deep-merge access path to implementation internals.
6. Prefer CSS/Tailwind/token controls over introducing an sx-style runtime merely to imitate MUI. An sx equivalent remains a tradeoff to evaluate, not a requirement.
7. Do not assume every library's replacement API preserves semantics automatically. React Aria specifically requires the expected underlying element type in its render contract.
8. MUI documents a custom-slot typing limitation; borrowed conventions still need ABMEX type-level tests.

GitHub evidence: [MUI useSlot source](https://github.com/mui/material-ui/blob/9b5bd2b3b5eae3e73c6e462ea6f50440ad5c09e9/packages/mui-material/src/utils/useSlot.ts). Context7 confirmed object/state-callback slot props and special merging for handlers, classes, styles, and sx. No library was installed or selected by this research.


## Open decisions

1. Canonical root prop and named-part prop spellings; compatibility aliases for existing inventory.
2. Style/token/variant/class precedence and Tailwind conflict handling.
3. Typed options boundaries, extension typing, and invalid-combination handling.
4. Content/element/behavior replacement protocols; custom renderer obligations and accessible naming.
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

- 2026-10-21 — Create revision 0.1. User required additive-only extension, approved stable named public parts, and requested both a kb child and a new living continuity document.
- 2026-10-21 — Added proto-component code block at the user's explicit request. API is provisional; no production component was added.
- Quality signal: the interview drifted into sidebar-specific props; user corrected the methodology toward principles and capability-derived contracts. Sidebar remains a worked example.
- 2026-10-21 — Revision 0.2: added current MUI, Mantine, Base UI, Radix, React Aria, and Chakra extension-pattern research at the user's request. Recommendations remain proposals. Prototype strict TypeScript check passed; runtime checks remain pending.

