// Headless InputBar state. Owns value, prompt history (localStorage-backed),
// and history-navigation state. View consumes the result + composes its own
// textarea / keyboard handlers (useReadlineKeys + InputBarKeyboardHandler
// stay element-coupled and run alongside this controller).

import { useCallback, useEffect, useRef, useState } from 'react';

const PROMPT_HISTORY_STORAGE_KEY = 'inputbar.promptHistory.v1';
const MAX_PROMPT_HISTORY_ITEMS = 200;

function parsePromptHistory(raw: string | null): string[] {
  try {
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const filtered = parsed.filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );
    // Cap on read — bounds memory if storage was hand-edited or grew from
    // a prior MAX_PROMPT_HISTORY_ITEMS limit.
    return filtered.slice(-MAX_PROMPT_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

function readPromptHistoryFromStorage(key: string): string[] {
  try {
    return parsePromptHistory(localStorage.getItem(key));
  } catch {
    return [];
  }
}

/**
 * Merges a proposed serialized history into the current serialized one:
 * current entries first, then the proposal's entries that are missing, capped
 * to the most recent MAX_PROMPT_HISTORY_ITEMS. A persistence layer that
 * re-reads the stored value under a lock uses this so a panel holding a stale
 * array never drops another panel's entries.
 */
export function mergePromptHistory(current: string | null, proposed: string): string {
  const merged = parsePromptHistory(current);
  for (const entry of parsePromptHistory(proposed)) if (!merged.includes(entry)) merged.push(entry);
  return JSON.stringify(merged.slice(-MAX_PROMPT_HISTORY_ITEMS));
}

function writePromptHistoryToStorage(key: string, history: string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(history));
  } catch {
    // Non-fatal: keep in-memory behavior if storage is unavailable.
  }
}

export interface UseInputBarControllerInput {
  onSend: (text: string) => void;
  /** When true: ⇧⏎ sends, bare ⏎ inserts newline. Default false. */
  shiftEnterToSend?: boolean;
  /**
   * Override the localStorage key under which prompt history is persisted.
   * Lets consumers namespace history per-conversation or per-route. Default
   * is `inputbar.promptHistory.v1`.
   */
  promptHistoryStorageKey?: string;
  /**
   * Durable persistence of the prompt history. The callback MUST write the
   * value it resolves with to localStorage itself before resolving.
   *
   * When given, it OWNS the write: the controller awaits it before touching
   * in-memory history, passes the
   * proposed serialized history, and adopts the value it resolves with (the
   * committed value, which may hold entries merged in from elsewhere) as its
   * state. The callback must have written that value to localStorage before
   * resolving — the controller does not write storage itself in this mode, so
   * a late write can never clobber a newer value persisted by another panel.
   * Rejection leaves history and storage unchanged, sets `historyNotSaved`,
   * and the unsaved entries are retried with the next submit.
   *
   * Omitted: the controller writes localStorage itself, synchronously.
   */
  onStoragePersist?: (key: string, serialized: string) => Promise<string>;
  /**
   * Default true. While false, submit still sends but records nothing in
   * history and calls no persistence (e.g. while a restore is pending); the
   * texts are kept in memory and recorded (persisted) as soon as it turns
   * true again.
   */
  historyEnabled?: boolean;
}

export interface UseInputBarControllerResult {
  inputValue: string;
  setInputValue: (next: string) => void;
  promptHistory: readonly string[];
  /** -1 = not navigating; 0..len-1 = current history entry shown. */
  navigationIndex: number | null;
  /**
   * Trim, send, clear, record history. `allowEmpty` lets an image-only send
   * through with '' text (nothing is recorded in prompt history for it).
   * Also accepts the composer's `(text: string)` callback shape so
   * `onSend={composer.submit}` keeps type-checking; the string is ignored —
   * the controller always sends its own trimmed `inputValue`.
   */
  submit: (opts?: { allowEmpty?: boolean } | string) => void;
  navigateHistoryUp: () => void;
  navigateHistoryDown: () => void;
  cancelHistoryNavigation: () => void;
  /** Reset input on any keystroke that's not a navigation result. */
  notifyManualEdit: () => void;
  /** Adaptive placeholder text matching the current shiftEnterToSend mode. */
  placeholder: string;
  shiftEnterToSend: boolean;
  /** True after `onStoragePersist` rejected, until a later persist succeeds. */
  historyNotSaved: boolean;
  /** Re-read history from storage (e.g. after a restore wrote it post-mount). */
  reloadHistoryFromStorage: () => void;
}

export function useInputBarController(
  input: UseInputBarControllerInput,
): UseInputBarControllerResult {
  const {
    onSend,
    shiftEnterToSend = false,
    promptHistoryStorageKey = PROMPT_HISTORY_STORAGE_KEY,
    onStoragePersist,
    historyEnabled = true,
  } = input;

  const [inputValue, setInputValue] = useState('');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [navigationIndex, setNavigationIndex] = useState<number | null>(null);
  const [navigationDraft, setNavigationDraft] = useState('');
  const [historyNotSaved, setHistoryNotSaved] = useState(false);
  // Entries not yet recorded (persist rejected, or history disabled): retried with the next submit.
  const unsavedRef = useRef<string[]>([]);

  const reloadHistoryFromStorage = useCallback(() => {
    setPromptHistory(readPromptHistoryFromStorage(promptHistoryStorageKey));
    // Reset navigation state — the prior index/draft point at a different
    // history array now and would address wrong entries.
    setNavigationIndex(null);
    setNavigationDraft('');
  }, [promptHistoryStorageKey]);

  useEffect(() => {
    reloadHistoryFromStorage();
  }, [reloadHistoryFromStorage]);

  /** Records the kept entries plus `extra` (persisting them when `onStoragePersist` is given). */
  const record = useCallback((extra: string[]) => {
    const pending = [...new Set([...unsavedRef.current, ...extra])];
    unsavedRef.current = [];
    if (pending.length === 0) return;
    if (!onStoragePersist) {
      setPromptHistory((prev) => {
        const add = pending.filter((t) => !prev.includes(t));
        if (add.length === 0) return prev;
        const next = [...prev, ...add].slice(-MAX_PROMPT_HISTORY_ITEMS);
        writePromptHistoryToStorage(promptHistoryStorageKey, next);
        return next;
      });
      return;
    }
    const entries = pending.filter((t) => !promptHistory.includes(t));
    if (entries.length === 0) return;
    const proposed = JSON.stringify([...promptHistory, ...entries].slice(-MAX_PROMPT_HISTORY_ITEMS));
    onStoragePersist(promptHistoryStorageKey, proposed).then(
      (committed) => {
        setPromptHistory(parsePromptHistory(committed));
        setHistoryNotSaved(false);
      },
      () => {
        unsavedRef.current = [...new Set([...unsavedRef.current, ...entries])];
        setHistoryNotSaved(true);
      },
    );
  }, [promptHistory, promptHistoryStorageKey, onStoragePersist]);

  // Texts kept while history was disabled are recorded as soon as it is enabled again, not only
  // with the next submit.
  useEffect(() => {
    // Fires on the enable transition only; `record` is this render's.
    if (historyEnabled && unsavedRef.current.length > 0) record([]);
  }, [historyEnabled]);

  const submit = useCallback((opts?: { allowEmpty?: boolean } | string) => {
    const allowEmpty = typeof opts === 'object' && opts !== null && opts.allowEmpty === true;
    const text = inputValue.trim();
    if (!text && !allowEmpty) return;
    onSend(text);
    setInputValue('');
    setNavigationIndex(null);
    setNavigationDraft('');
    if (!text) return;
    if (!historyEnabled) {
      if (!unsavedRef.current.includes(text)) unsavedRef.current = [...unsavedRef.current, text];
      return;
    }
    record([text]);
  }, [inputValue, onSend, historyEnabled, record]);

  const navigateHistoryUp = useCallback(() => {
    if (promptHistory.length === 0) return;
    if (navigationIndex === null) {
      // Capture the live input verbatim as the restore-draft. A previous
      // `!promptHistory.includes(inputValue)` guard dropped the draft when
      // the input happened to equal a history entry — navigating up then
      // back down then silently lost the user's text.
      setNavigationDraft(inputValue);
      const nextIndex = promptHistory.length - 1;
      setNavigationIndex(nextIndex);
      setInputValue(promptHistory[nextIndex] ?? '');
      return;
    }
    const nextIndex = Math.max(0, navigationIndex - 1);
    setNavigationIndex(nextIndex);
    setInputValue(promptHistory[nextIndex] ?? '');
  }, [inputValue, navigationIndex, promptHistory]);

  const navigateHistoryDown = useCallback(() => {
    if (navigationIndex === null) return;
    const lastIndex = promptHistory.length - 1;
    if (navigationIndex >= lastIndex) {
      setNavigationIndex(null);
      setInputValue(navigationDraft);
      return;
    }
    const nextIndex = navigationIndex + 1;
    setNavigationIndex(nextIndex);
    setInputValue(promptHistory[nextIndex] ?? '');
  }, [navigationIndex, navigationDraft, promptHistory]);

  const cancelHistoryNavigation = useCallback(() => {
    if (navigationIndex === null) return;
    setNavigationIndex(null);
    setInputValue(navigationDraft);
  }, [navigationIndex, navigationDraft]);

  const notifyManualEdit = useCallback(() => {
    if (navigationIndex !== null) {
      setNavigationIndex(null);
    }
  }, [navigationIndex]);

  const placeholder = shiftEnterToSend
    ? 'Ask anything… (⇧+⏎ to send)'
    : 'Ask anything… (⏎ to send, ⇧+⏎ for newline)';

  return {
    inputValue,
    setInputValue,
    promptHistory,
    navigationIndex,
    submit,
    navigateHistoryUp,
    navigateHistoryDown,
    cancelHistoryNavigation,
    notifyManualEdit,
    placeholder,
    shiftEnterToSend,
    historyNotSaved,
    reloadHistoryFromStorage,
  };
}
