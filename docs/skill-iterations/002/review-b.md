# ESI-20261027-002 — independent Reviewer B

## Review scope and evidence

Fresh review of the frozen `learning.md`, `candidate.diff`, `TEAM_CONTEXT.md`, executor/source events and report, inventory/token reports, `primary-source-supplement.md`, `verification.py`/`.json`, retrospective, and overseer report. I also read the current extraction entry, ABMEX profile, acceptance and decisions resources, composition skill, learn companion/evolution method, and the live plus loaded-cache `using-codemunch/references/troubleshooting.md`. No canonical skills edited. This is an independent disposition; no other reviewer verdict was supplied.

## Dispositions

| Track | Disposition | Finding |
|---|---|---|
| Extraction entry/profile/decisions/acceptance | **Already covered — no edit** | Existing rules require verifying source freshness, distinguish search leads from proof, trace dependencies/resources/generated artifacts, compare inventory, and keep material unknowns blocking. Profile also explicitly requires durable preference persistence and external authority. The executor's optional/host-only persistence framing is contradicted by these rules; evidence identifies an execution/proposal mismatch, not a missing instruction. Adding a generic “donor parity does not waive target requirements” rule would be duplicate guidance absent replay evidence that the current contract/profile fails to guide a fresh executor. |
| Composition subskill | **Already covered — no edit** | No runnable composition was produced; discovery closure failed before composition. Composition already sets real defaults, meaningful substitution, coordinated flows and actual destinations. No evidence ties this failure to composition instructions. |
| `learn-extract` / `learn-skill-evolve` | **Already covered — no edit** | Both already require all-polarity signals, narrow ownership, variation/counterexamples, separate target/method tracks, independent review and replay/holdout before treating consequential guidance as demonstrated. The learner applied that method. The primary's post-freeze supplement is correctly append-only and cannot overwrite frozen FAIL. |
| Codemunch troubleshooting candidate | **Trial, amend before trial use** | This is genuine marginal information: the live troubleshooting page only says to refresh a stale index and has no procedure for mutually inconsistent `content_verified`/`_freshness` and `git_sha_verification` fields. The candidate adds a narrow, tool-owned recovery that current extraction freshness guidance does not supply. It belongs in the Codemunch profile, not extraction core. One instance proves utility for one shape of wrapper; it does not establish generality or tool correctness. Keep trial-only and do not claim adoption/effectiveness. |
| Operational setup/checkpoint/budget bundle | **Episode-only trial; no skill edit** | Early checkpoint durability and richer inventory are useful positive observations, but setup, staffing, budgets and source assistance changed together. Exact latency/token receipts are incomplete and full acceptance remained FAIL. Replay on a materially different donor before operational adoption. |

## Candidate amendment and counterexamples

Keep the existing bounded recovery, with two clarifications before it is used as a tool-profile trial:

1. Require the verifier to state both the exact file and immutable revision, and to prove the working file equals that revision's blob before calling the body current. If revision/path is missing, ambiguous, unavailable, or working bytes differ, leave the conflict unresolved. A symbol-body match cannot establish repository freshness.
2. Keep boundary handling exact and declared. `verification.py` verifies one fixed `export ` prefix and an exact line slice; it does not support arbitrary wrapper inference, AST re-parsing, overload selection, or broad whitespace normalization. Preserve this limit in guidance and evidence. The script is a one-case artifact, not a reusable verifier.

Counterexamples the current wording must not accidentally pass:

- **True body drift:** exact body hash differs at the declared revision, or no exact body exists at those lines. Outcome stays unresolved/stale; do not reconstruct from nearby text or normalize until it matches.
- **Wrapper/public-export change:** body happens to match but export kind/name, decorator, overload, enclosing scope, or public barrel changed. The candidate only verifies symbol-body identity. Report body identity separately; public API/export equivalence is not established and needs its own source/build checks.
- **Dirty adjacent source:** one symbol matches but imports, provider, sibling symbol or package files are dirty/different. Only the named body is anchored; adjacent dependency closure stays open.
- **Missing/ambiguous revision:** a matching current line slice or hash without an immutable revision and exact path is not source identity. Do not substitute branch HEAD or a cache refresh's “no changes” message for revision-bound evidence.

The `AppSidebar` supplement is a valid narrow positive example: working file equals the stated Git blob and the tool hash matches the exact extracted body after a single `export ` prefix. It closes only that symbol's body. The initial over-escaped comparison failure is retained, but corrected verification makes this one case reproducible. Provider freshness, linked package source/export/build, inventory, tokens, licensing and runtime remain unresolved; overall discovery stays FAIL.

## Trial replay and holdout

Before promotion, replay with a second materially different mismatch shape (for example a method/class member with a decorator or another declared AST boundary) against an immutable revision. Record the raw conflicting fields, file/revision identity, exact boundary, working-blob comparison, and result. Include a deliberate negative where body differs or revision is unavailable; expected result is unresolved. Also include a public-export change and dirty adjacent-file case; expected result is that local body proof does not close export/dependency claims. A fresh executor should apply the trial guidance without evaluator hints. Compare against the pre-change troubleshooting text and record whether the instruction changed the decision or prevented an overclaim.

## Limits

One post-evaluation body proof, one donor/app component, and a hardcoded, one-prefix verification script support a bounded trial only. No second conflict replay, negative holdout, tool reliability study, package/build/public-export verification, or target behavior replay ran. ESI-001/EXTRACT episodes were represented through the learner's sampled history, not exhaustively retrieved here. No user assent or four-party consensus is claimed.
