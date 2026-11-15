# Six primitives — exercise checkpoint

Date: 2026-10-25. Status: implemented draft, acceptance and integration incomplete.

Latest checkpoint: 2026-10-26T23:25Z. Runtime/public-package verification complete for this candidate; learning and source-control integration tracked separately below. Earlier checkpoints are historical.

Release correction2026-10-26: format blocker withdrawn. Canonical KB already exempted npm on October16; current user rule requires exactly THREE-number development/main releases, MINOR into development and MAJOR into main. Project/global/KB mirrors corrected. Earlier claims that a new version-mapping decision was needed are erroneous historical statements, not current gates. Actual commit/PR/release steps remain unexecuted.

## Implemented

Text, Icon, Button, IconButton, BaseLayoutContainer; additive extension of existing LayoutContainer and region wrappers. Shared target-aware types, root slots, state-callback styling, scoped defaults, Tailwind merging through existing cn, React 19 ref cleanup composition, public useButtonBehavior, typed descriptors and generated narrow serializable-option schema. Public exports and two-composition demo.

## Observed checks

- Initial clean test invocation failed because @abmex/themes/motion was unbuilt. After building themes, all 179 pre-existing tests passed.
- Seven initial contract tests failed for missing primitives, then passed after implementation.
- Added custom-root keyboard regression: failed for missing button semantics, then passed after adding public useButtonBehavior. Nested provider regression passed.
- Final `pnpm test`: 22 files, 188 tests passed.
- `pnpm --filter @abmex/ui typecheck`: passed.
- Strict TypeScript tests/primitives-types.tsx: valid custom/anchor targets and expected errors for wrong props/refs/missing required custom props/name/options all passed.
- `pnpm build`, subsequent UI build including generated metadata: passed. Theme builder reported 200 contrast pairs, zero failing.
- `node --test tests/package-css.test.mjs`: 2 passed.
- Metadata generator --help and build invocation passed; git diff --check passed.

## Browser evidence

Connected user's Chrome extension browser, profile display name lukezautke.com. Exact profile email was not independently confirmed; do not claim full release-protocol certification. Demo imported @abmex/ui and @abmex/ui/styles.css through package exports, resolving built workspace artifacts; NOT a fresh packed/registry installation.

Before/after screenshots emitted in session tool record for each action: Save (0→1); light switch (dark→light); Details navigation (Overview→Details); Tab focus to polymorphic div button; Enter (1→2); Space (2→3); icon-button reset (3→0). Captured browser console warnings/errors empty before and after reset. Screenshot artifacts currently reside in session record, not separate durable exported files. Test tab closed; Vite process stopped.

## Findings and required follow-through

- Polymorphism needs runtime semantic behavior, not only TypeScript inference. Custom structural button keyboard support now demonstrated; broader interactive target/disabled/cancellation cases still need independent review.
- Existing layout containment/clipping defaults retained. This is a deliberate compatibility constraint, not the default for the unopinionated base layer.
- Descriptor/schema projection is explicitly partial: CSS-valued layout options and React values remain TypeScript-owned. No whole-inventory conformance claim.
- Provider defaults now include named slots, slotProps, and state-based styling channels. Static layers remain static after merging; callback layers resolve against state.
- IconButton now exposes a separately replaceable typed icon slot, with icon slotProps/classes/styles. Independent re-review remains outstanding.
- No persistence hooks implemented; six components are stateless aside from ephemeral keyboard bookkeeping. General persistent-state foundation remains outstanding.
- Independent reviewers, packed fresh-consumer proof, full root replacement/slot inference audit, descriptor drift gate, schema validation, contract revision reconciliation and mandatory learn review remain pending.
- No commit, push, draft PR, release or deployment. Await user decision resolving npm SemVer versus organization four-number release stamp. Do not fabricate deployed version parity.

## Cross-team state

PRIMARY-MSG-006 / CEV-002 r1 posted and readback verified in canonical KB blackboard. DEV/CEV authorized multi-agent planning now using draft extraction/composition/learn skills; implementation assignments follow primary review. Team acknowledgment pending at dispatch. Earlier CEV-001 posting failed when delegated curator hit usage limit; no secondary work was confirmed running.

## Retrospective checkpoint (not terminal acceptance)

The first executable exercise found gaps beyond the reasoning-only trials: build prerequisites, actual keyboard semantics and finite descriptor coverage. Existing cn reuse was successful. Intervention and implementation were by the same primary agent, so this is field evidence, not an independent blinded evaluation. Learning candidates should distinguish runtime-system gaps from missing instructions; current skill already demands semantic checks and independent review. Preserve these findings for the frozen learning packet once implementation/evaluation complete. No skill promotion or user consensus claimed.

## Resumed review checkpoint

Previous reviewer follow-ups did not survive the session reset; collaboration inventory contains only primary. No independent approval inferred. Public declaration gate `pnpm test:types` passed against the current built exports. Source UI typecheck and diff whitespace check passed.

Full resumed `pnpm test`: 22 files, 192 tests passed in 57.57 seconds. Final disk check: 6.1 GiB available; no assertion that cleanup alone caused the full increase. Test process exited successfully; no remaining test process observed.

Added a regression combining provider `slotProps.root.disabled` with instance `slotProps.root.title`. It failed because merging static objects produced a callback, which Button rejected as a state change. Shared merger now eagerly combines static layers and preserves callbacks only for genuinely dynamic layers. All 13 focused tests pass after the fix.

Runtime policy requiring disabled state to be established outside slot callbacks remains an unresolved contract/type alignment issue; do not claim unrestricted callback-based behavior or release acceptance.

## Distribution validation checkpoint (2026-10-26)

- Latest `pnpm --filter @abmex/ui build` passed. Vite transformed 89 modules, emitted UI declarations, then generated CSS (550.19 kB); full build took 6m15s plus 20.76s for CSS.
- `node --test tests/package-css.test.mjs`: 3/3 passed, covering component-family JS/types exports, primitive metadata/schema/declaration identity, and shipped CSS/assets.
- `pnpm test:types`: passed against the built package declarations and positive foundation fixture.
- A package tarball was generated with pnpm from an isolated temp staging copy of the just-built `dist` and package files. The staging copy omitted its `prepack` hook because the source build had already completed, and rewrote the workspace-only `@abmex/themes` range to its package version. Archive: `/Volumes/FLOUNDER/tmp/abmex-six-primitives-proof/abmex-ui-0.7.0-next.8.tgz`.
- Fresh consumer installation from that tarball passed with pnpm: 176 packages installed; consumer import resolved all six public primitive exports, stylesheet export, and six-component primitive manifest. CSS utility selector assertion passed. This proves the local packed artifact path, not registry publication.
- pnpm pack on the original source package invokes mandatory `prepack` and would rerun the 6m15s build; that attempt was stopped. The tarball was produced from a staging copy to validate the exact built snapshot without rebuilding.
- jCodemunch server could not resolve the local worktree path; package gate/source evidence was inspected directly. No source edits, version changes, commits, pushes, browser sessions, or servers were made in this lane.

Disk preflight reported 106 MiB free. Removed only disposable `/tmp/abmex-public-consumer.802hqt/node_modules`; fixture sources and packed artifacts retained. Subsequent check reported 1.9 GiB free. No dependency install, new browser/server, deployment or commit during this resumed checkpoint. Final packed-consumer and live-browser checks have not been repeated for these latest changes.

## Final candidate verification — 2026-10-26

- Source candidate: `feat/six-primitives` based on ba6551a, uncommitted changes preserved. No deployed-release equivalence or registry-publication claim.
- Luna/high source lane: 19 focused runtime tests and source UI typecheck passed. Disabled state is established by component/static root inputs; root callbacks consume one snapshot and cannot redefine disabled/aria-disabled. Type signatures exclude those callback keys; runtime guards ignore them from JavaScript/casts. Static provider state survives dynamic instance overrides, including IconButton. Absent IconButton override channels preserve Button provider defaults.
- Independent Luna/high code review caught missing root `LayoutContainerProps` type export. Primary added that export plus a public consumer fixture; no other concrete blocker reported in the reviewed paths. Reviewer did not execute browser checks.
- Primary final `pnpm test`: **22 files, 198 tests passed**, 19.58 seconds. `pnpm test:types` passed against rebuilt package declarations. `node --test tests/package-css.test.mjs`: **3 passed**, zero skipped/failing. `git diff --check` passed.
- Latest real-user Chrome exercise used the connected `lukezautke.com` profile, whose native account UI had shown `me@lukezautke.com`. Rebuilt package exports loaded visibly in demo at localhost:43187. Before/after screenshot chain: dark baseline → Save 0→1 → disabled scoped button attempted, remains1 → light mode → Details content pane → Tab focuses polymorphic div button → Enter 1→2 → Space 2→3 → IconButton reset3→0. Browser console warn/error log returned `[]`. No DOM/JavaScript mutation used as interaction proof.
- Screenshot evidence resides in this session's tool record (tab871033507); not separately exported durable image files. This summary is not a verbatim transcript. Test tab explicitly closed; Vite session68370 stopped with exit130. No primary-created server/tab remains.
- Packed consumer proof above covers a staging tarball made from built artifacts, with prepack omitted and workspace dependency concretized; it is narrower than normal source-package prepack/registry proof. Source-package prepack was stopped to avoid duplicate6-minute build. Package latency remains an observed concern; no claim of optimization.
- Stateless persistence is inapplicable to these six primitives; ephemeral keyboard bookkeeping is not durable preference state. General persistence hooks remain a separate system gap. Whole-inventory conformance, full donor Sidebar extraction, theme-family implementation and both-app swap acceptance are not claimed by this exercise.

## Frozen learning input — 2026-10-26T23:25Z

Source SHA256: contract.tsx `ba8e0ac2aa9874f5d8c0a1d1227e7c510cf8864f01d604488df7c22b03546569`; Button.tsx `207a93e3f0e7c29e03fd1f8a371af360ad72c8684e48bd96988bb0c69950c876`; IconButton.tsx `55a095f0b945ffd484f3e900e7293c6f3f3489adf28e888efa24f7bc3a484210`; public index.ts `74e8e35cf4f1095c3ffba7c542ed32f0eb74cec3715f35ec7f009dbc18cc63ab`; public type fixture `0f33946b10849877e2172992705d72f27a8f391af63a8dc6a86eda9c27f17d4c`; runtime fixture `8f4e02c81dd4f0a27fd405b60006f4312638454c2ccec5105a37401beba081e5`.

Learning analysis uses this bounded finished implementation/verification attempt, including its incomplete normal-packaging/integration evidence. It may conclude no skill edit. Do not promote incomplete runtime gates or fabricate user consensus. Historical learning packet preparation remains historical; latest freeze/addenda govern reviewer inputs.

## Late closure addendum — 2026-10-26

Normal source `pnpm pack`, including prepack/build, passed. Fresh consumer of that archive installed176packages in41.3s and passed six public imports, server rendering, shipped CSS and six-component manifest; cache reuse was reported, with no prewarming/cold-cache claim. Disposable consumer node_modules removed. Public README now documents the six primitives, overrides/state ownership, structural defaults, tokens and schema limits; documentation-only repack passed. Final archive `/Volumes/FLOUNDER/tmp/abmex-primitives-final-20261026/abmex-ui-0.7.0-next.8.tgz` SHA256 `2e25b245012e99f6c696d1b8a1c92a7abb02cd61675c93d83ab8b40a0b264088`; pack.log and small consumer fixture retained alongside it. Runtime source is unchanged by the README repack; prior consumer execution preceded that documentation-only change.

Two fresh Luna/high learning reviews completed; control/replay/holdout reasoning selected one conditional acceptance trial as extraction0.2.1. Companion/method unchanged. Canonical record `projects/design-system/donor-component-extraction-parent/runs/extract-20261025-003-learning-record` preserves dissent, limited coverage and user-not-yet-reviewed state. Metadata-only asset version aligned with0.2.1. Codex/shared skill aliases resolve to existing profile-owned sources without copies.

Machine-readable evidence `2026-10-26-six-primitives-evidence.json` passes structural validation. Deliberate negative `--acceptance` returns exit1 and `checks[6]: required check unresolved`, correctly rejecting the pending versioned commit/PR/integration. This is PASS for the declared negative test, not full acceptance. Version-policy/npm mapping remains unresolved; no commit/publication. Test-metrics registry and pass-rate ledger created in KB, seeded198/198 and3/3; future applicable test runs must append.
