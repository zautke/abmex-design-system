# Tabs

Phosphor document tabs. Compound component; React + `--ph-*` roles only (no component-library import), `lucide-react` for icons.

| Part | Role |
|---|---|
| `Tabs` | Root (`data-slot="tabs"`): the **folder frame**, `bg-ph-folder p-1.5` (`pt-0` horizontal, `pl-0` vertical) so the folder wraps the paper pane on its open sides; override with `className`. `value` / `defaultValue` / `onValueChange`, `orientation: 'horizontal' \| 'vertical'`, `motion: 'standard' \| 'reduced' \| 'none'` (`standard` drops to `reduced` under OS reduced motion), `density: 'compact' \| 'comfortable'`. Tab/panel ids are scoped per root (`useId`). |
| `Tabs.SheetList` | Direction B. Folder tabs (`tabMinWidth` 7rem … `tabMaxWidth` 15rem, via `--tab-min-width`/`--tab-max-width`) on a `ph-folder` strip: inactive tabs are flat folder with hairline `ph-folder-edge` dividers; the selected tab is `ph-paper` (`--tab-bg`), raised (`z-10`), with no bottom border, an inset top indicator (`box-shadow`, kind colour or primary) and `--ph-tab-flare` (6px) top radius plus outward-flaring concave feet (`::before`/`::after` radial gradients), so it joins the pane. The scroller carries `mask-fade`: clipped edges fade, driven by `useOverflowEdges('x')`. Vertical wheel scrolls the strip; overflow arrows (focusable, `aria-disabled` at the edge, 200px step); active tab scrolled into view; `after` slot behind a 1px separator. |
| `Tabs.Rail`, `Tabs.RailGroup` | Direction D. 280px vertical list (`aria-orientation="vertical"`), groups, `bg-ph-folder`, list with `mask-fade` on y (`useOverflowEdges('y')`), `filter`/`onFilterChange`, `collapsed`/`onCollapsedChange`, `after` slot. |
| `Tabs.Tab` | `value`, `color` (kind colour: top/left indicator, tints `.Chip` and `data-slot="icon"` children), `dirty`, `disabled`. Outer `data-slot="tab"` wrapper holds the `role="tab"` trigger and `.Close` as siblings. Parts: `.Label` (CSS end-ellipsis; `max` opts into middle truncation, `onRename` = double-click rename; Enter commits, Escape cancels, focus returns to the tab), `.Chip` (filled kind-tint chip; put it before `.Label`), `.Meta` (mono second line), `.Close` (`onClose`, `label`, `visibility: 'hover' \| 'always' \| 'selected'`; named "Close {label} tab"; unsaved dot until hover). Tabs animate in/out (180/135ms). |
| `Tabs.Panel` | `value`, `keepMounted` (default true). Paper: `bg-ph-paper`, `--ph-radius` corners, `shadow-ph-surface`. |
| `Tabs.OrientationToggle` | 2-radio icon group (`size-9`, lucide `MoveHorizontal` / `MoveVertical`); `labels` replaces the content, `itemLabels` names the radios (default "Horizontal tabs" / "Vertical tabs"). Arrow keys flip. Consumer owns the state. Frameless inside a `ButtonGroup`. |
| `Tabs.Switcher` | Direction C. Caret icon button → filterable grouped jump list (`groups`), "N open", ↑↓ / Enter / Esc. Binds **no** global keys: `shortcut` (default `Ctrl+K`, `null` hides) is a label/`aria-keyshortcuts` hint; the consumer binds it with the exported `matchesShortcut(e, shortcut)` and the controlled `open` / `onOpenChange`. Uses the enclosing `Tabs` unless `value`/`onSelect` are given. `triggerClassName` styles the caret button; flush inside a `ButtonGroup`. |

Keyboard: roving tabindex (falls back to the first rendered tab when the selected one is filtered out); ←/→ (sheets) or ↑/↓ (rail), Home/End, Enter/Space; Delete closes a tab that has `.Close`; disabled tabs are skipped.

Styling hooks: `data-slot` on every part (`tablist`, `tab`, `tab-trigger`, `label`, `chip`, `meta`, `close`, `scroller`, `arrow`, `panel`); state as `data-selected`, `data-dirty`, `data-disabled`, `data-orientation`. Forced-colors mode outlines the selected tab in `Highlight` (box-shadow indicator and flares are dropped), dividers are `GrayText`.

## Drag reorder (opt-in)

```tsx
import { SortableSheetList, SortableRail, SortableTab } from '@abmex/ui/components/tabs/Sortable';
<SortableSheetList items={order} onReorder={setOrder}>
  {order.map((v) => <SortableTab key={v} value={v}>…</SortableTab>)}
</SortableSheetList>
```

Requires the optional peers `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`. The root `@abmex/ui` entry never imports them.
