# @merlyn/ui

Reusable React UI components extracted from [Merlyn](../../README.md) — a multi-browser WXT MV3 extension that ships a sidepanel chat UI over multiple LLM providers.

## Install

```bash
pnpm add @merlyn/ui
# Required peer dependencies:
pnpm add react react-dom tailwindcss lucide-react
```

## Use

```tsx
import {
  MerlynUIProvider,
  ChatPane,
  InputBar,
  MarkdownRenderer,
  ColorSystem,
  ButtonGroup,
} from '@merlyn/ui';
import '@merlyn/ui/styles.css';
```

Wrap your app once with `<MerlynUIProvider value={adapters}>` and pass the adapter bag. Required adapters: `persistence`, `providers`, `tools`. Optional (graceful degradation): `mcp`, `webContext`, `keyboard`, `theme`, `transportDebug`. See `examples/consumer/src/App.tsx` for in-memory mock adapters that exercise the full surface.

## Module format

**ESM-only.** Package ships as `"type": "module"` with `formats: ['es']`. Targets Node ≥ 18 and modern bundlers (Vite ≥ 5, Webpack 5 + native ESM, Rolldown, esbuild). CommonJS consumers (Jest sans `--experimental-vm-modules`, Next.js `pages/api`, classic Node `require`) will hit `ERR_REQUIRE_ESM`.

## Tailwind v4

Tokens ship as CSS source inside the package — `dist/styles.css` contains the entire `@theme` block + bespoke component CSS. Consumers import the file once and Tailwind v4's `@source` directive picks up the package's compiled utility usage:

```css
@import '@merlyn/ui/styles.css';
@source '../src';
```

Tokens are CSS custom properties (`--color-tictac-orange`, `--color-chat-bubble-user-bg`, etc.) so consumers can override individual variables without forking the package.

## Stack

React 19.2 · Tailwind v4 · TypeScript 5.9 (strict + `noUncheckedIndexedAccess` + `verbatimModuleSyntax`) · Vite 7 library mode · `vite-plugin-dts`.

## Peer dependencies

| Peer | Range |
|---|---|
| `react` | `^19.2.0` |
| `react-dom` | `^19.2.0` |
| `tailwindcss` | `^4.2.0` |
| `lucide-react` | `^0.575.0` |
