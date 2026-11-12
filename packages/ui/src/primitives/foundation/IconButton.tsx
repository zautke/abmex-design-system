import { createElement } from 'react';
import type { ComponentPropsWithRef, ComponentType, ElementType } from 'react';
import { Button } from './Button';
import type { ButtonOwnProps, ButtonState } from './Button';
import { Icon } from './Icon';
import type { IconProps } from './Icon';
import { useComponentProps, mergePartProps, resolveState } from './contract';
import type { PartAppearance, PrimitiveComponent, PrimitiveProps, StateValue } from './contract';

export interface IconButtonOwnProps extends Omit<ButtonOwnProps, 'classNames' | 'styles'>, PartAppearance<ButtonState, 'root' | 'icon'> {
  label: string;
  slots?: { icon?: ComponentType<IconProps> };
  slotProps?: { icon?: StateValue<Partial<IconProps>, ButtonState> };
}
export type IconButtonProps<C extends ElementType = 'button'> = PrimitiveProps<C, IconButtonOwnProps, ButtonState, Extract<'disabled' | 'aria-disabled', keyof ComponentPropsWithRef<C>>>;
export const IconButton: PrimitiveComponent<'button', IconButtonOwnProps, ButtonState, 'disabled' | 'aria-disabled'> = (input: IconButtonProps) => {
  const { label, children, slots, slotProps, classNames, styles, ...props } = useComponentProps('IconButton', input);
  return <Button {...props} slots={slots?.root ? { root: slots.root } : undefined}
    slotProps={slotProps?.root === undefined ? undefined : { root: slotProps.root }}
    classNames={classNames?.root === undefined ? undefined : { root: classNames.root }}
    styles={styles?.root === undefined ? undefined : { root: styles.root }} aria-label={props['aria-label'] ?? label}>
    {state => createElement(slots?.icon ?? Icon, mergePartProps({
      unstyled: state.unstyled, 'data-slot': 'icon',
      children: typeof children === 'function' ? children(state) : children,
    }, resolveState(slotProps?.icon, state), {
      className: resolveState(classNames?.icon, state), style: resolveState(styles?.icon, state),
    }))}
  </Button>;
};
