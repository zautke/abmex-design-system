# button-group — icon-button segments, joined or spaced

```tsx
import { ButtonGroup } from '@abmex/ui/button-group';
import { Tabs } from '@abmex/ui/tabs';

<ButtonGroup aria-label="Tab layout">
  <Tabs.OrientationToggle value={o} onValueChange={setO} />
  <Tabs.Switcher groups={groups} />
</ButtonGroup>
```

One `ph-field` frame (`ring-1` in `ph-border`, so it adds no layout height), hairline dividers between direct children, no inner radii, focus outlines drawn inset. Any icon buttons work as children; `Tabs.OrientationToggle` and `Tabs.Switcher` read `ButtonGroupContext` and drop their own frame. `role="group"`: pass `aria-label`.

## `variant="spaced"`

```tsx
<ButtonGroup variant="spaced" aria-label="View options">
  <Button isIconOnly variant="secondary" aria-label="Grid view"><LayoutGrid size={18} /></Button>
  <Button isIconOnly variant="secondary" aria-label="Search list"><Search size={18} /></Button>
</ButtonGroup>
```

The separator is pure negative space: `gap-2`, no frame, no divider, no container chrome. Each child keeps its own surface (a `variant="secondary"` HeroUI button resolves its fill through the theme adapter, so the row reskins with the theme). `ButtonGroupContext` is `false` here, so kit segments keep their own frame.
