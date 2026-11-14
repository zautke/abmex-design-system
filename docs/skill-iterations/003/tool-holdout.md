# ESI-20261028-003 — CodeMunch tool holdout

Status: complete, bounded trial. This is not efficacy validation.

## Scope

- Repo: `/Volumes/FLOUNDER/dev/abmex-design-system` (`local/abmex-design-system-7fcb3461`)
- Indexed snapshot: `2026-10-22T15:47:56.254699`; accessible checkout HEAD: `1b8517e8ff4c94b62357812b75626b376991946f`.
- Target must exercise an actual AST boundary different from the known exported `AppSidebar` case. Keep CodeMunch's exact source and boundary wrappers; do not normalize source.
- Compare CodeMunch's exact returned span/body with immutable Git revision, then compare working-file bytes independently.
- No source edits, synthetic mutations, code/config/KB changes, commits, installs, servers, or browser actions.

## Receipt-backed holdout

`plan_turn` recommended `AppRootLayoutContainer`; that ordinary function returned `content_verified=true`, `_freshness=fresh`, but `git_sha_verification=git_sha_mismatch` against `1b8517e8ff4c94b62357812b75626b376991946f`. Disposition: unresolved and excluded from positive count.

An additional actual mismatch replay on `AppFooter` returned the same conflict: `content_verified=true`, `_freshness=fresh`, `git_sha_verification=git_sha_mismatch`. Git source has explicit `export function AppFooter`, while the returned AST symbol source starts `function AppFooter`. Preserve this `export ` boundary wrapper; do not erase it to call the full definition equal. The working file is clean at the queried revision, so this is not explained by local dirty bytes. Body-only identity and exported API identity remain unresolved for this mismatch. Full receipt and exact evidence appear in `tool-events.md`.

The materially different case is class method `ErrorBoundary.render`, lines 27–53 of `packages/ui/src/components/ErrorBoundary.tsx`. `get_symbol_source(verify=true, verify_against=git_sha, receipt=true)` returned `content_verified=true`, `_freshness=fresh`, `git_sha_verification=git_sha_match`, `git_sha_rev=1b8517e8ff4c94b62357812b75626b376991946f`, and content hash `3f84640b80916006bf75a1d7a6e6adce1a9e2d278a2bda6eba74d9989dff6441`. Receipt: `munch://evidence/sha256:e7682af45d7584d1878e9d088d9aaeb9b717f49a28b53cf061186f152fb0727b`.

Identity status: **verified for this returned method body/span only**. The accessible immutable source is the resolved checkout HEAD and path; Git reports that file's blob as `b242bc386c6e0489326d5aaa9d47844c757b1a00`. The working file SHA-256 is `3e450a2df96aeede18a57d0a383b73b7f7692ce7ad1aa5e7d157323f3fe27a0c`, and the target file had no `git status` entry (clean, so working bytes equal HEAD blob). Returned `public` modifier remains present; no prefix stripping or broad source normalization was used. CodeMunch's positive Git verification anchors its AST span/body to that revision. Full returned source and commands are in `tool-events.md`.

## Negative-case dispositions

- Changed body/hash: synthetic; reject identity if returned body hash differs from the revision's exact symbol span. No file was changed.
- Unavailable revision: synthetic; unresolved, because no accessible immutable revision can anchor the span. No bogus revision was injected into CodeMunch.
- Modifier/export boundary change: synthetic; unresolved for public/API equivalence even if method body is byte-identical. This method trial preserves `public`; it does not establish class exports or module API.
- Dirty adjacent file: synthetic; target-body identity can remain verified, but adjacent-file/call/dependency scope stays unverified. No adjacent file was edited.

The two mismatch cases and method match are actual tool receipts. The `AppFooter` case is an observed export-wrapper counterexample. Remaining negative cases are explicitly labeled evidence-rule simulations, not live tool failure injections. This trial does not prove the workflow is effective generally, nor establish export/public-API equivalence, imports, adjacent code, package artifacts, dependencies, or runtime behavior.
