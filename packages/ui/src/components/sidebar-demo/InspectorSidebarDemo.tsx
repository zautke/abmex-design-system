import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarItem,
  SidebarTrigger,
} from '../sidebar';

export interface InspectorSidebarDemoProps {
  title?: string;
  details?: ReactNode;
  activity?: ReactNode;
  sharing?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

const panels = [
  { id: 'details', label: 'Details', icon: '◫' },
  { id: 'activity', label: 'Activity', icon: '◷' },
  { id: 'sharing', label: 'Sharing', icon: '↗' },
] as const;

/** Right-side inspector composition: selection controls a contextual panel, not application navigation. */
export function InspectorSidebarDemo({
  title = 'Untitled project',
  details,
  activity,
  sharing,
  header,
  footer,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  className,
}: InspectorSidebarDemoProps) {
  const [activePanel, setActivePanel] = useState<(typeof panels)[number]['id']>('details');
  const content = { details, activity, sharing }[activePanel];

  return (
    <section className={`flex min-h-0 min-w-0 flex-1 overflow-hidden bg-bg text-fg ${className ?? ''}`}>
      <main className="flex min-w-0 flex-1 flex-col items-center justify-center bg-surface-2 px-8 py-10 text-center">
        <div className="grid size-16 place-items-center rounded-xl border border-border bg-surface text-2xl text-primary">▧</div>
        <h2 className="mt-5 text-lg font-semibold text-fg-strong">{title}</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-fg-muted">The canvas stays independent while the inspector changes its selected view.</p>
      </main>
      <Sidebar
        side="right"
        aria-label="Project inspector"
        showToggle={false}
        collapsed={collapsed}
        defaultCollapsed={defaultCollapsed}
        onCollapsedChange={onCollapsedChange}
        slotProps={{ rail: { 'aria-label': 'Resize inspector' } }}
      >
        <SidebarHeader className="flex items-center justify-between gap-2">
          {header ?? <span className="text-sm font-semibold text-fg-strong">Inspector</span>}
          <SidebarTrigger aria-label="Toggle inspector width" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Selection</SidebarGroupLabel>
            {panels.map(panel => (
              <SidebarItem
                key={panel.id}
                label={panel.label}
                icon={<span aria-hidden="true">{panel.icon}</span>}
                active={activePanel === panel.id}
                onClick={() => setActivePanel(panel.id)}
                children={panel.id === 'details' ? (
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{panel.label}</span>
                    <span className="truncate text-xs text-fg-muted">Canvas · {title}</span>
                  </span>
                ) : undefined}
              />
            ))}
          </SidebarGroup>
          <div className="mx-3 my-3 border-t border-border pt-4">
            {content ?? (
              <div className="space-y-4 px-1">
                <p className="text-sm font-medium text-fg-strong">{panels.find(panel => panel.id === activePanel)?.label}</p>
                {activePanel === 'details' ? (
                  <dl className="space-y-3 text-xs">
                    <div className="flex justify-between gap-3"><dt className="text-fg-muted">Type</dt><dd>Canvas</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-fg-muted">Updated</dt><dd>Today</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-fg-muted">Owner</dt><dd>Mira Santos</dd></div>
                  </dl>
                ) : activePanel === 'activity' ? (
                  <p className="text-xs leading-5 text-fg-muted">Mira edited the canvas today. No remote activity feed is connected.</p>
                ) : (
                  <p className="text-xs leading-5 text-fg-muted">Share controls are supplied by the host application.</p>
                )}
              </div>
            )}
          </div>
        </SidebarContent>
        <SidebarFooter>
          {footer ?? <p className="px-3 py-2 text-xs text-fg-muted">Contextual controls · local fixture</p>}
        </SidebarFooter>
      </Sidebar>
    </section>
  );
}
