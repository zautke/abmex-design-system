---
target: packages/ui/src (@abmex/ui chat kit)
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Volumes/FLOUNDER/dev/wxt-prompt/packages/ui/packages/ui/src"
timestamp: 2026-10-01T21-08-47Z
slug: packages-ui-src
---
# Design Critique — `@abmex/ui` (packages/ui/src)

**Target:** `packages/ui/src` — the `@abmex/ui` presentation-only React chat kit (HeroUI v3 · Tailwind v4 · React 19), extracted from the Merlyn WXT extension.
**Mode:** Operate
**Method:** ⚠️ DEGRADED: single-context (subagents unavailable — this session is itself a nested subagent, so the subagent depth limit blocks any further nesting).

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Splash/connection/streaming/token states exist; a 404 asset in the preview surface and the "Test" probe give weak feedback; `ConnectionIndicator` can show "Connecting…" while the header shows green. |
| 2 | Match System / Real World | 3 | Plain labels, but `ndjson`, `tool-call`, `Transport log`, raw `ECONNREFUSED` leak system-speak into the rendered surface. |
| 3 | User Control and Freedom | 2 | Escape closes drawer/modal; conversation delete and "Clear buffer" fire immediately with no undo or confirm. |
| 4 | Consistency and Standards | 2 | Spec-vs-code drift: `--font-code` bypassed at 24 sites (vs 1 correct); `ThemeEditorPanel` uses literal colors, `z-[100]/z-[200]`, `fixed inset-0`, `shadow-lg`. |
| 5 | Error Prevention | 3 | Disabled send, disabled-reason on models, JSON validation, empty-rename guard; destructive delete unguarded. |
| 6 | Recognition Rather Than Recall | 3 | Selected model + disabled reason are visible; `TokenCounter`/transport readouts rely on bare icons and abbreviations. |
| 7 | Flexibility and Efficiency | 3 | Strong keyboard story (roving tabs, readline keys, history, Esc); no bulk conversation actions. |
| 8 | Aesthetic and Minimalist Design | 3 | Calm and flat, but raw JSON sits in the main surface and the 9px theme editor is dense enough to read as noise. |
| 9 | Error Recovery | 3 | Inline bubble error, `ErrorBoundary` retry, `CopyCommandCallout` turn failures into a fix; error ink itself is low-contrast. |
| 10 | Help and Documentation | 2 | Placeholder teaches Enter/Shift+Enter; no in-UI help and no docs entry point. |
| **Total** | | **27/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment.** The kit is genuinely authored in its *spec*: named rules (One Voice, Three-Chroma, Bridge-Only Reskin, Flat-By-Default, Single Lifted Layer), a role-mirrored bubble with one squared tail, a closed three-chroma palette, and token discipline across ~141 `--color-*` variables. But at rest it renders as a competent generic light chat/admin shell — slate chrome, white cards, one teal button. Two of its three declared type voices are **dead in the render**: `--font-serif` (Playfair Display) is defined once in `tailwind.css` and used at **0 call sites**, so the "Display" tier (20–28px Playfair on empty-state titles / modal headings) has no instance; and the "Mono Carries Data Rule" ("via `--font-code` only") is bypassed at **24** sites using generic Tailwind `font-mono`, with only `CodeBlock.tsx` using `--font-code`. By its own One Voice Rule the warm Tic Tac orange accent appears only on hover/active, so the brand is a *hover state* rather than a first impression. **Authored on interaction; category-interchangeable at rest.**

**Deterministic scan.** Static CLI scan (`detect --json packages/ui/src`) exited **2** with **4 warnings + 1 advisory**, all in `ThemeEditorPanel.tsx` (4× `gray-on-color`, 1× advisory `design-system-color` for literal `#eee`). The runtime in-page detector (injected on the review page + 6 representative previews) reported **85 findings** across 10 rules, dominated by `undersized-ui-text` (~29 sites: 8× 9px, 21× 10px) and `low-contrast` (2.5–2.6:1 on slate-400 meta text). Per-preview: `TransportLogPanel` 31, `ThemeEditorPanel` 38, `ChatBubble` 8, `ToolsPanel` 7, `TokenCounter` 1, `AppFooter` 0. Both passes independently flag `ThemeEditorPanel.tsx` as the outlier.

**Visual overlays.** Injection succeeded. `document.title` + a `<script>` mutation preflight passed (`window.__imp_preflight === 1`, 59 iframes), `detect.js` loaded from the live server and rendered labelled overlay badges (LOW CONTRAST TEXT, TINY BODY TEXT, NESTED CARDS, UNDERSIZED FUNCTIONAL TEXT). Screenshots of the review page and `ThemeEditorPanel` confirm the flagged density. Overlays were produced via the chrome-devtools MCP. Both local servers (review + live-server) were stopped before reporting.

## Overall Impression

A rigorously documented system whose own spec is roughly half-implemented in the render. The engineering craft (a11y substrate, wiring honesty, error recovery) is high; the *visual* craft ships less than DESIGN.md promises. Biggest opportunity: make the type system and the contrast contract real — those two are what turn "clean light chat shell" into "EditorKit".

## What's Working

1. **The accessibility substrate is real, not claimed.** `ConversationListItem` is a genuine `<button>`; the overflow menu is a HeroUI Dropdown with roles, arrow keys, Escape and focus return; `ConversationsDrawer` adds Escape + `inert`; `ScrollableTabStrip` implements roving tabindex and wheel→horizontal. Unusually rigorous for an extracted kit.
2. **The wiring contract is honest.** Every removed dependency is a named prop with a `// WIRING:` comment. `PromptComposer` swallows history keys when callbacks are absent; `TokenCounter` renders `n/a` rather than fabricating `0` (`undefined` ≠ `0`). The reference consumer mounts the whole surface from `useState` with zero adapters.
3. **Error recovery is designed in.** `ChatBubble` dims the body and appends inline rose error text; `ErrorBoundary` ships retry; `CopyCommandCallout` turns a CORS failure into a copy-pasteable fix with a status tone and a docs link.

## Priority Issues

**[P1] The type identity is documented but unimplemented.**
- **What:** `--font-serif` (Playfair Display) is defined and used at **0** call sites — the DESIGN.md Display tier has no instance. Separately, the Mono-Carries-Data rule is bypassed at **24** call sites using generic `font-mono`; only `CodeBlock.tsx` uses `font-code`. Runtime detector confirms `flat-type-hierarchy` (e.g. ChatBubble "h4 12px, h3 14px, body 16px").
- **Why it matters:** two of the kit's three type voices are invisible. The "editorial" character that differentiates the kit cannot be reached, and a consumer reskinning by token cannot recover it.
- **Fix:** route data surfaces through `font-code`; introduce the Display tier on empty-state titles / modal headings, or delete the tier from DESIGN.md if abandoned.
- **Suggested command:** `/impeccable typeset`

**[P1] Sub-11px functional text at 29 sites.**
- **What:** 10px for transport-log timestamps/direction/channel/size (`TransportLogPanel`), JSON inspector, model badge row, MCP status labels, secrets names; **9px** for ColorSystem axis labels and theme-editor readouts (`ThemeEditorPanel`). Runtime `undersized-ui-text` is the single most frequent finding.
- **Why it matters:** this is the primary *data* voice on a 320px side panel; below the 11px floor it is unreadable and resists zoom.
- **Fix:** raise functional micro-text to ≥11px; move 9px color-math into the ColorSystem popover or drop it.
- **Suggested command:** `/impeccable typeset`

**[P1] Contrast failures — meta text at 2.5–2.6:1.**
- **What:** `#90a1b9` (slate-400), used **23×**, measures 2.6:1 on white and 2.5:1 on `#f8fafc` — `ChatEmptyState`, `TokenCounter` "Tokens n/a", meta labels, footer (need 4.5:1). The orange active-tab label/icon measures 2.8:1.
- **Why it matters:** WCAG AA failure on the most common readouts; the orange active-tab label is the primary "where am I" signal.
- **Fix:** darken meta text to slate-500/600 where it is text; reserve slate-400 for non-text decoration. Pair the orange active-tab underline with a slate-700 label.
- **Suggested command:** `/impeccable colorize`

**[P2] ThemeEditorPanel escapes the kit's own design system.**
- **What:** literal `bg-teal-50` / `hover:bg-rose-50` / `#eee`, `shadow-lg`, `z-[100]`/`z-[200]`, a `fixed inset-0` overlay with its own backdrop blur, and `font-sans` — instead of tokens, the `icon-btn-32` utility, and the kit's overlay conventions. Detector: 4× `gray-on-color` + 1× undocumented `#eee`, plus runtime `nested-cards` ×11.
- **Why it matters:** it is the one surface that looks like a different product, and a consumer reskin will not reach its colors. It violates DESIGN.md's "Don't hardcode hex values" and "Single Lifted Layer Rule".
- **Fix:** tokenize its colors, adopt the kit's overlay/HeroUI Modal, convert `#eee` to a token, flatten nested cards.
- **Suggested command:** `/impeccable distill`

**[P2] Destructive delete has no confirmation or undo.**
- **What:** `ConversationListItem`'s dropdown `delete` fires `onDelete(conversation.id)` immediately (line 118); "Clear buffer" likewise.
- **Why it matters:** a mis-click in a narrow drawer permanently loses a conversation.
- **Fix:** confirm step or undo affordance in the dropdown (the kit already models empty-title-as-cancel).
- **Suggested command:** `/impeccable harden`

**[P3] Decorative glows, blinking cursor and nested cards (runtime).**
- **What:** runtime `pulsing-dot`, `blinking-cursor`, `ai-color-palette` cyan ×5 (splash orbs, header aurora, dark code block), `nested-cards` (transport-log entry card inside the panel card; error bubble inside a bordered container).
- **Why it matters:** the pulses and aurora are explicitly committed to in DESIGN.md, so they are **false positives against the brief** — but the teal-on-dark code palette does read as conventional "AI app" cyan. The nested cards contradict "depth is tonal, borders carry the separation".
- **Fix:** make a conscious decision on the code palette; flatten nested cards to dividers.
- **Suggested command:** `/impeccable quieter`

## Persona Red Flags

**Alex (Power User).** Enter sends, Tab strips indent, ↑/↓ recall history — good. But: 10 settings tabs are arrow-walked one at a time with no ⌘K / jump; no bulk conversation actions (multi-select delete); no shortcut to focus the composer; the theme editor's color pickers are pointer-driven with no keyboard path to open the popover.

**Sam (Accessibility).** Body meta text (slate-400, 23×) fails AA at 2.5–2.6:1; the orange active-tab label fails at 2.8:1; 9–10px functional text is unreadable under zoom; `StreamingCursor` is `aria-hidden` with no live-region announcement that a response is streaming; the 32×32 icon buttons meet 32px, below the 44px touch target.

**Jordan (First-Timer).** `ChatEmptyState` defaults to "Send a message to start chatting." and offers no example prompts or clickable affordances. The transport log opens with `ndjson`, `tool-call`, and raw `ECONNREFUSED` — jargon-first. The disabled model *does* surface its reason inline (good), and the composer placeholder teaches the key binding (good).

## Minor Observations

- The `AppFooter` preview is **clean** at runtime (0 findings) — a data point that contradicts a prior-run claim that its version label fails contrast; the label's contrast depends on the host surface it sits on.
- `ConnectionIndicator` can render "Connecting…" with a pulsing amber dot while the header shows a green "Ollama · 3 models" — two live status signals that disagree.
- Two representations of "no data" coexist: `TokenCounter`'s uppercase "Tokens n/a" (slate-400 11px, fails contrast) and the icon row "↑ n/a ↓ n/a ◇ n/a".
- Two form-field a11y issues surface at runtime: 7 settings/theme fields and 14 review-page fields lack `id`/`name`.
- `SplashLoader` dropped into a short container renders as a washed-out box with a faint ring — it reads as broken outside full-viewport use.
- `layout-transition (transition: margin)` and the `marquee`/skeleton finding attribute to the HeroUI peer stylesheet, not the kit.
- ThemeEditorPanel's "Reset All" button is flagged low-contrast (slate text on a near-white control).

## Questions to Consider

- If the brand is Tic Tac orange, why is it invisible until hover? What would a confident version look like where the accent greets the user once, deliberately?
- The serif tier is specified but dead — is Playfair still the plan, or should DESIGN.md shed the claim?
- Should the transport log and JSON inspector be first-class chrome in a *chat* product, or a debug affordance that is off by default?
- 9px color-math on a 320px panel: is the ColorSystem's OKLCH readout for the user or for the implementer?
