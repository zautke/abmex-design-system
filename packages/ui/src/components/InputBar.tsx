import { useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { useReadlineKeys } from '../hooks/useReadlineKeys';
import { useInputBarController } from '../hooks/useInputBarController';
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
  /**
   * Optional localStorage key override for prompt history. Lets multiple
   * InputBar instances coexist on the same origin without collision. Default
   * `inputbar.promptHistory.v1`.
   */
  promptHistoryStorageKey?: string;
}

export function InputBar({
  onSend,
  onStop,
  streaming,
  disabled,
  shiftEnterToSend = false,
  promptHistoryStorageKey,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const controller = useInputBarController({
    onSend,
    shiftEnterToSend,
    ...(promptHistoryStorageKey !== undefined ? { promptHistoryStorageKey } : {}),
  });
  const {
    inputValue,
    setInputValue,
    submit,
    navigateHistoryUp,
    navigateHistoryDown,
    cancelHistoryNavigation,
    notifyManualEdit,
    placeholder,
  } = controller;

  const readlineOnKeyDown = useReadlineKeys(textareaRef, inputValue, setInputValue);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [inputValue]);

  // After submit clears value, also reset textarea height back to its
  // single-row baseline so the toolbar doesn't stay at a multi-line height.
  function handleSubmit(): void {
    submit();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleInputChange(e: ChangeEvent<HTMLTextAreaElement>): void {
    const nextValue = e.currentTarget.value;
    notifyManualEdit();
    setInputValue(nextValue);
  }

  const sendDisabled = disabled || inputValue.trim().length === 0;

  return (
    <div className="border-t border-inputbar-border bg-inputbar-bg px-3 py-2">
      <div className="flex flex-col gap-1.5 rounded-xl border border-inputbar-input-border bg-inputbar-input-bg focus-within:border-inputbar-input-border-focus">
        <InputBarKeyboardHandler
          streaming={streaming}
          disabled={disabled}
          shiftEnterToSend={shiftEnterToSend}
          onSubmit={handleSubmit}
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
              onClick={handleSubmit}
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
