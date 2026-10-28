# Source-backed sidebar style mapping — ESI003

## Evidence and limits

Ten complete files retrieved through CodeMunch match their current working bytes AND the declared HEAD Git blobs exactly; SHA256 receipts are in style-source-identities.json. Donor HEADc0b0e5f, linked UI HEADa899e70, target snapshot50d0504 (production paths unchanged from indexed002 snapshot). Dirty unrelated upstream files preserved. This proves these source files, not installed CSS, computed styles, contrast or whole dependency closure. No product code changed.

Read active DashboardPage: it renders AppSidebar without class/variant override. AppSidebar imports linked Sidebar/Item/Trigger/Rail. RootLayout imports globals.css and next/font Rethink Sans, applied as font-sans. Source names alone do not prove active styling.

## Active source chain — correction to earlier provisional maps

- Linked ui/src/components/sidebar/sidebar-variants.ts7–27: default root requests bg-card border-border; elevated/floating/inset are optional variants, not current app default.
- Same file33–46: default item requests hover:bg-accent/10; active requests bg-accent/20 text-accent.
- Sidebar.tsx applies those variants, transition-[width] duration-300 ease-in-out and inline rem widths.
- SidebarItem.tsx applies item variants, px-2 collapsed or px-4 expanded, py-3; fixed icon w-5/h-5; label ml-3 text-sm font-medium, width/opacity transition300ms.
- SidebarTrigger.tsx requests hover:bg-accent/10; SidebarRail.tsx hover accent/30, resizing accent/50, pill bg-border.
- globals.css102–257 declares card, foreground, accent, border and separate sidebar-* values in light/dark; @theme inline258–334 binds color-* utilities to those CSS variables.
- The separately declared sidebar/sidebar-hover/sidebar-active tokens are NOT what these default linked variant strings reference. Legacy/static sidebar code can reference them; do not claim that declaration names establish active usage.

## Actual declaration-to-target map

Values below are SOURCE declarations; opacity utilities and cascade/emission still need runtime verification. Target definitions: phosphor.tokens.css19–176 and phosphor.tailwind.css22–95.

| Active responsibility | Donor source/declaration | Existing ABMEX role / utility | Decision |
|---|---|---|---|
| Root surface | bg-card → --card: light oklab(1 0 0), dark oklab(.3086 -.001 .0035) | --surface / bg-surface | Reuse semantic panel role; intentional ABMEX appearance |
| Normal text | inherited foreground: light oklab(.3585 -.0019 .0054), dark oklab(.8066 -.0018 .0139) | --fg / text-fg | Reuse; expose per-part overrides |
| Divider/rail pill | border-border, bg-border → --border: light oklch(.90 .008 85), dark oklch(.30 .012 85) | --border, optionally --border-strong / border-border | Reuse; do not hardcode donor values |
| Hover surface | hover:bg-accent/10; --accent light oklch(.96 .015 45), dark oklch(.28 .04 45) | --surface-2 / hover:bg-surface-2 | Semantic translation; not color/alpha parity |
| Selected row | bg-accent/20 text-accent | --primary-soft + --fg-strong; icon --primary-soft-fg | Reuse existing selected-surface roles; contrast/visibility remains unverified |
| Resize feedback | accent/30 and accent/50 | --focus or --primary; state-aware override | Reuse feedback role; pointer/keyboard contract separate |
| Focus | no explicit item focus class; donor --ring=primary | --focus, --ring-width, --ring-offset | Use existing focus semantics; real keyboard/contrast proof required |
| Typography | next/font Rethink Sans, font-sans | --font-sans=Rethink Sans; --font-mono=Victor Mono | Existing target font authority; no donor binary copy needed |
| Corners | rounded-lg from donor Tailwind scale | --radius via rounded-base | ABMEX default .25rem; configurable visual difference |
| Width/collapse motion | utility duration300ms/ease-in-out | shared motion semantics or justified disclosure-specific mapping | Do not substitute unrelated token solely because value300 matches |
| Theme transition |550ms variable plus donor easing | existing --theme-transition-duration; UI theme-transition.css same choreography | Reuse existing facility, preserve local target and reduced-motion behavior |

No new theme semantic is justified solely by donor sidebar-* declarations. Component-specific defaults may reference existing roles; consumer class/style/slot overrides remain required by contract. Do not make all customization global.

## Important source risks / acceptance work

1. The donor @source is ../../node_modules/@braisenly/ui/src/**/*.tsx. Active variant strings live in sidebar-variants.ts, outside that explicit extension glob. Generated utility coverage must be checked after normal bootstrap; other app sources may incidentally emit some classes. Do not claim every requested class exists in delivered CSS.
2. Active text-accent uses a pale donor accent value in light mode; selected foreground visibility is a characterization risk. No measured contrast failure asserted. ABMEX selected text maps to its own readable role, with explicit defect-correction evidence if required.
3. Root always declares a width transition while rail directly changes width during drag; perceived drag lag is a source-derived risk, not observed runtime failure. Future resizing state can disable visual transition while keeping cleanup protected.
4. App theme rules mutate html-wide transition classes; target theme-transition.css allows scoped selectors, opt-out and reduced-motion. Do not transplant global behavior as Sidebar default.
5. Target token selectors support data-mode, but custom dark/light variants inspected in phosphor.tailwind.css rely on class/data-theme. Role-based colors avoid assuming variant parity; full selector/nesting audit remains open.
6. Donor palettes ocean/forest override core/sidebar/primary variables; they are theme-family inputs, not extra public Sidebar responsibilities. Current extraction uses ABMEX semantic authority; importing additional palette families is separate scope.

## Assets and distribution

Target phosphor.fonts.css defines four relative woff2 faces for Rethink Sans/Victor Mono, metadata says Fontsource5.3.0/SIL OFL1.1; font/license-file packaging still needs artifact checks. Target theme manifest exports styles.css, fonts.css and phosphor/*; UI offers styles.css and tailwind.css. Source UI Tailwind entry imports theme fonts/role bridge and theme-transition CSS and scans component/hook/internal/primitive/utils folders.

Do not copy donor app globals wholesale, add Heroicons/GSAP merely to preserve implementation choices, or retain a second donor token authority. Target existing Icon/Text/Button/IconButton/Layout candidates and meaningful IconLabel/item-body intermediates should be compared by contract; richer interactive bodies need separate actions. Stateful support must include memory defaults, optional built-in durable facility and external ownership; no host-only persistence waiver.

## Status

PASS: actual source declarations and variant chain traced,10 full-file cache/current/Git identities verified, semantic target mapping proposed with source references.
NOT RUN: installed emitted CSS coverage, computed cascade/contrast, font binary/package/license checks and browser interactions.
Full extraction acceptance remains pending; this is a prerequisite source-map artifact, not implementation approval.
