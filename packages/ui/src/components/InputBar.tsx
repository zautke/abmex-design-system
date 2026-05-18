import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { useReadlineKeys } from '../hooks/useReadlineKeys';
import { InputBarKeyboardHandler } from './InputBarKeyboardHandler';

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  streaming: boolean;
  disabled: boolean;
  /**
   * When true: ⇧⏎ sends, bare ⏎ inserts newline. When false (default):
   * bare ⏎ sends, ⇧⏎ inserts newline. Consumer owns persistence of this flag.
   */
  shiftEnterToSend?: boolean;
}

const PROMPT_HISTORY_STORAGE_KEY = 'inputbar.promptHistory.v1';
const MAX_PROMPT_HISTORY_ITEMS = 200;

function readPromptHistoryFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(PROMPT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );
  } catch {
    return [];
  }
}

function writePromptHistoryToStorage(history: string[]): void {
  try {
    localStorage.setItem(PROMPT_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Non-fatal: keep in-memory behavior if storage is unavailable.
  }
}

export function InputBar({
  onSend,
  onStop,
  streaming,
  disabled,
  shiftEnterToSend = false,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const readlineOnKeyDown = useReadlineKeys(textareaRef, inputValue, setInputValue);
  const [navigationIndex, setNavigationIndex] = useState<number | null>(null);
  const [navigationDraft, setNavigationDraft] = useState('');

  useEffect(() => {
    setPromptHistory(readPromptHistoryFromStorage());
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [inputValue]);

  function submit(): void {
    const text = inputValue.trim();
    if (!text) return;
    onSend(text);
    setInputValue('');
    setNavigationIndex(null);
    setNavigationDraft('');

    setPromptHistory((prev) => {
      if (prev.includes(text)) return prev;
      const next = [...prev, text].slice(-MAX_PROMPT_HISTORY_ITEMS);
      writePromptHistoryToStorage(next);
      return next;
    });

    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function navigateHistoryUp(): void {
    if (promptHistory.length === 0) return;

    if (navigationIndex === null) {
      const shouldCaptureDraft =
        inputValue.length > 0 && !promptHistory.includes(inputValue);
      setNavigationDraft(shouldCaptureDraft ? inputValue : '');
      const nextIndex = promptHistory.length - 1;
      setNavigationIndex(nextIndex);
      setInputValue(promptHistory[nextIndex] ?? '');
      return;
    }

    const nextIndex = Math.max(0, navigationIndex - 1);
    setNavigationIndex(nextIndex);
    setInputValue(promptHistory[nextIndex] ?? '');
  }

  function navigateHistoryDown(): void {
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
  }

  function cancelHistoryNavigation(): void {
    if (navigationIndex === null) return;
    setNavigationIndex(null);
    setInputValue(navigationDraft);
  }

  function handleInputChange(e: ChangeEvent<HTMLTextAreaElement>): void {
    const nextValue = e.currentTarget.value;
    if (navigationIndex !== null) {
      setNavigationIndex(null);
    }
    setInputValue(nextValue);
  }

  const placeholder = shiftEnterToSend
    ? 'Ask anything… (⇧+⏎ to send)'
    : 'Ask anything… (⏎ to send, ⇧+⏎ for newline)';

  const sendDisabled = disabled || inputValue.trim().length === 0;

  return (
    <div className="border-t border-inputbar-border bg-inputbar-bg px-3 py-2">
      <div className="flex flex-col gap-1.5 rounded-xl border border-inputbar-input-border bg-inputbar-input-bg focus-within:border-inputbar-input-border-focus">
        <InputBarKeyboardHandler
          streaming={streaming}
          disabled={disabled}
          shiftEnterToSend={shiftEnterToSend}
          onSubmit={submit}
          onHistoryUp={navigateHistoryUp}
          onHistoryDown={navigateHistoryDown}
          onCancelHistoryNavigation={cancelHistoryNavigation}
        >
          {({ onKeyDown: existingOnKeyDown }) => (
            <textarea
              ref={textareaRef}
              className="inputbar-textarea min-h-[3.25rem] w-full resize-none rounded-xl bg-transparent px-3 pt-2 pb-0 text-sm text-inputbar-input-text placeholder-inputbar-input-placeholder focus:outline-none disabled:opacity-50"
              placeholder={placeholder}
              rows={3}
              value={inputValue}
              onKeyDown={(e) => {
                readlineOnKeyDown(e);
                if (!e.defaultPrevented) existingOnKeyDown(e);
              }}
              onChange={handleInputChange}
              disabled={disabled || streaming}
              aria-label="Chat input"
            />
          )}
        </InputBarKeyboardHandler>

        {/* Bottom toolbar — icon-only, 32×32 controls, no text. */}
        <div className="flex items-center justify-end gap-1 px-1.5 pb-1.5">
          {streaming ? (
            <button
              type="button"
              className="icon-btn-32"
              data-active="true"
              onClick={onStop}
              aria-label="Stop generation"
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              className="icon-btn-32"
              data-active={!sendDisabled || undefined}
              onClick={submit}
              disabled={sendDisabled}
              aria-label="Send message"
            >
              <ArrowUp size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
