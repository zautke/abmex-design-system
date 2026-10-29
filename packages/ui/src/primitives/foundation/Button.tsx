import type { ComponentPropsWithRef, ElementType, MouseEvent, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { useComponentProps, useRoot } from './contract';
import type { ComponentDefaultOptions, PartAppearance, PrimitiveComponent, PrimitiveProps, PrimitiveState, RenderProps, StateValue } from './contract';
import { useButtonBehavior } from './useButtonBehavior';
import type { ButtonBehaviorInput } from './useButtonBehavior';

export interface ButtonState extends PrimitiveState { disabled: boolean; size: 'sm' | 'md' | 'lg'; variant: 'solid' | 'outline' | 'ghost' }
export interface ButtonOwnProps extends PartAppearance<ButtonState> {
  disabled?: boolean;
  options?: ComponentDefaultOptions['Button'];
  onAction?: (event: MouseEvent<HTMLElement>) => void;
  children?: StateValue<ReactNode, ButtonState>;
}
export type ButtonProps<C extends ElementType = 'button'> = PrimitiveProps<C, ButtonOwnProps, ButtonState, Extract<'disabled' | 'aria-disabled', keyof ComponentPropsWithRef<C>>>;
export const BUTTON_DEFAULTS = { size: 'md', variant: 'solid' } as const;
export const Button: PrimitiveComponent<'button', ButtonOwnProps, ButtonState, 'disabled' | 'aria-disabled'> = (input: ButtonProps) => {
  const { options, disabled, onAction, children, ...props } = useComponentProps('Button', input);
  const staticRoot = typeof props.slotProps?.root === 'object' ? props.slotProps.root : undefined;
  const isDisabled = disabled || props['aria-disabled'] === true || props['aria-disabled'] === 'true' || staticRoot?.disabled || staticRoot?.['aria-disabled'] === true || staticRoot?.['aria-disabled'] === 'true';
  const state = { ...BUTTON_DEFAULTS, ...options, disabled: Boolean(isDisabled), unstyled: props.unstyled ?? false };
  const rootSlot = props.slotProps?.root;
  const slotProps = typeof rootSlot === 'function' ? {
    ...props.slotProps,
    // Guard JavaScript callers and casts so state callbacks cannot contradict the state snapshot.
    root: (current: ButtonState) => {
      const { disabled: _disabled, 'aria-disabled': _ariaDisabled, ...safe } = rootSlot(current) as Record<string, unknown>;
      return safe;
    },
  } : props.slotProps;
  const root = useRoot({ ...props, slotProps } as RenderProps, state, 'button', {
    className: cn(!state.unstyled && ['inline-flex items-center justify-center gap-2 rounded-md font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] disabled:opacity-50 aria-disabled:opacity-50',
      { sm: 'px-2 py-1 text-sm', md: 'px-3 py-2 text-base', lg: 'px-4 py-3 text-lg' }[state.size],
      { solid: 'bg-[var(--primary)] text-[color:var(--primary-fg)]', outline: 'border border-[var(--border)] text-[color:var(--fg)]', ghost: 'text-[color:var(--fg)]' }[state.variant]]),
    children: typeof children === 'function' ? children(state) : children,
  });
  const click = root.props.onClick as ((event: MouseEvent<HTMLElement>) => void) | undefined;
  const unavailable = state.disabled;
  const semantics = root.target === 'button' || typeof root.target !== 'string' ? 'button' : root.target === 'a' && root.props.href ? 'link' : 'custom';
  const behavior = useButtonBehavior({ disabled: unavailable, semantics, onClick: click, onAction,
    onKeyDown: root.props.onKeyDown as ButtonBehaviorInput['onKeyDown'],
    onKeyUp: root.props.onKeyUp as ButtonBehaviorInput['onKeyUp'],
    onBlur: root.props.onBlur as ButtonBehaviorInput['onBlur'],
  });
  root.props['data-size'] = state.size;
  root.props['data-variant'] = state.variant;
  if (semantics === 'button') {
    root.props.type ??= 'button';
    root.props.disabled = unavailable;
  } else {
    delete root.props.disabled;
    if (unavailable) { root.props['aria-disabled'] = true; root.props.tabIndex = -1; }
    if (semantics === 'custom') { root.props.role = 'button'; root.props.tabIndex ??= 0; }
  }
  return root.render({ ...root.props, ...behavior });
};
