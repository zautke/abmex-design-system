# ExtractionSkillIteration protocol

User-authorized 2026-10-27. This is project memory for the component extraction skill evaluation program.

## Branches and isolation

- Integration worktree: `/Volumes/FLOUNDER/dev/abmex-extraction-skill-iteration`, branch `feat/extraction-skill-iteration`, created from `origin/development` at `4024eac07e1f7e619b9b70a4f0c2652ad5ca3328`.
- Every execution attempt gets a distinct branch from the pinned integration-branch revision, named `feat/extraction-skill-iteration-NNN`, and a separate linked worktree. Record parent SHA, actual branch and worktree in its run charter before dispatch.
- Never reuse a completed run branch or change its frozen inputs silently. Retries get new attempt IDs. Promote accepted run work through reviewed PRs; review/live/release gates remain applicable. No automatic merge, publish, donor deletion or application cutover.
- Current development lacks the unmerged six-primitives work at `cb99fd0`. Treat that branch as reference evidence, not an installed prerequisite or permission to integrate it.
- Preserve the original checkout's unrelated dirty changes. Do not blanket-commit them.

## Team and admission

Registered execution force: ESI-001, Extraction Skill Iteration Squad. Canonical KB roster: `teams/registered/esi-001-extraction-skill-iteration-squad`.

Before spawning, publish/read back the charter and roster, exact actual prompts/context hashes, skill-tree hash, source/target revisions, allowed paths, evaluation rubric, run kind, monitor and deadline. Follow KB `document/team-registration-protocol` and project `skill-evaluation-and-observation-procedure` (0.3 draft; cross-team adoption remains pending). Current user explicitly authorized drafting/registering/executing this team; no further team-card approval is needed.

All roles receive the same extraction/composition/learn skill and frontend/tool catalog. Load relevant resources by phase. Distinguish access to a skill/tool from actual use. Use Codemunch for code, Docmunch for indexed documentation, Context7 for current library behavior. Record unavailable tools and fallbacks honestly.

Primary owns shared KB writes/integration and monitors active agents at most 60 seconds apart. Every role has exclusive output paths and a bounded deadline; no descendants without a reserved allocation. Run concurrency is capped by actual runtime slots. Preserve independent evaluator and learner/reviewer contexts; never leak expected solutions into the executor.

## Evidence and learning

Canonical new series: KB `projects/design-system/donor-component-extraction-parent/extraction-skill-iteration-run-ledger`. Cross-link the existing extraction live-exercise ledger; do not fork historical evidence or renumber old episodes.

Every attempt records observable session actions, supplied/withheld context, tool usage, decisions, output artifacts, interventions, coverage limitations, requirements-to-evidence results and post-run retrospective. Separate execution, documentation, evaluation, learning and user-review statuses. Discovery-only runs cannot claim implementation, browser, package or migration success.

After every terminal outcome, freeze the evidence packet and run `learn-extract-abmex-components` through `learn-skill-evolve`. Compare prior episodes and current guidance. Two fresh independent reviewers examine fidelity/requirements and information gain/generalization, including proposed changes to the learning method. Record adopted/trial/deferred/rejected/already-covered dispositions; no edit is valid when supported. User assent is not inferred. Consequential changes require replay and a materially different holdout before effectiveness claims.

All skill edits belong in the canonical `~/.agents` repository via an isolated branch, with Codex paths remaining symlinks. Runtime facilities belong in ABMEX packages, not copied skill assets or demo-only glue.

Track every actual extraction/composition/learn companion/evolution-method file update in KB `projects/design-system/donor-component-extraction-parent/extraction-skill-file-changelog-ledger`: exact before/after file/version/hash/commit where known, rationale, originating run, review/promotion and validation. Keep proposed candidates and no-change decisions separate from actual updates; preserve unknown historical identities. User-assigned curator created and verified this ledger on 2026-10-27.

## First observed attempt and next operational trial

ESI-20261027-001 failed discovery acceptance: full dependency closure, exact target-branch reuse proof and token mapping incomplete. Source-backed findings and independent critique live on `feat/extraction-skill-iteration-001`, draft PR17; integration protocol is draft PR15. No component implementation or release accepted.

For the next attempt, trial an early saved dependency/unknown checkpoint and a budget calibrated from measured tool latency, with branch-local inventory identity established first. Preserve original acceptance; record setup time separately. These are episode-scoped operational hypotheses, not proven extraction-skill improvements or automatic reasons to add generic instructions. Compare coverage and checkpoint-at-deadline, then test a different donor boundary before generalizing. Learning/review disposition is canonical in the run ledger; do not infer user assent.
