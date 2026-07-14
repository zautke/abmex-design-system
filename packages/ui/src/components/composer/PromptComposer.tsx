import { useEffect, useRef } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useReadlineKeys } from '../../hooks/useReadlineKeys';
import { InputBarKeyboardHandler } from './InputBarKeyboardHandler';
import { SendButton } from './SendButton';
import { StopButton } from './StopButton';
import { cn } from '../../utils/cn';

const MAX_TEXTAREA_HEIGHT_PX = 120;

const DEFAULT_PLACEHOLDER_ENTER_SENDS = 'Ask anything… (⏎ to send, ⇧+⏎ for newline)';
const DEFAULT_PLACEHOLDER_SHIFT_ENTER_SENDS = 'Ask anything… (⇧+⏎ to send)';

export interface PromptComposerProps {
  /** Controlled text. The composer never owns it and never clears it itself. */
  value: string;
  onChange: (next: string) => void;
  /**
   * Called with the trimmed text on submit. The consumer clears `value` and
   * records prompt history — `useInputBarController().submit` does both and is
   * directly assignable here.
   */
  onSend: (text: string) => void;
  onStop: () => void;
  streaming: boolean;
  disabled: boolean;
  /**
   * When true: ⇧⏎ sends, bare ⏎ inserts a newline. When false (default):
   * bare ⏎ sends, ⇧⏎ inserts a newline.
   */
  shiftEnterToSend?: boolean;
  /** Defaults to the binding-aware hint text matching `shiftEnterToSend`. */
  placeholder?: string;
  // WIRING: prompt history is not in the view. Pass `navigateHistoryUp` /
  // `navigateHistoryDown` / `cancelHistoryNavigation` from the headless
  // `useInputBarController` hook (or your own store) to enable ↑/↓/Esc recall.
  // Omitted → those keys are swallowed and do nothing, which is correct for a
  // composer with no history.
  onHistoryUp?: () => void;
  onHistoryDown?: () => void;
  onCancelHistoryNavigation?: () => void;
  /** Toolbar content rendered before the send/stop control (settings, tools, …). */
  leading?: ReactNode;
  /** Toolbar content rendered after the send/stop control. */
  trailing?: ReactNode;
  className?: string;
}

export function PromptComposer({
  value,
  onChange,
  onSend,
  onStop,
  streaming,
  disabled,
  shiftEnterToSend = false,
  placeholder,
  onHistoryUp,
  onHistoryDown,
  onCancelHistoryNavigation,
  leading,
  trailing,
  className,
}: PromptComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const readlineOnKeyDown = useReadlineKeys(textareaRef, value, onChange);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  }, [value]);

  // After submit clears value, also reset textarea height back to its
  // single-row baseline so the toolbar doesn't stay at a multi-line height.
  function handleSubmit(): void {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleInputChange(e: ChangeEvent<HTMLTextAreaElement>): void {
    // WIRING: consumers using `useInputBarController` must call
    // `notifyManualEdit()` here (before `setInputValue`) so a keystroke exits
    // history-navigation mode. The view cannot know it is in that mode.
    onChange(e.currentTarget.value);
  }

  const sendDisabled = disabled || value.trim().length === 0;
  const resolvedPlaceholder =
    placeholder ??
    (shiftEnterToSend ? DEFAULT_PLACEHOLDER_SHIFT_ENTER_SENDS : DEFAULT_PLACEHOLDER_ENTER_SENDS);

  return (
    <div className={cn('border-t border-inputbar-border bg-inputbar-bg px-3 py-2', className)}>
      <div className="flex flex-col gap-1.5 rounded-xl border border-inputbar-input-border bg-inputbar-input-bg focus-within:border-inputbar-input-border-focus">
        <InputBarKeyboardHandler
          streaming={streaming}
          disabled={disabled}
          shiftEnterToSend={shiftEnterToSend}
          onSubmit={handleSubmit}
          onHistoryUp={onHistoryUp ?? noop}
          onHistoryDown={onHistoryDown ?? noop}
          onCancelHistoryNavigation={onCancelHistoryNavigation ?? noop}
        >
          {({ onKeyDown: keyboardOnKeyDown }) => (
            <textarea
              ref={textareaRef}
              className="inputbar-textarea min-h-[3.25rem] w-full resize-none rounded-xl bg-transparent px-3 pt-2 pb-0 text-sm text-inputbar-input-text placeholder-inputbar-input-placeholder focus:outline-none disabled:opacity-50"
              placeholder={resolvedPlaceholder}
              rows={3}
              value={value}
              onKeyDown={(e) => {
                readlineOnKeyDown(e);
                if (!e.defaultPrevented) keyboardOnKeyDown(e);
              }}
              onChange={handleInputChange}
              disabled={disabled || streaming}
              aria-label="Chat input"
            />
          )}
        </InputBarKeyboardHandler>

        {/* Bottom toolbar — icon-only, 32×32 controls, no text. */}
        <div className="flex items-center gap-1 px-1.5 pb-1.5">
          {leading}
          <div className="ml-auto flex items-center gap-1">
            {streaming ? (
              <StopButton onStop={onStop} />
            ) : (
              <SendButton onSend={handleSubmit} disabled={sendDisabled} />
            )}
            {trailing}
          </div>
        </div>
      </div>
    </div>
  );
}

function noop(): void {
  /* history navigation not wired */
}
