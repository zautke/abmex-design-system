# Package and source provenance — ESI-20261028-003 R2

## Decision status

Package installation is an **unbootstrapped prerequisite**, not evidence that `@braisenly/ui` source is absent. Labsupapg declares the package from a local path; that source and its built output exist. The target application's `node_modules` tree is absent, so Node cannot resolve it yet. No install, build, version switch, or source edit was run.

Transfer scope is not fully named by this packet. The confirmed consumer is Labsupapg's dashboard `AppSidebar`; its wrapper imports exported `Sidebar` and related symbols from the package root. Rights below are source facts only, not a licensing determination.

## Identity evidence

| Item | Current identity / evidence |
|---|---|
| Consumer checkout | `/Volumes/FLOUNDER/dev/labsupapg`, branch `feat/theme-toggle-circular-reveal`, `HEAD c0b0e5f82973b8a5c929d05f58cef48463bc7b73`. Working tree has untracked `.serena/` and `docs/superpowers/`; no tracked changes reported. |
| Declared package dependency | `apps/web/package.json` declares `@braisenly/ui: file:/Volumes/FLOUNDER/dev/design-system/ui`; the lockfile importer resolves `file:../design-system/ui` to `@braisenly/ui`. |
| Source checkout | `/Volumes/FLOUNDER/dev/design-system`, branch `development`, `HEAD a899e7051053f791dcb61b417af43c1f68ca307b`. It has numerous unrelated dirty app, Storybook, package, and design files; preserve them. Relevant sidebar source files and `ui/tsup.config.ts` are not listed among dirty paths. |
| Current UI manifest | `ui/package.json` bytes SHA-256 `fd973161eba556d6b1e7541b2dee3793747e06826c5fe798741392eb43635d1a`. Parsed current fields: `name=@braisenly/ui`, `version=0.4.2`, `license=MIT`, repository `https://github.com/zautke/design-system.git` (directory `ui`), package files `dist` and `src`. It is dirty relative to source `HEAD` only by an added `@abmex/phosphor` development dependency; that change is unrelated to the declared app dependency. |
| Source entry identity | `ui/src/index.ts` SHA-256 `857fc6f21a7215a76d0b1633cc09cee6dd85e701c1447e4697ac2cfc8866a21e`; current file is clean relative to source `HEAD`. It re-exports `Sidebar`, `SidebarTrigger`, `SidebarRail`, `SidebarItem`, `SidebarSection`, `SidebarContext`, `useSidebar` and their types from `./components/sidebar`, plus legacy `CollapsibleSidebar` aliases. |
| Build identity | `ui/tsup.config.ts` SHA-256 `03e7ce2898bb8805506ade9a4e8ece60443486fad1bfff54c1c4ddd3c5b37f08`; manifest build command is `tsup && node scripts/add-use-client.mjs`. Config emits ESM and CommonJS with declarations to `dist`, root entry `src/index.ts`, and component entry points including the code block/playground entries. |

CodeMunch was used to navigate both repositories (`resolve_repo`, `plan_turn`, manifest and consumer searches, and exact file retrieval). Labsupapg index was dated 2026-10-27; design-system index was dated 2026-10-03, so current source claims above were checked against the actual checkout, Git status, and SHA-256 metadata. Do not treat stale index content as current source identity.

## Exports and output presence

The current UI manifest exports root `.` to `dist/index.js`, `dist/index.cjs`, and `dist/index.d.ts`, and named subpaths (including button, card, input, badge, select, sidebar-adjacent UI primitives, theme switcher, token helper, code block, and playground) to corresponding `dist/*` files; it also exports `./code-block/code-editor.css` directly from `src`. `ui/tsup.config.ts` confirms the source entry map and `dist` output directory. Non-installing existence inspection found every path named in the current package `exports` present under `/Volumes/FLOUNDER/dev/design-system/ui`. Thus missing Labsupapg resolution is package-link/dependency bootstrap state, not missing package source or generated output.

## License and ownership notices

- Current package metadata says `MIT`. `git ls-files '*LICENSE*' '*NOTICE*'` in the source checkout found only `ui/.storybook/fonts/OFL-LICENSES.txt`; no tracked root or `ui/` MIT license text, `NOTICE`, or per-file notice was found by that filename inventory.
- `ui/.storybook/fonts/OFL-LICENSES.txt` SHA-256: `3d318877b9629d04012ab2fe3d0e0576ff673af660fa7521743f8f59ea3844f0`. It concerns Storybook font assets; no evidence in this packet establishes those fonts as part of intended transfer.
- Exact intended transfer file/assets list and their copyright/licensing provenance remain **unresolved**. Package metadata's `MIT` field alone is not a substitute for checking the applicable notice and third-party asset provenance. Do not infer blanket transfer rights from the package name or build output.

## Installed state and normal bootstrap

- Labsupapg root `package.json` pins `"packageManager": "pnpm@8.15.0"`, requires Node `>=18.0.0`, and declares pnpm `>=8.0.0`. Its workspace includes `apps/*`; `apps/web/package.json` points at the external local package path above.
- `pnpm-workspace.yaml` has a comment saying the Braisenly packages are now sourced from GitHub Packages, but the current app manifest and lockfile still declare/resolve this dependency as a local `file:` path. Treat the concrete manifest + lockfile entries as current install inputs; comment is stale or contradictory.
- Available versions observed without installing or switching: Node `v24.13.0`, pnpm `11.1.3`, Corepack `0.34.5`. The active pnpm does **not** match the project pin; do not use it directly for bootstrap.
- From `/Volumes/FLOUNDER/dev/labsupapg/apps/web`, `require.resolve('@braisenly/ui')` failed with `MODULE_NOT_FOUND`. Both `/Volumes/FLOUNDER/dev/labsupapg/apps/web/node_modules` and the repo-root `node_modules` are absent. This is an unbootstrapped checkout, not absent source.
- Permissible next bootstrap step, when execution is authorized: from Labsupapg root run `corepack pnpm install`; Corepack uses the root `packageManager` field to select pnpm 8.15.0 and may download/cache that runtime. Then verify package resolution from `apps/web`. Do not install dependencies from the design-system checkout or change a global pnpm alias. This Corepack behavior follows its [current usage guidance](https://github.com/nodejs/corepack#when-building-packages); bootstrap was not run here.

## Evidence limits

No `pnpm install`, build, typecheck, test, browser run, license determination, or artifact transfer was performed. Source checkout has unrelated uncommitted work and should not be edited by this role. Full provenance cannot pass until exact transfer paths and any bundled assets are named and their notices/ownership are checked individually.
