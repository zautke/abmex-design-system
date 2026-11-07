# Remember

- 2026-10-21: [Base Component Contract](BASE_COMPONENT_CONTRACT.md) is a living contract, paired with the kb child under the donor extraction parent. Preserve approved requirements separately from proposed APIs.
- Extensions are ONLY additive. Stable named parts expose configuration, props, styling, composition, and applicable behavior/state capabilities without breaking existing consumers.
- Stateful components need default in-memory and optional localStorage support plus external app-state ownership. Instance isolation is required; undo/redo is not required.
- The extraction skill is principle-driven, not a catalog of sidebar-specific props. Verify donor fidelity and a materially different composition.

- Preserve dirty donor worktrees and paused pull requests.
- Do not claim release completion from package build/test results alone.
- Keep React and Tailwind optional to framework-neutral themes; keep sortable tab dependencies isolated.
- Native deployment floors remain iOS 15 and macOS 12.
- The reviewed migration plan is authoritative and is preserved verbatim in `docs/ABMEX_INTERNAL_PLAN_VERBATIM.md`.
