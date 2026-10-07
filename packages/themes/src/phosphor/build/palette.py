"""Phosphor palette — single source of truth. All values OKLCH (L, C, H)."""
from color import *

def hexof(t): return oklch_to_hex(*t)[0]
def fit_L(C, H, against, target, lighter, lo=0.0, hi=1.0):
    """smallest lightness change from `against` that reaches `target` WCAG ratio"""
    for i in range(400):
        L = (lo + i*(hi-lo)/400) if lighter else (hi - i*(hi-lo)/400)
        if wcag(hexof((L,C,H)), against) >= target: return round(L,3)
    return None

N = 162   # ink/sage hue (dark neutrals + light ink)
P = 112   # bone paper hue (light neutrals)

# Re-anchored 2026-10-01 to the RENDERED pixels of the wxt-prompt screenshot (matte theme).
DARK = {
  # ---- neutrals (sampled pixel in comments)
  'bg':          (0.214, 0.018, 170.1), # #111c18 page / app ground
  'bg-sunken':   (0.185, 0.016, 170.0), # code wells, below the page
  'surface':     (0.252, 0.018, 165.4), # #1a2520 muted surface: sidebar, Questions block, cards
  'surface-2':   (0.316, 0.034, 157.5), # #23372b raised: input block, active tab, hover rows
  'surface-3':   (0.352, 0.036, 157.5), # pressed / selected on raised
  'overlay':     (0.285, 0.022, 163.0), # popover / menu / dialog
  'field':       (0.316, 0.034, 157.5), # #23372b inputs render on the raised fill
  'border':      (0.335, 0.020, 163.0), # hairline
  'border-strong': None,
  'fg':          (0.807, 0.061, 110.8), # #c1c497 golden khaki: the body text everywhere
  'fg-strong':   (0.895, 0.052, 108.0), # brighter gold-cream for headings / values
  'fg-sage':     (0.782, 0.035, 153.5), # #a8bfae sage (old Lane A text) — secondary text role
  'fg-muted':    None,                  # #53685b fails AA (2.6:1 on surface) → fitted
  'fg-disabled': (0.470, 0.030, 157.8), # near #53685b, WCAG-exempt
  # ---- intents (matte: chroma <= ~0.11 except the mint signal)
  'primary':     (0.785, 0.137, 176.9), # #2dd5b7 mint — the one saturated signal
  'danger':      None,                  # matte brick (rendered #ff5345 is too hot) → fitted
  'success':     (0.693, 0.111, 152.2), # #63b07a the screenshot's hex/code green
  'warning':     (0.780, 0.095, 70),    # matte ochre: oranger + more chroma than gold text so it reads as a state
  'info':        (0.740, 0.070, 228),   # matte slate-cyan
  'emphasis':    (0.695, 0.089, 319.2), # #b58bc0 mauve (anchor)
}
LIGHT = {
  'bg':          (0.962, 0.013, P),     # bone paper
  'bg-sunken':   (0.935, 0.016, P),
  'surface':     (0.985, 0.007, P),     # card stock
  'surface-2':   (0.945, 0.015, 120),
  'surface-3':   (0.915, 0.018, 128),
  'overlay':     (0.992, 0.005, P),
  'field':       (0.992, 0.004, P),
  'border':      (0.880, 0.018, 135),   # hairline
  'border-strong': None,
  'fg':          (0.330, 0.045, 108),   # olive ink (twin of the gold)
  'fg-strong':   (0.225, 0.035, 108),
  'fg-sage':     (0.400, 0.040, 158),   # forest ink (twin of sage)
  'fg-muted':    None,
  'fg-disabled': (0.700, 0.015, 140),
  'primary':     (0.505, 0.095, 176.9), # deep jade
  'danger':      (0.520, 0.120, 27),    # matte brick
  'success':     (0.490, 0.090, 150),
  'warning':     (0.760, 0.100, 72),    # ochre fill (dark text on it)
  'info':        (0.500, 0.075, 230),
  'emphasis':    (0.500, 0.090, 319),   # mauve ink
}
# Folder roles (2026-10-05): manila folder tabs holding a paper pane. Light is
# pixel-sampled from the Sheets mockup, except paper, which is ivory, not white.
# Dark reuses the matching neutral, so the dark look is unchanged.
DARK.update({
  'folder':      DARK['surface'],         # folder strip, inactive tabs, frame around the pane
  'paper':       DARK['surface-2'],       # active tab + pane
  'folder-edge': DARK['border'],          # dividers between folder tabs
  'page':        DARK['bg'],              # ground the folder sits on
})
LIGHT.update({
  'folder':      (0.9387, 0.0120, 79.8),  # #efeae2
  'paper':       (0.9844, 0.0108, 95.2),  # #fcfaf2 ivory
  'folder-edge': (0.8998, 0.0098, 72.7),  # #e2ddd7
  'page':        (0.9665, 0.0067, 97.4),  # #f5f4ef
})
FOLDER = ['folder', 'paper', 'folder-edge', 'page']
MUTED_HUE = {'dark': 157.8, 'light': 110}
INTENTS = ['primary','danger','success','warning','info','emphasis']

def resolve():
    out = {}
    for name, spec, dark in (('dark', DARK, True), ('light', LIGHT, False)):
        t = dict(spec)
        hx = lambda k: hexof(t[k])
        # muted text: 4.5:1 on the worst ground it lands on (surface-2 dark / bg-sunken light)
        worst = 'surface-2' if dark else 'surface-3'
        mh = MUTED_HUE[name]
        t['fg-muted'] = (fit_L(0.030, mh, hx(worst), 4.6, dark), 0.030, mh)
        # control boundary 3:1 vs field AND surface
        g = [hx('field'), hx('surface'), hx('bg')]
        L = None
        for cand in [i/400 for i in range(400)] if dark else [1-i/400 for i in range(400)]:
            h = hexof((cand, 0.022, N))
            if all(wcag(h, x) >= 3.05 for x in g): L = cand; break
        t['border-strong'] = (round(L,3), 0.022, N)
        if dark:
            # brick lifted until it reads as text on panel (shadcn uses text-destructive for errors)
            t['danger'] = (fit_L(0.115, 27, hx('surface-2'), 4.6, True, 0.55, 0.9), 0.115, 27)
        res = {k: hexof(v) for k, v in t.items()}
        lch = dict(t)
        # ---- derived intent family
        for i in INTENTS:
            Lc, Cc, Hc = t[i]
            # on-fill text: dark ink on bright fills, paper on deep fills
            ink = res['bg'] if dark else res['fg-strong']
            paper = res['surface'] if not dark else res['fg-strong']
            res[f'{i}-fg'] = ink if wcag(ink, res[i]) >= wcag(paper, res[i]) else paper
            hov = (Lc + (0.045 if dark else -0.045), Cc, Hc)
            res[f'{i}-hover'] = hexof(hov); lch[f'{i}-hover'] = hov
            # soft tint: opaque blend toward surface in OKLab
            soft_amt = 0.16 if dark else 0.13
            sL, sC = mix_lc(t['surface'], t[i], soft_amt)
            soft = (sL, sC, Hc); res[f'{i}-soft'] = hexof(soft); lch[f'{i}-soft'] = soft
            # soft foreground: text-safe on soft, bg and surface
            grounds = [res[f'{i}-soft'], res['bg'], res['surface'], res['surface-2']]
            sf = None
            rng = [i2/400 for i2 in range(400)]
            for cand in (rng if dark else rng[::-1]):
                if (dark and cand < Lc - 0.0001) or (not dark and cand > Lc + 0.0001): continue
                h = hexof((cand, Cc, Hc))
                if all(wcag(h, gr) >= 4.6 for gr in grounds): sf = (round(cand,3), Cc, Hc); break
            res[f'{i}-soft-fg'] = hexof(sf); lch[f'{i}-soft-fg'] = sf
        res['focus'] = res['primary']; res['link'] = res['primary-soft-fg']
        res['selection'] = res['primary-soft']
        res['code-bg'] = res['bg-sunken']
        res['scrollbar'] = res['border-strong']
        out[name] = (res, lch)
    return out

def mix_lc(a, b, amt):
    # mix in OKLab, return L,C (hue taken from b)
    import math
    def lab(t): L,C,H=t; return L, C*math.cos(math.radians(H)), C*math.sin(math.radians(H))
    A, B = lab(a), lab(b)
    m = [A[k]*(1-amt)+B[k]*amt for k in range(3)]
    return m[0], math.hypot(m[1], m[2])
