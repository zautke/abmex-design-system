# Tabs

Phosphor document tabs. Compound component; React + `--ph-*` roles only (no component-library import), `lucide-react` for icons.

| Part | Role |
|---|---|
| `Tabs` | Root. `value` / `defaultValue` / `onValueChange`, `orientation: 'horizontal' \| 'vertical'`. Context only. |
| `Tabs.SheetList` | Direction B. Folder tabs (176px) on `ph-surface`, active raised to `ph-surface-2` with a mint top edge, overflow arrows, `after` slot. |
| `Tabs.Rail`, `Tabs.RailGroup` | Direction D. 280px vertical list (`aria-orientation="vertical"`), groups, `filter`/`onFilterChange`, `collapsed`/`onCollapsedChange`, `after` slot. |
| `Tabs.Tab` | `value`, `color` (kind colour, e.g. plugin `tabColor`), `dirty`. Parts: `.Label` (middle truncation, `onRename` = double-click rename), `.Chip`, `.Meta` (mono second line), `.Close` (`onClose`; unsaved dot until hover). |
| `Tabs.Panel` | `value`, `keepMounted` (default true). |
| `Tabs.OrientationToggle` | 2-segment radiogroup; consumer owns the state. |
| `Tabs.Switcher` | Direction C. Caret icon button → filterable grouped jump list (`groups`), "N open", ↑↓ / Enter / Esc, `shortcut` default `Ctrl+K` (`null` disables). Uses the enclosing `Tabs` unless `value`/`onSelect` are given. |

Keyboard: roving tabindex; ←/→ (sheets) or ↑/↓ (rail), Home/End, Enter/Space.

## Drag reorder (opt-in)

```tsx
import { SortableSheetList, SortableRail, SortableTab } from '@abmex/ui/components/tabs/Sortable';
<SortableSheetList items={order} onReorder={setOrder}>
  {order.map((v) => <SortableTab key={v} value={v}>…</SortableTab>)}
</SortableSheetList>
```

Requires the optional peers `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`. The root `@abmex/ui` entry never imports them.
