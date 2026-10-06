# Tabs

Phosphor document tabs. Compound component; React + `--ph-*` roles only (no component-library import), `lucide-react` for icons.

| Part | Role |
|---|---|
| `Tabs` | Root. `value` / `defaultValue` / `onValueChange`, `orientation: 'horizontal' \| 'vertical'`, `motion: 'standard' \| 'reduced' \| 'none'` (`standard` drops to `reduced` under OS reduced motion), `density: 'compact' \| 'comfortable'`. Tab/panel ids are scoped per root (`useId`). |
| `Tabs.SheetList` | Direction B. Folder tabs (`tabMinWidth` 7rem … `tabMaxWidth` 15rem, via `--tab-min-width`/`--tab-max-width`) on `ph-surface`, active raised to `ph-surface-2` with a top stripe. Vertical wheel scrolls the strip; overflow arrows (focusable, `aria-disabled` at the edge, 200px step); active tab scrolled into view; `after` slot behind a 1px separator. |
| `Tabs.Rail`, `Tabs.RailGroup` | Direction D. 280px vertical list (`aria-orientation="vertical"`), groups, `filter`/`onFilterChange`, `collapsed`/`onCollapsedChange`, `after` slot. |
| `Tabs.Tab` | `value`, `color` (kind colour: tinted active fill, top/left stripe, muted bottom stripe when inactive, tints `data-slot="icon"` children), `dirty`, `disabled`. Outer `data-slot="tab"` wrapper holds the `role="tab"` trigger and `.Close` as siblings. Parts: `.Label` (middle truncation, `onRename` = double-click rename; Enter commits, Escape cancels, focus returns to the tab), `.Chip`, `.Meta` (mono second line), `.Close` (`onClose`, `label`, `visibility: 'hover' \| 'always' \| 'selected'`; named "Close {label} tab"; unsaved dot until hover). Tabs animate in/out (180/135ms). |
| `Tabs.Panel` | `value`, `keepMounted` (default true). |
| `Tabs.OrientationToggle` | 2-segment radiogroup; consumer owns the state. |
| `Tabs.Switcher` | Direction C. Caret icon button → filterable grouped jump list (`groups`), "N open", ↑↓ / Enter / Esc. Binds **no** global keys: `shortcut` (default `Ctrl+K`, `null` hides) is a label/`aria-keyshortcuts` hint; the consumer binds it with the exported `matchesShortcut(e, shortcut)` and the controlled `open` / `onOpenChange`. Uses the enclosing `Tabs` unless `value`/`onSelect` are given. |

Keyboard: roving tabindex (falls back to the first rendered tab when the selected one is filtered out); ←/→ (sheets) or ↑/↓ (rail), Home/End, Enter/Space; Delete closes a tab that has `.Close`; disabled tabs are skipped.

Styling hooks: `data-slot` on every part (`tablist`, `tab`, `tab-trigger`, `label`, `chip`, `meta`, `close`, `scroller`, `arrow`, `panel`); state as `data-selected`, `data-dirty`, `data-disabled`, `data-orientation`. Forced-colors mode outlines the selected tab in `Highlight`.

## Drag reorder (opt-in)

```tsx
import { SortableSheetList, SortableRail, SortableTab } from '@abmex/ui/components/tabs/Sortable';
<SortableSheetList items={order} onReorder={setOrder}>
  {order.map((v) => <SortableTab key={v} value={v}>…</SortableTab>)}
</SortableSheetList>
```

Requires the optional peers `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`. The root `@abmex/ui` entry never imports them.
