import type { CSSProperties, PropsWithChildren } from 'react';

type LayoutRegion =
  | 'app-root'
  | 'header'
  | 'body'
  | 'chat-column'
  | 'chat-main'
  | 'input-region'
  | 'overlay';

interface LayoutContainerProps extends PropsWithChildren {
  className?: string;
  region: LayoutRegion;
  style?: CSSProperties;
}

const BASE_LAYOUT_CONTAINER_CLASSNAME =
  'layout-container min-w-0 min-h-0 max-w-full max-h-full overflow-hidden';

const BASE_LAYOUT_CONTAINER_STYLE: CSSProperties = {
  contain: 'inline-size layout paint',
};

export function LayoutContainer({ children, className = '', region, style }: LayoutContainerProps) {
  return (
    <div
      data-layout-container="true"
      data-layout-region={region}
      className={`${BASE_LAYOUT_CONTAINER_CLASSNAME} ${className}`.trim()}
      style={{ ...BASE_LAYOUT_CONTAINER_STYLE, ...style }}
    >
      {children}
    </div>
  );
}

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
