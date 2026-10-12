# Current task state

Updated: 2026-10-11 (largo, Claude Fable 5.1 with glm-5.3 + kimi-k3 peers)

## Where we are

- `main` = `6ddad7c`. `@abmex/themes` + `@abmex/ui` **0.7.0-next.5** published to npm via OIDC with provenance (run 37976835873). `next` dist-tag → next.5; `latest` still 0.7.0-next.1. Merlyn (`wxt-prompt`) consumes from the registry (PR #32 pins next.5, retargeted to `development`, not merged — needs a live extension run).
- Active work: **ABMEX SSoT Composable Compound Component specification**, branch `spec/ccc-foundation`, folder `specification/`. Layers 1–2 landed; branch pushed, PR #7 open for review (reviews from Codex, Copilot, graphify addressed in follow-up commit).
- Decided (user, 2026-10-10): packages `@abmex/themes ← @abmex/ui ← @abmex/ai`; `ui` plumbing-free; `ai` keeps opinionated drop-in plumbing behind injectable seams and MUST compose `ui`; debug surfaces genericised → `ui`. 32 common features CF-01..32 ruled `final`. Prototype = `Disclosure`.

## specification/ status

| Layer | Title | Status |
|---|---|---|
| 1 | structure + `data-slot` (CF-01, 02, 04, 05, 27, 32 scaffold; CF-25 constraint) | landed `4138946` — `pnpm spec:check` 7 files / 23 tests green; `pnpm test` 28 / 198 green |
| 2 | context + orphan errors (CF-15, CF-25 gate) | landed `4ec5790` — 9 files / 39 tests green; engine post-hydration mutations declared (exact values) in manifest `ssr.postHydrationMutations` |
| 3 | controlled state + details (CF-13, 24, 28) | next |
| 4 | render prop + refs (CF-11, 12) | pending |
| 5 | styling surface (CF-06, 07, 08, 09, 10, 30, 31) | pending |
| 6 | motion (CF-22) | pending |
| 7 | final gates (CF-03, 14, 16–20, 23); CF-21/26/29 `exempt` | pending |

Authoritative sources: `specification/SPEC.md` + `specification/features.json` (repo); kb `projects/design-system/ssot-component-spec/` (hub, research ×7 verbatim, 3 append-only ledgers, feature list with rulings).

## Known blockers / hygiene

- kb MCP returned `sqlite3 database is locked` on every `edit_note` from ~22:00Z 2026-10-10; pending ledger entries staged at `~/.claude/deferred-kb-sync/2026-10-10-ssot-component-spec-phase3-start.md` (auto-drains when kb unlocks).
- Peer-agent MCP wrappers (`mcp__glm-5-3__ask`, `mcp__kimi-k3__ask`) fail with `fetch failed` on long generations; use direct streaming `curl -N https://ollama2.braisenly.com/api/chat` with `stream:true` (scripts in session scratchpad; pattern documented in kb research index).
- Historical: the private twin `zautke/abmex-ai` PR #1 is still open; its content was ported via abmex-design-system PRs #2/#3. Fate undecided.
