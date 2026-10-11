# Session log

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

## 2026-10-09 — PR reviews, 0.7.0-next.5

- Codex P1 on PR #4 valid (themes left at next.4); bumped to lockstep (`e55a47a`), merged `6ddad7c`; run 37976835873 published both packages via OIDC with provenance; tags + releases created.
- Merlyn PR #32 retargeted to `development`; `c97dbf8` pins both next.5 from the registry (committed lockfile had resolved next.4 while package.json pinned next.5). Verified in a clean worktree: frozen install, typecheck, build:chrome, components 198/198. Not merged.

## 2026-10-10 — SSoT component spec: research → feature list → layer 1

- Plan approved (plan mode) after reframing: research round, zero-to-finalized common feature list with glm-5.3 + kimi-k3 peers, `specification/` with ONE prototype grown feature-by-feature.
- User decisions: `@abmex/ui` + `@abmex/ai` real packages; debug surfaces genericised → ui; `ai` keeps drop-in plumbing behind seams and MUST compose ui.
- Phase 0: kb hub, research index, 3 append-only ledgers, feature list.
- Phase 1: 11 web queries, 7 Context7 queries, 8 leader source files via `gh api`; HeroUI Button/Disclosure source + CSS captured. Raw + analyses verbatim in kb (7 notes). Peer MCP wrappers failed on long prompts; delivered via direct streaming curl.
- Phase 2: 23 rows → R1 (0 rejects, 6 amendments) → 9 new rows → R2 (0 rejects, 7 amendments) → user: all 32 `final`; prototype Disclosure.
- Phase 3: branch `spec/ccc-foundation`; `specification/{SPEC.md,features.json,README.md}`, `prototype/Disclosure` on HeroUI engine, checks CF-01/02/04/05/27/32 + completeness gate; `@heroui/react`+`@heroui/styles` 3.2.2 added to root devDeps; `spec:check` script + vitest include. Layer 1 commit `4138946`: 7 files / 23 tests green, full suite 28 / 198 green. Not pushed.
- kb `database is locked` from ~22:00Z; pending entries staged in `~/.claude/deferred-kb-sync/`.
