# Token map — ESI-20261027-002

Status: partial, frozen at parent stop-research checkpoint. The active Labsupapg style source was not directly traced. No donor computed-style or installed-artifact equivalence claimed.

## Evidence checkpoint

- Scope: active Labsupapg sidebar appearance → source CSS/assets/fonts/animations → target branch semantic tokens and public CSS exports.
- Target identity: branch-local CodeMunch handle `local/abmex-extraction-skill-iteration-002-aa5d211f` (160 files/4,848 symbols; CSS/JSON/YAML parser coverage is incomplete per shared context).
- Donor checkout identity, active consumer, resolved package identities, sidebar selectors, asset URLs/fonts, animation source, and exact property values: **unknown**; none was directly opened or traced in this role. No donor class/property/asset provenance can be asserted.
- Target index resolved by CodeMunch at `2026-10-27T16:29:02.695087Z`, 160 files/4,848 symbols, including 11 CSS and 11 JSON files. It is branch-local but its source index predates this read and shared inventory warns three uncommitted in-scope files were excluded. No fresh current-working-tree source identity was verified here.
- Target inventory evidence (not independently source-verified by this role): `@abmex/ui/styles.css`, optional `@abmex/ui/tailwind.css`; `packages/ui/src/styles/tailwind.css` described as exporting `--color-app-bg` plus header/splash/chat roles backed by semantic base variables; theme controller applies root mode/identity attributes and `colorScheme`; theme CSS respects reduced motion and `--theme-transition-duration`. Exact file revisions, full variable spellings, Tailwind config aliases, export map and scoped override mechanics remain unverified.
- Evidence rule: report source declarations and asset references only; computed styles, installed package output and visual equivalence remain unverified unless directly observed.

## Semantic role mapping (inventory-only target evidence; donor side unknown)

| Needed role | Target mapping available from inventory | Donor source evidence | Status |
|---|---|---|---|
| Sidebar/page canvas | `--color-app-bg` reported in `packages/ui/src/styles/tailwind.css` | No active class/property/value traced | Candidate mapping only; exact target declaration and emitted alias unverified |
| Header / sidebar top surface | Inventory says header roles exist, but gives no exact variable spellings | No active class/property/value traced | Gap: exact current target token unknown |
| Secondary surfaces, separators, borders | Inventory says semantic base variables exist, no exact names captured | No active class/property/value traced | Gap |
| Text, muted text, icons, selected/hover/focus states | No exact target names captured | No active class/property/value traced | Gap |
| Accent, destructive/status, badges | No exact target names captured | No active class/property/value traced | Gap |
| Spacing, dimensions, radius, shadow | No exact target names captured | No active class/property/value traced | Gap |
| Typography and icon/font assets | No exact target names/assets captured | No font or asset dependency traced | Gap |
| Motion / transition / reduced motion | Inventory reports `--theme-transition-duration` and reduced-motion-aware theme transition only | No sidebar animation traced | Theme transition is not evidence of donor sidebar motion or equivalent behavior |

No donor semantic can yet be promoted: provenance and collision check are absent. The only defensible candidate is to reuse existing ABMEX semantic roles after direct source confirmation, preserving ABMEX authority and Tailwind integration. Do not mint aliases from generic design-token skill examples.

## Gaps and candidate promotions

- Parser boundary: CodeMunch reports CSS and JSON languages in the index, but the shared context explicitly says CSS/JSON/YAML parsing is incomplete and import closure cannot be inferred from the symbol graph. This role did not test parser coverage by file or inspect CSS/JSON directly. No graph negative is used as absence proof.
- No donor/current-target diff, compiled CSS, package tarball, computed styles, browser render, or runtime scoped override was inspected. Alias collisions, duplicate semantics, CSS layer/order, theme scoping, animation differences and asset resolution are unknown.
- Promotion disposition: defer all token additions until donor declarations and exact current target export/declaration identities are sourced. Existing-role reuse is provisional inventory evidence, not verified mapping.
