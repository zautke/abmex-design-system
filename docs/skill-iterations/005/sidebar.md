# Sidebar extraction

## Reuse and decomposition

Sidebar is a semantic navigation region assembled from independently exported parts. `Sidebar` owns per-instance width/collapse state, `useSidebar` exposes that state to custom parts, `SidebarItem` owns one navigation/action row, and `IconLabel` composes icon and label content. The public parts are `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarItem`, `SidebarTrigger`, and `SidebarRail`. No donor palette or application route/service is included.

The sidebar reuses the foundation's cancellable prop/ref merge helpers and `useControllableState` / `usePersistentState`. Provider defaults are available through the shared `Sidebar` component map. It does not introduce a second state or styling system.

## Public API

```tsx
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarItem, SidebarRail, SidebarTrigger, useSidebar,
} from '@abmex/ui/sidebar';

<Sidebar side="left" defaultWidth={280} minWidth={200} maxWidth={480}>
  <SidebarHeader><SidebarTrigger>Toggle</SidebarTrigger>Workspace</SidebarHeader>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarItem href="/projects" label="Projects" icon={<ProjectIcon />} />
    </SidebarGroup>
  </SidebarContent>
</Sidebar>
```

Root supports controlled `collapsed`/`width` and `onCollapsedChange`/`onWidthChange`, uncontrolled `defaultCollapsed`/`defaultWidth`, `minWidth`, `maxWidth`, `collapsedWidth`, `side`, `collapsible`, `collapseToIcons`, `showToggle`, and opt-in versioned `persistence`. Controlled values win over stored values. Persistence defaults to memory unless a key is supplied; the storage seam, migration, validation, and typed error callback come from the foundation hook. Independent roots do not share state.

The root preserves native props and ref, supports `as`, replaceable `slots`, typed part `slotProps`, state-aware `classNames` and `styles`, and `unstyled`. `options` supplies provider-friendly defaults; direct root props override them. Styling uses ABMEX semantic roles. In collapsed icon mode, item labels are hidden and named by their label; otherwise collapsed content remains mounted, hidden and inert. The default root renders a working toggle and resizable rail. Set `showToggle={false}` to place a trigger in a custom header.

`SidebarItem` accepts a native `href`/`onClick`, active/disabled state, an icon and label, or replacement `children` for the item body. `interactiveContent` is rendered beside the primary link/button, so an independent control never nests inside it. Consumers supply its action and accessible name.

## Stable named-part inventory

| Part | Default semantics | Replace/configure |
|---|---|---|
| root | `<nav aria-label="Sidebar">` | `as`, `slots.root`, native props/ref, root style/class channels |
| header/content/footer | structural `<div>` regions | `as`, corresponding slots and part props |
| group/groupLabel | labelled group and label content | `as`, corresponding slots and part props |
| item | row with a native link or button | `href`, `onClick`, disabled/active, item/body/action slots |
| trigger | accessible toggle button | children, `as`, trigger slot/props |
| rail | vertical separator with min/max/current ARIA values | pointer drag, arrows, Home/End, `as`, rail slot/props |
| IconLabel | icon/label composition | icon/label content and each slot/style/class channel |

Callbacks supplied through `slotProps` run before existing handlers and can cancel them with `preventDefault`. Custom slot renderers own honoring their supplied props, refs, semantics, and accessibility. `SidebarRail` changes width by ten CSS pixels per arrow key (fifty with Shift), clamps at bounds, and unregisters active pointer listeners on pointer end/cancel or unmount.

## Source and fidelity notes

Donor behavior was independently checked against the LabSupapg `AppSidebar` and design-system sidebar sources in the prior extraction iterations. This extraction keeps the donor's navigation hierarchy, collapse/icon mode, configurable side and width, active/disabled entries, and resize behavior while separating rendering, state, and style seams. Defects were addressed at extraction boundaries: ordinary navigation remains native links/buttons rather than an ARIA menu; hidden content is inert; controls are not nested in links; controlled state wins over persistence; and the splitter exposes keyboard and value semantics.

This record describes the reusable library lane. Donor-specific providers, menus, routing, and demo content belong in a composition layer and are not Sidebar library dependencies.
