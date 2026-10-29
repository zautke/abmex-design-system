import type { ElementType } from 'react';
import { useComponentProps, useRoot } from './contract';
import type { ComponentDefaultOptions, PartAppearance, PrimitiveComponent, PrimitiveProps, PrimitiveState, RenderProps } from './contract';
import { cn } from '../../utils/cn';

export interface IconState extends PrimitiveState { size: 'sm' | 'md' | 'lg' }
export interface IconOwnProps extends PartAppearance<IconState> { label?: string; options?: ComponentDefaultOptions['Icon'] }
export type IconProps<C extends ElementType = 'span'> = PrimitiveProps<C, IconOwnProps, IconState>;
export const ICON_DEFAULTS = { size: 'md' } as const;
export const Icon: PrimitiveComponent<'span', IconOwnProps, IconState> = (input: IconProps) => {
  const { options, label, ...props } = useComponentProps('Icon', input);
  const state = { ...ICON_DEFAULTS, ...options, unstyled: props.unstyled ?? false };
  const root = useRoot(props as RenderProps, state, 'span', {
    className: cn(!state.unstyled && ['inline-flex shrink-0 items-center justify-center [&>svg]:size-full', { sm: 'size-4', md: 'size-5', lg: 'size-6' }[state.size]]),
    'aria-label': label,
  });
  const named = Boolean(root.props['aria-label'] || root.props['aria-labelledby']);
  root.props.role ??= named ? 'img' : undefined;
  root.props['aria-hidden'] ??= named ? undefined : true;
  return root.render();
};
