// cn() — the clsx + tailwind-merge class combiner exported alongside
// MarkdownRenderer. Pure utility; verify both layers behave.

import { describe, expect, it } from 'vitest';
import { cn } from '@abmex/ui';

describe('cn', () => {
  it('joins plain class strings', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values (clsx layer)', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('applies conditional object syntax', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active');
  });

  it('flattens nested arrays', () => {
    expect(cn(['a', ['b', 'c']], 'd')).toBe('a b c d');
  });

  it('last-wins on conflicting Tailwind utilities (twMerge layer)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-sm text-slate-400', 'text-slate-700')).toBe(
      'text-sm text-slate-700',
    );
  });

  it('keeps non-conflicting Tailwind utilities', () => {
    expect(cn('px-2 py-1', 'mt-3')).toBe('px-2 py-1 mt-3');
  });

  it('returns an empty string for no input', () => {
    expect(cn()).toBe('');
  });
});
