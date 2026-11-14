# ESI005 foundation and state

## Reuse decision

Restored the six-primitives foundation and `LayoutContainer` from `cb99fd0`. This reuses the tested polymorphic root, named-part, provider, styling, and layout contracts instead of reimplementing them for Sidebar. `useInputBarController` already owns prompt-history persistence, but that storage is specific to input history and includes an application callback contract; it does not provide generic durable component state.

## State APIs

- `useControllableState({ value, defaultValue, onChange })` supports one state owner. `value !== undefined` is authoritative; setter calls notify `onChange` without changing controlled output. Uncontrolled state starts at `defaultValue`.
- `usePersistentState({ initialValue, key?, version?, storage?, migrate?, validate?, onError?, syncAcrossTabs? })` works in memory when `key` is omitted. A key enables versioned storage; omitted `storage` uses browser `localStorage`, a supplied adapter replaces it, and `null` disables persistence. `syncAcrossTabs` opts into matching storage events and defaults to false.
- The foundation `ComponentDefaultsProvider` contract includes Sidebar in its name, full prop map, and typed defaults options, so application defaults use the existing provider precedence/merge path.
- Stored values use `{ version, value }`. Older versions require a migration function; future versions, invalid envelopes, parse failures, migration failures, and validation failures report typed `PersistentStateError`s.
- Storage access happens after mount, keeping server rendering and the first client render on `initialValue`. Unreadable data is left untouched and the fallback is not written automatically. A later explicit state update enables writes. Errors remain non-fatal to in-memory state.
- Cross-tab events reuse the same version/migration/validation decoder. Invalid events leave current state and storage untouched; accepted remote values do not write back. Listeners are removed when config changes or the hook unmounts. Custom adapters receive events only when `event.storageArea` is the adapter object itself; other adapters need their own external synchronization.

The Sidebar can own default or controlled collapsed/width values and choose persistence per durable field. Transient interaction state stays in memory unless its owner explicitly persists it.

## Verification

Focused hook tests cover memory defaults, controlled authority, migration/version rewrite, malformed-data preservation, and typed storage read failures. Run with `pnpm exec vitest run tests/components/usePersistentState.test.tsx` from the repository root.
