---
target: packages/ui/src (@abmex/ui chat kit)
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Volumes/FLOUNDER/dev/wxt-prompt/packages/ui/packages/ui/src"
timestamp: 2026-10-01T20-58-52Z
slug: packages-ui-src
---
# Design Critique — `@abmex/ui` v0.3.2 (packages/ui/src)

**Target:** `packages/ui/src` (the `@abmex/ui` presentation-only React chat kit)
**Mode:** Operate · **Method:** ⚠️ DEGRADED: single-context (no sub-agent tool available — nesting depth limit reached)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Splash/connection/streaming/token states all present; a 404 asset and the "Test" button give no feedback |
| 2 | Match System / Real World | 3 | Plain labels, but `ndjson`, `tool-call`, `Transport log`, raw `ECONNREFUSED` leak system-speak |
| 3 | User Control and Freedom | 2 | Escape closes drawer/modal; delete conversation and "Clear buffer" have no undo or confirm |
| 4 | Consistency and Standards | 2 | Spec-vs-code drift: `font-code` bypassed at 22 sites; ThemeEditorPanel uses literal colors/z-index/`fixed` overlay |
| 5 | Error Prevention | 3 | Disabled send, disabled-reason on models, JSON validation, empty-rename guard; destructive delete unguarded |
| 6 | Recognition Rather Than Recall | 3 | Selected model + disabled reason visible; TokenCounter/transport rely on bare icons and abbreviations |
| 7 | Flexibility and Efficiency | 3 | Strong keyboard story (roving tabs, readline keys, history, Esc); no bulk conversation actions |
| 8 | Aesthetic and Minimalist Design | 3 | Calm and flat, but raw JSON in the main surface and a dense 9px theme editor add noise |
| 9 | Error Recovery | 3 | Inline bubble error, ErrorBoundary retry, CopyCommandCallout; error ink itself is low-contrast |
| 10 | Help and Documentation | 2 | Placeholder teaches Enter/Shift+Enter; no in-UI help, no docs entry point |
| **Total** | | **27/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment.** The kit is genuinely authored, not category-default: the role-mirrored bubble with a single squared tail, a closed three-chroma palette, named rules (One Voice, Three-Chroma, Bridge-Only Reskin, Flat-By-Default), and an elevated-only-on-state philosophy. But at rest it reads as a competent generic light chat/admin shell — slate chrome, white cards, one teal button. By its own One Voice Rule the warm accent is absent from every static frame, so the brand is a hover state rather than a first impression. And the editorial type voice (Playfair Display) is a dead token: `--font-serif` is defined and referenced nowhere. The DESIGN.md claim "magazine typography applied to an app shell" is not delivered anywhere in the render. **Authored on interaction; category-interchangeable at rest.**

**Deterministic scan.** CLI static scan (`detect --json packages/ui/src`) exited 2 with **4 warnings + 1 advisory**, all in `ThemeEditorPanel.tsx` (4× `gray-on-color`, 1× `design-system-color` `#eee`). Runtime in-page detector overlay reported **72 findings across 16 rules**, dominated by `undersized-ui-text` (38) and `low-contrast` (14). The static pass caught literal-color drift; the runtime pass caught the systemic type/contrast problems static analysis cannot see. Both independently flag `ThemeEditorPanel.tsx` as the outlier.

**Visual overlays.** Injection succeeded: `detect.js` loaded and ran in the page, console printed `[impeccable] 72 anti-patterns found`, and labelled highlight overlays rendered (UNDERSIZED FUNCTIONAL TEXT, LOW CONTRAST TEXT, NESTED CARDS, FLAT TYPE HIERARCHY, PULSING STATUS DOT, DECORATIVE BLINKING CURSOR). Note: the harness's desktop-browser MCP was disconnected, so the overlay and screenshots were produced via a Playwright fallback against the installed Chrome, not the native browser path.

## Overall Impression

A rigorously documented system whose own spec is roughly half-implemented in the render. The engineering craft (a11y substrate, wiring honesty, error recovery) is high; the *visual* craft ships less than DESIGN.md promises. Biggest opportunity: make the type system and contrast contract real, because those two are what turn "clean light chat shell" into "EditorKit".

## What's Working

1. **The accessibility substrate is real, not claimed.** `ConversationListItem` is a genuine `<button>`; the overflow menu is a HeroUI Dropdown with roles, arrow keys, Escape and focus return; `ConversationsDrawer` adds Escape + `inert`; `ScrollableTabStrip` implements roving tabindex, end-scroll-instead-of-wrap, and wheel→horizontal. Unusually rigorous for an extracted kit.
2. **The wiring contract is honest.** Every removed dependency is a named prop with a `// WIRING:` comment. `ModelPicker` takes an already-flattened model list; `PromptComposer` swallows history keys when callbacks are absent; `TokenCounter` renders `n/a` rather than fabricating `0`. The reference consumer mounts the whole surface from `useState` with zero adapters.
3. **Error recovery is designed in.** `ChatBubble` dims the body and appends inline rose error text; `ErrorBoundary` ships retry; `CopyCommandCallout` turns a CORS failure into a copy-pasteable fix with a status tone and a docs link.

## Priority Issues

**[P1] The type identity is documented but unimplemented.**
- **What:** `--font-serif` (Playfair Display) is defined and used at zero call sites — the DESIGN.md "Display" tier (20–28px Playfair on empty-state titles and modal headings) has no instance. Separately, "The Mono Carries Data Rule" ("Victor Mono … via `--font-code` only") is bypassed at 22 call sites using generic Tailwind `font-mono`; only `CodeBlock.tsx` uses `--font-code`. Runtime detector confirms `flat-type-hierarchy: h1 14px, h2 14px, h3 14px, body 16px`.
- **Why it matters:** two of the kit's three type voices are dead. The "editorial" character that differentiates it is invisible, and a consumer reskinning by token cannot recover it.
- **Fix:** Route data surfaces through `font-code`; introduce the Display tier on empty-state titles / modal headings, or delete the tier from DESIGN.md if abandoned.
- **Suggested command:** `/impeccable typeset`

**[P1] 38 instances of sub-11px functional text.**
- **What:** 10px for transport-log timestamps/direction/channel/size, JSON inspector, model badge row, MCP status labels, secrets names, AppFooter; **9px** for ColorSystem axis labels (`HEX`, `RGB`, `255`) and theme-editor C/L/H readouts.
- **Why it matters:** these are the primary data voice on a 320px side panel; below the 11px floor they are unreadable and resist zoom.
- **Fix:** raise functional micro-text to ≥11px; move 9px color-math into the ColorSystem popover or drop it.
- **Suggested command:** `/impeccable typeset`

**[P1] 14 contrast failures, incl. body meta text at 2.5–2.6:1.**
- **What:** `#90a1b9` (slate-400) on white = 2.6:1 and on `#f8fafc` = 2.5:1 — used by `ChatEmptyState`, `TokenCounter` n/a, meta labels, footer (need 4.5:1). `#ff6e27` (Tic Tac orange) on white = 2.8:1 — the active Settings tab label and icon-btn hover text.
- **Why it matters:** WCAG AA failure on the most common readouts; the orange active-tab label is the primary "where am I" signal.
- **Fix:** darken meta text to slate-500/600 where it is text; reserve slate-400 for non-text decoration. Pair the orange active-tab underline with a slate-700 label.
- **Suggested command:** `/impeccable colorize`

**[P2] ThemeEditorPanel escapes the kit's own design system.**
- **What:** literal `bg-teal-50` / `hover:bg-rose-50` / `#eee`, `shadow-lg`, `z-[100]`/`z-[200]`, `fixed inset-0` overlay with its own backdrop blur, hand-rolled overlays, and `font-sans` — instead of tokens, the `icon-btn-32` utility, and the kit's overlay conventions. Detector: 4× `gray-on-color` + 1× undocumented `#eee`.
- **Why it matters:** it is the one surface that looks like a different product, and a consumer reskin will not reach its colors. It violates DESIGN.md's "Don't hardcode hex values" and "Single Lifted Layer Rule".
- **Fix:** tokenize its colors, adopt the kit's overlay/HeroUI Modal, convert `#eee` to a token.
- **Suggested command:** `/impeccable distill`

**[P2] Destructive delete has no confirmation or undo.**
- **What:** the conversation dropdown's `delete` fires `onDelete` immediately; "Clear buffer" likewise.
- **Why it matters:** a mis-click in a narrow drawer permanently loses a conversation.
- **Fix:** confirm step or undo affordance in the dropdown (the kit already models empty-title-as-cancel).
- **Suggested command:** `/impeccable harden`

**[P3] Decorative glows and nested cards (runtime).**
- **What:** `radial-halo`, `dark-glow`, `repeating-stripes-gradient`, `ai-color-palette` cyan ×7 (splash orbs, header aurora, dark code block); `nested-cards` ×4 (transport-log entry card inside the panel card; error bubble inside a bordered container).
- **Why it matters:** the glows/aurora are explicitly committed to in DESIGN.md, so they are **false positives against the brief** — but the teal-on-dark code palette does read as conventional "AI app" cyan. The nested cards contradict "depth is tonal, borders carry the separation".
- **Fix:** conscious decision on the code palette; flatten nested cards to dividers.
- **Suggested command:** `/impeccable quieter`

## Persona Red Flags

**Alex (Power User).** Enter sends, Tab strips indent, ↑/↓ recall history — good. But: 10 settings tabs are arrow-walked one at a time, no ⌘K / jump; no bulk conversation actions (multi-select delete); no shortcut to focus the composer; the theme editor's color pickers are pointer-driven with no keyboard path to open the popover.

**Sam (Accessibility).** Body meta text (slate-400) fails AA at 2.6:1; the orange active-tab label fails at 2.8:1; 9–10px functional text is unreadable under zoom; `StreamingCursor` is `aria-hidden` with no live-region announcement that a response is streaming; the 32×32 icon buttons meet 32px, below the 44px touch target.

**Jordan (First-Timer).** `ChatEmptyState` says "Ask anything to start a conversation" but offers no example prompts or clickable affordances. The transport log opens with `ndjson`, `tool-call`, and raw `ECONNREFUSED` — jargon-first. The disabled model *does* surface its reason inline (good), and the composer placeholder teaches the key binding (good).

## Minor Observations

- Console warning: "A PressResponder was rendered without a pressable child" (React Aria) — a real bug from a HeroUI Button with non-element children.
- `ConnectionIndicator` renders "Connecting…" with a pulsing amber dot even when `connectedCount > 0`, so it can contradict the header's green "Ollama · 2 models".
- Two representations of "no data" coexist: `TokenCounter`'s uppercase "Tokens n/a" and the icon row "↑ n/a ↓ n/a ◇ n/a".
- `SplashLoader` dropped into a short container renders as a washed-out box with a faint ring — it reads as broken outside full-viewport use.
- `AppFooter` version renders 10px mono at slate-400 (fails the contrast finding).
- `layout-transition (transition: height)` and `marquee (skeleton)` runtime findings attribute to the HeroUI peer stylesheet, not the kit.

## Questions to Consider

- If the brand is Tic Tac orange, why is it invisible until hover? What would a confident version look like where the accent greets the user once, deliberately?
- The serif tier is specified but dead — is Playfair still the plan, or should DESIGN.md shed the claim?
- Should the transport log and JSON inspector be first-class chrome in a *chat* product, or a debug affordance that is off by default?
- 9px color-math on a 320px panel: is the ColorSystem's OKLCH readout for the user or for the implementer?
