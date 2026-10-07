# button-group — joined icon-button segments

```tsx
import { ButtonGroup } from '@abmex/ui/button-group';
import { Tabs } from '@abmex/ui/tabs';

<ButtonGroup aria-label="Tab layout">
  <Tabs.OrientationToggle value={o} onValueChange={setO} />
  <Tabs.Switcher groups={groups} />
</ButtonGroup>
```

One `ph-field` frame (`ring-1` in `ph-border`, so it adds no layout height), hairline dividers between direct children, no inner radii, focus outlines drawn inset. Any icon buttons work as children; `Tabs.OrientationToggle` and `Tabs.Switcher` read `ButtonGroupContext` and drop their own frame. `role="group"`: pass `aria-label`.
