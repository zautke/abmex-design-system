import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { cn } from '../../utils/cn';

// Phosphor tab system. React + --ph-* roles only — no component-library import in\n// this family, so a tabs consumer needs only react + lucide-react.

export type TabsOrientation = 'horizontal' | 'vertical';

interface TabsContextValue {
  value: string | undefined;
  select: (value: string) => void;
  orientation: TabsOrientation;
}

const TabsContext = createContext<TabsContextValue | null>(null);

/** Optional access, for parts (Switcher) that also work outside a Tabs root. */
export const useTabsOptional = () => useContext(TabsContext);

function useTabs(part: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<Tabs.${part}> must be rendered inside <Tabs>`);
  return ctx;
}

const TabContext = createContext<{ value: string; selected: boolean; color?: string; dirty?: boolean } | null>(null);

export const focusRing =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ph-focus)]';
export const motion = 'transition-colors duration-[var(--ph-duration)] ease-[var(--ph-ease)] motion-reduce:transition-none';
const mono = 'font-[family-name:var(--ph-font-mono)]';

/** Keep both ends of long names visible: "quarterly-rep…draft-v3.md". */
export function middleTruncate(text: string, max = 24): string {
  if (text.length <= max) return text;
  const head = Math.ceil((max - 1) / 2);
  return `${text.slice(0, head)}…${text.slice(text.length - (max - 1 - head))}`;
}

// ── Root ──────────────────────────────────────────────────────────────────
export interface TabsProps extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: TabsOrientation;
}

function TabsRoot({ value, defaultValue, onValueChange, orientation = 'horizontal', className, ...rest }: TabsProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const select = (next: string) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };
  return (
    <TabsContext.Provider value={{ value: current, select, orientation }}>
      <div
        data-orientation={orientation}
        className={cn('flex min-h-0', orientation === 'horizontal' ? 'flex-col' : 'flex-row', className)}
        {...rest}
      />
    </TabsContext.Provider>
  );
}

/** Roving tabindex: arrows move focus along the tablist, Home/End jump. */
function onListKeyDown(e: KeyboardEvent<HTMLElement>, orientation: TabsOrientation) {
  const prev = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
  const next = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
  if (![prev, next, 'Home', 'End'].includes(e.key)) return;
  const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'));
  const i = tabs.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  const to = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === next ? 1 : -1) + tabs.length) % tabs.length;
  tabs[to]?.focus();
  tabs[to]?.click();
}

// ── Direction B: Sheets ───────────────────────────────────────────────────
export interface TabsSheetListProps extends ComponentPropsWithRef<'div'> {
  /** Slot after the tabs, e.g. the New control. */
  after?: ReactNode;
  'aria-label'?: string;
}

function SheetList({ after, className, children, ref, 'aria-label': ariaLabel = 'Documents', ...rest }: TabsSheetListProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const measure = () => {
    const el = scroller.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft > 0, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 });
  };
  useEffect(() => {
    measure();
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);
  const scrollBy = (dir: number) => scroller.current?.scrollBy({ left: dir * 176, behavior: 'smooth' });
  const arrow = (dir: number, show: boolean, Icon: typeof ChevronLeft, label: string) =>
    show && (
      <button
        type="button"
        aria-label={label}
        tabIndex={-1}
        onClick={() => scrollBy(dir)}
        className={cn('grid size-9 shrink-0 place-items-center text-ph-fg-sage hover:text-ph-fg', motion, focusRing)}
      >
        <Icon className="size-4" aria-hidden />
      </button>
    );
  return (
    <div ref={ref} className={cn('flex items-end bg-ph-surface pt-1.5 px-1.5', className)} {...rest}>
      {arrow(-1, edges.start, ChevronLeft, 'Scroll tabs left')}
      <div
        ref={scroller}
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        onScroll={measure}
        onKeyDown={(e) => onListKeyDown(e, 'horizontal')}
        className="flex min-w-0 flex-1 items-end gap-0.5 overflow-x-auto [scrollbar-width:none]"
      >
        {children}
      </div>
      {arrow(1, edges.end, ChevronRight, 'Scroll tabs right')}
      {after && <div className="flex h-9 shrink-0 items-center pl-1">{after}</div>}
    </div>
  );
}

// ── Direction D: Rail ─────────────────────────────────────────────────────
export interface TabsRailProps extends Omit<ComponentPropsWithRef<'nav'>, 'title'> {
  title?: ReactNode;
  filter?: string;
  onFilterChange?: (filter: string) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Slot under the header, e.g. the New control. */
  after?: ReactNode;
  'aria-label'?: string;
}

function Rail({
  title = 'Documents',
  filter,
  onFilterChange,
  collapsed = false,
  onCollapsedChange,
  after,
  className,
  children,
  'aria-label': ariaLabel = 'Documents',
  ...rest
}: TabsRailProps) {
  const Toggle = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <nav
      className={cn(
        'flex shrink-0 flex-col border-r border-ph-border bg-ph-surface',
        collapsed ? 'w-12' : 'w-[280px]',
        className,
      )}
      {...rest}
    >
      <div className="flex h-9 items-center gap-2 px-2">
        {!collapsed && <span className="flex-1 truncate text-sm font-semibold text-ph-fg-strong">{title}</span>}
        {onCollapsedChange && (
          <button
            type="button"
            aria-label={collapsed ? 'Expand document rail' : 'Collapse document rail'}
            aria-expanded={!collapsed}
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn('grid size-8 place-items-center rounded-[var(--ph-radius)] text-ph-fg-sage hover:bg-ph-surface-2 hover:text-ph-fg', motion, focusRing)}
          >
            <Toggle className="size-4" aria-hidden />
          </button>
        )}
      </div>
      {!collapsed && onFilterChange && (
        <div className="px-2 pb-2">
          <input
            type="search"
            value={filter ?? ''}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Filter documents"
            aria-label="Filter documents"
            className={cn(
              'h-9 w-full rounded-[var(--ph-radius)] border border-ph-border bg-ph-field px-2.5 text-sm text-ph-fg placeholder:text-ph-fg-muted',
              motion,
              focusRing,
            )}
          />
        </div>
      )}
      {!collapsed && after && <div className="px-2 pb-2">{after}</div>}
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="vertical"
        hidden={collapsed}
        onKeyDown={(e) => onListKeyDown(e, 'vertical')}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2 pb-2"
      >
        {children}
      </div>
    </nav>
  );
}

export interface TabsRailGroupProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  label: ReactNode;
  /** Shown in mono after the label, e.g. a count. */
  meta?: ReactNode;
}

function RailGroup({ label, meta, className, children, ...rest }: TabsRailGroupProps) {
  return (
    <div role="presentation" className={cn('flex flex-col gap-0.5', className)} {...rest}>
      <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-wide text-ph-fg-muted">
        <span>{label}</span>
        {meta !== undefined && <span className={mono}>{meta}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Tab + parts ───────────────────────────────────────────────────────────
export interface TabsTabProps extends ComponentPropsWithRef<'div'> {
  value: string;
  /** Kind colour (plugin tabColor); tints the Chip. */
  color?: string;
  /** Unsaved changes: Close shows a dot until hovered. */
  dirty?: boolean;
}

function TabRoot({ value, color, dirty, className, children, onClick, onKeyDown, ...rest }: TabsTabProps) {
  const { value: active, select, orientation } = useTabs('Tab');
  const selected = active === value;
  const horizontal = orientation === 'horizontal';
  return (
    <TabContext.Provider value={{ value, selected, color, dirty }}>
      <div
        role="tab"
        id={`tab-${value}`}
        aria-selected={selected}
        aria-controls={`panel-${value}`}
        tabIndex={selected ? 0 : -1}
        data-selected={selected || undefined}
        onClick={(e) => {
          select(value);
          onClick?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              select(value);
            }
          }
          onKeyDown?.(e);
        }}
        className={cn(
          'group relative flex shrink-0 cursor-pointer select-none items-center gap-2 text-sm',
          motion,
          focusRing,
          horizontal
            ? 'h-9 w-[176px] rounded-t-[var(--ph-radius)] px-2.5'
            : 'min-h-9 w-full flex-wrap rounded-[var(--ph-radius)] px-2 py-1.5',
          selected
            ? 'bg-ph-surface-2 text-ph-fg-strong'
            : 'text-ph-fg-sage hover:bg-ph-surface-2/60 hover:text-ph-fg',
          // Active indicator: mint bar on the top edge (sheets) / left edge (rail).
          selected &&
            (horizontal
              ? 'before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:rounded-t-[var(--ph-radius)] before:bg-ph-primary'
              : 'before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:bg-ph-primary'),
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    </TabContext.Provider>
  );
}

function useTab(part: string) {
  const ctx = useContext(TabContext);
  if (!ctx) throw new Error(`<Tabs.Tab.${part}> must be rendered inside <Tabs.Tab>`);
  return ctx;
}

export interface TabsTabLabelProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  children: string;
  /** Enables inline rename on double-click; called with the trimmed new name. */
  onRename?: (name: string) => void;
  /** Characters kept by middle truncation. */
  max?: number;
}

function TabLabel({ children, onRename, max, className, ...rest }: TabsTabLabelProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(children);
  const commit = () => {
    setEditing(false);
    const name = draft.trim();
    if (name && name !== children) onRename?.(name);
  };
  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        aria-label="Rename document"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        onFocus={(e) => e.currentTarget.select()}
        className="h-6 min-w-0 flex-1 rounded-[var(--ph-radius)] border border-ph-primary bg-ph-field px-1 text-sm text-ph-fg outline-none"
      />
    );
  }
  return (
    <span
      title={children}
      onDoubleClick={
        onRename &&
        (() => {
          setDraft(children);
          setEditing(true);
        })
      }
      className={cn('min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap', className)}
      {...rest}
    >
      {middleTruncate(children, max)}
    </span>
  );
}

export interface TabsTabChipProps extends ComponentPropsWithRef<'span'> {}

function TabChip({ className, style, ...rest }: TabsTabChipProps) {
  const { color } = useTab('Chip');
  return (
    <span
      className={cn(
        'shrink-0 rounded-[var(--ph-radius)] border px-1 text-[10px] leading-4 uppercase',
        mono,
        !color && 'border-ph-border text-ph-fg-muted',
        className,
      )}
      style={color ? { color, borderColor: `color-mix(in oklab, ${color} 45%, transparent)`, ...style } : style}
      {...rest}
    />
  );
}

export interface TabsTabMetaProps extends ComponentPropsWithRef<'span'> {}

/** Second line in the rail: "Markdown · 2m ago". */
function TabMeta({ className, ...rest }: TabsTabMetaProps) {
  return <span className={cn('basis-full truncate text-xs text-ph-fg-muted', mono, className)} {...rest} />;
}

export interface TabsTabCloseProps extends Omit<ComponentPropsWithRef<'button'>, 'onClick'> {
  onClose: () => void;
}

function TabClose({ onClose, className, ...rest }: TabsTabCloseProps) {
  const { dirty } = useTab('Close');
  return (
    <button
      type="button"
      aria-label={dirty ? 'Close document (unsaved changes)' : 'Close document'}
      tabIndex={-1}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className={cn(
        'relative grid size-5 shrink-0 place-items-center rounded-[var(--ph-radius)] text-ph-fg-muted hover:bg-ph-surface-3 hover:text-ph-fg',
        motion,
        focusRing,
        !dirty && 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-data-[selected]:opacity-100',
        className,
      )}
      {...rest}
    >
      {dirty && <span aria-hidden className="size-2 rounded-full bg-ph-primary group-hover:hidden" />}
      <X aria-hidden className={cn('size-3.5', dirty && 'hidden group-hover:block')} />
    </button>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────
export interface TabsPanelProps extends ComponentPropsWithRef<'div'> {
  value: string;
  /** Keep the panel mounted while hidden (editor state, scroll). Default true. */
  keepMounted?: boolean;
}

function Panel({ value, keepMounted = true, className, children, ...rest }: TabsPanelProps) {
  const { value: active } = useTabs('Panel');
  const selected = active === value;
  if (!selected && !keepMounted) return null;
  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      hidden={!selected}
      tabIndex={0}
      className={cn('min-h-0 min-w-0 flex-1 bg-ph-surface-2', focusRing, className)}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── Orientation toggle (B ⇄ D) ────────────────────────────────────────────
export interface TabsOrientationToggleProps extends Omit<ComponentPropsWithRef<'div'>, 'onChange'> {
  value: TabsOrientation;
  onValueChange: (value: TabsOrientation) => void;
  labels?: Record<TabsOrientation, ReactNode>;
  'aria-label'?: string;
}

function OrientationToggle({
  value,
  onValueChange,
  labels = { horizontal: 'Sheets', vertical: 'Rail' },
  className,
  'aria-label': ariaLabel = 'Tab layout',
  ...rest
}: TabsOrientationToggleProps) {
  const options: TabsOrientation[] = ['horizontal', 'vertical'];
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        const next = value === 'horizontal' ? 'vertical' : 'horizontal';
        onValueChange(next);
        e.currentTarget.querySelector<HTMLElement>(`[data-value="${next}"]`)?.focus();
      }}
      className={cn('inline-flex h-9 rounded-[var(--ph-radius)] border border-ph-border bg-ph-field p-0.5', className)}
      {...rest}
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          data-value={o}
          aria-checked={value === o}
          tabIndex={value === o ? 0 : -1}
          onClick={() => onValueChange(o)}
          className={cn(
            'rounded-[calc(var(--ph-radius)-1px)] px-2.5 text-sm',
            motion,
            focusRing,
            value === o ? 'bg-ph-primary text-ph-primary-fg' : 'text-ph-fg-sage hover:text-ph-fg',
          )}
        >
          {labels[o]}
        </button>
      ))}
    </div>
  );
}

const Tab = Object.assign(TabRoot, { Label: TabLabel, Close: TabClose, Chip: TabChip, Meta: TabMeta });

export { TabsRoot, SheetList, Rail, RailGroup, Tab, Panel, OrientationToggle, onListKeyDown };
