import { useRef } from 'react';
import type { FocusEvent, KeyboardEvent, MouseEvent } from 'react';

export interface ButtonBehaviorInput {
  disabled: boolean;
  /** Use button/link for native targets; custom renderers declare their semantics. */
  semantics: 'button' | 'link' | 'custom';
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  onAction?: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
  onKeyUp?: (event: KeyboardEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
}

/** Optional public behavior layer; consumers spread returned handlers without replacing them. */
export function useButtonBehavior(input: ButtonBehaviorInput) {
  const spacePressed = useRef(false);
  return {
    onClick(event: MouseEvent<HTMLElement>) {
      if (input.disabled) { event.preventDefault(); return; }
      input.onClick?.(event);
      if (!event.defaultPrevented) input.onAction?.(event);
    },
    onKeyDown(event: KeyboardEvent<HTMLElement>) {
      input.onKeyDown?.(event);
      if (event.defaultPrevented || input.disabled || input.semantics !== 'custom' || event.target !== event.currentTarget) return;
      if (event.key === 'Enter' && !event.repeat) { event.preventDefault(); event.currentTarget.click(); }
      if (event.key === ' ') { event.preventDefault(); spacePressed.current = true; }
    },
    onKeyUp(event: KeyboardEvent<HTMLElement>) {
      const pressed = spacePressed.current;
      spacePressed.current = false;
      input.onKeyUp?.(event);
      if (!event.defaultPrevented && !input.disabled && input.semantics === 'custom' && pressed && event.key === ' ' && event.target === event.currentTarget) {
        event.preventDefault(); event.currentTarget.click();
      }
    },
    onBlur(event: FocusEvent<HTMLElement>) {
      spacePressed.current = false;
      input.onBlur?.(event);
    },
  };
}
