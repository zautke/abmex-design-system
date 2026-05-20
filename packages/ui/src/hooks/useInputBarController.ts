// Headless InputBar state. Owns value, prompt history (localStorage-backed),
// and history-navigation state. View consumes the result + composes its own
// textarea / keyboard handlers (useReadlineKeys + InputBarKeyboardHandler
// stay element-coupled and run alongside this controller).

import { useCallback, useEffect, useState } from 'react';

const PROMPT_HISTORY_STORAGE_KEY = 'inputbar.promptHistory.v1';
const MAX_PROMPT_HISTORY_ITEMS = 200;

function readPromptHistoryFromStorage(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
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
}

export interface UseInputBarControllerResult {
  inputValue: string;
  setInputValue: (next: string) => void;
  promptHistory: readonly string[];
  /** -1 = not navigating; 0..len-1 = current history entry shown. */
  navigationIndex: number | null;
  submit: () => void;
  navigateHistoryUp: () => void;
  navigateHistoryDown: () => void;
  cancelHistoryNavigation: () => void;
  /** Reset input on any keystroke that's not a navigation result. */
  notifyManualEdit: () => void;
  /** Adaptive placeholder text matching the current shiftEnterToSend mode. */
  placeholder: string;
  shiftEnterToSend: boolean;
}

export function useInputBarController(
  input: UseInputBarControllerInput,
): UseInputBarControllerResult {
  const {
    onSend,
    shiftEnterToSend = false,
    promptHistoryStorageKey = PROMPT_HISTORY_STORAGE_KEY,
  } = input;

  const [inputValue, setInputValue] = useState('');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [navigationIndex, setNavigationIndex] = useState<number | null>(null);
  const [navigationDraft, setNavigationDraft] = useState('');

  useEffect(() => {
    setPromptHistory(readPromptHistoryFromStorage(promptHistoryStorageKey));
    // Reset navigation state — the prior index/draft point at a different
    // history array now and would address wrong entries.
    setNavigationIndex(null);
    setNavigationDraft('');
  }, [promptHistoryStorageKey]);

  const submit = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;
    onSend(text);
    setInputValue('');
    setNavigationIndex(null);
    setNavigationDraft('');
    setPromptHistory((prev) => {
      if (prev.includes(text)) return prev;
      const next = [...prev, text].slice(-MAX_PROMPT_HISTORY_ITEMS);
      writePromptHistoryToStorage(promptHistoryStorageKey, next);
      return next;
    });
  }, [inputValue, onSend, promptHistoryStorageKey]);

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
  };
}
