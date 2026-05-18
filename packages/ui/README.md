# @merlyn/ui

Reusable React UI components extracted from [Merlyn](../../README.md) — a multi-browser WXT MV3 extension that ships a sidepanel chat UI over multiple LLM providers.

## Status

`v0.1.0` scaffold. Components land in later slices (S1–S8 of the extraction plan). External consumers will be able to:

```bash
pnpm add @merlyn/ui
```

```tsx
import { MerlynUIProvider, ChatPane, InputBar, MarkdownRenderer } from '@merlyn/ui';
import '@merlyn/ui/styles.css';
```

## Stack

React 19.2, Tailwind v4 (CSS-as-source), TypeScript 5.9, Vite 8 library mode + `vite-plugin-dts`.

## Peer dependencies

`react`, `react-dom`, `tailwindcss`, `lucide-react`.
