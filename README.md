# ABMEX

Organization-wide UI, themes and motion, extracted from Merlyn.

## Migration status

This repository is an **unpublished integration candidate**. It combines the
Merlyn theme-editor lane, six tab-family commits and the captured adagio 0.6.4
working tree. Existing consumers have not been migrated yet.

The approved specification lives in the sole knowledge base:
`projects/design-system/plans/abmex-standalone-ui-migration-2026-10-06`.
The accompanying session prompt is
`projects/design-system/plans/abmex-opus-55-session-2026-10-06`.

## Development

Use pnpm and the repository lockfile. `pnpm check` runs package type checks,
builds and the component regression suite. CSS generation also runs its contrast
gate; failures must prevent release.

No app data store, extension runtime or networking belongs in reusable UI.
Consumer entrypoints own those connections.

## Provenance

`docs/provenance/source-artifacts.json` identifies original source commits and
captured artifacts by SHA-256. `filtered-commit-map.txt` maps original commits to
package-only history; filtered hashes are not original commit hashes.
`test-sources.json` identifies copied regression tests.

Original repositories and dirty worktrees are preserved. The captured adagio
tarball is evidence of what mdeditor consumed, not proof that every dirty source
file was part of that artifact.

## Native compatibility

Merlyn requires iOS 15 and macOS 12. Keep those deployment floors for ABMEX.
Its current host uses WKWebView; extraction does not require rewriting that host.
The separate VoiceCommand SwiftUI package is a native proof consumer with newer
deployment targets. Newer platform APIs in shared components need fallbacks.

## Release gates

Publish tested immutable tarballs under `next`, themes before UI. Verify registry
installs before updating consumers. Preserve each consumer's prior artifact,
lockfile and state fixtures, and test rollback before removing copied source.
Do not promote a partially published candidate or merge paused upstream PRs.
