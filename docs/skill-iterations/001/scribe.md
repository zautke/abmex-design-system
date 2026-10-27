# ESI-001 scribe baseline and recording requirements

Run ESI-20261027-001; inspected 2026-10-27. Scope: documentation assets and accessible canonical history. This is a source-evidence stage, not implementation proof. I did not read executor output and am not a live observer of other agents. Their dialogue, tool calls, decisions, timing, failures and successful behavior must come from their own bounded records or coordinator observations; none are reconstructed here.

## Baseline guidance already present

Loaded `/Users/derp/.agents/skills/extract-abmex-components/SKILL.md` (draft 0.2.1), `resources/session-recording.md`, `resources/evaluation.md`, `assets/run-record.md`; both learning entrypoints and `learn-skill-evolve/assets/learning-record.md` (draft 0.1.0); and `/Users/derp/.codex/skills/.system/skill-creator/SKILL.md`.

Recording guidance already requires frozen prompts/context/versions/revisions, ownership, deadlines and monitoring; timestamped observable events; exact relevant commands/errors/quotes; labeled summaries and omissions; durable bounded artifacts; explicit uncertainty; terminal retrospective even on failure; canonical KB write/readback; and separate execution, recording, retrospective and learning statuses. It already distinguishes source reasoning from implementation proof and observation from causal explanation. These are not missing instructions.

Learning already requires current skill + historical episodes/adoption decisions + frozen new dataset; all signal polarities; relevant variation and counterevidence; narrow ownership; two fresh independent reviews; user status without invented assent; target-skill and evolution-method tracks; replay/holdout where consequential; and a legitimate no-change disposition. Skill-creator supports progressive disclosure and marginal information gain rather than adding redundant rules.

## Historical coverage and provenance

Canonical endpoint `https://kb.braisenly.com/mcp` accessed read-only through `/tmp/extraction-kb.py`; project `master-kb`. Retrieved full current ledger `projects/design-system/donor-component-extraction-parent/extraction-skill-live-exercise-ledger` and full child `runs/extract-20261024-002-recording-and-learn-companion-evolution` beneath that parent. No alternate KB used.

| Evidence | Observed historical learning coverage | Limit |
|---|---|---|
| Ledger episode 001 | Bounded reasoning/authoring and composition applicability recheck; implementation untested | Child not retrieved in this scribe pass |
| Full episode 002 | Explicit recording and learn-companion authoring; summary-only transcript limitation; independent reviews; single novel success eligible; aborted missing evidence remains pending; optional redundant column rejected; user not yet reviewed | Authoring/review evidence, empirical extraction effectiveness pending |
| Ledger episode 003 | Six-primitives implementation checkpoint, later 198 tests and callback-ownership trial; recording partial; integration/publication and real holdout pending | Ledger summary only; foundation branch is not development inventory |
| Ledger episode 004 | CEV theme planning; acknowledgment gate failure; learning reviews/proposals present, deliberation pending | Planning evidence; child not retrieved |
| Ledger episodes 005/006 and CEV closeout | Procedure authoring/roster, known-ref regression, cross-team coordination, deadline intervention, explicit pending gates and no efficacy claims | Ledger summaries only; not independent inspection of their artifacts |

History is sampled, not exhaustive. Episode 002 preserves earlier running/in-progress text alongside later completed closure; ledger likewise preserves historical creation text. Readers need dated current checkpoint precedence without rewriting earlier observations. This is a demonstrated interpretation risk, not proof of current executor failure.

## Required ESI-001 packet

Coordinator should freeze and link: exact user task and each role prompt; TEAM_CONTEXT revision/hash; actual loaded skill/resource paths and versions/hashes; contract snapshot identity; source/target/foundation revisions and dirty states; supplied/withheld context and prior exposure; acceptance matrix; ownership and permission limits; roster and timestamps; liveness/progress/deadline interventions; role artifacts and hashes; exact meaningful tool inputs/results including negative evidence; provenance locations; evaluator observations with source identifiers; and terminal outcomes.

Each role's record must identify what it actually observed, what is self-report, what is source inference, and what remains unknown. Use labeled summaries when exact session evidence is unavailable. Retrospective should compare prediction/outcome, successful guidance, surprises, improvisation, all-polarity signals, historical variation, cause hypotheses and a falsifiable next experiment. Freeze execution/evaluation before fresh learning. Canonical episode and index need readback by primary, the sole KB writer. This scribe report alone does not satisfy that closure.

## Concrete recording mechanics to check

1. Existing templates are narrative; the inspected run-record/learning-record assets do not prescribe a machine-enforced event manifest or immutable packet digest. Coordinator should record actual artifact identities and a clear freeze checkpoint in this episode. A new helper is not justified without checking validator coverage and observed failure.
2. Distributed observer coverage is material here: scribe cannot truthfully transcribe other role sessions. Primary must retain role source references and own observed handoffs; missing per-role event evidence remains an omission, not inferred transcript.
3. Use one explicit current closure checkpoint with date/source and four statuses to disambiguate preserved historical state. Existing guidance already supports separate statuses; avoid universal duplication unless new evidence shows inadequate application.
4. Runtime, package consumption, donor migration, accessibility interaction and release gates must remain not-run at this discovery stage. A good decomposition plan cannot advance those gates.

These are episode recording checks/candidate mechanics, not adopted skill edits or findings against executor behavior. Validator implementation not inspected; no claim that it lacks a particular check.

## Indexed retrieval and relevant references

Docmunch `search_sections` in `local/extraction-team-frontend-skills`, query `recording retrospective learning`, lexical-only; then `get_section` with `verify:true` fetched `extract-abmex-components/assets/run-record.md` → `Required learning closure`. Section ID `local/extraction-team-frontend-skills::extract-abmex-components/assets/run-record.md::extraction-run/required-learning-closure#2`; content hash `6cfe7439abacf3a17f98cf2886bc93ca8d34a572d08eca2ef227e350b147d964`; both content/source hashes verified. This is actual indexed resource retrieval, not a catalog citation.

Relevant catalog references identified but not claimed loaded: extraction composition subskill for coordinated demos; frontend `extracting-reusable-components` for closure inventory, `codebase-design` for responsibility boundaries, `design-tokens` for semantic mapping, `design-review` and `better-accessibility` for later behavior proof. Generic donor relocation/redesign advice must remain subordinate to ABMEX adaptation and required capability. No current library question required Context7 or web research in this documentation-only scope.

## Verification and limits

Read shared packet before assignment; inspected target `git status --short` before writing (existing `docs/skill-iterations/` untracked); sole write is this report. Home-volume disk check showed 22 GiB available. No product/donor edits, descendants, commits, publication, KB writes or external messages. Tools actually used: `functions.exec`, `exec_command` with `/bin/bash`, `apply_patch`, canonical KB client (read_note), Docmunch search/get-section, and parent progress message.

No full historical corpus comparison, executor observation, runtime verification or learning review performed. Primary owns final recording integration, canonical readback, frozen packet and required independent learning closure.
