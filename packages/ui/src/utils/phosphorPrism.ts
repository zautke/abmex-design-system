import type { CSSProperties } from 'react';

const c = (color: string, extra: CSSProperties = {}): CSSProperties => ({ color, ...extra });

const base: CSSProperties = {
  color: 'var(--ph-fg)',
  background: 'transparent',
  fontFamily: 'var(--ph-font-mono)',
  textAlign: 'left',
  whiteSpace: 'pre',
  wordSpacing: 'normal',
  wordBreak: 'normal',
  lineHeight: '1.5',
  tabSize: 4,
  hyphens: 'none',
};

/**
 * react-syntax-highlighter Prism style where every colour is a `--ph-*` token,
 * so code follows the Phosphor theme (dark/light) instead of a fixed palette.
 * Same shape as `prism/vsc-dark-plus`; the container supplies the surface.
 */
export const phosphorPrism: { [key: string]: CSSProperties } = {
  'code[class*="language-"]': base,
  'pre[class*="language-"]': { ...base, margin: 0, overflow: 'auto' },
  comment: c('var(--ph-emphasis)', { fontStyle: 'italic' }),
  prolog: c('var(--ph-emphasis)', { fontStyle: 'italic' }),
  doctype: c('var(--ph-emphasis)', { fontStyle: 'italic' }),
  cdata: c('var(--ph-emphasis)', { fontStyle: 'italic' }),
  punctuation: c('var(--ph-fg-muted)'),
  operator: c('var(--ph-fg-muted)'),
  entity: c('var(--ph-fg-muted)'),
  url: c('var(--ph-link)'),
  keyword: c('var(--ph-primary)'),
  atrule: c('var(--ph-primary)'),
  selector: c('var(--ph-primary)'),
  important: c('var(--ph-primary)', { fontWeight: 'bold' }),
  string: c('var(--ph-warning)'),
  char: c('var(--ph-warning)'),
  'attr-value': c('var(--ph-warning)'),
  regex: c('var(--ph-warning)'),
  number: c('var(--ph-info)'),
  boolean: c('var(--ph-info)'),
  constant: c('var(--ph-info)'),
  symbol: c('var(--ph-info)'),
  builtin: c('var(--ph-info)'),
  variable: c('var(--ph-fg)'),
  property: c('var(--ph-fg)'),
  function: c('var(--ph-success)'),
  'class-name': c('var(--ph-success)'),
  tag: c('var(--ph-primary-soft-fg)'),
  'attr-name': c('var(--ph-primary-soft-fg)'),
  deleted: c('var(--ph-danger-soft-fg)'),
  inserted: c('var(--ph-success-soft-fg)'),
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
};
