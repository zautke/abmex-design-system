import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarItem,
  SidebarTrigger,
} from '@abmex/ui/sidebar';
import { ContentPane, InspectorSidebarDemo, SidebarDemo } from '@abmex/ui/sidebar-demo';
import { RecipeSearchSidebarDemo } from '@abmex/ui/sidebar-search';
import type { SidebarDemoItem } from '@abmex/ui/sidebar-demo';

const workspaceItems: SidebarDemoItem[] = [
  {
    id: 'overview', label: 'Overview', icon: '◉', group: 'Workspace',
    description: 'A calm view of the projects and work moving through Northstar Studio.',
    keywords: ['home', 'summary', 'start'],
    content: <FixturePanel title="Good morning, Mira" text="Your studio has 4 active projects and 2 items waiting for review." />,
  },
  {
    id: 'projects', label: 'Projects', icon: '▦', group: 'Workspace',
    description: 'Keep current work, collaborators, and project notes together.',
    keywords: ['boards', 'campaigns', 'work'],
    content: <FixturePanel title="Projects" text="Spring campaign · Product launch · Studio refresh" />,
  },
  {
    id: 'assets', label: 'Asset library', icon: '▤', group: 'Workspace',
    description: 'Browse shared brand assets and reusable campaign material.',
    keywords: ['images', 'files', 'brand'],
    content: <FixturePanel title="Asset library" text="24 approved assets are ready for your next project." />,
  },
  {
    id: 'saved', label: 'Saved views', icon: '☆', group: 'Personal',
    description: 'Return to filters and workspaces you saved for later.',
    keywords: ['bookmarks', 'favorites'],
    children: <span className="flex min-w-0 flex-col"><span className="truncate">Saved views</span><span className="truncate text-xs text-fg-muted">12 views · Updated today</span></span>,
    content: <FixturePanel title="Saved views" text="Launch checklist · Waiting on me · This week" />,
  },
  {
    id: 'preferences', label: 'Preferences', icon: '⚙', group: 'Personal',
    description: 'Choose how Northstar Studio looks and remembers your workspace.',
    keywords: ['theme', 'appearance', 'settings'],
    content: <FixturePanel title="Preferences" text="Use the theme control at the bottom of the sidebar to switch light and dark appearance." />,
  },
];

function FixturePanel({ title, text }: { title: string; text: string }) {
  return (
    <section className="fixture-panel">
      <div className="fixture-panel__marker" aria-hidden="true">N</div>
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </section>
  );
}

function DirectPartsView() {
  const [active, setActive] = useState('tokens');
  const entries = [
    { id: 'tokens', label: 'Tokens', icon: '◈' },
    { id: 'parts', label: 'Named parts', icon: '▤' },
    { id: 'state', label: 'State ownership', icon: '◉' },
  ];
  const selected = entries.find(entry => entry.id === active) ?? entries[0];

  return (
    <div className="direct-parts-view">
      <Sidebar aria-label="Public sidebar parts" showToggle={false} slotProps={{ rail: { 'aria-label': 'Resize public parts sidebar' } }}>
        <SidebarHeader className="direct-parts-view__header">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>Public parts</span>
          <SidebarTrigger aria-label="Toggle public parts sidebar" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>API surface</SidebarGroupLabel>
            {entries.map(entry => (
              <SidebarItem
                key={entry.id}
                label={entry.label}
                icon={<span aria-hidden="true">{entry.icon}</span>}
                active={active === entry.id}
                onClick={() => setActive(entry.id)}
              />
            ))}
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter><p className="direct-parts-view__footer">Built from public parts</p></SidebarFooter>
      </Sidebar>
      <ContentPane title={selected.label} description="This small host composition imports Sidebar parts directly from the built public subpath.">
        <FixturePanel title={selected.label} text="Select a row to change this page body. No app route or service is required." />
      </ContentPane>
    </div>
  );
}

type ViewName = 'recipe' | 'workspace' | 'inspector' | 'parts';

export function App() {
  const [view, setView] = useState<ViewName>('recipe');
  const [workspaceCollapsed, setWorkspaceCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);

  return (
    <main className="app-frame">
      <header className="app-header">
        <div className="app-brand"><span className="brand-mark" aria-hidden="true">A</span><span>ABMEX UI</span></div>
        <nav aria-label="Composition examples" className="example-tabs">
          <button type="button" aria-current={view === 'recipe' ? 'page' : undefined} onClick={() => setView('recipe')}>Recipe search</button>
          <button type="button" aria-current={view === 'workspace' ? 'page' : undefined} onClick={() => setView('workspace')}>Workspace</button>
          <button type="button" aria-current={view === 'inspector' ? 'page' : undefined} onClick={() => setView('inspector')}>Right inspector</button>
          <button type="button" aria-current={view === 'parts' ? 'page' : undefined} onClick={() => setView('parts')}>Public parts</button>
        </nav>
        <span className="app-header__note">Working compositions</span>
      </header>
      <section className="composition-stage" aria-label="Sidebar composition preview">
        {view === 'recipe' ? (
          <RecipeSearchSidebarDemo />
        ) : view === 'workspace' ? (
          <>
            <div className="host-controls">
              <p>Fixture navigation · search filters real local items</p>
              <button type="button" onClick={() => setWorkspaceCollapsed(value => !value)}>
                {workspaceCollapsed ? 'Expand workspace navigation' : 'Collapse workspace navigation'}
              </button>
            </div>
            <SidebarDemo
              items={workspaceItems}
              collapsed={workspaceCollapsed}
              onCollapsedChange={setWorkspaceCollapsed}
              persistPreferences
              persistenceKey="esi005-workspace-demo"
              brand={<span className="brand-mark" aria-hidden="true">N</span>}
              renderContent={item => item.content}
            />
          </>
        ) : view === 'inspector' ? (
          <>
            <div className="host-controls">
              <p>Independent right inspector · host controls collapse state</p>
              <button type="button" onClick={() => setInspectorCollapsed(value => !value)}>
                {inspectorCollapsed ? 'Expand inspector' : 'Collapse inspector'}
              </button>
            </div>
            <InspectorSidebarDemo
              title="Spring campaign"
              collapsed={inspectorCollapsed}
              onCollapsedChange={setInspectorCollapsed}
              details={<FixturePanel title="Campaign details" text="Owner Mira Santos · Due May 21 · Status In review" />}
              activity={<FixturePanel title="Recent activity" text="Mira updated the campaign brief today. This activity is a local example." />}
              sharing={<FixturePanel title="Sharing" text="Host applications can replace this panel with their own access controls." />}
            />
          </>
        ) : <DirectPartsView />}
      </section>
    </main>
  );
}
