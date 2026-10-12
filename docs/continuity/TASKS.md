# Tasks

## Extraction + publish (plan 1)

- [x] Extract reconciled ABMEX package history into standalone repository.
- [x] Build themes and UI packages; preserve public exports.
- [x] Add scoped theme controller, SSR-safe lifecycle, and reduced-motion handling.
- [x] Add contrast audit and package build/typecheck/test gates.
- [x] Add SwiftUI foundation and counterpart matrix.
- [x] Add DTCG-shaped motion source and platform-generation foundation.
- [x] Port npm OIDC trusted-publishing workflow; publish 0.7.0-next.2 → next.5 with provenance, tags, releases.
- [x] Merlyn consumes `@abmex/*` from the registry (development pins next.4; PR #32 → next.5).
- [ ] Merge Merlyn PR #32 after live extension run.
- [ ] Promote `latest`; deprecate `0.0.0-stage`.

## Specification (plan 2)

- [x] Phase 0 kb scaffolding (hub, research index, 3 ledgers, feature list).
- [x] Phase 1 research, 3 lanes × 3 modalities, verbatim.
- [x] Phase 2 feature list: 32 rows `final`.
- [x] Layer 1 — structure + `data-slot` (`4138946`).
- [x] Layer 2 — context + orphan errors (CF-15) + CF-25 hydration/aria-pair gate (`4ec5790`).
- [ ] Layer 3 — controlled state + `details` (CF-13), `states` block + closed-world reason enum (CF-24), `eventOrder` (CF-28).
- [ ] Layer 4 — `render` prop + refs (CF-11, CF-12); regression 24/25/28.
- [ ] Layer 5 — styling surface (CF-06, 07, 08, 09, 10, 30, 31); first CSS.
- [ ] Layer 6 — motion (CF-22).
- [ ] Layer 7 — final gates (CF-03, 14, 16, 17, 18, 19, 20, 23); CF-21/26/29 report `exempt`.
- [x] Push `spec/ccc-foundation`, open PR #7 (2026-10-12).
- [ ] Component #2 (Tabs or Select).
- [ ] writing-plans: migration of existing components + `@abmex/ai` split.

## Deferred from plan 1 (now governed by the spec)

- [ ] Authored token authority and neutral theme (CF-10, CF-31).
- [ ] Headless/compiled styling completion (CF-06/07).
- [ ] Native compilation and runtime acceptance (CF-23 declares status, not promise).
- [ ] Rollback and release acceptance gates (CF-17).
