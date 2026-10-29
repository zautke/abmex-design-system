# Sidebar capability

Import working compositions or build your own from the public parts. React19 and Tailwind4 are supported. Import `@abmex/ui/styles.css` for complete compiled styling; Tailwind consumers can instead import `@abmex/ui/tailwind.css` and register their own source paths. ABMEX theme roles remain the color authority.

```tsx
import '@abmex/ui/styles.css';
import { RecipeSearchSidebarDemo } from '@abmex/ui/sidebar-search';
import { SidebarDemo, InspectorSidebarDemo } from '@abmex/ui/sidebar-demo';

export function Examples() {
  return <><RecipeSearchSidebarDemo /><SidebarDemo /><InspectorSidebarDemo /></>;
}
```

Recipe search uses explicit local fixtures. Pass `search({query, mode, limit, signal})` to connect a real service; it returns recipe results. Modes and Analytics/Documentation/Settings have actual content destinations. No backend or application router is imported into the library.

```tsx
import { Sidebar, SidebarHeader, SidebarContent, SidebarItem } from '@abmex/ui/sidebar';

<Sidebar side="left" defaultWidth={320} collapseToIcons
  persistence={{key: 'workspace.navigation', syncAcrossTabs: true}}
  classNames={{root: 'border-r', itemAction: 'rounded-none'}}>
  <SidebarHeader>Workspace</SidebarHeader>
  <SidebarContent>
    <SidebarItem href="/projects" label="Projects" icon={<ProjectIcon />} />
    <SidebarItem label="Details" onClick={showDetails}
      interactiveContent={<button aria-label="More details" onClick={showMore}>…</button>} />
  </SidebarContent>
</Sidebar>
```

Root supports native attributes and target-aware `as`/ref. `slots` replace named parts; `slotProps` configure them. `classNames` and `styles` accept static values or Sidebar-state callbacks. Classes resolve Tailwind conflicts, inline styles merge by property, consumer event handlers run before cancelable built-in behavior. Required hidden/inert/disabled semantics remain protected. Custom replacement components own forwarding props/ref and preserving their behavior.

Default root includes a toggle and resize rail. Use `showToggle={false}` or `showRail={false}` to place your own public `SidebarTrigger`/`SidebarRail`. Left/right width, min/max, collapsed width, collapse-to-icons and collapse capability are configurable. Rail supports pointer drag, arrows, Shift acceleration and Home/End, with unmount cleanup. Ordinary navigation uses links/buttons, not menu roles. Trailing controls are siblings, never nested actions.

Controlled `collapsed`/`width` and callbacks override memory/stored state. Without persistence, instances are independent in memory. Supply a stable key to enable versioned localStorage, or replace storage/migration/validation/error handling. `syncAcrossTabs` is opt-in; malformed data is preserved and errors are typed. External controlled state stays authoritative. `useControllableState` and `usePersistentState` are available through the lean `@abmex/ui/state` entry and root exports. Collapsed content stays mounted; hidden controls are inert. No undo/redo behavior is implied.

`IconLabel`, `Text`, `Icon`, `Button`, `IconButton`, `BaseLayoutContainer` and `LayoutContainer` are public reusable layers. `sidebarDescriptor` and `sidebarOptionsSchema` expose serializable discovery metadata; full TypeScript declarations define callbacks, refs and replacements. `ComponentDefaultsProvider` supplies scoped defaults, with instance overrides.

Run local examples with `pnpm build && pnpm build:sidebar-demo && pnpm demo:sidebar`. Set APP_HOST and APP_PORT in `demo-sidebar/.env`; host must bind0.0.0.0. Production validation uses Vite preview of the built app. Tests and build results are recorded under `docs/skill-iterations/005`; live release acceptance remains a separate gate.
