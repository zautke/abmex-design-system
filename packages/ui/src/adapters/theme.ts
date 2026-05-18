// ThemeTokenAdapter — abstract over the extension's color pipeline.

import type { Theme } from '../types/theme';

export interface ThemeTokenAdapter {
  getTheme(): Theme;
  setTheme(theme: Partial<Theme>): void;
  /** Returns an unsubscribe function. */
  subscribe(cb: (theme: Theme) => void): () => void;
}
