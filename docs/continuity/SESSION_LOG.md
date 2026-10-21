# Session log

## 2026-10-21 — donor extraction and base contract

- Captured user-approved Maximum Flexibility Axiom, replaceable defaults, token authority, additive-only extensions, named public parts, independent instances, persistence capabilities, and two-composition verification.
- Created `projects/design-system/donor-component-extraction-parent` and child `base-component-contract` in the singular kb.
- Added [BASE_COMPONENT_CONTRACT.md](BASE_COMPONENT_CONTRACT.md) with a provisional React/TypeScript proto-component code block. No production component changes.
- User requested comparison with MUI and other popular systems; research and final interface decisions remain open.
- Follow-up: official docs, Context7, and GitHub research recorded in contract revision 0.2. Final interface decisions remain open. Prototype strict TypeScript check passed with zero diagnostics; no runtime test claimed.
- Prior migration test results below are historical, not rerun. Current browser work must respect the no-Playwright instruction.

## 2026-10-07

- Added scoped transition CSS so theme transitions apply to any controller target, not only `html`.
- Added DTCG-shaped motion source and generated CSS/TypeScript/Swift platform artifacts.
- Added SwiftUI package foundation and native component matrix.
- Themes build passed with 200 contrast pairs and zero failures. Full `pnpm check` was still running when this entry was written.
- Preparing commit, push, pull request, and transfer to `/Volumes/MACDEV/abmex-ai`.
- Committed as `fcb4510`, pushed source remote, opened source PR #1.
- Created private `zautke/abmex-ai`, transferred `main` and `feat/abmex-ai-foundation`, opened transfer PR #1.

## 2026-10-07 — npm OIDC publish workflow

- Ported `publish-to-npm` from `zautke/design-system` into `.github/workflows/publish.yml` (no npm workflow exists in `../blogg`), plus `scripts/create-tags-and-releases.mjs`.
- Run 37655997174 failed on `ERR_PNPM_IGNORED_BUILDS` (esbuild); fixed with `allowBuilds`. Run 37656509966 passed install/check and failed at publish: OIDC token exchange 404 because neither package exists on npm or has a trusted publisher.
- Added `repository` metadata (npm requires `repository.url` to match the publishing repo).
- Release events SSoT: kb `ABMEX Release Ledger (append-only)`; procedure: kb `Runbook — bootstrap and operate npm OIDC trusted publishing (pnpm workspace)`.
