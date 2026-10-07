// @vitest-environment jsdom
//
// The markdown-rendering assertions from ChatPane.test.tsx. They were never
// really about the pane — they assert that MarkdownRenderer routes fenced code
// through the highlighting CodeBlock and inline code through the plain inline
// path. That component is now in the kit, so they point straight at it.
//
// The real MarkdownRenderer renders in jsdom: its react-syntax-highlighter
// dependency loads fine under vitest 4 ESM.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { MarkdownRenderer } from '@abmex/ui';

afterEach(() => cleanup());

// The copy affordance is the kit's CopyButton primitive, whose accessible name is
// "Copy". (ChatPane rendered the kit's OTHER, top-level MarkdownRenderer, where the
// button was labelled "Copy code" — hence the changed query. Same assertion: the
// fenced path has a copy affordance, the inline path does not.)
const COPY_LABEL = 'Copy';

describe('MarkdownRenderer', () => {
  it('syntax-highlights a fenced code block (react-syntax-highlighter path)', () => {
    const { container } = render(
      <MarkdownRenderer content={'Here:\n\n```ts\nconst x: number = 41 + 1;\n```\n'} />,
    );
    const body = container.querySelector('.markdown-body')!;

    // CodeBlock chrome: the language label + Copy button only render for the
    // fenced (block) path, never for inline code.
    expect(body.textContent).toContain('ts');
    expect(screen.getByRole('button', { name: COPY_LABEL })).toBeTruthy();
    // react-syntax-highlighter (PreTag="div") emits a <code> tokenized into
    // many <span>s — proof the highlighter actually ran.
    const code = body.querySelector('code');
    expect(code).not.toBeNull();
    expect(code!.querySelectorAll('span').length).toBeGreaterThan(1);
    expect(code!.textContent).toContain('const x');
  });

  it('renders an inline code span via the inline path (not the highlighter)', () => {
    const { container } = render(<MarkdownRenderer content={'Call `useId()` at the top.'} />);
    const body = container.querySelector('.markdown-body')!;

    const code = body.querySelector('code');
    expect(code).not.toBeNull();
    // Inline path: tagged with the inline-code class, NOT the CodeBlock chrome.
    expect(code!.className).toContain('bg-md-code-inline-bg');
    // No CodeBlock Copy button — that only renders on the fenced/block path.
    expect(screen.queryByRole('button', { name: COPY_LABEL })).toBeNull();
    // No syntax-highlighter token spans — tokenization is the block signal.
    expect(code!.querySelectorAll('span').length).toBe(0);
    expect(code!.textContent).toContain('useId()');
  });
});
