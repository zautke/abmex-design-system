import type { ElementType } from 'react';
import { BaseLayoutContainer } from '../../primitives/foundation/BaseLayoutContainer';
import type { BaseLayoutContainerOwnProps, LayoutState } from '../../primitives/foundation/BaseLayoutContainer';
import { mergePartProps, useComponentProps } from '../../primitives/foundation/contract';
import type { PrimitiveComponent, PrimitiveProps } from '../../primitives/foundation/contract';

export type LayoutRegion =
  | 'app-root'
  | 'header'
  | 'body'
  | 'chat-column'
  | 'chat-main'
  | 'input-region'
  | 'overlay';

export interface LayoutContainerOwnProps extends BaseLayoutContainerOwnProps {
  region?: LayoutRegion | (string & {});
}
export type LayoutContainerProps<C extends ElementType = 'div'> = PrimitiveProps<C, LayoutContainerOwnProps, LayoutState>;

const BASE_LAYOUT_CONTAINER_CLASSNAME =
  'layout-container min-w-0 min-h-0 max-w-full max-h-full overflow-hidden';

export const LAYOUT_CONTAINER_DEFAULTS = {
  contain: 'inline-size layout paint',
} as const;

export const LayoutContainer: PrimitiveComponent<'div', LayoutContainerOwnProps, LayoutState> = (input: LayoutContainerProps) => {
  const { region, options, ...props } = useComponentProps('LayoutContainer', input);
  return (
    <BaseLayoutContainer
      {...mergePartProps({ className: BASE_LAYOUT_CONTAINER_CLASSNAME }, props)}
      options={{ ...LAYOUT_CONTAINER_DEFAULTS, ...options }}
      data-layout-container="true"
      data-layout-region={region}
    />
  );
};

export function AppRootLayoutContainer(props: Omit<LayoutContainerProps, 'region'>) {
  return <LayoutContainer region="app-root" {...props} />;
}

export function HeaderLayoutContainer(props: Omit<LayoutContainerProps, 'region'>) {
  return <LayoutContainer region="header" {...props} />;
}

export function BodyLayoutContainer(props: Omit<LayoutContainerProps, 'region'>) {
  return <LayoutContainer region="body" {...props} />;
}

export function ChatColumnLayoutContainer(props: Omit<LayoutContainerProps, 'region'>) {
  return <LayoutContainer region="chat-column" {...props} />;
}

export function ChatMainLayoutContainer(props: Omit<LayoutContainerProps, 'region'>) {
  return <LayoutContainer region="chat-main" {...props} />;
}

export function InputLayoutContainer(props: Omit<LayoutContainerProps, 'region'>) {
  return <LayoutContainer region="input-region" {...props} />;
}

export function OverlayLayoutContainer(props: Omit<LayoutContainerProps, 'region'>) {
  return <LayoutContainer region="overlay" {...props} />;
}
