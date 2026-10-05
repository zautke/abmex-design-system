---
name: "@abmex/ui"
description: "Reusable React AI-chat UI kit on HeroUI v3 — Phosphor matte instrument-panel theme, dark with a bone-paper light twin."
colors:
  # Dark scope (default). Light twin exists under .light / [data-theme="light"].
  bg: "#111c18"
  surface: "#1a2520"
  surface-2: "#23372b"
  border: "#2e3a34"
  fg: "#c1c497"
  fg-strong: "#dfe0b8"
  fg-sage: "#a8bfae"
  fg-muted: "#8ca194"
  primary: "#2ed5b7"
  primary-fg: "#111c18"
  danger: "#df8379"
  success: "#63b07a"
  warning: "#dfad73"
  info: "#7bb4ce"
  emphasis: "#b58bc0"
typography:
  body:
    fontFamily: "Rethink Sans"
  display:
    fontFamily: "Rethink Sans"
    fontWeight: 700
  code:
    fontFamily: "Victor Mono"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  gutter: "8px"
  pad-chat: "8px 12px"
components:
  bubble-user:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
  bubble-assistant:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
  button-send:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-fg}"
    rounded: "{rounded.md}"
  button-stop:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.bg}"
    rounded: "{rounded.md}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
  input-composer:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
---

# Design System: @abmex/ui

## Overview

**Creative North Star: "Phosphor"** — a matte instrument panel: phosphor-black ground, golden-khaki text, one mint signal. Dark by default with a bone-paper light twin under `.light` / `[data-theme="light"]`, nesting allowed.

Phosphor is generated, not hand-tuned: the framework-agnostic `--*` token interface lives in `src/styles/phosphor/` and is built by `phosphor/build/palette.py` from OKLCH values. All ~170 contrast pairs are computed at generation time and must pass WCAG (4.5:1 text, 3:1 control boundaries); the build fails otherwise. Re-generation is byte-identical — never hand-edit the generated CSS.

Component tokens (`--color-chat-bubble-user-bg`, etc.) are the kit's stable per-surface API; every value is a `@theme inline` alias of a `--*` role so nested `.light` scopes re-resolve correctly. Reskin one surface by overriding its `--*` role; reskin everything by editing `palette.py`.

**Key Characteristics:**

- Matte, not glossy: chroma capped ~0.11 except the mint primary; no glows, orbs, or halo shadows.
- Hairline structure: 1px `--border` separates regions; elevation is a tonal step, not a drop shadow.
- Golden-khaki body text (`--fg`) against ink-green grounds; mint (`--primary`) is the one hot signal.
- Mauve (`--emphasis`) reserved for italic commentary; slate-cyan info, ochre warning, brick danger are closed roles.
- Dark-first: no class → dark; light is an explicit opt-in scope.

## Colors

### Primary

- **Mint Signal** (`#2ed5b7` dark / `#037663` light): commit actions, active states, focus rings, key hints. The only saturated voice.

### Secondary

- **Sage** (`#a8bfae` dark): secondary text, connected states, links in prose.

### Danger / Status

- **Brick** (`#df8379` dark): stop, delete, error. Soft variants (`--danger-soft` + `-soft-fg`) for destructive hovers in menus.
- **Success** (`#63b07a`), **Warning** (`#dfad73`), **Info** (`#7bb4ce`): closed status roles.

### Neutral

- **Ink Ground** (`#111c18`): app ground.
- **Surface** (`#1a2520`) / **Surface-2** (`#23372b`): card and raised fills.
- **Khaki** (`#c1c497`): body text. **Khaki Strong** (`#dfe0b8`): headings/values. **Khaki Muted** (`#8ca194`): meta text — AA-fitted at generation.

### Emphasis

- **Mauve** (`#b58bc0`): italic asides and commentary only. Never structural.

### Named Rules

**The One Signal Rule.** Mint is the only high-chroma color; everything else is matte. If a second accent appears, the palette build has been bypassed.

**The Generator Rule.** Palette values live in `phosphor/build/palette.py`. Generated files are never hand-edited; a value that doesn't survive `pnpm build` in `phosphor/` isn't in the system.

**The Twin Rule.** Every role has a dark and light value. A component that hardcodes a hex breaks the light twin — use the role token.

## Typography

**Body:** Rethink Sans Variable (shipped in `phosphor/fonts/`, OFL) — chrome, content, labels, inputs.
**Display:** Rethink Sans at display weight — empty-state titles, modal headings.
**Code/Data:** Victor Mono Variable — hex, JSON, model names, timestamps. Applied via `--font-mono` (`font-mono` utility); the kit's `font-code` utility aliases it.

**The 11px Floor Rule.** No functional text below 11px (12px in most kit surfaces). Micro-copy that can't fit gets restructured, not shrunk.

## Layout

Terminal-dense rhythm: 8px gutters, 8px×12px chat padding. Fixed chrome: header top, scrollable chat column, composer pinned bottom, drawer as backdrop overlay. Hairline grid separates regions.

## Elevation & Depth

No glows or ambient orbs. Depth = tonal step (`bg` → `surface` → `surface-2`) plus hairline borders. Overlays (popovers, dropdowns, pickers) use HeroUI primitives on the `--overlay` ground with `--overlay-shadow`; no `shadow-lg` on resting chrome, no bespoke `fixed inset-0` stacks.

**The Hairline Rule.** Structure is 1px `--border`. Reach for a hairline, never a glow.

## Shapes

Controls: 4–8px radius. Panels: 8–12px. Chat bubbles keep the role-mirrored squared tail (user right, assistant left). No pill buttons; status dots full-round.

## Components

### Buttons

- Send: mint fill, `--primary-fg` ink. Stop: brick fill. Both 32×32 icon buttons, 120ms ease background transition.
- Icon (`.icon-btn-32`): transparent, sage icon at rest; hover = `--surface-2` fill + mint icon; active = mint fill.

### Bubbles (signature)

User: surface-2 fill, khaki text, squared bottom-right tail. Assistant: surface fill, hairline border, squared bottom-left tail. Streaming cursor blinks inside; errors dim the body and append a brick inline line.

### Inputs / Fields

Composer: surface-2 field, hairline border, 8px radius. Focus = border shifts to `--focus` — border shift is the whole focus signal.

### Navigation

Header: ink ground, hairline bottom border, 32×32 icon rail. Drawer: surface over a `--backdrop` veil, hairline row separators, Escape closes, `inert` when off-screen. Theme editor dropdowns and the color picker are HeroUI Popovers — portals own stacking and dismissal.

### Code Surface

`code-surface` utility: `--bg-sunken` ground, hairline border, Victor Mono, khaki text, mint links. Background, foreground, and border travel together; in a light scope the surface re-resolves via the twin.

## Do's and Don'ts

### Do:

- **Do** express every color as a `--*` role; component tokens alias roles via `@theme inline`.
- **Do** edit `phosphor/build/palette.py` and regenerate for palette changes; never hand-edit generated CSS.
- **Do** keep mint for commit/focus/active semantics and sage for status/links.
- **Do** wrap animation in `motion-safe:`.
- **Do** verify the light twin renders when touching surfaces — roles must re-resolve.
- **Do** use HeroUI Popover/Modal for any floating surface; portals own stacking and dismissal.

### Don't:

- **Don't** hand-edit `phosphor/*.css` or `tokens.json` — generated.
- **Don't** add Tailwind color-family utilities (`slate-*`, `teal-*`, `rose-*`) in kit call sites.
- **Don't** add glows, orbs, ambient gradients, or halo rings.
- **Don't** add literal hex in components.
- **Don't** ship text under 11px.
- **Don't** stack bespoke `fixed inset-0` overlays or `z-[100]+` hacks.
- **Don't** let mauve become structural; italic commentary only.
