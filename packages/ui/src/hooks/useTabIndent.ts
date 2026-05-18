// useTabIndent — Tab key inserts N spaces at cursor (or replaces selection)
// instead of triggering browser focus traversal. Configurable indent size.
//
// Pattern mirrors src/hooks/useReadlineKeys.ts:
//   - read selectionStart/End
//   - mutate value via setValue
//   - schedule cursor placement via pendingCursorRef + useLayoutEffect

import { useLayoutEffect, useRef } from 'react';
import type { KeyboardEvent, RefObject } from 'react';

export type TabIndentSpaces = 2 | 4;

export function useTabIndent(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  value: string,
  setValue: (v: string) => void,
  spaces: TabIndentSpaces = 2,
): (event: KeyboardEvent<HTMLTextAreaElement>) => void {
  const pendingCursorRef = useRef<{ start: number; end: number } | null>(null);

  useLayoutEffect(() => {
    if (!pendingCursorRef.current || !textareaRef.current) return;
    const { start, end } = pendingCursorRef.current;
    pendingCursorRef.current = null;
    textareaRef.current.setSelectionRange(start, end);
  }, [value, textareaRef]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== 'Tab') return;
    if (event.nativeEvent.isComposing) return;
    if (event.shiftKey) return; // let Shift+Tab keep its native behavior

    const el = textareaRef.current;
    if (!el) return;

    event.preventDefault();

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;
    const indent = ' '.repeat(spaces);

    const next = value.slice(0, start) + indent + value.slice(end);
    pendingCursorRef.current = { start: start + spaces, end: start + spaces };
    setValue(next);
  }

  return handleKeyDown;
}
