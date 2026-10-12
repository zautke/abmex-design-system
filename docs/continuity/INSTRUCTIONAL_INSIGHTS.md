# Instructional insights

- Generated artifacts must be derived from one authored token source; CSS, TypeScript, and Swift output should be checked together.
- Scope-local theme controllers require scope-local transition selectors; root-only selectors silently fail for nested themes.
- Low disk capacity makes bounded syntax checks safer than dependency or simulator downloads.
- Close evidence gaps before asking peers for verdicts: capturing HeroUI's emitted DOM (`data-slot`, `tv` slots via context, `data-expanded`) reconciled the two peers' R1 disagreements without a debate round.
- Ask peers for ACCEPT/AMEND/REJECT per row with a mandatory check name; free-form "opinions" produced consensus too cheaply in R0.
- A prototype's spec must state what it does NOT certify (coverage disclaimer) — both peers insisted independently.
- Mine third-party AI kits (AI Elements, assistant-ui) for part taxonomy only; their styling habits (hard-coded utilities, store-required rendering) violate consumer-owns-look and zero-adapter rules.
- GitHub code search with `repo:` + `path:` qualifiers returned 0 for most leader repos; `gh api repos/:o/:r/contents/:path` fetch-by-path is the reliable modality.
- Re-issuing `gh run rerun` without checking `attempt`/`status` first queued a duplicate attempt; harmless only because the publish pipeline is idempotent.
