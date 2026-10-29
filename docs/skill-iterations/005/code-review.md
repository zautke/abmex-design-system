# ESI005 implementation review

Final source review: 2026-10-28 18:11 local (2026-10-29 00:11 UTC), after Sidebar lane freeze. I reindexed the exact Sidebar, state-hook, foundation-contract, and composition files before review.

## Findings

### P1 — SidebarRail discards consumer inline styles

`packages/ui/src/components/sidebar/Sidebar.tsx:449-453` spreads native `props` into `partProps`, then replaces `style` with the rail offset and `context.styles?.rail`. Since `partProps` applies this final layer after `slotProps.rail`, both `<SidebarRail style={...}>` and `slotProps.rail.style` are lost. The raw `styles.rail` value is also spread directly instead of resolving a state callback. This breaks native prop forwarding and the approved consumer-first style precedence.

Minimal fix: resolve `styles.rail` with the current state, then merge it with rail defaults, slot props, and direct props in the documented precedence order.

### P1 — Disabled href items can remain keyboard-focusable

`SidebarItem` creates `aria-disabled` and `tabIndex` defaults for `href` items, then merges native and slot props afterward (`Sidebar.tsx:345-355`). A disabled link can therefore receive `aria-disabled={false}` and `tabIndex={0}` from props or `slotProps.action`; the final click handler prevents navigation but does not restore the disabled accessibility state. The disabled item is still reachable by keyboard and announced as enabled.

Minimal fix: apply the component-owned disabled semantics after consumer layers for href items (`aria-disabled=true`, `tabIndex=-1`), while retaining the click suppression.

### P2 — Persistent state has no configurable cross-tab synchronization

`UsePersistentStateOptions` exposes key, version, storage, migration, validation, and error handling, but no synchronization option (`packages/ui/src/hooks/usePersistentState.ts:59-74`). The hook reads/writes storage without a storage-event listener or equivalent synchronization (`:97-234`). Two tabs using the same persistence key therefore keep divergent in-memory preferences until remount. Revision 0.9 explicitly requires cross-tab synchronization to be configurable.

Minimal fix: add an opt-in synchronization option and update in-memory state from matching, validated storage events; leave controlled state authoritative.

## Fixed from interim review

The frozen source fixes the earlier four candidates: SidebarRail runs consumer and slot handlers before resize behavior and honors cancellation; IconLabel now has target-aware `as` and refs; SidebarItem's href overload targets an anchor ref; and local `slotProps.action` reaches the primary action element. It also preserves pointer listener cleanup on unmount.

## Verification scope

Source review only. Root reports public declaration fixtures compile and the Sidebar suite passes 11/11; I did not rerun them or run browser checks. Composition review found abort checks preventing stale recipe-search responses and theme scope contained by each composition root. Root owns the live browser evidence.
