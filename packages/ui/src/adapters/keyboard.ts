// KeyboardAdapter — abstract over window scope so InputBar works outside the
// extension (default impl binds to window via react-hotkeys-hook).

export interface KeyboardAdapter {
  /** Returns an unsubscribe function. */
  bindHotkey(combo: string, handler: (e: KeyboardEvent) => void): () => void;
}
