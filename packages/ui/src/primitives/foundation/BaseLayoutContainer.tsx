import type { ElementType } from 'react';
import { cn } from '../../utils/cn';
import { useComponentProps, useRoot } from './contract';
import type { ComponentDefaultOptions, PartAppearance, PrimitiveComponent, PrimitiveProps, PrimitiveState, RenderProps } from './contract';

export interface LayoutState extends PrimitiveState { display: 'block' | 'flex' | 'grid' }
export interface BaseLayoutContainerOwnProps extends PartAppearance<LayoutState> { options?: ComponentDefaultOptions['BaseLayoutContainer'] }
export type BaseLayoutContainerProps<C extends ElementType = 'div'> = PrimitiveProps<C, BaseLayoutContainerOwnProps, LayoutState>;
export const BASE_LAYOUT_DEFAULTS = { display: 'block' } as const;
export const BaseLayoutContainer: PrimitiveComponent<'div', BaseLayoutContainerOwnProps, LayoutState> = (input: BaseLayoutContainerProps) => {
  const { options: overrides, ...props } = useComponentProps('BaseLayoutContainer', input);
  const options = { ...BASE_LAYOUT_DEFAULTS, ...overrides };
  const state = { display: options.display, unstyled: props.unstyled ?? false };
  const root = useRoot(props as RenderProps, state, 'div', {
    className: cn('min-w-0 min-h-0', options.display),
    style: { flexDirection: options.direction, gap: options.gap, overflow: options.overflow, contain: options.contain },
  });
  return root.render();
};
