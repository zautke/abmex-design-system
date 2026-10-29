# abmex-design-system — agent instructions

## Extraction skill iteration

For the user-authorized extraction execution force, run branches, recording and mandatory learning cycle, read [EXTRACTION_SKILL_ITERATION_PROTOCOL.md](docs/continuity/EXTRACTION_SKILL_ITERATION_PROTOCOL.md). Canonical KB team: ESI-001; each execution attempt branches from the pinned `feat/extraction-skill-iteration` integration branch in its own worktree.

## Publish

- Publishing runs on push to `main` and on `release: published` via `.github/workflows/publish.yml`. Both packages are versioned in lockstep; bump `packages/ui/package.json` and `packages/themes/package.json` together or only one ships.
- The workflow ends with a completion webhook (step `Notify publish webhook`). It POSTs `{"text", "status", "version", "dist_tag", "published", "sha", "run_url"}` to repo secret `PUBLISH_WEBHOOK_URL` (optional bearer `PUBLISH_WEBHOOK_TOKEN`), on success, failure and cancel. Unset URL = step skips.
- **If you trigger a publish from a local session, you are the consumer.** A local session cannot receive the webhook. Wait and react yourself:
  ```bash
  RUN=$(gh run list -w publish.yml -L1 --json databaseId -q '.[0].databaseId')
  gh run watch "$RUN" --exit-status           # blocks until done; non-zero on failure
  for i in 1 2 3 4 5 6; do npm view @abmex/ui@<version> version && break; sleep 20; done  # CDN lag ~2 min
  ```
  Then confirm the `Notify publish webhook` step log line `notified … status=…`. On failure: `gh run view "$RUN" --log-failed`, fix, re-run. Do not report the publish done from build/test output alone.
- **Cloud consumer (push, no polling):** a Claude Code routine with an API trigger. Set `PUBLISH_WEBHOOK_URL` to the routine `/fire` URL and `PUBLISH_WEBHOOK_TOKEN` to its bearer token (created at claude.ai/code/routines; the CLI cannot mint tokens). The routine prompt must reference the `routine-fire-payload` block explicitly or the text is inert. Reference prompt: `docs/routines/post-publish.md`.
