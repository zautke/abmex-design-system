import type { KeyboardEvent, ReactNode } from 'react';

interface InputBarKeyboardHandlerProps {
  streaming: boolean;
  disabled: boolean;
  /**
   * When true, ⇧⏎ submits and bare ⏎ inserts a newline. When false (default),
   * bare ⏎ submits and ⇧⏎ inserts a newline.
   */
  shiftEnterToSend?: boolean;
  onSubmit: () => void;
  onHistoryUp: () => void;
  onHistoryDown: () => void;
  onCancelHistoryNavigation: () => void;
  children: (args: {
    onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  }) => ReactNode;
  // Extensibility stubs — optional hooks for future feature attachment.
  onTab?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onCtrlEnter?: () => void;
  onShiftEnter?: () => void;
  onAltEnter?: () => void;
  onEscape?: () => void;
}

export function InputBarKeyboardHandler({
  streaming,
  disabled,
  shiftEnterToSend = false,
  onSubmit,
  onHistoryUp,
  onHistoryDown,
  onCancelHistoryNavigation,
  onTab,
  onArrowLeft,
  onArrowRight,
  onCtrlEnter,
  onShiftEnter,
  onAltEnter,
  onEscape,
  children,
}: InputBarKeyboardHandlerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.defaultPrevented) return;

    if (event.key === 'Tab') {
      event.preventDefault();
      onTab?.();
      return;
    }

    // ── Enter handling ────────────────────────────────────────────────
    if (event.key === 'Enter') {
      // Ctrl/Cmd+Enter always submits — backstop for either binding mode.
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        if (!streaming && !disabled) {
          onSubmit();
          onCtrlEnter?.();
        }
        return;
      }

      const plain = !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey;
      const shiftOnly = event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey;

      if (shiftEnterToSend) {
        // Shift+Enter submits, bare Enter inserts newline.
        if (shiftOnly) {
          event.preventDefault();
          if (!streaming && !disabled) {
            onSubmit();
            onShiftEnter?.();
          }
          return;
        }
        // Plain Enter falls through → default textarea inserts newline.
      } else {
        // Default: bare Enter submits, Shift+Enter inserts newline.
        if (plain) {
          event.preventDefault();
          if (!streaming && !disabled) {
            onSubmit();
          }
          return;
        }
        if (shiftOnly) {
          onShiftEnter?.();
          return;
        }
      }

      if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        event.preventDefault();
        onAltEnter?.();
        return;
      }
    }

    if (event.key === 'ArrowUp' && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      if (!streaming && !disabled) {
        onHistoryUp();
      }
      return;
    }

    if (event.key === 'ArrowDown' && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      if (!streaming && !disabled) {
        onHistoryDown();
      }
      return;
    }

    if (event.key === 'ArrowLeft') {
      onArrowLeft?.();
      return;
    }

    if (event.key === 'ArrowRight') {
      onArrowRight?.();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      if (!streaming && !disabled) {
        onCancelHistoryNavigation();
      }
      onEscape?.();
    }
  }

  return <>{children({ onKeyDown: handleKeyDown })}</>;
}
