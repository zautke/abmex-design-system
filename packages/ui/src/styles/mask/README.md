# mask — opacity-gradient fades for scroll edges

`mask.css` ships inside `@abmex/ui/styles.css`. It adds one utility, `mask-fade`, that fades an element's content toward its edges with a CSS mask on both axes, plus sizing utilities.

```tsx
const { ref } = useOverflowEdges('x');
<div ref={ref} className="mask-fade overflow-x-auto">…</div>
```

`useOverflowEdges(axis)` (from `@abmex/ui` or `@abmex/ui/tabs`) writes `data-overflow-start|end` (x) or `data-overflow-top|bottom` (y) onto the element it is attached to. An edge whose attribute is `"false"` gets a zero-size fade, so the fade appears only where content is clipped, and its size animates as you scroll. Without the hook, both x edges always fade.

## Utilities

| Class | Effect |
|---|---|
| `mask-fade` | The mask. x edges default to `--mask-fade-size` (2rem); y edges default to 0 (off). |
| `mask-fade-x-<n>` / `mask-fade-y-<n>` | Both edges of one axis. `<n>` is a spacing step (`-8` = 2rem), `[3rem]` or `[10%]`. |
| `mask-fade-start-<n>` `mask-fade-end-<n>` `mask-fade-top-<n>` `mask-fade-bottom-<n>` | One edge. |

A vertical list: `mask-fade mask-fade-x-0 mask-fade-y-6` with `useOverflowEdges('y')`.

## Tokens

| Variable | Default | Meaning |
|---|---|---|
| `--mask-fade-size` | `2rem` | Default start/end length. |
| `--mask-fade-from` | `0` | Opacity at the very edge. |
| `--mask-fade-to` | `1` | Opacity once the fade is over. |
| `--mask-fade-mid` | halfway | Opacity at the midpoint, for a soft curve. |
| `--mask-fade-mid-at` | `0.5` | Midpoint position as a fraction (0–1) of the fade length. |
| `--mask-fade-duration` | `200ms` | Size transition when an edge turns on/off (0 under reduced motion). |
| `--mask-fade-ease` | `var(--ph-ease)` | Size transition easing. |

`--mask-fade-{start,end,top,bottom}-size` are registered with `@property` (`<length-percentage>`, `inherits: true`), so they interpolate. Set the unsuffixed `--mask-fade-{edge}` to choose a size; the `-size` variables are what the mask reads after activation.

Notes: the utility sets `transition-property` for the size variables, so it replaces other transitions on the same element. The x axis is physical (left = start); RTL is not mirrored.

## Without `styles.css`

Apps that compose the `@abmex/ui/phosphor/*` layers instead of `styles.css` import the standalone copy in their Tailwind v4 entry:

```css
@import "tailwindcss";
@import "@abmex/ui/phosphor/mask.css";
```

It is the same source that `styles.css` inlines. Importing both is safe: Tailwind merges the duplicate `@utility mask-fade*` and `@property --mask-fade-*` definitions, so each rule is emitted once.
