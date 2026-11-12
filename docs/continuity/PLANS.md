# Plans

## Latest sequencing — 2026-10-26

Scoped six-primitives implementation/verification and required learning review are complete; trial guidance is0.2.1. Integrate by reviewed development PR using THREE-number release versions (MINOR into development, MAJOR into main), then allocate shared-theme P1–P4 against the revised CEV map and pinned verified baseline. The claimed npm format conflict is withdrawn; the existing ecosystem exemption already covered npm. Both families require both modes. CEV rework owns rendered Chat removal/retained quick-switch tab; preserve chat code and avoid overlapping writes. Full Sidebar and persistence/inventory work remain queued.

## Current priority — 2026-10-25

First live component exercise: implement Text, Icon, Button, IconButton, BaseLayoutContainer, and LayoutContainer, using the exercise to inform the executable base-component contract. Theme work must cover Merlyn and CEV through an interchangeable common interface and support dark/light modes. The precise meaning and acceptance boundary for “interchangeable” is being confirmed by primary; record it as pending until resolved. See [fresh handoff](FRESH_SESSION_HANDOFF.md). These are requirements, not completed implementation or runtime acceptance.

Verified source state: local main@1b8517e, origin/main@ba6551a, four commits behind, with no local-only commits. origin/main contains development commit 4024eac. Preserve all dirty documentation; no source-control integration has been performed. ~/.codex/skills component/learn paths are symlinks into ~/.agents/skills; .system remains local.

## Full default theme / Merlyn adoption

Current detailed plan: [ABMEX_THEME_NORMALIZATION_PLAN.md](ABMEX_THEME_NORMALIZATION_PLAN.md), based on the complete [Tailwind 4.3 reference](TAILWIND_4_3_DEFAULT_THEME.md). Preserve upstream utility vocabulary and ABMEX visual defaults; normalize ownership, generated metadata, runtime component variables, motion, modes, and source imports. Six tasks cover baseline proof through Merlyn adoption. Proposed, builder-reviewed, not implemented. Extraction/learn skill drafts exist; live extraction remains pending.

## 2026-10-22 — contract closure and theme audit

Initial contract interview closed at revision 0.9. Consumer replacements own runtime behavior; ABMEX verifies its implementations. Independent behavior hooks are public where meaningful. Final styling/persistence policies are approved. [Theme source audit](THEME_PROPERTY_AUDIT.md) now documents the wxt-prompt import path and full captured property inventory. Prioritize additive runtime component variables, generated theme metadata/editor coverage, shared motion aliases, and consistent mode scoping. Validate installed artifacts and browser behavior before claiming end-to-end coverage. The new six-component live exercise is the first implementation informing the executable contract. Earlier Labsupapg sidebar exercise remains historical planned work; do not report it as started or canceled by this task.

## Donor extraction contract — 2026-10-21

Maintain [BASE_COMPONENT_CONTRACT.md](BASE_COMPONENT_CONTRACT.md) and its linked kb child throughout this effort. Apply the existing principle-driven extraction skill, require decomposition proposals and two-composition proof, then align existing inventory additively. The six-component exercise is first; Labsupapg sidebar remains a later worked example. Exact executable interfaces remain pending; publication is not part of this documentation update.

Revision 0.7: slots/slotProps and as are adopted. If both `as` and `slots.root` are supplied, the custom root receives and honors `as`; reject incompatible combinations. Proposed enforcement combines shared types, typed descriptors, generated declaration/manifest/schema outputs, and regression gates. This architecture remains under discussion; no enforcement framework is implemented. Research last checked 2026-10-21.

The extraction skill/composition drafts now exist. Full donor extraction and the historical Labsupapg worked example remain pending; the active first implementation exercise is the six components above.

## ABMEX standalone design system

Status: implementation checkpoint, approximately 40% complete.

The reviewed plan is copied verbatim to `docs/ABMEX_INTERNAL_PLAN_VERBATIM.md`. This repository currently contains the extracted package history, framework-neutral theme/controller work, token generation foundation, React package, and SwiftUI foundation. Consumer migration, full native verification, compiled/headless styling completion, release publication, and organization-wide cutover remain open.

Historical migration plan branch references are superseded by the verified current source state above. No registry publication or consumer cutover is claimed here.
