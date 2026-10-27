# abmex-design-system — agent instructions

## Publish

- Publishing runs on push to `main` and on `release: published` via `.github/workflows/publish.yml`. Both packages are versioned in lockstep; bump `packages/ui/package.json` and `packages/themes/package.json` together or only one ships.
- **If you trigger a publish from a local session, you are the consumer.** Wait and react yourself:
  ```bash
  RUN=$(gh run list -w publish.yml -L1 --json databaseId -q '.[0].databaseId')
  gh run watch "$RUN" --exit-status           # blocks until done
  gh run view "$RUN" --json conclusion -q .conclusion   # watch can exit 0 on a failed run; read this too
  for i in 1 2 3 4 5 6; do npm view @abmex/ui@<version> version && break; sleep 20; done  # CDN lag ~2 min
  ```
  On failure: `gh run view "$RUN" --log-failed`, fix, re-run. Do not report the publish done from build/test output alone.
- **Cloud consumer (push, no polling):** Claude Code routine `abmex post-publish` (`trig_01GAjDCke5pxZyXYuTMSA3AA`, https://claude.ai/code/routines/trig_01GAjDCke5pxZyXYuTMSA3AA) is fired by a GitHub `release.published` trigger on this repo (webhook trigger `374f1380-a019-4d81-8026-01ddb9cf5a43`). publish.yml creates one release per package after a successful publish, so the `@abmex/ui@<v>` release is the success signal; the routine ignores the `@abmex/themes@<v>` twin. It verifies registry + provenance and opens a `chore(release): record publish <v>` PR. Failure runs produce no release, so the local consumer above is the failure path. **Requires the Claude GitHub App installed on this repo** (https://github.com/apps/claude); `/web-setup` alone does not deliver webhooks. Routine GitHub triggers support only `pull_request` and `release` (docs, 2026-10-22); `workflow_run` is silently never delivered. Prompt: `docs/routines/post-publish.md`. Debug: `RemoteTrigger list_runs` / `get_run_log`.
