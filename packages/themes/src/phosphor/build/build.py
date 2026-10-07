#!/usr/bin/env python3
"""Phosphor theme generator — one source (palette.py) → every artifact.
Outputs: ../*.css (drop-in), build/tokens.generated.json (seed for ../tokens.json, which is hand-curated after generation), build/contrast.json."""
import json, os, math
from color import *
from palette import resolve, hexof, INTENTS, FOLDER

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
os.makedirs(f'{OUT}/adapters', exist_ok=True)
R = resolve()
CHARTS = {  # matte: only series 1 (mint) is saturated
 'dark':  [(0.785,0.137,176.9),(0.695,0.089,319.2),(0.780,0.095,70),(0.680,0.080,242),(0.680,0.100,35)],
 'light': [(0.505,0.095,176.9),(0.500,0.090,319),(0.600,0.100,70),(0.480,0.080,245),(0.560,0.110,35)],
}
for th in R:
    for i, c in enumerate(CHARTS[th], 1): R[th][0][f'chart-{i}'] = hexof(c)

ALPHA = {  # non-opaque tokens
 'dark':  {'backdrop': 'rgba(3, 8, 5, 0.72)'},
 'light': {'backdrop': 'rgba(9, 27, 19, 0.32)'},
}
SHADOW = {
 'dark': {
   'shadow-surface': 'none',
   'shadow-field':   'none',
   'shadow-overlay': '0 0 0 1px rgba(168, 191, 174, 0.06), 0 16px 40px -12px rgba(0, 0, 0, 0.7)',
 },
 'light': {
   'shadow-surface': '0 1px 2px 0 rgba(9, 27, 19, 0.06), 0 0 0 1px rgba(9, 27, 19, 0.03)',
   'shadow-field':   '0 1px 2px 0 rgba(9, 27, 19, 0.05)',
   'shadow-overlay': '0 2px 8px 0 rgba(9, 27, 19, 0.08), 0 14px 32px -6px rgba(9, 27, 19, 0.14)',
 },
}
ORDER = (['bg','bg-sunken','surface','surface-2','surface-3','overlay','field','border','border-strong',
          'fg','fg-strong','fg-sage','fg-muted','fg-disabled'] + FOLDER +
         [f'{i}{s}' for i in INTENTS for s in ('','-fg','-hover','-soft','-soft-fg')] +
         ['focus','link','selection','code-bg','scrollbar'] + [f'chart-{i}' for i in range(1,6)])

USAGE = {
 'bg': 'App background (deep phosphor-black / bone paper). Ground for `fg`, `fg-strong`, `fg-muted`.',
 'bg-sunken': 'Recessed wells below the app ground: code blocks, terminal output, inset sidebars.',
 'surface': 'The muted surface: sidebar, inspector, Questions block, cards (shadcn `card`, HeroUI `surface`). Ground for every text token.',
 'surface-2': 'Raised fill: the prompt/input block, active tab, hovered rows, secondary buttons.',
 'surface-3': 'Pressed / selected neutral fill, segmented-control thumb.',
 'overlay': 'Floating layers: popover, menu, tooltip, dialog. One step above `surface`.',
 'field': 'Input, textarea and select background (the raised green of the prompt block).',
 'border': 'Hairline: card edges, dividers, table rules. Decorative only (below 3:1 by design).',
 'border-strong': 'Control boundary: input, checkbox and select outlines; 3:1 on `field`, `surface`, `bg`.',
 'fg': 'Body text: golden khaki (dark) / olive ink (light) on every ground, including the muted `surface`.',
 'fg-sage': 'Secondary text role: sage (dark) / forest ink (light). Inactive tabs, neutral values, table body in dense data.',
 'fg-strong': 'Headings, active labels, values on every ground.',
 'fg-muted': 'Secondary text, captions, placeholders: 4.5:1 on every ground up to `surface-2`.',
 'fg-disabled': 'Disabled labels only (WCAG-exempt).',
 'focus': 'Focus ring, 2px solid with 2px offset; 3:1 on every ground.',
 'link': 'Inline links on any ground.',
 'selection': 'Text selection and highlighted search matches.',
 'code-bg': 'Code surface: blends toward app bg, bordered by `border`.',
 'scrollbar': 'Scrollbar thumb.',
 'folder': 'Manila folder: tab strip, inactive tabs and the frame that wraps the paper pane.',
 'paper': 'Paper lying on the folder: the active tab and the pane it opens (ivory in light).',
 'folder-edge': 'Hairline dividers between folder tabs. Decorative only.',
 'page': 'Ground the folder sits on (app page behind the frame).',
 'backdrop': 'Modal scrim behind dialogs and sheets.',
}
INTENT_NOTE = {
 'primary': 'Mint / deep jade: the one saturated color; the brand signal. Primary buttons, active nav, toggles on, progress.',
 'danger': 'Matte brick: destructive actions, invalid fields, error text.',
 'success': 'Code green: completed, connected, passing.',
 'warning': 'Matte ochre (oranger than the gold text): degraded, pending attention. Always dark text on the fill.',
 'info': 'Matte slate-cyan: neutral notices, help, links to docs.',
 'emphasis': 'Mauve: italic emphasis, highlights in prose, a fourth category hue.',
}
for i, n in INTENT_NOTE.items():
    USAGE[i] = n + ' As text it holds 4.5:1 on `bg`/`surface`.' if i not in ('warning',) else n
    USAGE[f'{i}-fg'] = f'Text and icons on a `{i}` or `{i}-hover` fill.'
    USAGE[f'{i}-hover'] = f'Hover / pressed state of a `{i}` fill.'
    USAGE[f'{i}-soft'] = f'Tinted background for {i} badges, alerts and selected rows.'
    USAGE[f'{i}-soft-fg'] = f'{i.capitalize()} text that reads on `{i}-soft`, `bg`, `surface` and `surface-2` (4.5:1).'
for i in range(1,6): USAGE[f'chart-{i}'] = f'Categorical series {i}; 3:1 on `surface` in both themes.'

def oklch_str(h):
    L,C,H = hex_to_oklch(h)
    if C < 0.0005: return f'oklch({L:.4f} 0 0)'
    return f'oklch({L:.4f} {C:.4f} {H:.2f})'

# ---------------------------------------------------------------- tokens.css (framework-agnostic)
def block(th):
    res = R[th][0]; lines = []
    groups = [('Neutrals', ORDER[:14]), ('Folder', FOLDER)] + [(i.capitalize(), [f'{i}{s}' for s in ('','-fg','-hover','-soft','-soft-fg')]) for i in INTENTS] + \
             [('Utility', ['focus','link','selection','code-bg','scrollbar']), ('Charts', [f'chart-{i}' for i in range(1,6)])]
    for g, keys in groups:
        lines.append(f'  /* {g} */')
        for k in keys: lines.append(f'  --{k}: {oklch_str(res[k])}; /* {res[k]} */')
    lines.append('  /* Effects */')
    for k,v in ALPHA[th].items(): lines.append(f'  --{k}: {v};')
    for k,v in SHADOW[th].items(): lines.append(f'  --{k}: {v};')
    return '\n'.join(lines)

HEADER = '''/* ============================================================================
 * Phosphor — {title}
 * Generated by build/build.py from build/palette.py. Do not hand-edit values;
 * change the palette and re-run `python3 build/build.py`.
 * Requires: Tailwind CSS >= 4.2 (verified on 4.2.x and 4.3.x) where noted.
 * ========================================================================== */
'''
tokens_css = HEADER.format(title='tokens (Layer 1: the role interface)') + '''
/* Theme scoping
 *   default (no class)            → dark
 *   .dark  | [data-theme="dark"]  → dark   (works on any element, nests)
 *   .light | [data-theme="light"] → light  (works on any element, nests)
 * Every adapter re-declares its variables on these same selectors, so a
 * nested scope re-resolves var() chains instead of inheriting stale values.
 */
:root,
.dark,
[data-theme="dark"] {
  color-scheme: dark;
''' + block('dark') + '''
}

.light,
[data-theme="light"] {
  color-scheme: light;
''' + block('light') + '''
}

/* Non-color tokens (theme-independent) */
:root {
  --theme-attribute: class;      /* how this theme is scoped; read by createThemeController */
  --radius: 0.25rem;          /* crisp instrument corners; every radius derives from this */
  --tab-flare: 6px;           /* folder tab: top radius and the outward flare at its foot */
  --border-width: 1px;
  --ring-width: 2px;
  --ring-offset: 2px;
  --font-sans: "Rethink Sans", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Rethink Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Victor Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
  --display-weight: 600;
  --display-tracking: -0.02em;
  --duration: 140ms;
  --ease: cubic-bezier(0.2, 0, 0, 1);
}
'''
ROLES_MARKER = '/* theme-editor: roles — parseSemanticVariables lists every declaration between\n * this marker and the end marker as the theme\'s role group. */\n'
tokens_css = tokens_css.replace('/* Theme scoping', ROLES_MARKER + '\n/* Theme scoping', 1) + '/* theme-editor: roles-end */\n'
open(f'{OUT}/phosphor.tokens.css','w',encoding='utf-8',newline=chr(10)).write(tokens_css)

# ---------------------------------------------------------------- tailwind layer
SEL = ':root,\n.dark,\n[data-theme="dark"],\n.light,\n[data-theme="light"]'
colors = ORDER + ['backdrop']
tw = HEADER.format(title='Tailwind v4 layer') + '''
@import "./phosphor.tokens.css";

/* Dark is the default, so `dark:` fires with no scope at all. Nearest-scope
 * rule (Codex PR#15 P2, both directions): an explicit inner scope wins over an
 * outer one in either nesting order —
 *   .light .dark x  → dark utilities fire, light silenced
 *   .dark  .light y → light utilities fire, dark silenced
 * so `dark:`/`light:` never disagree with the `--*` token cascade, which
 * resolves by the same nearest-scope CSS inheritance. Redefines any earlier
 * `dark` variant (e.g. HeroUI's), so import this file AFTER @heroui/styles. */
@custom-variant dark (&:not(:where(.light, .light *, [data-theme="light"], [data-theme="light"] *)), &:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *):not(:where(.dark .light, .dark .light *, [data-theme="dark"] [data-theme="light"], [data-theme="dark"] [data-theme="light"] *)));
@custom-variant light (&:where(.light, .light *, [data-theme="light"], [data-theme="light"] *):not(:where(.light .dark, .light .dark *, [data-theme="light"] .dark, [data-theme="light"] .dark *)));

/* Phosphor-native utilities: bg-surface, text-fg-muted, border-border,
 * ring-focus, shadow-overlay, rounded-base, font-display … */
@theme inline {
''' + '\n'.join(f'  --color-{k}: var(--{k});' for k in colors) + '''

  /* --font-sans / --font-mono: Tailwind's own keys; the theme's unlayered
   * :root values win over Tailwind's layered defaults, so no alias is needed. */
  --font-display: var(--font-display);

  --shadow-surface: var(--shadow-surface);
  --shadow-field: var(--shadow-field);
  --shadow-overlay: var(--shadow-overlay);

  --radius-base: var(--radius);
  --ease-base: var(--ease);
}

@layer base {
  /* Tailwind v4 defaults borders to currentColor; Phosphor's hairline instead. */
  :where(*, ::before, ::after, ::backdrop, ::file-selector-button) { border-color: var(--border); }
  html {
    background-color: var(--bg);
    color: var(--fg);
    font-family: var(--font-sans);
    scrollbar-color: var(--scrollbar) transparent;
    -webkit-font-smoothing: antialiased;
  }
  :where(h1, h2, h3, h4) {
    font-family: var(--font-display);
    font-weight: var(--display-weight);
    letter-spacing: var(--display-tracking);
    color: var(--fg-strong);
  }
  :where(code, kbd, samp, pre) { font-family: var(--font-mono); }
  :where(em, i) { color: var(--emphasis-soft-fg); }
  :where(a:not([class])) { color: var(--link); text-underline-offset: 0.2em; }
  ::selection { background-color: var(--selection); color: var(--fg-strong); }
  :where(:focus-visible) {
    outline: var(--ring-width) solid var(--focus);
    outline-offset: var(--ring-offset);
  }
}
'''
open(f'{OUT}/phosphor.tailwind.css','w',encoding='utf-8',newline=chr(10)).write(tw)

# ---------------------------------------------------------------- adapters
def adapter(name, desc, mapping, theme_inline=None, extra_root=''):
    s = HEADER.format(title=f'{name} adapter') + desc + f'\n{SEL} {{\n'
    s += '\n'.join(f'  --{k}: {v};' for k, v in mapping) + '\n}\n'
    if extra_root: s += extra_root
    if theme_inline:
        s += '\n@theme inline {\n' + '\n'.join(f'  {l}' for l in theme_inline) + '\n}\n'
    return s

v = lambda k: f'var(--{k})'
shadcn_map = [
 ('radius', v('radius')),
 ('background', v('bg')), ('foreground', v('fg')),
 ('card', v('surface')), ('card-foreground', v('fg')),
 ('popover', v('overlay')), ('popover-foreground', v('fg')),
 ('primary', v('primary')), ('primary-foreground', v('primary-fg')),
 ('secondary', v('surface-2')), ('secondary-foreground', v('fg-strong')),
 ('muted', v('surface-2')), ('muted-foreground', v('fg-muted')),
 ('accent', v('primary-soft')), ('accent-foreground', v('fg-strong')),
 ('destructive', v('danger')), ('destructive-foreground', v('danger-fg')),
 ('border', v('border')), ('input', v('border-strong')), ('ring', v('focus')),
] + [(f'chart-{i}', v(f'chart-{i}')) for i in range(1,6)] + [
 ('sidebar', v('surface')), ('sidebar-foreground', v('fg')),
 ('sidebar-primary', v('primary')), ('sidebar-primary-foreground', v('primary-fg')),
 ('sidebar-accent', v('surface-2')), ('sidebar-accent-foreground', v('fg-strong')),
 ('sidebar-border', v('border')), ('sidebar-ring', v('focus')),
 ('/* Phosphor extensions (shadcn has no built-in status tokens) */', None),
] + [x for i in ('success','warning','info') for x in ((i, v(i)), (f'{i}-foreground', v(f'{i}-fg')))] + [
 ('emphasis', v('emphasis')), ('emphasis-foreground', v('emphasis-fg')),
]
shadcn_map = [(k, val) for k, val in shadcn_map]
def render_map(m):
    out=[]
    for k,val in m:
        if val is None: out.append(f'  {k}'); continue
        # Same name as a theme role: the theme already defines it (unlayered),
        # and `--x: var(--x)` would be a cycle.
        if val == f'var(--{k})': continue
        out.append(f'  --{k}: {val};')
    return '\n'.join(out)
sh_keys = [k for k,val in shadcn_map if val is not None and k!='radius']
shadcn_inline = [f'--color-{k}: var(--{k});' for k in sh_keys] + [
 '--radius-sm: calc(var(--radius) * 0.6);', '--radius-md: calc(var(--radius) * 0.8);',
 '--radius-lg: var(--radius);', '--radius-xl: calc(var(--radius) * 1.4);',
 '--radius-2xl: calc(var(--radius) * 1.8);', '--radius-3xl: calc(var(--radius) * 2.2);',
 '--radius-4xl: calc(var(--radius) * 2.6);']
shadcn_css = HEADER.format(title='shadcn/ui adapter (CLI v4, Radix or Base UI)') + '''
/* Usage (app/globals.css) — replaces the :root/.dark blocks `shadcn init` wrote:
 *   @import "tailwindcss";
 *   @import "tw-animate-css";
 *   @import "shadcn/tailwind.css";
 *   @import "./phosphor/phosphor.tailwind.css";
 *   @import "./phosphor/adapters/shadcn.css";
 * Delete the generated `@custom-variant dark`, `@theme inline`, :root and .dark
 * blocks; this file supplies all of them. components.json → "cssVariables": true.
 *
 * Semantics note: shadcn `accent` is the subtle hover fill (menus, ghost buttons),
 * here a mint-tinted `primary-soft`; shadcn `muted` is a background, `muted-foreground`
 * is the muted text.
 */
''' + f'{SEL} {{\n' + render_map(shadcn_map) + '\n}\n\n@theme inline {\n' + '\n'.join('  '+l for l in shadcn_inline) + '\n}\n'
open(f'{OUT}/adapters/shadcn.css','w',encoding='utf-8',newline=chr(10)).write(shadcn_css)

hero_map = [
 ('radius', v('radius')), ('field-radius', 'calc(var(--radius) * 1.5)'),
 ('border-width', v('border-width')), ('field-border-width', v('border-width')),
 ('ring-offset-width', v('ring-offset')),
 ('background', v('bg')), ('foreground', v('fg')),
 ('surface', v('surface')), ('surface-foreground', v('fg')),
 ('surface-secondary', v('surface-2')), ('surface-secondary-foreground', v('fg')),
 ('surface-tertiary', v('surface-3')), ('surface-tertiary-foreground', v('fg')),
 ('overlay', v('overlay')), ('overlay-foreground', v('fg')),
 ('muted', v('fg-muted')),
 ('default', v('surface-2')), ('default-foreground', v('fg-strong')),
 ('accent', v('primary')), ('accent-foreground', v('primary-fg')),
 ('field-background', v('field')), ('field-foreground', v('fg-strong')),
 ('field-placeholder', v('fg-muted')), ('field-border', v('border-strong')),
 ('success', v('success')), ('success-foreground', v('success-fg')),
 ('warning', v('warning')), ('warning-foreground', v('warning-fg')),
 ('danger', v('danger')), ('danger-foreground', v('danger-fg')),
 ('segment', v('surface-3')), ('segment-foreground', v('fg-strong')),
 ('border', v('border')), ('separator', v('border')),
 ('focus', v('focus')), ('link', v('link')), ('backdrop', v('backdrop')),
 ('scrollbar-thumb', v('scrollbar')),
 ('surface-shadow', v('shadow-surface')), ('overlay-shadow', v('shadow-overlay')), ('field-shadow', v('shadow-field')),
 ('/* Calculated tokens: pinned to contrast-checked Phosphor values instead of color-mix() */', None),
 ('surface-hover', v('surface-2')),
 ('background-secondary', v('surface')), ('background-tertiary', v('surface-2')), ('background-inverse', v('fg-strong')),
 ('default-hover', v('surface-3')),
] + [(f'{a}-hover', v(f'{p}-hover')) for a,p in (('accent','primary'),('success','success'),('warning','warning'),('danger','danger'))] + \
 [x for a,p in (('accent','primary'),('success','success'),('warning','warning'),('danger','danger'))
    for x in ((f'{a}-soft', v(f'{p}-soft')), (f'{a}-soft-foreground', v(f'{p}-soft-fg')),
              (f'{a}-soft-hover', f'color-mix(in oklab, var(--{p}-soft) 80%, var(--{p}) 20%)'))] + [
 ('default-soft', v('surface-2')), ('default-soft-foreground', v('fg-strong')), ('default-soft-hover', v('surface-3')),
 ('field-hover', v('field')), ('field-focus', v('field')),
 ('field-border-hover', v('fg-muted')), ('field-border-focus', v('focus')),
 ('separator-secondary', v('border')), ('separator-tertiary', v('border-strong')),
 ('border-secondary', v('border-strong')), ('border-tertiary', v('fg-muted')),
]
hero_css = HEADER.format(title='HeroUI v3 adapter (@heroui/react >= 3.0.5)') + '''
/* Usage (globals.css):
 *   @import "tailwindcss";
 *   @import "@heroui/styles";
 *   @import "./phosphor/phosphor.tailwind.css";   ← after HeroUI: replaces its `dark` variant
 *   @import "./phosphor/adapters/heroui.css";
 * HeroUI's own @theme inline already maps these to --color-* utilities.
 * Unlayered on purpose: beats HeroUI's layer(theme) defaults with no !important.
 *
 * Semantics note: HeroUI `accent` = the brand fill (Phosphor `primary`);
 * HeroUI `muted` = muted TEXT (Phosphor `fg-muted`).
 * Phosphor-only intents (info, emphasis) are available as bg-info etc.
 */
''' + f'{SEL} {{\n' + render_map(hero_map) + '\n}\n'
open(f'{OUT}/adapters/heroui.css','w',encoding='utf-8',newline=chr(10)).write(hero_css)

tmpl = HEADER.format(title='adapter template (the interface contract)') + '''
/* Any component system can consume Phosphor by mapping ITS variable names to the
 * --* interface below. Rules:
 *  1. Declare the mapping on exactly these selectors (so nested .light/.dark
 *     scopes re-resolve):  :root, .dark, [data-theme="dark"], .light, [data-theme="light"]
 *  2. Map by ROLE, never by name: libraries reuse names (accent, muted) for
 *     different roles. Read the library's docs for what each variable paints.
 *  3. Text-on-fill pairs: always <intent> + <intent>-fg. Tinted pairs: <intent>-soft
 *     + <intent>-soft-fg. Both pairs are contrast-checked (WCAG 4.5:1) in both themes.
 *  4. Prefer the pinned -hover / -soft tokens over color-mix(); they are checked.
 *  5. Import order: library CSS → phosphor.tailwind.css → your adapter.
 *
 * THE INTERFACE (all defined in phosphor.tokens.css, both themes)
 *  Grounds    --bg --bg-sunken --surface --surface-2 --surface-3
 *             --overlay --field --code-bg
 *  Lines      --border (hairline, decorative) --border-strong (3:1 controls)
 *  Text       --fg --fg-strong --fg-sage --fg-muted --fg-disabled --link
 *  Intents    --{primary|danger|success|warning|info|emphasis}
 *             + -fg  -hover  -soft  -soft-fg
 *  Utility    --focus --selection --scrollbar --backdrop
 *  Data viz   --chart-1 … --chart-5
 *  Effects    --shadow-surface --shadow-field --shadow-overlay
 *  Shape/type --radius --border-width --ring-width --ring-offset
 *             --font-sans --font-display --font-mono
 *             --display-weight --display-tracking --duration --ease
 */
''' + f'{SEL} {{\n' + '''  /* --library-background: var(--bg); */
  /* --library-primary: var(--primary); */
  /* --library-primary-text: var(--primary-fg); */
}
'''
open(f'{OUT}/adapters/_template.css','w',encoding='utf-8',newline=chr(10)).write(tmpl)

# ---------------------------------------------------------------- tokens.json for the design system
ctoks = []
for k in colors:
    ctoks.append({'name': f'{k}', 'value': {'dark': R['dark'][0].get(k) or ALPHA['dark'][k], 'light': R['light'][0].get(k) or ALPHA['light'][k]}, 'usage': USAGE[k]})
tokens = {
 'name': 'Phosphor', 'version': 1,
 'meta': {'source': 'Rendered pixels of the wxt-prompt screenshot (Oct 2026), matte; light theme derived; build/palette.py'},
 'color': {'themes': [{'id':'dark','name':'Dark (Phosphor)'},{'id':'light','name':'Light (Bone paper)'}], 'tokens': ctoks},
 'type': {
   'fonts': [],
   'families': {'sans': '"Rethink Sans", ui-sans-serif, system-ui, sans-serif',
                'display': '"Rethink Sans", ui-sans-serif, system-ui, sans-serif',
                'mono': '"Victor Mono", ui-monospace, SFMono-Regular, Menlo, monospace'},
   'groups': [
     {'name':'Display','family':'display','styles':[
       {'name':'display-xl','fontSize':'40px','lineHeight':'44px','fontWeight':600,'letterSpacing':'-0.025em','usage':'Page and hero titles, one per view.','sample':'Conversation initiation'},
       {'name':'display-lg','fontSize':'28px','lineHeight':'34px','fontWeight':600,'letterSpacing':'-0.02em','usage':'Section titles.'},
       {'name':'display-md','fontSize':'20px','lineHeight':'26px','fontWeight':600,'letterSpacing':'-0.015em','usage':'Panel and dialog titles.'}]},
     {'name':'Text','family':'sans','styles':[
       {'name':'title','fontSize':'16px','lineHeight':'24px','fontWeight':600,'usage':'Card titles, table headers in prose layouts.'},
       {'name':'body','fontSize':'15px','lineHeight':'22px','fontWeight':400,'usage':'Default UI and prose text in `fg`.'},
       {'name':'body-sm','fontSize':'13px','lineHeight':'20px','fontWeight':400,'usage':'Dense UI, helper text in `fg-muted`.'},
       {'name':'label','fontSize':'12px','lineHeight':'16px','fontWeight':500,'letterSpacing':'0.01em','usage':'Form labels, badges, button text at sm size.'}]},
     {'name':'Data','family':'mono','styles':[
       {'name':'mono','fontSize':'13px','lineHeight':'20px','fontWeight':400,'usage':'Code, terminal output, token counts, hex values, IDs.','sample':'158,029 tokens · 15% used'},
       {'name':'mono-sm','fontSize':'12px','lineHeight':'18px','fontWeight':400,'usage':'Status lines, key hints (ctrl+p), table numerics.'},
       {'name':'mono-emphasis','fontSize':'13px','lineHeight':'20px','fontWeight':400,'fontStyle':'italic','usage':'Victor Mono cursive italic in `emphasis-soft-fg` for emphasis inside data.'}]}]},
 'spacing': {'tokens': [{'name': f'space-{n}', 'value': f'{n*4}px', 'usage': u} for n,u in
   ((1,'Icon-to-label gap, badge padding-y.'),(2,'Control padding-y, tight stacks.'),(3,'Control padding-x, table cell padding.'),
    (4,'Card padding (dense), form row gap.'),(6,'Card padding, section gap inside panels.'),(8,'Panel gutters.'),(12,'Page section spacing.'))]},
 'radius': {'tokens': [
   {'name':'radius-sm','value':'2px','usage':'Badges, kbd, checkboxes (shadcn radius-sm ≈ 0.6×).'},
   {'name':'radius','value':'4px','usage':'Base: buttons, cards, menus (--radius, shadcn radius-lg).'},
   {'name':'radius-field','value':'6px','usage':'Inputs and selects (HeroUI field-radius = 1.5×).'},
   {'name':'radius-full','value':'9999px','usage':'Status dots, avatars, switches.'}]},
 'shadow': {'tokens': [{'name': f'{k}', 'value': {'dark': SHADOW['dark'][k], 'light': SHADOW['light'][k]},
   'usage': {'shadow-surface':'Cards: none in dark (hairline does the work), a faint lift on paper.',
             'shadow-field':'Inputs.','shadow-overlay':'Popovers, menus, dialogs.'}[k]} for k in SHADOW['dark']]},
}
json.dump(tokens, open(os.path.join(os.path.dirname(__file__), 'tokens.generated.json'),'w',encoding='utf-8',newline=chr(10)), indent=1, ensure_ascii=False)

# ---------------------------------------------------------------- contrast audit
PAIRS = []
for th in R:
    res = R[th][0]
    grounds = ['bg','bg-sunken','surface','surface-2','overlay','field','folder','paper','page']
    for t in ['fg','fg-strong','fg-sage','fg-muted','link']:
        for g in grounds: PAIRS.append((th,t,g,4.5))
    for i in INTENTS:
        PAIRS += [(th,f'{i}-fg',i,4.5),(th,f'{i}-fg',f'{i}-hover',4.5)]
        for g in [f'{i}-soft','bg','surface','surface-2']: PAIRS.append((th,f'{i}-soft-fg',g,4.5))
        if i in ('primary','danger'):
            for g in ['bg','surface']: PAIRS.append((th,i,g,4.5))
    for g in ['field','surface','bg']: PAIRS.append((th,'border-strong',g,3))
    for g in ['bg','surface','overlay','surface-2']: PAIRS.append((th,'focus',g,3))
    for c in range(1,6): PAIRS.append((th,f'chart-{c}','surface',3))
    PAIRS.append((th,'fg','code-bg',4.5)); PAIRS.append((th,'fg-strong','selection',4.5))
    PAIRS.append((th,'fg-strong','primary-soft',4.5))  # shadcn accent/accent-foreground
fails=[]; rows=[]
for th,t,g,need in PAIRS:
    a,b = R[th][0][t], R[th][0][g]; c = wcag(a,b); ap = abs(apca(a,b))
    rows.append((th,t,g,round(c,2),round(ap),need, c>=need))
    if c < need: fails.append((th,t,g,c,need))
json.dump(rows, open(os.path.join(os.path.dirname(__file__), 'contrast.json'),'w',encoding='utf-8',newline=chr(10)))
print(f'{len(rows)} pairs checked, {len(fails)} failing')
for f in fails: print('  FAIL', f)
print('min per theme:', {th: min(r[3] for r in rows if r[0]==th and r[5]==4.5) for th in R})
raise SystemExit(bool(fails))
