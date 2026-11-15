# Current task state

## Latest — 2026-11-15 trunk state

Entries below this one are history and predate the releases listed here.

- `development` is at 0.10.0 (`8f7f305`); `main` is at 1.0.0. The next promotion to `main` is 2.0.0.
- 0.9.0 (PR #14): six primitives on Base Component Contract 0.9, primitive manifest and options schema exports.
- 0.10.0 (PR #16): cev theme family overlay (`data-theme="cev"` with `data-mode`) and the `@abmex/themes/mui` adapter. This delivered P1–P3 of the CEV-002 theme donor plan.
- PR #26 (`test/cev-family-gates`, draft, 0.11.0): P4 gates plus a fix making the Tailwind `dark:`/`light:` variants follow `data-mode` and the nearest scope. Waiting on review.
- Open: P5 (Merlyn swap proof) and CEV-side consumption, which starts after the CEV repository's PR #2 merges. The acceptance definition of an "interchangeable" theme interface is still not written down beyond color-role parity, which `test_build.py` now enforces.
- Known drift: npm dist-tag `next` still points at 0.7.0-next.11 although the release protocol retired it. Stale PRs #7, #8, #11 and the Sidebar extraction PRs #15 and #21 remain open.
- Release records: kb `projects/design-system/abmex-release/abmex-design-system-release-log-append-only`. 0.8.0 and 1.0.0 are not yet backfilled there.

## Latest — 2026-10-26 verification and learning closeout
## 2026-10-26 — six-primitives closeout

Primary work is in `/Volumes/FLOUNDER/dev/abmex-design-system-six-primitives`, branch `feat/six-primitives`. Six primitives are implemented as a draft. Latest recorded `pnpm test` passed 192 tests across 22 files; type checks, builds, metadata generation and prior browser evidence are recorded in [the evidence checkpoint](../superpowers/plans/2026-10-25-six-primitives-evidence.md). Browser/packed-consumer proof has not been repeated after latest source changes. No acceptance, release, commit or deployment is claimed.

Next: finish independent contract/acceptance review; reconcile disabled slot callback policy and descriptor/schema gates; update same Base Component Contract body in worktree and KB after contract-agent report; refresh live/packed evidence; freeze episode packet; complete mandatory learning with two independent reviewers and user/primary deliberation. Preserve full run note at `projects/design-system/donor-component-extraction-parent/runs/extract-20261025-003-six-primitives-executable-contract-exercise`.

Cross-team: PRIMARY-MSG-006 authorized CEV theme planning only. CEV-002 plan is submitted; its learning review is complete but proposed dispositions are not adopted. No CEV implementation assignment exists. Working interpretation of “two initial themes” is Merlyn and CEV families, each with light/dark modes; confirmation remains pending. Specific G1–G8 positions remain proposals pending primary/user deliberation. Blackboard: `projects/design-system/donor-component-extraction-parent/blackboard-cev-abmex-donor-import-local-to-abmex-multi-agent-message-hub`.

Pending: npm SemVer versus the full org version stamp mapping (user response requested); skill aliases versus profile-only distribution. Verified skill source: `~/.agents/settings/global/claude-profiles/fe/skills/`; do not recreate stale aliases/copies before a decision.

## 2026-10-21 — active contract design


Six primitives candidate verified in `/Volumes/FLOUNDER/dev/abmex-design-system-six-primitives`, `feat/six-primitives` (uncommitted). Final suite198/198 in22files; public declaration gate and3artifact tests pass. Normal source prepack/pack and fresh tarball consumer pass; live work-profile Chrome actions/screenshots and empty console recorded. Owned tab/server and disposable consumer dependencies cleaned. Contract0.9 implementation appendix matches KB and both repository copies.

Learning record: `projects/design-system/donor-component-extraction-parent/runs/extract-20261025-003-learning-record`. Two fresh Luna/high reviewers plus bounded control/replay/holdout completed; extraction0.2.1 adds a conditional callback-ownership trial. Companion/method0.1.0 unchanged; no user consensus or empirical promotion claimed. Codex extraction/learn aliases now resolve through ~/.agents/skills to existing profile sources.

Version-format blocker withdrawn2026-10-26: canonical KB already exempted npm on2026-10-16; user confirms development/main exactly THREE numbers, MINOR bump into development and MAJOR bump into main. No separate stamp mapping is needed. Next integration work is commit/push/reviewed PR under that rule; no commit/PR/publish made yet. Broader work remains Sidebar extraction, persistence/inventory rollout and shared themes/two-app swaps. CEV ownership remains explicitly sequenced; latest cross-team board and PRIMARY-MSG-008 govern.

Earlier checkpoints below are historical and superseded where this section is newer.

Updated 2026-10-25. Read [FRESH_SESSION_HANDOFF.md](FRESH_SESSION_HANDOFF.md) for the complete initial prompt.

## Active objective
First live component exercise: implement Text, Icon, Button, IconButton, BaseLayoutContainer, and LayoutContainer to inform the executable contract. Theme scope covers Merlyn and CEV through an interchangeable common interface with dark/light support. Primary is confirming the exact meaning/acceptance boundary of “interchangeable”; implementation and runtime acceptance remain pending. CEV team remains secondary and acts only under exact primary/user assignments.

## Coordination
KB parent blackboard: projects/design-system/donor-component-extraction-parent/blackboard-cev-abmex-donor-import-local-to-abmex-multi-agent-message-hub
Read child Coordination Hub, Action Ledger and CEV Donor Import Topic Hub. PRIMARY-MSG-001..005 answer branch/package/dirty-doc questions, correct old Phase2/palette/release assumptions and request standby acknowledgment. Check NEW messages before work.

## Implemented versus pending
Skills: extract-abmex-components0.2.0 + composition; learn-extract-abmex-components0.1.0 + learn-skill-evolve0.1.0. Verified ~/.codex component/learn paths are symlinks into ~/.agents/skills; .system remains local. Validator/links and bounded reasoning reviews passed; official quick_validate lacks yaml. No component implementation/live exercise, runtime contract enforcement, theme interoperability, theme migration or HeroUI replacement is claimed complete.

Contract0.9 approved. Theme audit/full Tailwind4.3 reference/normalization plan documented, not implemented. Prior untracked/modified docs remain primary-owned. Secondary cannot touch them.

## Resume order
1. Confirm primary's precise acceptance definition for interchangeable Merlyn/CEV theme interface and dark/light behavior.
2. Reconcile branch/version/deployment workflow and dirty-doc integration before any branch mutation. Verified local main@1b8517e; origin/main@ba6551a is four commits ahead and contains development@4024eac; no local-only commits.
3. Begin the six-component live exercise under the agreed contract; record component and theme decisions as evidence, then run the required learner/review loop.
4. Check latest shared-board messages and CEV standby acknowledgment; any CEV task needs a precise bounded assignment.

No commit/push or app/browser process started in coordination. Last reported disk free5.6Gi (not rechecked). Source-control integration remains unfinished; do not claim clean state. Skills outside this repo remain local. Full handoff includes KB paths, findings, policy limits and unresolved tasks.
