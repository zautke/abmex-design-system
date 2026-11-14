# Sidebar compositions

The demo app opens on the donor-faithful recipe-search experience, then offers fixture workspace navigation, a right inspector, and direct public parts. The recipe example exercises `@abmex/ui/sidebar-search`; the other compositions exercise public `@abmex/ui/sidebar` parts through `@abmex/ui/sidebar-demo`.

## Donor recipe search

`RecipeSearchSidebarDemo` is the primary drop-in. It includes recipe search, semantic/ingredient/hybrid modes, scoped theme control, and the donor menu actions. Its default search is fixture-backed. Supply `search` to call a host search service with `{ query, mode, limit, signal }`; the demo never invents a remote endpoint. Omit `persistenceKey` for memory-only preferences.

```tsx
import { RecipeSearchSidebarDemo } from '@abmex/ui/sidebar-search';

<RecipeSearchSidebarDemo
  persistenceKey="recipe-sidebar"
  search={async ({ query, mode, limit, signal }) => recipeClient.search({ query, mode, limit, signal })}
/>
```

## Workspace navigation

`SidebarDemo` uses local fixture navigation and `ContentPane`. Selecting a result changes the page body. Search filters fixture labels, groups, descriptions and keywords in memory; it makes no service calls. Pass `items`, a controlled `activeItemId`, `onNavigate`, `renderContent`, or `renderItemBody` to connect the composition to host data and routes. `brand`, `header`, `footer`, and page content are replaceable.

```tsx
import { SidebarDemo } from '@abmex/ui/sidebar-demo';
import { BookOpen, Layers, Star } from 'lucide-react';

<SidebarDemo
  persistenceKey="studio-navigation"
  persistPreferences
  items={[
    { id: 'overview', label: 'Overview', group: 'Workspace', icon: <Layers />, description: 'A live summary of the current workspace.', content: <Overview /> },
    { id: 'library', label: 'Library', group: 'Workspace', icon: <BookOpen />, description: 'Reusable assets for this project.', content: <Library /> },
    { id: 'saved', label: 'Saved', group: 'Personal', icon: <Star />, children: <span><strong>Saved</strong><small>12 items · Updated today</small></span>, content: <SavedItems /> },
  ]}
  brand={<WorkspaceMark />}
  renderContent={item => <WorkspacePage item={item} />}
/>
```

Persistence is opt-in. A `persistenceKey` enables local theme preference storage; `persistPreferences` enables sidebar width/collapse storage as well. Controlled values remain owned by the host. Omit both for memory-only behavior.

## Inspector composition

`InspectorSidebarDemo` puts an independently controlled sidebar on the right. It switches between contextual Details, Activity, and Sharing panels while the canvas remains mounted. It supports controlled collapse and replaceable panel/header/footer content. Unlike the workspace composition, selection changes an inspector view rather than a page destination.

```tsx
import { useState } from 'react';
import { InspectorSidebarDemo } from '@abmex/ui/sidebar-demo';

function Editor() {
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setInspectorCollapsed(value => !value)}>
        Toggle inspector from host
      </button>
      <InspectorSidebarDemo
        title="Campaign board"
        collapsed={inspectorCollapsed}
        onCollapsedChange={setInspectorCollapsed}
        details={<CampaignFields />}
        activity={<ActivityList />}
        sharing={<ShareSettings />}
      />
    </>
  );
}
```

## Capability and evidence matrix

| Capability | Public surface | Default / evidence | Limit |
|---|---|---|---|
| Fixture navigation | `SidebarDemo.items`, `ContentPane` | Selecting a row updates the content pane | Routes and server data belong to host |
| Local search | `SidebarDemo` search field | Filters actual fixture metadata without network access | Fixture-only unless host supplies its own items |
| Brand/footer/content replacement | `brand`, `header`, `footer`, `renderContent` | Replaces visible host regions | Replacement owns its own behavior |
| Rich menu body | `SidebarDemoItem.children`, `renderItemBody` | Replaces item body for Saved fixture row | Consumer content must preserve useful labeling |
| Collapse and rail | Public `SidebarTrigger`, auto-rendered `SidebarRail` | Sidebar controls remain operable by keyboard | Live focus/hidden-state proof is recorded by root |
| Scoped theme | `theme`, `defaultTheme`, `onThemeChange` | Dark/light `data-theme` on composition root | Theme does not escape composition root |
| Preference persistence | `persistPreferences`, `persistenceKey`, `onPreferenceError` | Off by default; opted in key stores theme and sidebar preferences | Host can report storage errors through callback |
| Independent right inspector | `InspectorSidebarDemo` | Right side, contextual panels, independent selection/collapse | Panel service actions supplied by host |
| External state | `activeItemId`, `collapsed`, change callbacks | Host values stay authoritative | Host must update controlled values in response to callbacks |
| Donor recipe experience | `RecipeSearchSidebarDemo` | Default demo view, fixture-backed with replaceable search adapter | Root owns component implementation and live behavior verification |
| Built public consumption | `packages/ui/demo-sidebar` | Imports `@abmex/ui/sidebar-search`, `@abmex/ui/sidebar`, `@abmex/ui/sidebar-demo`, and published CSS | Root owns build and live Chrome verification |

## Demo app

From the workspace root, run `pnpm --filter @abmex/ui exec vite --config demo-sidebar/vite.config.ts` after the public package build. Build the app with `pnpm --filter @abmex/ui exec vite build --config demo-sidebar/vite.config.ts`. Vite uses `APP_HOST=0.0.0.0` and `APP_PORT=43829` from the app's `.env`. The app tabs exercise the public compositions and a direct public-parts composition. All examples are fixture-backed; there are no credentials or remote endpoints.

## Verification record

| Check | Result | Artifact / limitation |
|---|---|---|
| Type/build through public package | Not run in this lane | Root owns build config and package build |
| Browser navigation, search, theme, collapse and two-instance independence | Pending root live Chrome run | Record screenshots and console state in run ledger |
| Storage failure and keyboard focus inspection | Not run in this lane | Must be covered by root acceptance evidence |
