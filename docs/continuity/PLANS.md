# Plans

## 1. ABMEX standalone design system (extraction + publish) — DONE through prerelease

The reviewed plan is preserved verbatim in `docs/ABMEX_INTERNAL_PLAN_VERBATIM.md`. Extraction, publish workflow (OIDC trusted publishing), and registry publication are complete: `0.7.0-next.5` of both packages on npm; Merlyn consumes from the registry. Remaining items from that plan (neutral theme, headless styling completion, native acceptance, org-wide consumer cutover, rollback gates) are now subsumed by plan 2 — the spec decides what "done" means per component before any further migration.

## 2. ABMEX SSoT Composable Compound Component specification — IN PROGRESS

Approved plan (plan mode, 2026-10-10): research → feature list → `specification/` prototype.

- **Phase 1 research** — done. Three lanes (spec methodology & governance / headless-behaviour / styled kits & AI kits) × three modalities (web, Context7, GitHub) + a HeroUI v3 emitted-DOM capture. All raw results and peer analyses verbatim in kb `…/ssot-component-spec/research/`.
- **Phase 2 feature list** — done. 32 features CF-01..32 ruled `final` by the user after two peer rounds (0 rejects, 13 amendments). Mirror: `specification/features.json`.
- **Phase 3 prototype** — in progress on branch `spec/ccc-foundation`. ONE component (`Disclosure`, HeroUI engine) grown one layer per commit (`spec(<lead CF>): …`), each commit = code + checks + rewritten SPEC sections, `pnpm spec:check` green. 7 layers; layers 1–2 landed; PR #7 open (pushed on user go 2026-10-12). Further pushes only on the user's say-so.
- **After Phase 3:** component #2 (Tabs or Select) to exercise selection/positioning rows; then a writing-plans migration plan to rewrite the existing 53 `@abmex/ui` components into the spec and split `@abmex/ai` out. Nothing under `packages/*` changes until then.

## 3. Hygiene queue (needs user go)

- Move npm `latest` off `0.7.0-next.1` (or leave until first stable); deprecate `0.0.0-stage`.
- Merge Merlyn PR #32 after a live extension run.
- Decide the fate of `zautke/abmex-ai`.
- Remove `packages/ui/src/primitives/` (struck vocabulary) under the migration plan.
