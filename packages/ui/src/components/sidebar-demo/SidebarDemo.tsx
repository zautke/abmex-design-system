import { useId, useMemo, useState } from 'react';
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
import { usePersistentState } from '../../hooks/usePersistentState';
import type { PersistentStateError } from '../../hooks/usePersistentState';
import { ContentPane } from './ContentPane';

export interface SidebarDemoItem {
  id: string;
  label: string;
  icon?: ReactNode;
  group?: string;
  description?: string;
  keywords?: string[];
  /** Replace the default item body with a richer menu row. */
  children?: ReactNode;
  content?: ReactNode;
}

export type SidebarDemoTheme = 'dark' | 'light';

export interface SidebarDemoProps {
  items?: SidebarDemoItem[];
  initialItemId?: string;
  activeItemId?: string;
  onNavigate?: (item: SidebarDemoItem) => void;
  brand?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  renderContent?: (item: SidebarDemoItem) => ReactNode;
  renderItemBody?: (item: SidebarDemoItem) => ReactNode;
  theme?: SidebarDemoTheme;
  defaultTheme?: SidebarDemoTheme;
  onThemeChange?: (theme: SidebarDemoTheme) => void;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  persistPreferences?: boolean;
  persistenceKey?: string;
  onPreferenceError?: (error: PersistentStateError) => void;
  searchPlaceholder?: string;
  className?: string;
}

const validTheme = (value: unknown): value is SidebarDemoTheme => value === 'dark' || value === 'light';
const defaultItems: SidebarDemoItem[] = [
  { id: 'overview', label: 'Overview', icon: '◉', content: <p>Your workspace overview. Replace items to connect application navigation.</p> },
  { id: 'projects', label: 'Projects', icon: '▦', content: <p>Project notes and resources appear here.</p> },
];

function BrandMark() {
  return (
    <span aria-hidden="true" className="grid size-8 place-items-center rounded-md bg-primary text-xs font-bold text-primary-fg">
      A
    </span>
  );
}

/** Working fixture-driven navigation composition. Search stays local; routes and content are host replaceable. */
export function SidebarDemo({
  items = defaultItems,
  initialItemId,
  activeItemId,
  onNavigate,
  brand,
  header,
  footer,
  renderContent,
  renderItemBody,
  theme,
  defaultTheme = 'dark',
  onThemeChange,
  collapsed,
  defaultCollapsed,
  onCollapsedChange,
  persistPreferences = false,
  persistenceKey,
  onPreferenceError,
  searchPlaceholder = 'Search navigation',
  className,
}: SidebarDemoProps) {
  const generatedId = useId();
  const storageKey = persistenceKey ?? `abmex-sidebar-demo${generatedId}`;
  const [storedTheme, setStoredTheme] = usePersistentState<SidebarDemoTheme>({
    initialValue: defaultTheme,
    key: persistPreferences && theme === undefined ? `${storageKey}:theme` : undefined,
    validate: validTheme,
    onError: onPreferenceError,
  });
  const [localActiveId, setLocalActiveId] = useState(initialItemId ?? items[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const activeId = activeItemId ?? localActiveId;
  const activeItem = items.find(item => item.id === activeId) ?? items[0];
  const currentTheme = theme ?? storedTheme;
  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return items;
    return items.filter(item =>
      [item.label, item.group, item.description, ...(item.keywords ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalized),
    );
  }, [items, query]);
  const groups = useMemo(() => {
    const ordered = new Map<string, SidebarDemoItem[]>();
    for (const item of visibleItems) {
      const group = item.group ?? 'Workspace';
      ordered.set(group, [...(ordered.get(group) ?? []), item]);
    }
    return ordered;
  }, [visibleItems]);

  function selectItem(item: SidebarDemoItem) {
    if (activeItemId === undefined) setLocalActiveId(item.id);
    onNavigate?.(item);
  }

  function setTheme(nextTheme: SidebarDemoTheme) {
    if (theme === undefined) setStoredTheme(nextTheme);
    onThemeChange?.(nextTheme);
  }

  return (
    <div data-theme={currentTheme} className={`flex min-h-0 min-w-0 overflow-hidden bg-bg text-fg ${className ?? ''}`}>
      <Sidebar
        collapseToIcons
        aria-label="Workspace navigation"
        collapsed={collapsed}
        defaultCollapsed={defaultCollapsed}
        onCollapsedChange={onCollapsedChange}
        showToggle={false}
        slotProps={{ rail: { 'aria-label': 'Resize workspace navigation' } }}
        persistence={persistPreferences ? { key: `${storageKey}:sidebar`, onError: onPreferenceError } : undefined}
      >
        <SidebarHeader className="flex items-center justify-between gap-2">
          {header ?? (
            <div className="flex min-w-0 items-center gap-3">
              {brand ?? <BrandMark />}
              <span className="truncate text-sm font-semibold text-fg-strong">Northstar Studio</span>
            </div>
          )}
          <SidebarTrigger aria-label="Toggle navigation width" />
        </SidebarHeader>
        <SidebarContent>
          <label className="mx-3 my-3 flex h-9 items-center gap-2 rounded-md border border-border bg-field px-3 text-xs text-fg-muted">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search navigation"
              className="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted"
              value={query}
              onChange={event => setQuery(event.currentTarget.value)}
              placeholder={searchPlaceholder}
            />
          </label>
          {groups.size === 0 ? (
            <p className="px-4 py-5 text-sm text-fg-muted">No navigation matches “{query}”.</p>
          ) : [...groups].map(([group, groupItems]) => (
            <SidebarGroup key={group}>
              <SidebarGroupLabel>{group}</SidebarGroupLabel>
              {groupItems.map(item => (
                <SidebarItem
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  active={item.id === activeItem?.id}
                  onClick={() => selectItem(item)}
                  children={renderItemBody?.(item) ?? item.children}
                />
              ))}
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter>
          {footer ?? (
            <div className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-surface-3 text-xs font-semibold text-fg-strong">MS</span>
                <span className="truncate text-xs text-fg-muted">Mira Santos</span>
              </div>
              <button
                type="button"
                className="rounded px-2 py-1 text-xs text-fg-muted hover:bg-surface-2 hover:text-fg-strong focus-visible:outline-2 focus-visible:outline-focus"
                aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} theme`}
                onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
              >
                {currentTheme === 'dark' ? '☼' : '◐'}
              </button>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
      {activeItem ? (
        <ContentPane
          eyebrow={activeItem.group ?? 'Workspace'}
          title={activeItem.label}
          description={activeItem.description}
          footer={persistPreferences ? 'Sidebar width and theme preference are stored on this device.' : 'Fixture navigation · no network requests'}
        >
          {renderContent ? renderContent(activeItem) : activeItem.content}
        </ContentPane>
      ) : (
        <ContentPane title="No navigation items" description="Add a fixture item or pass host content to get started." />
      )}
    </div>
  );
}
