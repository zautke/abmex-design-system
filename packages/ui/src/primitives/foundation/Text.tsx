import type { ElementType } from 'react';
import { useComponentProps, useRoot } from './contract';
import type { ComponentDefaultOptions, PartAppearance, PrimitiveComponent, PrimitiveProps, PrimitiveState, RenderProps } from './contract';
import { cn } from '../../utils/cn';

export interface TextState extends PrimitiveState { tone: 'inherit' | 'muted' | 'strong'; truncate: boolean }
export interface TextOwnProps extends PartAppearance<TextState> { options?: ComponentDefaultOptions['Text'] }
export type TextProps<C extends ElementType = 'span'> = PrimitiveProps<C, TextOwnProps, TextState>;
export const TEXT_DEFAULTS = { tone: 'inherit', truncate: false } as const;
export const Text: PrimitiveComponent<'span', TextOwnProps, TextState> = (input: TextProps) => {
  const { options, ...props } = useComponentProps('Text', input);
  const state = { ...TEXT_DEFAULTS, ...options, unstyled: props.unstyled ?? false };
  const root = useRoot(props as RenderProps, state, 'span', {
    className: cn(!state.unstyled && [state.tone === 'muted' && 'text-[color:var(--fg-muted)]', state.tone === 'strong' && 'text-[color:var(--fg-strong)]', state.truncate && 'truncate']),
  });
  return root.render();
};
