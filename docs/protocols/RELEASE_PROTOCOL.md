# Release protocol — abmex-design-system

Copied from the Merlyn (wxt-prompt) release protocol on 2026-11-07 and adapted
for two npm packages published in lockstep. Canonical rule source:
kb `protocols/release/protocol-org-wide-branch-and-version-policy-development-and-main`.
Merlyn source: wxt-prompt `CLAUDE.md` "Build identity / release lane" and
kb `projects/merlyn/merlyn-versioning-rule-every-commit-is-a-patch-bump`
(legacy permalink; body carries the corrected rule). Project mirror:
kb `projects/design-system/abmex-release/abmex-release-protocol-merlyn-derived`.

## Version scheme

```
0.8.0.3-cev-theme-family
└─┬─┘ │ └──────┬───────┘
  │   │        └─ branchLabel — branch with its scope prefix stripped (feat/x -> x)
  │   └────────── BUILD — moves by one per ordinary task commit on that branch
  └────────────── base — MAJOR.MINOR.PATCH
```

| Branch | Version | npm dist-tag |
| --- | --- | --- |
| `development` | exactly `MAJOR.MINOR.PATCH` | `latest` |
| `main` | exactly `MAJOR.MINOR.PATCH` | `latest` |
| any other branch | `MAJOR.MINOR.PATCH.BUILD-<branchLabel>` | never published; see npm rendering |

The release trunks `development` and `main` never carry a BUILD number, a
fourth number or a branch suffix. `package.json`, the git tag and the registry
version are the same three numbers. There is no `next` dist-tag: `latest` is
the only tag a trunk publish produces.

**npm rendering of a branch version.** npm rejects four numeric components, so
an externally constrained field (`packages/*/package.json`) writes the branch
form as `MAJOR.MINOR.PATCH-<branchLabel>.BUILD` (same information, semver
prerelease order). Git tags and internal stamps keep the canonical
`MAJOR.MINOR.PATCH.BUILD-<branchLabel>`. A branch version reaches the registry
only through a deliberate `release: published` event, and then under the
dist-tag `<branchLabel>`.

## Bump rules

| Event | Bump | Reset | Example |
| --- | --- | --- | --- |
| Ordinary commit on a branch (`fix`, `docs`, `chore`, `refactor`) | BUILD + 1 | — | `0.8.0.3-x` → `0.8.0.4-x` |
| `feat` commit on a branch | PATCH + 1 | BUILD → 0 | `0.8.0.4-x` → `0.8.1.0-x` |
| Merge into `development` | MINOR + 1 | PATCH → 0 | `0.7.x` → `0.8.0` |
| Promotion `development` → `main` | MAJOR + 1 | MINOR, PATCH → 0 | `0.8.0` → `1.0.0` |

Both `packages/ui/package.json` and `packages/themes/package.json` move
together or only one package ships. A merge into `development` adds its entry
to `packages/ui/CHANGELOG.md` in the same commit as the version bump (this is
the repository's single release-notes file; `scripts/create-tags-and-releases.mjs`
reads it for GitHub release notes). Promotion to `main` adds no entry.

## Step 0 — survey concurrent work before any bump, commit, push or PR

Several agents and hosts commit to this repo. Version numbers and tags are
shared resources.

1. `git fetch --all --prune --tags`
2. `git log --oneline <your-base>..origin/development` and `..origin/main`
3. `gh pr list --state all --limit 15`; `git for-each-ref --sort=-committerdate refs/remotes | head`; `git worktree list`
4. `git tag --list '@abmex/ui@*'` and `npm view @abmex/ui versions --json`: pick the next UNCLAIMED version, never reuse one another lane stamped or published.
5. `git diff --stat origin/development...<lane>` for every open lane that shares your files; say so in the PR.
6. Rebase or merge the destination trunk into your branch before bumping; rerun `pnpm check`.
7. Repeat 1–2 immediately before `git push`.

## Branch workflow

Feature work starts as `<type>/<slug>` in a worktree off `development` and
returns by reviewed PR. `main` receives only verified `development` by PR.
Never merge before Copilot/Codex have posted; decline findings whose premise
does not hold here with a one-line reply naming the rule.

## Full pre-commit sequence

1. Finish one atomic task.
2. Step 0 survey.
3. Bump per the table above (both packages).
4. `pnpm check` (build, typecheck, vitest, package CSS test, public type test).
5. `pnpm publish -r --dry-run --no-git-checks --access public` to see the exact tarball contents.
6. Live proof where UI behaviour changed: the consumer app rebuilt against the tarball, exercised in the user's real Chrome profile **me@lukezautke.com** by user-impersonation, screenshot before and after, DevTools console free of new errors.
7. If any step fails: revert the version edit, fix, restart from 1. Never commit a half-verified bump.
8. Record the run in kb `projects/design-system/abmex-release/abmex-release-ledger-append-only`.
9. Commit (`chore(release): <version>`), push to the draft PR.

## Publish and verify (trunk merge)

`publish.yml` runs on push to `main` (and on `release: published`). It refuses
to publish a trunk whose version is not exactly three numbers.

```bash
RUN=$(gh run list -w publish.yml -L1 --json databaseId -q '.[0].databaseId')
gh run watch "$RUN" --exit-status
gh run view "$RUN" --json conclusion -q .conclusion      # watch can exit 0 on a failed run
for i in 1 2 3 4 5 6; do npm view @abmex/ui@<version> version && break; sleep 20; done
npm view @abmex/ui dist-tags            # latest must equal <version>
npm view @abmex/ui@<version> dist.attestations   # provenance present
```

Then append the ledger entry. A publish is not done from build output alone.

## Gotchas (inherited from Merlyn)

- A rule recorded in kb is not a rule the repo encodes: read `CLAUDE.md` in the checkout you commit from.
- A version number is shared across lanes: pick the next unclaimed, never "mine + 1".
- Local `pnpm publish` needs the npm granular token with Allowed IP Range `98.97.0.0/17` (Starlink egress) or Meshnet routing through adagio; CI publishes by OIDC and needs no token.
