# Six primitives implementation plan

**Goal:** Implement Text, Icon, Button, IconButton, BaseLayoutContainer and additive LayoutContainer as the first executable base-contract exercise.

**Architecture:** Shared typed root/part composition and scoped defaults, existing cn merger, React 19 native refs, semantic HTML and Tailwind styles referencing ABMEX role tokens. BaseLayoutContainer is the configurable structural layer; LayoutContainer preserves existing containment/clipping defaults and region wrappers. No state/persistence is invented for stateless primitives.

**Spec:** User's 2026-10-25 implementation request and docs/continuity/BASE_COMPONENT_CONTRACT.md revision 0.9. Deliberately open implementation details are primary-agent choices, subject to evidence-driven revision.

## Scope and decisions

- Preserve all existing exports and layout defaults. New controls use semantic button/anchor behavior, default button type=button, disabled suppression and consumer-first cancellation.
- All six support target-sensitive as/ref, slots.root, slotProps.root, classNames/styles state callbacks, unstyled, native props, scoped defaults. Consumers own custom replacement correctness.
- Text defaults to span; Icon defaults to a decorative span wrapping supplied graphics, with named accessible graphics supported. IconButton requires an accessible name and composes Button/Icon.
- Base layout defaults to div with min-size constraints, configurable display/flow/gap/overflow/containment through options. LayoutContainer keeps prior containment and overflow defaults; no fixed app topology.
- Typed descriptors reference shared defaults/parts and generate serializable metadata. Tests enforce runtime/type claims rather than interface naming.
- Scope reaches public exports, generated declarations, compiled CSS, existing layout wrappers, documentation, public consumer demo, contract and KB episode.

## Work

- [ ] Freeze episode and baseline; preserve existing dirty documentation independently.
- [ ] Add failing runtime and compiler fixtures for forwarding, overrides, cancellation, ref cleanup, accessible naming, native semantics and layout compatibility.
- [ ] Implement shared contract utilities and six components; use existing dependencies.
- [ ] Verify tests/types/build and public packed-consumer imports. Show two compositions and substitutions in a real browser; record before/after actions and console evidence.
- [ ] Document observed contract adjustments; generate descriptor metadata and update contract with evidence.
- [ ] Freeze results, retrospective, mandatory learner and two independent reviews; update run ledger and continuity.

## Review focus

Wrong target refs/custom required props; cancelled or disabled actions; conflicting class/style/ref channels; nested scoped defaults; unstyled preserving semantics; original layout consumers; accessible icon names; public CSS compilation; custom root receiving as. Missing live evidence remains pending, never a pass.

## Separate theme workstream

Merlyn and CEV theme-family interpretation is awaiting user clarification. Existing theme audit/normalization plan is input. Both consumers must ultimately swap approved themes through a common interface. CEV code ownership requires an explicit acknowledged assignment.

## Research checked 2026-10-25

- React ref callbacks and cleanup: https://react.dev/reference/react-dom/components/common (also Context7 /reactjs/react.dev).
- Tailwind conflict customization: https://github.com/dcastil/tailwind-merge/blob/main/docs/configuration.md.

Git provenance: branch created from origin/development 4024eac, fast-forwarded to published origin/main ba6551a. No deployment/version equivalence claimed; npm versus organizational stamp mapping pending user decision.
