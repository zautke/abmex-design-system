# ESI-20261027-002 — Reviewer A

## Disposition

**Accept the Codemunch troubleshooting candidate as a TRIAL, with one wording amendment before application. Accept the no-edit decisions for extraction guidance, composition, and learning guidance.** This review does not approve extraction discovery: the independent overseer’s FAIL remains in force. Exact-body verification closes only the `AppSidebar` function body at the declared Git revision.

## Evidence fidelity and coverage

- The frozen packet records conflicting Codemunch fields: `content_verified=true` and `_freshness=fresh` alongside `git_sha_mismatch`. The initial source report appropriately treated the retrieved functions as cached/provisional; the overseer froze discovery FAIL before receiving the later supplement.
- The append-only primary supplement gives reproducible, narrowly scoped evidence for `AppSidebar`: cached body hash equals the hash of the Git slice after removing the explicit `export ` AST boundary; the working file bytes equal that revision’s Git blob. `verification.py` encodes those checks and `verification.json` records the outputs. The first over-escaped newline comparison failed and is retained as a negative attempt; the corrected comparison is the positive evidence. Neither result proves other symbols or package/runtime behavior.
- Inventory and token reports preserve important unknowns: target inventory omitted three uncommitted in-scope files and lacks exact current-working-tree reads; donor package resolution/build/export and license closure remain open; token lane did not directly read donor or target CSS. The source report and retrospective also retain setup and package-manager limits. The candidate explicitly says it cannot waive these checks.
- The candidate adds concrete recovery detail absent from the current `using-codemunch` entry and troubleshooting table. Current guidance says `verify: true`, inspect freshness, invalidate/reindex stale indexes, and stop on negative evidence, but does not describe conflicting verification fields or a bounded exact-body check. The proposed owner is appropriately the Codemunch troubleshooting profile, not extraction core.

## Required wording amendment

Before application, scope the procedure to cases where the declared revision and repository checkout are available and trusted. State that the check compares the returned body hash to the exact symbol body at that revision and separately compares the current working file to that revision’s blob; any unavailable checkout, ambiguous AST boundary, or non-exact match stays unresolved. The candidate mostly implies this already, but spelling out the prerequisite prevents a reader from treating a hash comparison alone as current-source identity. Do not broaden normalization beyond explicit wrapper removal.

## No-edit decisions

- **Extraction entry/profile/decisions/acceptance: accept no edit.** Existing guidance requires freshness verification, actual consumer/dependency/resource tracing, current target inventory comparison, contract-derived additive interfaces, and unresolved material unknowns blocking acceptance. The overseer’s contract corrections are proposal omissions, not proof those requirements are missing from the skill. The executor’s statement that persisted sidebar preferences are optional/host-only conflicts with the loaded profile/contract; that is an execution/proposal error. Do not duplicate persistence rules in the skill.
- **Composition subskill: accept no edit.** It already calls for complete working defaults and meaningful, coordinated alternative compositions. No composition ran; this episode cannot evidence a method gap.
- **`learn-extract` and `learn-skill-evolve`: accept no edit.** The current method requires frozen inputs, history/counterexample review, all-signal extraction, narrow ownership, independent review, trial vs adoption, and replay/holdout. This run followed those requirements. Keep the operational checkpoint/budget idea episode-scoped and unproven; setup, staffing, and budget changed together, so no causal skill effect is established.

## Safety and preserved gates

Keep the candidate at **TRIAL** pending a second materially different verification-field conflict and a negative case where exact identity cannot be reproduced. Preserve the overseer’s original FAIL and the post-evaluation supplement as separate records. Do not infer repository freshness, package identity, license permission, token mapping, build output, or runtime correctness from the `AppSidebar` proof. No product or skill changes are approved by this review beyond the candidate’s scoped profile trial after the stated amendment.

## Limits

Reviewed `TEAM_CONTEXT.md`, frozen learning/candidate diff, primary supplement and verification artifacts, retrospective, overseer, executor, inventory, token map, current extraction/learning guidance, and the current `using-codemunch` profile plus its troubleshooting source. No product code, canonical skill, KB, package, build, browser, or runtime was touched. No independent second mismatch replay was available. Reviewer A assesses fidelity, coverage, safety, and requirement preservation; this is not a claim of four-party consensus or demonstrated efficacy.
