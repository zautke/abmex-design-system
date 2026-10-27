# Six primitives learning packet — bounded checkpoint

Frozen scope: implementation and review experience through 2026-10-26, before final release acceptance. This is a labeled summary, not a verbatim transcript. Browser/distribution verification still in progress; do not treat this packet as a completed release.

## Sources

- `2026-10-25-six-primitives-evidence.md` records the earlier 192-test run, initial browser checks and their limitations.
- Canonical KB episode: `projects/design-system/donor-component-extraction-parent/runs/extract-20261025-003-six-primitives-executable-contract-exercise`.
- Historical ledger: `projects/design-system/donor-component-extraction-parent/extraction-skill-live-exercise-ledger`; compare linked episodes 001–004 and recorded learning dispositions. State any unavailable history explicitly.
- Current skills: `~/.agents/settings/global/claude-profiles/fe/skills/extract-abmex-components`, `learn-extract-abmex-components`, `learn-skill-evolve`.
- Base Component Contract revision 0.9; implementation is a foundation exercise, not donor fidelity evidence.

## New observations

1. Provider static slot configuration combined with instance callback configuration lost disabled state. Tests now cover mixed layers, nested defaults and callback state coherence. Dynamic callbacks cannot define the authoritative state they consume; public types forbid those fields and runtime ignores them from JavaScript callers. Static state inputs remain supported.
2. IconButton explicitly forwarded absent root channels, erasing Button provider defaults. Omitting absent forwarding restored composition behavior. This was found by independent review, then fixed with regression coverage.
3. Independent final review found the missing public LayoutContainerProps export despite successful source checks. Export and a public consumer fixture were added. Public declaration checks must use rebuilt artifacts; stale dist caused expected-error directives to appear unused.
4. Earlier tests validated individual surfaces; cross-layer combinations exposed additional defects. This expands the variation beyond prior reasoning-only exercises and planning-only theme work.
5. HOME disk availability fluctuated from 7GiB to hundreds of MiB while the external workspace volume retained 33GiB. Check the actual destination volume before attributing workspace capacity to HOME. Do not delete unrelated files or seed first-user environments.
6. Browser connector disappeared repeatedly during this checkpoint; native automation also returned a pipe-startup failure. Earlier browser results cannot certify changed source. Preserve verification status rather than inventing success.

## Candidate dispositions for independent review

- Target skill candidate: add a compact conditional acceptance check for composed override paths (provider → intermediate → primitive → named part), including absent values, conflicting values, static+callback mixing, state authority, and public artifact consumption. First check whether existing resources already cover this precisely; adopt only the missing instruction, otherwise record already-covered.
- Evolution-method candidate: no universal edit proposed. Compare the new evidence with prior episodes; disk/browser instability may be episode-only or existing operational protocol, not new meta-skill guidance.
- No API expansion, dependency, platform, persistence requirement or policy change proposed. User requirements remain intact.

## Review instructions

Two fresh read-only reviewers receive this identical packet. Reviewer A checks fidelity, requirement preservation and coverage; Reviewer B checks information gain, counterexamples, generalization and instruction cost. Both review target and evolution-method tracks under current learn-skill-evolve. Record evidence limitations and dissent. User deliberation remains not yet reviewed; no consensus or promotion is implied.
