import { useLayoutEffect, useRef } from 'react';
import type { KeyboardEvent, RefObject } from 'react';

// ---------------------------------------------------------------------------
// Word boundary helpers — readline semantics (\w = alphanumeric + underscore)
// ---------------------------------------------------------------------------

function wordBoundaryBack(text: string, pos: number): number {
  let i = pos;
  while (i > 0 && !/\w/.test(text[i - 1]!)) i--; // skip non-word chars
  while (i > 0 && /\w/.test(text[i - 1]!)) i--;   // skip word chars
  return i;
}

function wordBoundaryForward(text: string, pos: number): number {
  let i = pos;
  while (i < text.length && !/\w/.test(text[i]!)) i++; // skip non-word chars
  while (i < text.length && /\w/.test(text[i]!)) i++;  // skip word chars
  return i;
}

// ---------------------------------------------------------------------------
// useReadlineKeys
//
// Attaches readline/emacs-style text manipulation shortcuts to a controlled
// <textarea>. Returns an onKeyDown handler to compose with existing handlers.
//
// Shortcuts handled:
//   Ctrl+K  — kill cursor → end of line (appends on consecutive kills)
//   Ctrl+U  — kill start of line → cursor
//   Ctrl+W  — kill word backward
//   Ctrl+D  — delete character forward
//   Ctrl+H  — delete character backward
//   Ctrl+Y  — yank (paste from kill buffer)
//   Ctrl+A  — move cursor to line start
//   Ctrl+E  — move cursor to line end
//   Ctrl+B  — move cursor back one character
//   Alt+B   — move cursor back one word
//   Alt+F   — move cursor forward one word
//   Alt+D   — kill word forward
// ---------------------------------------------------------------------------

export function useReadlineKeys(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  value: string,
  setValue: (v: string) => void,
): (event: KeyboardEvent<HTMLTextAreaElement>) => void {
  // Kill ring: single-entry buffer; consecutive kills accumulate
  const killRingRef = useRef('');
  const lastWasKillRef = useRef(false);

  // After a setValue() call React resets the cursor to the end. We schedule
  // the correct position here and apply it in useLayoutEffect (synchronously
  // after the DOM update, before paint — avoids the visible cursor-jump flash
  // that useEffect would cause).
  const pendingCursorRef = useRef<{ start: number; end: number } | null>(null);

  useLayoutEffect(() => {
    if (!pendingCursorRef.current || !textareaRef.current) return;
    const { start, end } = pendingCursorRef.current;
    pendingCursorRef.current = null;
    textareaRef.current.setSelectionRange(start, end);
  }, [value, textareaRef]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    // Don't fire during IME composition (CJK input, etc.)
    if (event.nativeEvent.isComposing) return;

    const el = textareaRef.current;
    if (!el) return;

    const { ctrlKey, altKey, key } = event;

    // Collapse to selectionStart when text is selected before operating
    const cursor = el.selectionStart ?? 0;

    // Helper: mutate value + schedule cursor, mark kill state
    function mutate(newValue: string, newCursor: number, isKill: boolean): void {
      pendingCursorRef.current = { start: newCursor, end: newCursor };
      lastWasKillRef.current = isKill;
      setValue(newValue);
    }

    // Helper: cursor-only move (no value change, React won't re-render cursor)
    // el is guaranteed non-null by the guard above; TypeScript can't narrow into closures
    function moveCursor(pos: number): void {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      el!.setSelectionRange(pos, pos);
      lastWasKillRef.current = false;
    }

    // Helper: accumulate or replace kill ring
    function kill(text: string, append: boolean): void {
      killRingRef.current = append ? killRingRef.current + text : text;
    }

    // ----- Line boundaries (logical lines delimited by \n) -----
    const lineStart = value.lastIndexOf('\n', cursor - 1) + 1;
    const nextNl    = value.indexOf('\n', cursor);
    const lineEnd   = nextNl === -1 ? value.length : nextNl;

    const isConsecutiveKill = lastWasKillRef.current;

    if (ctrlKey && !altKey) {
      switch (key) {
        case 'k': {
          // Kill cursor → end of line (stop before \n; if already at EOL kill the \n)
          event.preventDefault();
          const killTarget = cursor === lineEnd && nextNl !== -1 ? nextNl + 1 : lineEnd;
          const killed = value.slice(cursor, killTarget);
          kill(killed, isConsecutiveKill);
          mutate(value.slice(0, cursor) + value.slice(killTarget), cursor, true);
          return;
        }
        case 'u': {
          // Kill start of line → cursor
          event.preventDefault();
          const killed = value.slice(lineStart, cursor);
          kill(killed, isConsecutiveKill);
          mutate(value.slice(0, lineStart) + value.slice(cursor), lineStart, true);
          return;
        }
        case 'w': {
          // Kill word backward (Ctrl+W — capturable in Chrome extension sidepanel)
          event.preventDefault();
          const wordStart = wordBoundaryBack(value, cursor);
          const killed = value.slice(wordStart, cursor);
          kill(killed, isConsecutiveKill);
          mutate(value.slice(0, wordStart) + value.slice(cursor), wordStart, true);
          return;
        }
        case 'd': {
          // Delete character forward
          event.preventDefault();
          if (cursor >= value.length) {
            lastWasKillRef.current = false;
            return;
          }
          mutate(value.slice(0, cursor) + value.slice(cursor + 1), cursor, false);
          return;
        }
        case 'h': {
          // Delete character backward (like Backspace)
          event.preventDefault();
          if (cursor === 0) {
            lastWasKillRef.current = false;
            return;
          }
          mutate(value.slice(0, cursor - 1) + value.slice(cursor), cursor - 1, false);
          return;
        }
        case 'y': {
          // Yank (paste from kill ring)
          event.preventDefault();
          const yanked = killRingRef.current;
          if (!yanked) {
            lastWasKillRef.current = false;
            return;
          }
          mutate(value.slice(0, cursor) + yanked + value.slice(cursor), cursor + yanked.length, false);
          return;
        }
        case 'a': {
          // Move cursor to beginning of current line
          event.preventDefault();
          moveCursor(lineStart);
          return;
        }
        case 'e': {
          // Move cursor to end of current line
          event.preventDefault();
          moveCursor(lineEnd);
          return;
        }
        case 'b': {
          // Move cursor back one character
          event.preventDefault();
          moveCursor(Math.max(0, cursor - 1));
          return;
        }
        default:
          break;
      }
    }

    if (altKey && !ctrlKey) {
      switch (key) {
        case 'b': {
          // Move cursor back one word
          event.preventDefault();
          moveCursor(wordBoundaryBack(value, cursor));
          return;
        }
        case 'f': {
          // Move cursor forward one word
          event.preventDefault();
          moveCursor(wordBoundaryForward(value, cursor));
          return;
        }
        case 'd': {
          // Kill word forward
          event.preventDefault();
          const wordEnd = wordBoundaryForward(value, cursor);
          const killed  = value.slice(cursor, wordEnd);
          kill(killed, isConsecutiveKill);
          mutate(value.slice(0, cursor) + value.slice(wordEnd), cursor, true);
          return;
        }
        default:
          break;
      }
    }

    // Any non-readline key resets the consecutive-kill accumulation flag
    lastWasKillRef.current = false;
  }

  return handleKeyDown;
}
