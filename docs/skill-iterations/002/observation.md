# ESI002 primary observation and interventions

Run operational follow-up, not blinded/control efficacy comparison. Original acceptance unchanged. Target index established before dispatch (30.87s); docs-only packet commit followed index, so reported HEAD mismatch is not itself production-source drift. Primary independently checked d187c3a..HEAD changes only three packet docs and working diff across production packages/Sources/tests/manifests/lockfile empty.

Actual agents R4 /root/esi002_executor and R2 /root/esi002_inventory, both fresh Luna/high, created early checkpoint files. Primary verified executor.md/inventory.md/inventory-events.md exist at22:34:35Z; exact within90s timing is agent self-report, runner start times unavailable. Source-events.md created later. Role liveness/progress checked <=60s; known tool latency ~15–31s, aggregate receipts unavailable.

R2 stopped source work by seven-minute deadline and handed off inventory. R4 consumed R2 working checkpoint; its final report still refers to earlier mutable state, so primary must preserve final inventory separately rather than rewrite executor's past exposure. R9 fresh /root/esi002_tokens added by registered charterR1 to independent token-map/events lane, five-minute deadline; outputs only partial and arrived after R4 freeze. R4 did not consume final token-map.

R4 reported target/donor git SHA mismatch. Primary's target path-diff check establishes production equivalence despite packet/report files. Donor incremental index refresh11.25s returned no changes, then full refresh26.21s rebuilt85files8139symbols at tool-local16:44:25. No post-refresh hash receipt or installed-artifact proof obtained. R4 said reindex was not authorized under strict write-lane interpretation; primary performed tool-cache work. This setup permission ambiguity is evidence, not a proven core-skill omission.

Node donor package resolution MODULE_NOT_FOUND. Project package-manager inspection failed because donor requests pnpm8.15.0 while corepack supplies11.1.3. Charter prohibited installs/build/product execution, so installed provenance remains unresolved; do not call environment restriction a complete skill failure or fake package equivalence. No user data/servers/browser/product files touched.

R4 stopped at original twelve-minute boundary and published terminal111-line report with explicit source-acceptance FAIL. R9 stopped at five-minute checkpoint with no direct donor/target CSS source retrieval, accurately labeled partial. R0 preserved actual role documents and exact source limitations, not reconstructed traces.

Packet formatting caveat: original TEAM_CONTEXT.md committed0f2afaa had an extra blank line at EOF reported by staged diff check; subsequent commit still executed. Input remains frozen unchanged during execution; any final whitespace normalization is appended as post-run formatting with original bytes recoverable from0f2afaa. This is primary setup/verification error, not executor work.

Source reports freeze before fresh independent evaluation. No learner/reviewer advice supplied to executor. Complete raw tool transcript absent; role event docs and public handoffs constitute bounded coverage only. Skills unchanged throughout.
