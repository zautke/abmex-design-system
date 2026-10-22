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
- **Cloud consumer (push, no polling):** Claude Code routine `abmex post-publish` (`trig_01GAjDCke5pxZyXYuTMSA3AA`, https://claude.ai/code/routines/trig_01GAjDCke5pxZyXYuTMSA3AA) is fired by a GitHub `workflow_run` app trigger on this repo (webhook trigger `31b49774-b21a-4143-a6cf-605af13381a3`, no filter: the routine gates on `action == completed` and `workflow_run.name == publish-to-npm`). It verifies the registry, quotes `--log-failed` on failure, and opens a `chore(release): record publish …` PR. No secrets, no curl step. Prompt: `docs/routines/post-publish.md`. Debug: `RemoteTrigger list_runs` / `get_run_log`.
