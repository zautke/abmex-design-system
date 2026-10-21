# Current task state

## 2026-10-21 — active contract design

Current effort: donor-component extraction skill and evolving public component contract. Read [BASE_COMPONENT_CONTRACT.md](BASE_COMPONENT_CONTRACT.md) first. Principles are approved; API names, merge rules, and prototype remain draft. Next: research conventional extension surfaces in MUI and other major systems, then continue the design interview. Existing inventory alignment must be additive. No extraction implementation or consumer migration has occurred in this effort.

KB parent: `projects/design-system/donor-component-extraction-parent`; child: `projects/design-system/donor-component-extraction-parent/base-component-contract`. Keep the child and local contract body aligned. Prototype is documentation, not production code.

## Historical migration checkpoint — not reverified this session

Checkpoint: roughly 40% of reviewed ABMEX migration plan.

Latest implementation includes motion token source, generated CSS/TypeScript/Swift platform output, scoped transition selectors, and SwiftUI primitives. Latest `pnpm check` passes: 162 tests across 18 files, both package builds, and typechecks. Browser verification must use an installed Chrome channel because Playwright's bundled browser is unavailable. Native syntax parsing passed; full Swift package verification is still pending.

Transfer complete. Source PR: https://github.com/zautke/abmex-design-system/pull/1. New private repository: https://github.com/zautke/abmex-ai, local path `/Volumes/MACDEV/abmex-ai`, transfer PR: https://github.com/zautke/abmex-ai/pull/1. Continue remaining plan gates from the transfer branch.
