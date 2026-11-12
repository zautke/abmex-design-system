# ESI004 independent evaluation

## Scope and checkpoint

Independent review of the ESI004 packet against run003 evidence and current extraction acceptance guidance. This is not the separate full Sidebar acceptance.

## Receipt track — verified

The checker consumes the saved raw CodeMunch response: it parses the outer tool result, parses its first text block as JSON, takes `source` directly from that response, checks its symbol ID and receipt ID, then compares those bytes with `git show <immutable-revision>:<file>` and current working bytes. This closes run003 review-B's specific raw-receipt gap for this subject. It reports the returned source's `content_verified=true`, freshness, `git_sha_verification=git_sha_mismatch`, revision, and receipt ID without treating local byte identity as an explanation for the tool mismatch.

Independent representative invocation against `/Volumes/FLOUNDER/dev/labsupapg-extraction-004` passed: returned RootLayout body matches the pinned source at lines 17–29; current file matches pinned blob; explicit `export default ` wrapper is present in both; response and metadata revisions agree; tool mismatch remains visible. After checker update, `--self-check` passed baseline plus six synthetic negatives (changed body, altered wrapper, adjacent current-file byte, unavailable revision, incorrect end line, mismatched response/metadata revision). These are checker fixtures, not extra tool calls. The receipt finding supports an evidence amendment about this symbol's source identity; it does not claim general CodeMunch efficacy.

### Receipt interpretation

The checker now verifies both reported span endpoints and equality of the response revision with metadata revision; both new negatives reject correctly. The recorded `git_sha_mismatch` remains an unexplained diagnostic about CodeMunch's verification metadata, but independent returned-body, pinned blob, working-file, and wrapper comparisons establish exact source identity for this use. Do not treat that metadata discrepancy as blocking extraction when these identity checks pass; do not claim its origin is resolved.

## Extraction/package track — repair confirmed; full acceptance separate

The bootstrap report records isolated checkout provenance and a successful normal pinned `corepack pnpm install` (pnpm 8.15.0). The initial production build passed but omitted active `bg-accent/20`; source search placed that class in `sidebar-variants.ts`, outside the app scanner's `**/*.tsx` glob. The executor repaired the owning app-side scanner glob to include `.ts` and `.tsx`. The final build report records successful rebuild, all 13 before/after selector assertions, and emitted bundle paths in `sidebar-css-assertions.json`. I independently checked all 13 expected selectors in the post-repair CSS `/Volumes/FLOUNDER/dev/labsupapg-extraction-004/apps/web/.next/static/css/f33d993723cc0bf0.css`; none are missing. The concrete emitted-style defect is repaired and the bootstrap lane has final command/output evidence.

Current acceptance requires distribution proof through public imports and consumer Tailwind coverage, and separately requires runtime/browser evidence when applicable. This establishes one consumer build's utility emission; it does not establish packed/public import behavior, cascade/contrast, browser interactions, or complete Sidebar acceptance. Do not conflate this bounded repair with full extraction acceptance.

The episode gives practical support for the proposed narrow recovery behavior: the ordinary pinned bootstrap resolved package readiness; then the actual production CSS check exposed and localized a scanner omission, which was fixed in the app lane and reflected in the rebuilt artifact. Existing acceptance criteria correctly required emitted-style proof, but the episode adds evidence for explicit follow-through on recoverable prerequisites and repair. Reviewers should assess exact candidate wording; no general tool-efficacy conclusion follows.

## Disposition

The extraction run resolved package readiness, found and repaired a real consumer CSS omission, and independently confirmed the repaired utility in the regenerated CSS. The receipt checker now verifies the returned source against pinned and working bytes, with its metadata discrepancy visible but nonblocking for this identity result. Full Sidebar acceptance remains separate and requires its remaining distribution/runtime/browser checks.

**Disposition:** bounded bootstrap/style recovery succeeded. Preserve app-only scanner repair and generated lockfile update. No result here supports claiming full Sidebar acceptance or general CodeMunch verification efficacy. Primary live verification remains pending.
