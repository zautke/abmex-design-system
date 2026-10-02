# Surface Brief — @abmex/ui theme overhaul

- **Scope:** the entire kit surface (`packages/ui/src` + `packages/ui/src/styles/tailwind.css` + HeroUI bridge semantics). Visitor mode: Operate.
- **Audience / job:** developers embedding a chat UI; the kit must read as one deliberate dark terminal-phosphor system, not a light admin shell.
- **Direction:** user-pinned via reference screenshot (2026-10-01). Dark phosphor terminal: near-black green ground, sage body text, chartreuse primary, brick danger, hairline borders, mono data voice. **Replaces** "EditorKit" (light editorial) world wholesale — Tic Tac orange, white-paper language, Playfair serif, aurora/splash glows are all anti-reference now.
- **Direction contract:** THESIS: the kit is a live terminal surface — phosphor on glass, hairline grid, one hot accent. OWN-WORLD: ink-green blacks, sage text, chartreuse commit color, mauve emphasis italic, box-drawn hairlines. STORY: visitor sees a precise instrument, not a web app. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
- **Token naming mandate (user, 2026-10-01):** palette tokens are named by ROLE (`--ink`, `--accent`, `--sage`…), never by Tailwind color family (`slate-*`, `teal-*`). Component tokens (`--color-chat-bubble-user-bg`) keep their names but must resolve through role tokens.
- **Density:** tighten toward terminal rhythm (12px gutters → 8px where safe; row padding down one step).
- **Glows:** killed (aurora orbs, splash orbs, radial halos). Flat hairline chrome only.
- **Signature check:** ChatBubble tail + chartreuse user bubble must survive the transplant.
- **Unresolved:** exact hex values are Lane A's to finalize against AA on dark ground; sans-display face choice (Archivo vs reuse of Rethink at 800) rides Lane B.
