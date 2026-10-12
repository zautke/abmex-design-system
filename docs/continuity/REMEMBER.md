# Remember

- Preserve dirty donor worktrees and paused pull requests. Another session often has `/Volumes/FLOUNDER/dev/wxt-prompt` checked out dirty — never touch it; verify in a separate worktree.
- Do not claim release completion from package build/test results alone. After an npm publish, the packument/`npm view` can 404 for ~2 min (CDN lag); trust the `Notify publish webhook` step line `notified … status=…` plus the version endpoint. Local sessions cannot receive that webhook: poll with `gh run watch --exit-status` (see repo `CLAUDE.md`).
- Keep React and Tailwind optional to framework-neutral themes; keep sortable tab dependencies isolated.
- Native deployment floors remain iOS 15 and macOS 12.
- The reviewed migration plan is preserved verbatim in `docs/ABMEX_INTERNAL_PLAN_VERBATIM.md`; the component **spec** (`specification/SPEC.md`, `features.json`) now outranks it for what "done" means per component.
- Governing principle: Composable Compound Components (kb `concept/composable-compound-components`). Two kinds only; acyclicity, not rank; dot-notation parts; placement determinism. `primitives/` is struck vocabulary.
- Enforcement, not knowledge, is the binding constraint (kb `concept/why-agentic-design-system-builds-fail`). Every spec feature names a mechanical check; flag-scoped rows report `exempt`, never silence.
- HeroUI v3 is the fixed base library; only `@abmex/ui` imports `@heroui/*`. Do not propose Base UI / Radix / Ark swaps.
- `@abmex/ai` composes `@abmex/ui` and may ship opinionated drop-in plumbing behind injectable seams; core must render with zero adapters.
- Publishing is lockstep: bump both `packages/*/package.json` to the same version or `pnpm publish -r` ships only one (Codex caught this on PR #4).
- Peer agents (glm-5.3, kimi-k3) are ask-only; Claude runs the searches. Their MCP wrappers drop long generations — use direct streaming curl to `ollama2.braisenly.com/api/chat`.
- kb writes can hit `database is locked`; stage to `~/.claude/deferred-kb-sync/` per the README schema, never to an alternate store.
- Under vitest's jsdom environment `import.meta.url` is not a file URL — resolve spec paths from `process.cwd()` (`SPEC_ROOT`).
