# abmex-design-system — agent instructions

## ⛔ NON-NEGOTIABLE — release-branch version exceptions (user correction 2026-10-26)

**Read this before every version bump, commit, merge, tag or publish. These exceptions override the generic four-number rule and all older bump tables.**

| Destination branch | Exact release version | Merge bump | Reset | Example |
|---|---|---|---|---|
| `development` | **`MAJOR.MINOR.PATCH` — exactly THREE numbers** | **MINOR + 1** | PATCH → 0 | `1.4.2` → `1.5.0` |
| `main` (promotion from `development`) | **`MAJOR.MINOR.PATCH` — exactly THREE numbers** | **MAJOR + 1** | MINOR → 0; PATCH → 0 | `1.5.0` → `2.0.0` |

**Neither release branch ever adds BUILD, a fourth number, or a branch suffix.** `package.json` and the released/published artifact use that same three-number version. Release tags must not reintroduce a fourth numeric component; retain the repository/ecosystem tag convention.

Other internal branches retain `MAJOR.MINOR.PATCH.BUILD-<branch>` and increment BUILD per commit where applicable. **Externally constrained version fields (including npm packages) always obey their ecosystem's accepted format; never put a four-number stamp into an npm package version, even on a feature branch.** The existing external-format exemption was already recorded on 2026-10-16.

A merge into `development` gets the `changeset.md` entry; promotion to `main` does not. Existing worktree, pull-request, review-bot, build/live-verification and publication gates still apply. Do not invent separate release metadata or block for a three-versus-four-number decision already settled by these exceptions.

Canonical protocol: `protocols/release/protocol-org-wide-branch-and-version-policy-development-and-main`.


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
