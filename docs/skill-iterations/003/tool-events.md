# Tool trial events — ESI-20261028-003

Times approximate local. No files in source repo were modified.

## 2026-10-28 — setup and first candidate

- Read `docs/skill-iterations/003/TEAM_CONTEXT.md` and `/Volumes/FLOUNDER/dev/braisenly-extraction-recovery-002/base/skills/using-codemunch/references/troubleshooting.md`.
- `plan_turn` on `local/abmex-design-system-7fcb3461` with task asking for a materially different default-export or member boundary returned high confidence; suggested `AppRootLayoutContainer` among files/symbols.
- `resolve_repo(path=/Volumes/FLOUNDER/dev/abmex-design-system)` returned `found=true`, `indexed=true`, `loadable=true`, source root exact; index timestamp `2026-10-22T15:47:56.254699`.
- Checkout HEAD: `1b8517e8ff4c94b62357812b75626b376991946f`.
- First `get_symbol_source` target `packages/ui/src/components/layout/LayoutContainer.tsx::AppRootLayoutContainer#function`, `verify=true`, `verify_against=git_sha`, `receipt=true`, `context_lines=2` returned:
  - span lines 38–40, full source `function AppRootLayoutContainer(props: Omit<LayoutContainerProps, 'region'>) {\n  return <LayoutContainer region="app-root" {...props} />;\n}`
  - `content_hash=15eb1c880fee9dd4c6e323637c603d2f1095a5e4bfd8be31d2313d8716e84298`
  - `content_verified=true`, `_freshness=fresh`
  - `git_sha_verification=git_sha_mismatch`, `git_sha_rev=1b8517e8ff4c94b62357812b75626b376991946f`
  - receipt `munch://evidence/sha256:20f961b8123883e167b6497e9b09c73a38bb392d0edfe4c4603221af8dbb9df7`
- Disposition: unresolved. Conflicting fields cannot verify identity; candidate is an ordinary named function, so it does not meet requested alternate AST-boundary criterion. No broad source normalization attempted.

## 2026-10-28 — method boundary and independent file identity

- `search_symbols(query=render, kind=method)` found actual AST method `packages/ui/src/components/ErrorBoundary.tsx::ErrorBoundary.render#method`; `search_text` found no `export default` occurrences in indexed TSX. The target is class method, materially different from known exported `AppSidebar` function and the first ordinary function candidate.
- `get_symbol_source(repo=local/abmex-design-system-7fcb3461, symbol_id=packages/ui/src/components/ErrorBoundary.tsx::ErrorBoundary.render#method, verify=true, verify_against=git_sha, receipt=true, context_lines=2)` returned:
  - `kind=method`, file as above, lines 27–53, signature `public render()`
  - body hash `3f84640b80916006bf75a1d7a6e6adce1a9e2d278a2bda6eba74d9989dff6441`
  - `content_verified=true`, `git_sha_verification=git_sha_match`, `git_sha_rev=1b8517e8ff4c94b62357812b75626b376991946f`, `_freshness=fresh`
  - receipt `munch://evidence/sha256:e7682af45d7584d1878e9d088d9aaeb9b717f49a28b53cf061186f152fb0727b`
- Accessible revision: `git rev-parse HEAD` returned `1b8517e8ff4c94b62357812b75626b376991946f`; `git rev-parse HEAD:packages/ui/src/components/ErrorBoundary.tsx` returned blob `b242bc386c6e0489326d5aaa9d47844c757b1a00`; `git show HEAD:... | sed -n '25,55p'` showed the preserved `public render()` method and body spanning lines 27–53.
- Working-file check: `git status --short -- packages/ui/src/components/ErrorBoundary.tsx` emitted no entry; `shasum -a 256 packages/ui/src/components/ErrorBoundary.tsx` returned `3e450a2df96aeede18a57d0a383b73b7f7692ce7ad1aa5e7d157323f3fe27a0c`. Clean target file means working bytes equal the Git HEAD blob. Thus method body/span identity verified for the separate checkout at query time.
- Exact returned source (modifier retained; no normalization):

```tsx
public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center bg-bg p-6 text-center text-fg-strong">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger-soft-fg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-fg-muted">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition-colors hover:bg-primary-hover"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
```

## 2026-10-28 — distinct export-wrapper mismatch replay

- `get_symbol_source(repo=local/abmex-design-system-7fcb3461, symbol_id=packages/ui/src/components/status/AppFooter.tsx::AppFooter#function, verify=true, verify_against=git_sha, receipt=true)` returned lines 10–18, content hash `d1d7ad50fd9ad65a4d38f9692d9e42f34cf635710218b518d91bff299c59fe74`, `content_verified=true`, `_freshness=fresh`, `git_sha_verification=git_sha_mismatch`, revision `1b8517e8ff4c94b62357812b75626b376991946f`; receipt `munch://evidence/sha256:68268f16c33151060b334e6fb00b4430e67cad954d0b2518f66afe372515d89a`.
- Immutable source check: `git show HEAD:packages/ui/src/components/status/AppFooter.tsx | sed -n '8,20p'` shows `export function AppFooter(...)`; CodeMunch returned source begins `function AppFooter(...)`. The returned function body text otherwise corresponds to the shown Git definition, but the explicit `export ` wrapper is missing from that AST symbol source. Preserve this wrapper difference; no normalization or full-definition match claimed. This is an observed boundary mismatch / counterexample to treating `content_verified` or freshness as export proof.
- Independent working bytes: `git rev-parse HEAD:packages/ui/src/components/status/AppFooter.tsx` returned blob `e4fd65a0baf8efd5621b9780d778648b36723fe4`; `shasum -a 256` returned `b3eb42aa04b2e9624d63c81d6f80ba93c707f5ab8fa62a0af7e9ea43899f2706`; targeted `git status --short -- ...AppFooter.tsx` emitted no entry. Working file therefore equals HEAD. Disposition: wrapper/export identity unresolved despite unchanged working bytes.

## Declared non-mutating negative cases

These are evidence-rule simulations, not live mutation/injection runs. No source files were changed.

| Case | Outcome under evidence | Why |
|---|---|---|
| Body changed while cached/revision hash stays fixed | Reject exact identity | Exact span/body no longer matches immutable revision; hash mismatch is positive negative evidence. |
| Revision unavailable | Unresolved | No reachable immutable source to anchor symbol span or body. |
| Modifier/export wrapper changed, body same | Body may match; boundary/API identity unresolved | Synthetic rule remains; actual `AppFooter` mismatch above separately demonstrates an omitted `export ` wrapper. Identical body cannot prove export semantics. |
| Dirty adjacent file | Target body can still match; adjacent scope unresolved | This receipt binds only one method definition, not imports, callers, dependencies, or neighboring files. |

Both mismatch receipts and the method match were actual tool observations. Do not report remaining synthetic cases as observed tool behavior or claim general workflow efficacy.
