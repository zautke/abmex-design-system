# WXT Prompt / ABMEX theme property audit

Checked: 2026-10-22. Contract: [revision 0.9](BASE_COMPONENT_CONTRACT.md). Initial contract interview is complete; implementation is pending.

## Result and scope

The inspected wxt-prompt entrypoint imports ABMEX's compiled stylesheet; its palette model, stylesheet generator, and theme editor are imported from @abmex/ui. Its app hook owns persistence and document injection. There is no separate theme definition in the inspected consumer Tailwind entrypoint to extract. Both consumer package declarations are 0.7.0-next.7, matching the current ABMEX source package version. Matching version strings do not prove installed artifacts match this checkout.

This is a complete declaration inventory for the source files listed below, with runtime/metadata comparisons and a source-level consumer provenance trace. It is not a claim that every upstream Tailwind/HeroUI built-in property, generated artifact, application stylesheet, or browser-computed value has been exhaustively audited. The accompanying [JSON inventory](THEME_PROPERTY_INVENTORY.json) retains every captured declaration/value and the full token catalog.

## Findings

1. **Component aliases are compile-time names, not independent runtime overrides.** All 76 UI color aliases map directly to global semantic roles in @theme inline. A focused Tailwind 4.3.0 compilation proved bg-drawer-bg emits background-color: var(--surface), bypassing --color-drawer-bg. Overriding that alias cannot change this utility; overriding --surface changes every consumer in its scope. This fails the intended independent per-component token flexibility unless a separate runtime component variable or another documented customization surface is used. Preserve utility names and defaults while adding runtime indirection; do not rename existing tokens.
2. **Theme editor does not expose the full property set.** Running the actual parser against source-assembled CSS yielded 129 entries: 73 Phosphor roles/settings plus 56 HeroUI bridge properties. It deliberately omits direct role aliases, and also misses the 12 motion declarations imported before the role marker, the UI text-size/pop-animation declarations, and --oocm-text. It exposes --theme-attribute as a raw setting although the controller behavior is not validated by that field. These are editor coverage gaps, not proof the CSS properties are absent.
3. **Catalog and emitted theme disagree.** CSS has 59 color roles; tokens.json lists 55. Folder, paper, folder-edge, and page are missing from JSON. JSON also lists seven spacing tokens and ten typography recipes without corresponding named properties/recipes in the inspected theme bridge. Some values can be expressed with ordinary Tailwind utilities, but that is not a generated semantic token contract. JSON radius-sm is 2px; the shadcn mapping is 0.6 × the 4px base, or 2.4px at the default 16px root. HeroUI uses --field-radius while JSON calls the semantic entry radius-field. Explicit mappings and documented units are needed.
4. **Motion has duplicate authorities.** @abmex/themes exports --pop-duration / --pop-in-ease / --pop-out-ease. UI separately declares --duration-pop / --ease-pop-in / --ease-pop-out and its pop keyframes consume the latter. Current values match, but changing shared motion values will not update those UI animation declarations. Add aliases to the shared source, preserving existing names.
5. **Mode selection is inconsistent across layers.** Core token selectors honor data-mode and disable legacy class/data-theme selectors when it is present. The Tailwind dark/light variants and palette generator still select class/data-theme without the same data-mode logic. Mixed selectors can therefore choose different modes; a browser reproduction remains pending. Generated palette overrides also use global selectors rather than an explicit component scope. Treat this as a source-confirmed selector mismatch, with visual impact still to verify.
6. **Theme authority is still split between packages.** Framework-neutral theme roles/motion/controller live in @abmex/themes, but the Theme model, five-family palette defaults/derivation, and component aliases live in @abmex/ui. For the approved single source of truth, promote portable token/model responsibilities to themes and retain additive UI re-exports. App-specific theme records, active theme ID, and durable-write orchestration should remain consumer-owned or injectable.
7. **Adapters are alternatives with conflicting semantics.** HeroUI --accent means primary fill; shadcn --accent means primary-soft. HeroUI --muted means muted foreground; shadcn --muted means surface-2. They must not be indiscriminately merged into the same scope. Shadcn has eight sidebar-specific properties already mapped; these are available adapter vocabulary, not proof that ABMEX has a reusable sidebar component.

## Provenance

| Layer | Evidence | Ownership |
|---|---|---|
| Consumer dependency | ../wxt-prompt/package.json:43–44, refreshed index | @abmex/themes and @abmex/ui 0.7.0-next.7 |
| Consumer Tailwind entry | ../wxt-prompt/src/styles/tailwind.css:5–8 | Imports tailwindcss plus @abmex/ui/styles.css; scans src and entrypoints |
| Consumer theme integration | ../wxt-prompt/src/hooks/useThemeColors.ts:10–24 | Imports shared model/generator; owns persistence and injection |
| Editor integration | ../wxt-prompt/entrypoints/sidepanel/App.tsx:19–21 | Imports shared editor and compiled CSS as raw text |
| Shared tokens | packages/themes/src/phosphor/phosphor.tokens.css | 77 identity names; 62 mode-dependent roles including three shadows; 11 non-color settings |
| Shared Tailwind bridge | packages/themes/src/phosphor/phosphor.tailwind.css | 65 mappings, dark/light variants, base element styles |
| UI additions | packages/ui/src/styles/tailwind.css | 76 color mappings and 13 other declarations |
| Motion | packages/themes/src/phosphor/motion.css | 12 generated declarations |
| Token catalog | packages/themes/src/phosphor/tokens.json | 55 color roles; typography/font metadata; spacing/radius/shadow catalogs |
| Adapters | packages/themes/src/phosphor/adapters/heroui.css; packages/themes/src/phosphor/adapters/shadcn.css | 56 HeroUI declarations; 76 shadcn runtime/mapping declarations |

CSS headers identify build/palette.py and build/build.py as generation sources. These generator sources were not validated in this pass; do not hand-edit generated CSS as a proposed repair. JSON provenance says the palette originated from rendered wxt-prompt pixels in October 2026; this is source metadata, not independently verified historical provenance.

## Full captured property inventory

Counts are per source layer, not additive unique-property totals. Names can repeat across layers. Colors below preserve CSS identity references; identity values are in the JSON inventory. Both dark and light values are retained.

### Semantic colors and effects

| Property | Dark | Light | Catalog |
|---|---|---|---|
| `--bg` | `var(--pitch)` | `var(--bone)` | Present |
| `--bg-sunken` | `var(--tar)` | `var(--parchment)` | Present |
| `--surface` | `var(--peat)` | `var(--cardstock)` | Present |
| `--surface-2` | `var(--fern)` | `var(--linen)` | Present |
| `--surface-3` | `var(--moss)` | `var(--oat)` | Present |
| `--overlay` | `var(--loam)` | `var(--chalk)` | Present |
| `--field` | `var(--fern)` | `var(--eggshell)` | Present |
| `--border` | `var(--lichen)` | `var(--straw)` | Present |
| `--border-strong` | `var(--pewter)` | `var(--taupe)` | Present |
| `--fg` | `var(--khaki)` | `var(--olive)` | Present |
| `--fg-strong` | `var(--cream)` | `var(--loden)` | Present |
| `--fg-sage` | `var(--sage)` | `var(--pine)` | Present |
| `--fg-muted` | `var(--eucalyptus)` | `var(--verdigris)` | Present |
| `--fg-disabled` | `var(--thicket)` | `var(--pebble)` | Present |
| `--folder` | `var(--peat)` | `var(--manila)` | Missing |
| `--paper` | `var(--fern)` | `var(--ivory)` | Missing |
| `--folder-edge` | `var(--lichen)` | `var(--sand)` | Missing |
| `--page` | `var(--pitch)` | `var(--vellum)` | Missing |
| `--primary` | `var(--mint)` | `var(--jade)` | Present |
| `--primary-fg` | `var(--pitch)` | `var(--cardstock)` | Present |
| `--primary-hover` | `var(--spearmint)` | `var(--malachite)` | Present |
| `--primary-soft` | `var(--kelp)` | `var(--pistachio)` | Present |
| `--primary-soft-fg` | `var(--mint)` | `var(--viridian)` | Present |
| `--danger` | `var(--brick)` | `var(--madder)` | Present |
| `--danger-fg` | `var(--pitch)` | `var(--cardstock)` | Present |
| `--danger-hover` | `var(--terracotta)` | `var(--maroon)` | Present |
| `--danger-soft` | `var(--umber)` | `var(--blush)` | Present |
| `--danger-soft-fg` | `var(--salmon)` | `var(--madder)` | Present |
| `--success` | `var(--clover)` | `var(--evergreen)` | Present |
| `--success-fg` | `var(--pitch)` | `var(--cardstock)` | Present |
| `--success-hover` | `var(--basil)` | `var(--hunter)` | Present |
| `--success-soft` | `var(--forest)` | `var(--celery)` | Present |
| `--success-soft-fg` | `var(--shamrock)` | `var(--evergreen)` | Present |
| `--warning` | `var(--ochre)` | `var(--saffron)` | Present |
| `--warning-fg` | `var(--pitch)` | `var(--loden)` | Present |
| `--warning-hover` | `var(--amber)` | `var(--mustard)` | Present |
| `--warning-soft` | `var(--bronze)` | `var(--wheat)` | Present |
| `--warning-soft-fg` | `var(--ochre)` | `var(--caramel)` | Present |
| `--info` | `var(--slate)` | `var(--marine)` | Present |
| `--info-fg` | `var(--pitch)` | `var(--cardstock)` | Present |
| `--info-hover` | `var(--steel)` | `var(--navy)` | Present |
| `--info-soft` | `var(--denim)` | `var(--mist)` | Present |
| `--info-soft-fg` | `var(--slate)` | `var(--marine)` | Present |
| `--emphasis` | `var(--mauve)` | `var(--aubergine)` | Present |
| `--emphasis-fg` | `var(--pitch)` | `var(--cardstock)` | Present |
| `--emphasis-hover` | `var(--lilac)` | `var(--grape)` | Present |
| `--emphasis-soft` | `var(--plum)` | `var(--lavender)` | Present |
| `--emphasis-soft-fg` | `var(--orchid)` | `var(--aubergine)` | Present |
| `--focus` | `var(--mint)` | `var(--jade)` | Present |
| `--link` | `var(--mint)` | `var(--viridian)` | Present |
| `--selection` | `var(--kelp)` | `var(--pistachio)` | Present |
| `--code-bg` | `var(--tar)` | `var(--parchment)` | Present |
| `--scrollbar` | `var(--pewter)` | `var(--taupe)` | Present |
| `--chart-1` | `var(--mint)` | `var(--jade)` | Present |
| `--chart-2` | `var(--mauve)` | `var(--aubergine)` | Present |
| `--chart-3` | `var(--ochre)` | `var(--copper)` | Present |
| `--chart-4` | `var(--cobalt)` | `var(--indigo)` | Present |
| `--chart-5` | `var(--cinnamon)` | `var(--sienna)` | Present |
| `--backdrop` | `rgba(3, 8, 5, 0.72)` | `rgba(9, 27, 19, 0.32)` | Present |
| `--shadow-surface` | `none` | `0 1px 2px 0 rgba(9, 27, 19, 0.06), 0 0 0 1px rgba(9, 27, 19, 0.03)` | Present |
| `--shadow-field` | `none` | `0 1px 2px 0 rgba(9, 27, 19, 0.05)` | Present |
| `--shadow-overlay` | `0 0 0 1px rgba(168, 191, 174, 0.06), 0 16px 40px -12px rgba(0, 0, 0, 0.7)` | `0 2px 8px 0 rgba(9, 27, 19, 0.08), 0 14px 32px -6px rgba(9, 27, 19, 0.14)` | Present |

### Non-color settings

| Property | Value / mapping |
|---|---|
| `--theme-attribute` | `class` |
| `--radius` | `0.25rem` |
| `--tab-flare` | `6px` |
| `--border-width` | `1px` |
| `--ring-width` | `2px` |
| `--ring-offset` | `2px` |
| `--font-sans` | `"Rethink Sans", ui-sans-serif, system-ui, sans-serif` |
| `--font-display` | `"Rethink Sans", ui-sans-serif, system-ui, sans-serif` |
| `--font-mono` | `"Victor Mono", ui-monospace, "SFMono-Regular", Menlo, monospace` |
| `--display-weight` | `600` |
| `--display-tracking` | `-0.02em` |

### Motion

| Property | Value / mapping |
|---|---|
| `--duration` | `140ms` |
| `--tab-enter-duration` | `180ms` |
| `--tab-exit-duration` | `135ms` |
| `--theme-transition-duration` | `550ms` |
| `--mask-fade-duration` | `200ms` |
| `--pop-duration` | `360ms` |
| `--toggle-duration` | `300ms` |
| `--ease` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--tab-enter-ease` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `--tab-exit-ease` | `cubic-bezier(0.4, 0, 1, 1)` |
| `--pop-in-ease` | `cubic-bezier(0.42, 0, 1, 1)` |
| `--pop-out-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` |

### Phosphor Tailwind mappings

| Property | Value / mapping |
|---|---|
| `--color-bg` | `var(--bg)` |
| `--color-bg-sunken` | `var(--bg-sunken)` |
| `--color-surface` | `var(--surface)` |
| `--color-surface-2` | `var(--surface-2)` |
| `--color-surface-3` | `var(--surface-3)` |
| `--color-overlay` | `var(--overlay)` |
| `--color-field` | `var(--field)` |
| `--color-border` | `var(--border)` |
| `--color-border-strong` | `var(--border-strong)` |
| `--color-fg` | `var(--fg)` |
| `--color-fg-strong` | `var(--fg-strong)` |
| `--color-fg-sage` | `var(--fg-sage)` |
| `--color-fg-muted` | `var(--fg-muted)` |
| `--color-fg-disabled` | `var(--fg-disabled)` |
| `--color-folder` | `var(--folder)` |
| `--color-paper` | `var(--paper)` |
| `--color-folder-edge` | `var(--folder-edge)` |
| `--color-page` | `var(--page)` |
| `--color-primary` | `var(--primary)` |
| `--color-primary-fg` | `var(--primary-fg)` |
| `--color-primary-hover` | `var(--primary-hover)` |
| `--color-primary-soft` | `var(--primary-soft)` |
| `--color-primary-soft-fg` | `var(--primary-soft-fg)` |
| `--color-danger` | `var(--danger)` |
| `--color-danger-fg` | `var(--danger-fg)` |
| `--color-danger-hover` | `var(--danger-hover)` |
| `--color-danger-soft` | `var(--danger-soft)` |
| `--color-danger-soft-fg` | `var(--danger-soft-fg)` |
| `--color-success` | `var(--success)` |
| `--color-success-fg` | `var(--success-fg)` |
| `--color-success-hover` | `var(--success-hover)` |
| `--color-success-soft` | `var(--success-soft)` |
| `--color-success-soft-fg` | `var(--success-soft-fg)` |
| `--color-warning` | `var(--warning)` |
| `--color-warning-fg` | `var(--warning-fg)` |
| `--color-warning-hover` | `var(--warning-hover)` |
| `--color-warning-soft` | `var(--warning-soft)` |
| `--color-warning-soft-fg` | `var(--warning-soft-fg)` |
| `--color-info` | `var(--info)` |
| `--color-info-fg` | `var(--info-fg)` |
| `--color-info-hover` | `var(--info-hover)` |
| `--color-info-soft` | `var(--info-soft)` |
| `--color-info-soft-fg` | `var(--info-soft-fg)` |
| `--color-emphasis` | `var(--emphasis)` |
| `--color-emphasis-fg` | `var(--emphasis-fg)` |
| `--color-emphasis-hover` | `var(--emphasis-hover)` |
| `--color-emphasis-soft` | `var(--emphasis-soft)` |
| `--color-emphasis-soft-fg` | `var(--emphasis-soft-fg)` |
| `--color-focus` | `var(--focus)` |
| `--color-link` | `var(--link)` |
| `--color-selection` | `var(--selection)` |
| `--color-code-bg` | `var(--code-bg)` |
| `--color-scrollbar` | `var(--scrollbar)` |
| `--color-chart-1` | `var(--chart-1)` |
| `--color-chart-2` | `var(--chart-2)` |
| `--color-chart-3` | `var(--chart-3)` |
| `--color-chart-4` | `var(--chart-4)` |
| `--color-chart-5` | `var(--chart-5)` |
| `--color-backdrop` | `var(--backdrop)` |
| `--font-display` | `var(--font-display)` |
| `--shadow-surface` | `var(--shadow-surface)` |
| `--shadow-field` | `var(--shadow-field)` |
| `--shadow-overlay` | `var(--shadow-overlay)` |
| `--radius-base` | `var(--radius)` |
| `--ease-base` | `var(--ease)` |

### UI component mappings and additions

| Property | Value / mapping |
|---|---|
| `--text-2xs` | `0.6875rem` |
| `--text-2xs--line-height` | `1rem` |
| `--text-3xs` | `0.625rem` |
| `--text-3xs--line-height` | `0.875rem` |
| `--scale-pop` | `0.85` |
| `--scale-pop-over` | `1.08` |
| `--duration-pop` | `360ms` |
| `--ease-pop-in` | `cubic-bezier(0.42, 0, 1, 1)` |
| `--ease-pop-out` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--animate-pop-in` | `pop-in var(--duration-pop) both` |
| `--animate-pop-out` | `pop-out var(--duration-pop) both` |
| `--font-code` | `var(--font-mono)` |
| `--color-app-bg` | `var(--bg)` |
| `--color-header-bg` | `var(--surface)` |
| `--color-header-border` | `var(--border)` |
| `--color-splash-bg` | `var(--bg)` |
| `--color-splash-text` | `var(--fg-muted)` |
| `--color-splash-ring` | `var(--border-strong)` |
| `--color-chat-empty-text` | `var(--fg-muted)` |
| `--color-chat-bubble-user-bg` | `var(--surface-2)` |
| `--color-chat-bubble-user-text` | `var(--fg)` |
| `--color-chat-bubble-ai-bg` | `var(--surface)` |
| `--color-chat-bubble-ai-text` | `var(--fg)` |
| `--color-chat-bubble-ai-border` | `var(--border)` |
| `--color-chat-error-text` | `var(--danger-soft-fg)` |
| `--color-chat-clearbtn-text` | `var(--fg-muted)` |
| `--color-chat-clearbtn-text-hover` | `var(--danger-soft-fg)` |
| `--color-conn-probing` | `var(--warning)` |
| `--color-conn-connected` | `var(--success)` |
| `--color-conn-disconnected` | `var(--danger)` |
| `--color-conn-label` | `var(--fg-muted)` |
| `--color-drawer-backdrop` | `var(--backdrop)` |
| `--color-drawer-bg` | `var(--surface)` |
| `--color-drawer-border` | `var(--border)` |
| `--color-drawer-header-bg` | `var(--surface)` |
| `--color-drawer-header-border` | `var(--border)` |
| `--color-drawer-newbtn-bg` | `var(--primary-soft)` |
| `--color-drawer-newbtn-text` | `var(--primary-soft-fg)` |
| `--color-drawer-newbtn-bg-hover` | `var(--surface-3)` |
| `--color-drawer-search-bg` | `var(--surface)` |
| `--color-drawer-search-border` | `var(--border)` |
| `--color-drawer-empty-text` | `var(--fg-muted)` |
| `--color-drawer-item-bg-active` | `var(--primary-soft)` |
| `--color-drawer-item-text-active` | `var(--fg-strong)` |
| `--color-drawer-item-text` | `var(--fg)` |
| `--color-drawer-item-bg-hover` | `var(--surface-2)` |
| `--color-drawer-item-text-hover` | `var(--fg-strong)` |
| `--color-drawer-item-icon` | `var(--fg-muted)` |
| `--color-drawer-item-icon-active` | `var(--primary-soft-fg)` |
| `--color-drawer-edit-bg` | `var(--field)` |
| `--color-drawer-edit-border` | `var(--focus)` |
| `--color-inputbar-bg` | `var(--bg)` |
| `--color-inputbar-border` | `var(--border)` |
| `--color-inputbar-input-bg` | `var(--field)` |
| `--color-inputbar-input-border` | `var(--field)` |
| `--color-inputbar-input-text` | `var(--fg)` |
| `--color-inputbar-input-placeholder` | `var(--fg-muted)` |
| `--color-inputbar-input-border-focus` | `var(--focus)` |
| `--color-md-code-inline-bg` | `var(--surface-2)` |
| `--color-md-code-inline-text` | `var(--success-soft-fg)` |
| `--color-md-link` | `var(--link)` |
| `--color-md-th-border` | `var(--border)` |
| `--color-md-td-border` | `var(--border)` |
| `--color-md-code-block-bg` | `var(--code-bg)` |
| `--color-md-code-block-text` | `var(--fg)` |
| `--color-md-code-block-link` | `var(--link)` |
| `--color-md-code-block-border` | `var(--border)` |
| `--color-md-code-header-bg` | `var(--surface)` |
| `--color-md-code-header-text` | `var(--fg-muted)` |
| `--color-md-code-header-border` | `var(--border)` |
| `--color-md-code-copy-bg-hover` | `var(--surface-2)` |
| `--color-md-code-copy-text-hover` | `var(--fg-strong)` |
| `--color-md-code-copied-icon` | `var(--success)` |
| `--color-modelpicker-empty-bg` | `var(--surface-2)` |
| `--color-modelpicker-empty-border` | `var(--border)` |
| `--color-modelpicker-empty-text` | `var(--fg-muted)` |
| `--color-themeedit-bg` | `var(--overlay)` |
| `--color-themeedit-border` | `var(--border)` |
| `--color-themeedit-title-text` | `var(--fg-strong)` |
| `--color-themeedit-title-border` | `var(--border)` |
| `--color-themeedit-family-label` | `var(--fg-muted)` |
| `--color-themeedit-slider-label` | `var(--fg-muted)` |
| `--color-themeedit-slider-track` | `var(--surface-3)` |
| `--color-themeedit-slider-thumb` | `var(--primary)` |
| `--color-themeedit-reset-text` | `var(--fg-muted)` |
| `--color-themeedit-reset-text-hover` | `var(--fg-strong)` |
| `--color-themeedit-reset-border` | `var(--border)` |
| `--color-error-text` | `var(--fg-strong)` |
| `--oocm-text` | `var(--fg-muted)` |

### HeroUI adapter

| Property | Value / mapping |
|---|---|
| `--field-radius` | `calc(var(--radius) * 1.5)` |
| `--field-border-width` | `var(--border-width)` |
| `--ring-offset-width` | `var(--ring-offset)` |
| `--background` | `var(--bg)` |
| `--foreground` | `var(--fg)` |
| `--surface-foreground` | `var(--fg)` |
| `--surface-secondary` | `var(--surface-2)` |
| `--surface-secondary-foreground` | `var(--fg)` |
| `--surface-tertiary` | `var(--surface-3)` |
| `--surface-tertiary-foreground` | `var(--fg)` |
| `--overlay-foreground` | `var(--fg)` |
| `--muted` | `var(--fg-muted)` |
| `--default` | `var(--surface-2)` |
| `--default-foreground` | `var(--fg-strong)` |
| `--accent` | `var(--primary)` |
| `--accent-foreground` | `var(--primary-fg)` |
| `--field-background` | `var(--field)` |
| `--field-foreground` | `var(--fg-strong)` |
| `--field-placeholder` | `var(--fg-muted)` |
| `--field-border` | `var(--border-strong)` |
| `--success-foreground` | `var(--success-fg)` |
| `--warning-foreground` | `var(--warning-fg)` |
| `--danger-foreground` | `var(--danger-fg)` |
| `--segment` | `var(--surface-3)` |
| `--segment-foreground` | `var(--fg-strong)` |
| `--separator` | `var(--border)` |
| `--scrollbar-thumb` | `var(--scrollbar)` |
| `--surface-shadow` | `var(--shadow-surface)` |
| `--overlay-shadow` | `var(--shadow-overlay)` |
| `--field-shadow` | `var(--shadow-field)` |
| `--surface-hover` | `var(--surface-2)` |
| `--background-secondary` | `var(--surface)` |
| `--background-tertiary` | `var(--surface-2)` |
| `--background-inverse` | `var(--fg-strong)` |
| `--default-hover` | `var(--surface-3)` |
| `--accent-hover` | `var(--primary-hover)` |
| `--accent-soft` | `var(--primary-soft)` |
| `--accent-soft-foreground` | `var(--primary-soft-fg)` |
| `--accent-soft-hover` | `color-mix(in oklab, var(--primary-soft) 80%, var(--primary) 20%)` |
| `--success-soft-foreground` | `var(--success-soft-fg)` |
| `--success-soft-hover` | `color-mix(in oklab, var(--success-soft) 80%, var(--success) 20%)` |
| `--warning-soft-foreground` | `var(--warning-soft-fg)` |
| `--warning-soft-hover` | `color-mix(in oklab, var(--warning-soft) 80%, var(--warning) 20%)` |
| `--danger-soft-foreground` | `var(--danger-soft-fg)` |
| `--danger-soft-hover` | `color-mix(in oklab, var(--danger-soft) 80%, var(--danger) 20%)` |
| `--default-soft` | `var(--surface-2)` |
| `--default-soft-foreground` | `var(--fg-strong)` |
| `--default-soft-hover` | `var(--surface-3)` |
| `--field-hover` | `var(--field)` |
| `--field-focus` | `var(--field)` |
| `--field-border-hover` | `var(--fg-muted)` |
| `--field-border-focus` | `var(--focus)` |
| `--separator-secondary` | `var(--border)` |
| `--separator-tertiary` | `var(--border-strong)` |
| `--border-secondary` | `var(--border-strong)` |
| `--border-tertiary` | `var(--fg-muted)` |

### Shadcn adapter (alternative integration)

| Property | Value / mapping |
|---|---|
| `--background` | `var(--bg)` |
| `--foreground` | `var(--fg)` |
| `--card` | `var(--surface)` |
| `--card-foreground` | `var(--fg)` |
| `--popover` | `var(--overlay)` |
| `--popover-foreground` | `var(--fg)` |
| `--primary-foreground` | `var(--primary-fg)` |
| `--secondary` | `var(--surface-2)` |
| `--secondary-foreground` | `var(--fg-strong)` |
| `--muted` | `var(--surface-2)` |
| `--muted-foreground` | `var(--fg-muted)` |
| `--accent` | `var(--primary-soft)` |
| `--accent-foreground` | `var(--fg-strong)` |
| `--destructive` | `var(--danger)` |
| `--destructive-foreground` | `var(--danger-fg)` |
| `--input` | `var(--border-strong)` |
| `--ring` | `var(--focus)` |
| `--sidebar` | `var(--surface)` |
| `--sidebar-foreground` | `var(--fg)` |
| `--sidebar-primary` | `var(--primary)` |
| `--sidebar-primary-foreground` | `var(--primary-fg)` |
| `--sidebar-accent` | `var(--surface-2)` |
| `--sidebar-accent-foreground` | `var(--fg-strong)` |
| `--sidebar-border` | `var(--border)` |
| `--sidebar-ring` | `var(--focus)` |
| `--success-foreground` | `var(--success-fg)` |
| `--warning-foreground` | `var(--warning-fg)` |
| `--info-foreground` | `var(--info-fg)` |
| `--emphasis-foreground` | `var(--emphasis-fg)` |
| `--color-background` | `var(--background)` |
| `--color-foreground` | `var(--foreground)` |
| `--color-card` | `var(--card)` |
| `--color-card-foreground` | `var(--card-foreground)` |
| `--color-popover` | `var(--popover)` |
| `--color-popover-foreground` | `var(--popover-foreground)` |
| `--color-primary` | `var(--primary)` |
| `--color-primary-foreground` | `var(--primary-foreground)` |
| `--color-secondary` | `var(--secondary)` |
| `--color-secondary-foreground` | `var(--secondary-foreground)` |
| `--color-muted` | `var(--muted)` |
| `--color-muted-foreground` | `var(--muted-foreground)` |
| `--color-accent` | `var(--accent)` |
| `--color-accent-foreground` | `var(--accent-foreground)` |
| `--color-destructive` | `var(--destructive)` |
| `--color-destructive-foreground` | `var(--destructive-foreground)` |
| `--color-border` | `var(--border)` |
| `--color-input` | `var(--input)` |
| `--color-ring` | `var(--ring)` |
| `--color-chart-1` | `var(--chart-1)` |
| `--color-chart-2` | `var(--chart-2)` |
| `--color-chart-3` | `var(--chart-3)` |
| `--color-chart-4` | `var(--chart-4)` |
| `--color-chart-5` | `var(--chart-5)` |
| `--color-sidebar` | `var(--sidebar)` |
| `--color-sidebar-foreground` | `var(--sidebar-foreground)` |
| `--color-sidebar-primary` | `var(--sidebar-primary)` |
| `--color-sidebar-primary-foreground` | `var(--sidebar-primary-foreground)` |
| `--color-sidebar-accent` | `var(--sidebar-accent)` |
| `--color-sidebar-accent-foreground` | `var(--sidebar-accent-foreground)` |
| `--color-sidebar-border` | `var(--sidebar-border)` |
| `--color-sidebar-ring` | `var(--sidebar-ring)` |
| `--color-success` | `var(--success)` |
| `--color-success-foreground` | `var(--success-foreground)` |
| `--color-warning` | `var(--warning)` |
| `--color-warning-foreground` | `var(--warning-foreground)` |
| `--color-info` | `var(--info)` |
| `--color-info-foreground` | `var(--info-foreground)` |
| `--color-emphasis` | `var(--emphasis)` |
| `--color-emphasis-foreground` | `var(--emphasis-foreground)` |
| `--radius-sm` | `calc(var(--radius) * 0.6)` |
| `--radius-md` | `calc(var(--radius) * 0.8)` |
| `--radius-lg` | `var(--radius)` |
| `--radius-xl` | `calc(var(--radius) * 1.4)` |
| `--radius-2xl` | `calc(var(--radius) * 1.8)` |
| `--radius-3xl` | `calc(var(--radius) * 2.2)` |
| `--radius-4xl` | `calc(var(--radius) * 2.6)` |

### Catalog-only semantic definitions / recipes

These entries exist in JSON; matching utility names alone do not establish a runtime semantic mapping.

| Property | Value / mapping |
|---|---|
| `space-1` | `4px` |
| `space-2` | `8px` |
| `space-3` | `12px` |
| `space-4` | `16px` |
| `space-6` | `24px` |
| `space-8` | `32px` |
| `space-12` | `48px` |

| Property | Value / mapping |
|---|---|
| `radius-sm` | `2px` |
| `radius` | `4px` |
| `radius-field` | `6px` |
| `radius-full` | `9999px` |

| Typography recipe | Family | Size | Line height | Weight | Tracking | Style |
|---|---|---|---|---|---|---|
| display-xl | display | 40px | 44px | 600 | -0.025em | normal |
| display-lg | display | 28px | 34px | 600 | -0.02em | normal |
| display-md | display | 20px | 26px | 600 | -0.015em | normal |
| title | sans | 16px | 24px | 600 | 0 | normal |
| body | sans | 12px | 22px | 430 | 0 | normal |
| body-sm | sans | 10px | 20px | 400 | 0 | normal |
| label | sans | 10px | 16px | 330 | 0.01em | normal |
| mono | mono | 12px | 20px | 400 | 0 | normal |
| mono-sm | mono | 10px | 18px | 400 | 0 | normal |
| mono-emphasis | mono | 12px | 20px | 400 | 0 | italic |

### Identity palette

These 77 identity names are intentionally not component-facing semantic roles. Values and mode declarations are preserved in the JSON inventory.

`--cream`, `--spearmint`, `--amber`, `--khaki`, `--mint`, `--steel`, `--sage`, `--ochre`, `--terracotta`, `--lilac`, `--slate`, `--basil`, `--salmon`, `--brick`, `--orchid`, `--shamrock`, `--mauve`, `--clover`, `--eucalyptus`, `--cobalt`, `--cinnamon`, `--pewter`, `--thicket`, `--moss`, `--kelp`, `--bronze`, `--lichen`, `--denim`, `--umber`, `--plum`, `--forest`, `--fern`, `--loam`, `--peat`, `--pitch`, `--tar`, `--loden`, `--olive`, `--pine`, `--hunter`, `--grape`, `--navy`, `--malachite`, `--maroon`, `--indigo`, `--evergreen`, `--viridian`, `--verdigris`, `--marine`, `--aubergine`, `--jade`, `--madder`, `--caramel`, `--sienna`, `--copper`, `--taupe`, `--pebble`, `--mustard`, `--saffron`, `--straw`, `--sand`, `--oat`, `--celery`, `--mist`, `--lavender`, `--pistachio`, `--blush`, `--parchment`, `--manila`, `--linen`, `--wheat`, `--bone`, `--vellum`, `--ivory`, `--cardstock`, `--chalk`, `--eggshell`.

## Recommended implementation order

1. Establish a generated property manifest in @abmex/themes covering semantic colors, dimensions, typography, motion, modes, and adapter mappings; reconcile the four missing catalog roles and named recipe mappings. Reuse the existing token generation pipeline after inspecting it.
2. Make component overrides effective through additive runtime variables with semantic-role fallbacks. Preserve current utility names and defaults; verify a component override does not recolor unrelated components.
3. Feed the editor from the shared property manifest instead of assuming CSS comment regions are a complete schema. Preserve compatible existing overrides and support non-color property editors.
4. Alias UI motion values to the shared motion source and align mode/scoping behavior across tokens, variants, and palette overrides.
5. Verify both public consumption paths: compiled stylesheet and consumer Tailwind compilation, in wxt-prompt and an independent composition. Keep consumer persistence orchestration injectable.

These are audit recommendations, not implemented changes. No theme values, package versions, or consumer code were changed.

## Evidence and verification

- Refreshed both CodeMunch indexes on 2026-10-22. A stale first read showed next.4 in wxt-prompt; refreshed evidence showed next.7. Only refreshed package evidence is used above.
- Parsed every declaration in the seven listed CSS/JSON sources in memory, with comments excluded for counts. JSON catalog parsed successfully.
- Executed the actual TypeScript semantic-variable parser after in-memory transpilation, using the real five-family list. Source import assembly covered tokens, motion, Tailwind mapping, and HeroUI adapter. Asserted four missing JSON roles are editor-visible and selected omitted properties are absent.
- Installed Tailwind 4.3.0 compilation assertion passed: bg-drawer-bg directly references --surface.
- [Official Tailwind theme documentation](https://tailwindcss.com/docs/theme#referencing-other-variables), checked 2026-10-22, confirms inline mappings use the referenced value. Context7 /websites/tailwindcss confirmed the behavior and shared-theme import pattern.
- GitHub code search checked [Tailwind compiler tests](https://github.com/tailwindlabs/tailwindcss/blob/8cc0551b1217d36dc565840b90920964d37cb46c/packages/tailwindcss/src/index.test.ts) for @theme inline behavior. Local installed compilation supplies the concrete assertion above.
- Not run: application build, browser/computed-style tests, complete package artifact equivalence, fresh theme generation, full upstream default-token enumeration, or persistence tests. Source-assembled parser counts are not claimed as the rendered editor's count for the installed/minified stylesheet.

