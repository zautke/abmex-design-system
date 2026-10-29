import type { ReactNode } from 'react';

export interface ContentPaneProps {
  title: string;
  description?: string;
  eyebrow?: string;
  toolbar?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** A replaceable page body for compositions driven by Sidebar navigation. */
export function ContentPane({
  title,
  description,
  eyebrow,
  toolbar,
  children,
  footer,
  className,
}: ContentPaneProps) {
  return (
    <article className={`flex min-h-0 min-w-0 flex-1 flex-col bg-bg text-fg ${className ?? ''}`}>
      <header className="flex items-start justify-between gap-6 border-b border-border px-8 py-7">
        <div className="min-w-0">
          {eyebrow ? <p className="mb-2 text-xs font-medium text-fg-muted">{eyebrow}</p> : null}
          <h1 className="text-2xl font-semibold tracking-tight text-fg-strong">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-muted">{description}</p> : null}
        </div>
        {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
      </header>
      <div className="min-h-0 flex-1 overflow-auto px-8 py-7">{children}</div>
      {footer ? <footer className="border-t border-border px-8 py-4 text-xs text-fg-muted">{footer}</footer> : null}
    </article>
  );
}
