import type { CSSProperties } from 'react';

const c = (color: string, extra: CSSProperties = {}): CSSProperties => ({ color, ...extra });

const base: CSSProperties = {
  color: 'var(--fg)',
  background: 'transparent',
  fontFamily: 'var(--font-mono)',
  textAlign: 'left',
  whiteSpace: 'pre',
  wordSpacing: 'normal',
  wordBreak: 'normal',
  lineHeight: '1.5',
  tabSize: 4,
  hyphens: 'none',
};

/**
 * react-syntax-highlighter Prism style where every colour is a `--*` token,
 * so code follows the Phosphor theme (dark/light) instead of a fixed palette.
 * Same shape as `prism/vsc-dark-plus`; the container supplies the surface.
 */
export const phosphorPrism: { [key: string]: CSSProperties } = {
  'code[class*="language-"]': base,
  'pre[class*="language-"]': { ...base, margin: 0, overflow: 'auto' },
  comment: c('var(--emphasis)', { fontStyle: 'italic' }),
  prolog: c('var(--emphasis)', { fontStyle: 'italic' }),
  doctype: c('var(--emphasis)', { fontStyle: 'italic' }),
  cdata: c('var(--emphasis)', { fontStyle: 'italic' }),
  punctuation: c('var(--fg-muted)'),
  operator: c('var(--fg-muted)'),
  entity: c('var(--fg-muted)'),
  url: c('var(--link)'),
  keyword: c('var(--primary)'),
  atrule: c('var(--primary)'),
  selector: c('var(--primary)'),
  important: c('var(--primary)', { fontWeight: 'bold' }),
  string: c('var(--warning)'),
  char: c('var(--warning)'),
  'attr-value': c('var(--warning)'),
  regex: c('var(--warning)'),
  number: c('var(--info)'),
  boolean: c('var(--info)'),
  constant: c('var(--info)'),
  symbol: c('var(--info)'),
  builtin: c('var(--info)'),
  variable: c('var(--fg)'),
  property: c('var(--fg)'),
  function: c('var(--success)'),
  'class-name': c('var(--success)'),
  tag: c('var(--primary-soft-fg)'),
  'attr-name': c('var(--primary-soft-fg)'),
  deleted: c('var(--danger-soft-fg)'),
  inserted: c('var(--success-soft-fg)'),
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
};
