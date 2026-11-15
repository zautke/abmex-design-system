"""CEV palette — the claude-export-viewer theme as an ABMEX theme family.

Anchors are the app's own hexes (src/styles/tokens/identity.css at v0.2.0),
converted to OKLCH so the shared resolve() derives every -fg/-hover/-soft/-soft-fg
role exactly as it does for Phosphor. Build: `python3 build/build.py -f cev`.

Scoping: data-theme="cev" selects the family, data-mode="dark|light" the mode
(no data-mode → dark). The emitted cev.tokens.css is an overlay: load it AFTER
phosphor.tokens.css (via phosphor.tailwind.css), which supplies motion, the
theme-independent tokens and the Tailwind bridge every family shares.
Known limits: a phosphor scope nested inside a cev scope is not supported, and
the bridge's dark:/light: variants ignore data-mode (existing ABMEX defect).
"""
from color import hex_to_oklch
from palette import resolve as _resolve, hexof, fit_L, INTENTS

NAME = 'CEV'
SOURCE = 'claude-export-viewer v0.2.0 identity.css (dark pre-token app, light Phase 1); build/palette_cev.py'
THEMES = [{'id': 'dark', 'name': 'Dark (CEV)'}, {'id': 'light', 'name': 'Light (CEV linen)'}]

def lch(h): return hex_to_oklch(h)

DARK_HEX = {
  'bg': '#0a0a0a', 'bg-sunken': '#0a0a0a', 'surface': '#1a1a1a', 'surface-2': '#2a2a2a',
  'surface-3': '#333333', 'overlay': '#2a2a2a', 'field': '#1a1a1a',
  'border': '#404040', 'border-strong': '#a0a0a0',
  'fg': '#ededed', 'fg-strong': '#ffffff', 'fg-sage': '#ededed', 'fg-muted': '#a0a0a0', 'fg-disabled': '#666666',
  'folder': '#1a1a1a', 'paper': '#2a2a2a', 'folder-edge': '#404040', 'page': '#0a0a0a',
  'primary': '#ff6b35', 'danger': '#f44336', 'success': '#66bb6a', 'warning': '#ffa726',
  'info': '#29b6f6', 'emphasis': '#718096',
}
LIGHT_HEX = {
  'bg': '#ffffff', 'bg-sunken': '#ffffff', 'surface': '#f7f6f3', 'surface-2': '#efede8',
  'surface-3': '#e4e1da', 'overlay': '#efede8', 'field': '#f7f6f3',
  'border': '#cfcbc2', 'border-strong': '#5c5a55',
  'fg': '#2a2926', 'fg-strong': '#1a1a1a', 'fg-sage': '#2a2926', 'fg-muted': '#5c5a55', 'fg-disabled': '#8a877f',
  'folder': '#f7f6f3', 'paper': '#efede8', 'folder-edge': '#cfcbc2', 'page': '#ffffff',
  'primary': '#d9541f', 'danger': '#d32f2f', 'success': '#2e7d32', 'warning': '#ed6c02',
  'info': '#0288d1', 'emphasis': '#4a5568',
}
DARK = {k: lch(h) for k, h in DARK_HEX.items()}
LIGHT = {k: lch(h) for k, h in LIGHT_HEX.items()}

def darken_to(spec, role, against, target):
    """Contrast gate fix: lower only the anchor's lightness until it reaches `target` on `against`."""
    L, C, H = spec[role]
    return (fit_L(C, H, against, target, False, 0.0, L), C, H)

# Light primary and info: paper text on the fill (and the fill as text on surface) must reach AA.
LIGHT['primary'] = darken_to(LIGHT, 'primary', LIGHT_HEX['surface'], 4.6)
LIGHT['info'] = darken_to(LIGHT, 'info', LIGHT_HEX['surface'], 4.6)

def resolve(): return _resolve(DARK, LIGHT)

# Categorical series = the intents; light warning orange is too pale for 3:1 on surface.
_SERIES = ['primary', 'info', 'success', 'warning', 'danger']
CHARTS = {'dark': [DARK[k] for k in _SERIES], 'light': [LIGHT[k] for k in _SERIES]}
CHARTS['light'][3] = darken_to(LIGHT, 'warning', LIGHT_HEX['surface'], 3.05)

ALPHA = {
 'dark':  {'backdrop': 'rgba(0, 0, 0, 0.6)'},
 'light': {'backdrop': 'rgba(0, 0, 0, 0.32)'},
}
SHADOW = {
 'dark': {
   'shadow-surface': 'none',
   'shadow-field':   'none',
   'shadow-overlay': '0 24px 56px rgba(0, 0, 0, 0.15)',
 },
 'light': {
   'shadow-surface': '0 1px 3px rgba(0, 0, 0, 0.08)',
   'shadow-field':   '0 1px 2px rgba(0, 0, 0, 0.05)',
   'shadow-overlay': '0 24px 56px rgba(0, 0, 0, 0.15)',
 },
}

# Specificity (0,2,0) beats phosphor's (0,1,0); within this file light follows dark.
DARK_SEL = ':root[data-theme="cev"],\n[data-theme="cev"],\n[data-theme="cev"][data-mode="dark"],\n[data-theme="cev"] [data-mode="dark"]'
LIGHT_SEL = '[data-theme="cev"][data-mode="light"],\n[data-theme="cev"] [data-mode="light"]'
SCOPE_NOTE = '''/* Theme scoping
 *   [data-theme="cev"]                     → cev dark (default)
 *   [data-theme="cev"][data-mode="light"]  → cev light; data-mode nests inside a cev scope
 */'''
PREAMBLE = '\n/* Overlay family: load after phosphor.tokens.css (motion, theme-independent tokens, Tailwind bridge). */'
ROOT_BLOCK = '''/* Non-color tokens (cev overrides; everything else comes from phosphor.tokens.css).
 * Fonts are fallbacks only: apps bind their own faces (e.g. next/font variables). */
:root[data-theme="cev"],
[data-theme="cev"] {
  --radius: 0.5rem;
  --font-sans: ui-sans-serif, system-ui, sans-serif;
  --font-display: ui-sans-serif, system-ui, sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", Menlo, monospace;
}'''

# ---------------------------------------------------------------- identity layer
# One name per distinct color across both modes: named anchors first, then every
# remaining derived color gets cev-<role>-<mode>. Same hex → same name everywhere,
# so build.py's one-hex-one-name gates hold by construction.
ANCHOR_NAMES = {
  '#0a0a0a': 'cev-onyx', '#1a1a1a': 'cev-ink', '#2a2a2a': 'cev-graphite', '#333333': 'cev-charcoal',
  '#404040': 'cev-iron', '#a0a0a0': 'cev-pewter', '#ededed': 'cev-mist', '#ffffff': 'cev-white',
  '#666666': 'cev-ash', '#ff6b35': 'cev-ember', '#f44336': 'cev-scarlet', '#66bb6a': 'cev-clover',
  '#ffa726': 'cev-amber', '#29b6f6': 'cev-cyan', '#718096': 'cev-slate',
  '#f7f6f3': 'cev-linen', '#efede8': 'cev-bone', '#e4e1da': 'cev-sand', '#cfcbc2': 'cev-stone',
  '#5c5a55': 'cev-taupe', '#2a2926': 'cev-soot', '#8a877f': 'cev-khaki', '#d32f2f': 'cev-crimson',
  '#2e7d32': 'cev-forest', '#ed6c02': 'cev-tangerine', '#4a5568': 'cev-slate-deep',
  hexof(LIGHT['primary']): 'cev-rust', hexof(LIGHT['info']): 'cev-cerulean',
  hexof(CHARTS['light'][3]): 'cev-copper',
}

def _identity():
    names = dict(ANCHOR_NAMES)
    out = {}
    for th, (res, _) in resolve().items():
        res = dict(res)
        for i, c in enumerate(CHARTS[th], 1): res[f'chart-{i}'] = hexof(c)
        out[th] = {}
        for role, h in res.items():
            out[th][role] = names.setdefault(h, f'cev-{role}-{th}')
    return out
IDENTITY = _identity()
