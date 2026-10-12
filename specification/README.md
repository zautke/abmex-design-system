# specification/

The canonical ABMEX Composable Compound Component specification and the one prototype it is grown on.

- `SPEC.md` — the specification. One section per finalized feature (CF-01..32), each with the agreed contract, the mechanical check, the worked code as landed on the prototype, and instructions for consuming agents.
- `features.json` — machine-readable list of the 32 features, their status, check file, and the layer in which each lands. This is the completeness gate, not the foundation.
- `prototype/Disclosure/` — the prototype base component. Features are added one layer at a time, one commit per layer (`spec(CF-xx): …`).
- `checks/` — the mechanical checks, born alongside each layer. Run with `pnpm spec:check`.

Governing principle: Composable Compound Components (kb `concept/composable-compound-components`). Working record: kb `projects/design-system/ssot-component-spec/` (hub, research, ledgers, feature list).

Nothing under `packages/*` is changed by this folder. Migration of existing components to the spec is a later plan.
