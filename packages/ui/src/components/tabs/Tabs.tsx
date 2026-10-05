import {
  Children,
  cloneElement,
  createContext,
  useCallback,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type Key,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { cn } from '../../utils/cn';

// Phosphor tab system. React + --ph-* roles only — no component-library import in
// this family, so a tabs consumer needs only react + lucide-react.

export type TabsOrientation = 'horizontal' | 'vertical';
/** 'standard' animates; 'reduced' fades only; 'none' is instant. 'standard' drops to 'reduced' when the OS asks. */
export type TabsMotion = 'standard' | 'reduced' | 'none';
export type TabsDensity = 'compact' | 'comfortable';

interface TabsContextValue {
  value: string | undefined;
  select: (value: string) => void;
  orientation: TabsOrientation;
  /** Per-root prefix for tab/panel ids. */
  id: string;
  motion: TabsMotion;
  density: TabsDensity;
}

const TabsContext = createContext<TabsContextValue | null>(null);

/** Optional access, for parts (Switcher) that also work outside a Tabs root. */
export const useTabsOptional = () => useContext(TabsContext);

function useTabs(part: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<Tabs.${part}> must be rendered inside <Tabs>`);
  return ctx;
}

interface TabContextValue {
  value: string;
  selected: boolean;
  color?: string;
  dirty?: boolean;
  /** Text registered by Tab.Label; names the Close button. */
  label?: string;
  setLabel: (label: string) => void;
  trigger: RefObject<HTMLDivElement | null>;
}

const TabContext = createContext<TabContextValue | null>(null);

/** True once the enclosing list has mounted, so only tabs added later animate in. */
const ListContext = createContext<RefObject<boolean> | null>(null);
/** True inside a drag ghost: the clone renders no tab semantics, ids or tab stop. */
export const TabGhostContext = createContext(false);

export const focusRing =
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ph-focus)]';
export const motion = 'transition-colors duration-[var(--ph-duration)] ease-[var(--ph-ease)] motion-reduce:transition-none';
const mono = 'font-[family-name:var(--ph-font-mono)]';

const ENTER_MS = 180;
const EXIT_MS = 135;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const resolveMotion = (m: TabsMotion): TabsMotion => (m === 'standard' && prefersReducedMotion() ? 'reduced' : m);
const scrollBehavior = (m: TabsMotion): ScrollBehavior => (resolveMotion(m) === 'standard' ? 'smooth' : 'auto');

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
  /** Tab enter/exit and scroll animation. Default 'standard'. */
  motion?: TabsMotion;
  /** 'compact' = 32px tabs, 12px text. Default 'comfortable' (36px). */
  density?: TabsDensity;
}

function TabsRoot({
  value,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  motion: motionPref = 'standard',
  density = 'comfortable',
  className,
  ...rest
}: TabsProps) {
  const [inner, setInner] = useState(defaultValue);
  const id = useId();
  const current = value ?? inner;
  const select = (next: string) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };
  return (
    <TabsContext.Provider value={{ value: current, select, orientation, id, motion: motionPref, density }}>
      <div
        data-orientation={orientation}
        data-density={density}
        data-motion={motionPref}
        className={cn('flex min-h-0', orientation === 'horizontal' ? 'flex-col' : 'flex-row', className)}
        {...rest}
      />
    </TabsContext.Provider>
  );
}

/** Tabs reachable by keyboard: not disabled, not on their way out. */
const liveTabs = (root: Element | null | undefined) =>
  Array.from(root?.querySelectorAll<HTMLElement>('[role="tab"]:not([aria-disabled="true"])') ?? []).filter(
    (t) => !t.closest('[inert]'),
  );

/** Roving tabindex: arrows move focus along the tablist, Home/End jump. Disabled tabs are skipped. */
function onListKeyDown(e: KeyboardEvent<HTMLElement>, orientation: TabsOrientation) {
  // A handler further in (e.g. an active keyboard drag) already owns this key.
  if (e.defaultPrevented) return;
  const prev = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
  const next = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
  if (![prev, next, 'Home', 'End'].includes(e.key)) return;
  const tabs = liveTabs(e.currentTarget);
  const i = tabs.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  const to = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === next ? 1 : -1) + tabs.length) % tabs.length;
  tabs[to]?.focus();
  tabs[to]?.click();
}

/** Exactly one tab stop: the selected tab, or the first live tab when the selected one isn't rendered (e.g. filtered out). */
function useRovingFallback(list: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const tabs = Array.from(list.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []);
    const stop =
      tabs.find((t) => t.getAttribute('aria-selected') === 'true' && !t.closest('[inert]')) ?? liveTabs(list.current)[0];
    for (const t of tabs) t.tabIndex = t === stop ? 0 : -1;
  });
}

function useListReady() {
  const ready = useRef(false);
  useEffect(() => {
    ready.current = true;
  }, []);
  return ready;
}

/** Vertical wheel scrolls an overflowing horizontal strip; native horizontal gestures pass through. */
function useWheelToHorizontal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const { scrollWidth, clientWidth, scrollLeft } = el;
      if (scrollWidth <= clientWidth || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      // deltaMode: 0 pixel, 1 line, 2 page.
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? clientWidth : 1;
      const next = Math.max(0, Math.min(scrollWidth - clientWidth, scrollLeft + e.deltaY * unit));
      if (next === scrollLeft) return;
      el.scrollLeft = next;
      e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [ref]);
}

const keyOf = (n: ReactNode): Key | null => (isValidElement(n) ? n.key : null);

/**
 * Minimal presence: a keyed child that disappears stays rendered (with
 * `data-exiting`, which Tab turns into `inert` + exit animation) for EXIT_MS.
 * ponytail: render-time ref bookkeeping (idempotent under StrictMode); swap for a presence lib if lists need layout animation.
 */
function usePresence(children: ReactNode, enabled: boolean): ReactNode[] {
  const next = Children.toArray(children);
  const shown = useRef<ReactNode[]>(next);
  const expired = useRef(new Set<Key>());
  const timers = useRef(new Map<Key, ReturnType<typeof setTimeout>>());
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const live = new Set(next.map(keyOf));
  const out = [...next];
  if (enabled) {
    shown.current.forEach((child, i) => {
      const k = keyOf(child);
      if (k === null || live.has(k) || expired.current.has(k)) return;
      out.splice(Math.min(i, out.length), 0, cloneElement(child as ReactElement<Record<string, unknown>>, { 'data-exiting': '' }));
    });
  }
  shown.current = out;
  expired.current.clear();
  const exiting = out.map(keyOf).filter((k): k is Key => k !== null && !live.has(k));
  useEffect(() => {
    for (const [k, t] of timers.current) {
      if (!exiting.includes(k)) {
        clearTimeout(t);
        timers.current.delete(k);
      }
    }
    for (const k of exiting) {
      if (timers.current.has(k)) continue;
      timers.current.set(
        k,
        setTimeout(() => {
          timers.current.delete(k);
          expired.current.add(k);
          rerender();
        }, EXIT_MS),
      );
    }
  });
  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);
  return out;
}

/** Close a tab; if focus was inside it, hand focus to the neighbouring tab. */
function closeTab(trigger: HTMLElement | null, onClose: () => void) {
  const tabs = liveTabs(trigger?.closest('[role="tablist"]'));
  const refocus = !!trigger?.parentElement?.contains(document.activeElement);
  const i = trigger ? tabs.indexOf(trigger) : -1;
  onClose();
  if (refocus && i >= 0) (tabs[i + 1] ?? tabs[i - 1])?.focus();
}

// ── Direction B: Sheets ───────────────────────────────────────────────────
export interface TabsSheetListProps extends ComponentPropsWithRef<'div'> {
  /** Slot after the tabs, e.g. the New control. */
  after?: ReactNode;
  'aria-label'?: string;
  /** Narrowest a sheet tab may get (CSS length). Default 7rem. */
  tabMinWidth?: string;
  /** Widest a sheet tab may get (CSS length); longer labels truncate. Default 15rem. */
  tabMaxWidth?: string;
}

function SheetList({
  after,
  tabMinWidth,
  tabMaxWidth,
  className,
  style,
  children,
  ref,
  'aria-label': ariaLabel = 'Documents',
  ...rest
}: TabsSheetListProps) {
  const { motion: motionPref, density } = useTabs('SheetList');
  const scroller = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const ready = useListReady();
  const items = usePresence(children, resolveMotion(motionPref) !== 'none');
  const [edges, setEdges] = useState({ start: false, end: false });
  useRovingFallback(list);
  useWheelToHorizontal(scroller);
  // Overflow edges. A callback ref (React 19 cleanup form) binds the listeners to
  // whichever node is actually mounted, and a per-render layout pass re-measures
  // when tabs change; a mount-only effect could miss both.
  const measure = useRef<() => void>(() => {});
  const setScroller = useCallback((el: HTMLDivElement | null) => {
    scroller.current = el;
    if (!el) return;
    const run = () => {
      const start = el.scrollLeft > 1;
      const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setEdges((p) => (p.start === start && p.end === end ? p : { start, end }));
    };
    measure.current = run;
    run();
    el.addEventListener('scroll', run, { passive: true });
    const ro = new ResizeObserver(run);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener('scroll', run);
      ro.disconnect();
      measure.current = () => {};
    };
  }, []);
  useLayoutEffect(() => measure.current());
  const overflow = edges.start || edges.end;
  const arrow = (dir: -1 | 1, enabled: boolean, Icon: typeof ChevronLeft, label: string) =>
    overflow && (
      <button
        type="button"
        data-slot="arrow"
        aria-label={label}
        aria-disabled={!enabled || undefined}
        onClick={() => enabled && scroller.current?.scrollBy({ left: dir * 200, behavior: scrollBehavior(motionPref) })}
        className={cn(
          'grid shrink-0 place-items-center text-ph-fg-sage',
          density === 'compact' ? 'size-8' : 'size-9',
          motion,
          focusRing,
          enabled ? 'hover:text-ph-fg' : 'cursor-default opacity-40',
          'forced-colors:text-[ButtonText] forced-colors:aria-disabled:text-[GrayText]',
        )}
      >
        <Icon className="size-4" aria-hidden />
      </button>
    );
  return (
    <div
      ref={ref}
      style={{ '--tab-min-width': tabMinWidth, '--tab-max-width': tabMaxWidth, ...style } as CSSProperties}
      className={cn('flex items-end bg-ph-surface pt-1.5 px-1.5', className)}
      {...rest}
    >
      {arrow(-1, edges.start, ChevronLeft, 'Scroll tabs left')}
      <div ref={setScroller} data-slot="scroller" className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
        <div
          ref={list}
          role="tablist"
          data-slot="tablist"
          data-orientation="horizontal"
          aria-label={ariaLabel}
          aria-orientation="horizontal"
          onKeyDown={(e) => onListKeyDown(e, 'horizontal')}
          className="flex w-max items-end gap-0.5"
        >
          <ListContext.Provider value={ready}>{items}</ListContext.Provider>
        </div>
      </div>
      {arrow(1, edges.end, ChevronRight, 'Scroll tabs right')}
      {after && (
        <div className={cn('flex shrink-0 items-center gap-1 pl-1', density === 'compact' ? 'h-8' : 'h-9')}>
          <span aria-hidden data-slot="separator" className="h-5 border-l border-ph-border" />
          {after}
        </div>
      )}
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
  const { motion: motionPref } = useTabs('Rail');
  const list = useRef<HTMLDivElement>(null);
  const ready = useListReady();
  const items = usePresence(children, resolveMotion(motionPref) !== 'none');
  useRovingFallback(list);
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
      {!collapsed && after && (
        <>
          <div className="px-2 pb-2">{after}</div>
          <div aria-hidden data-slot="separator" className="mx-2 mb-2 border-t border-ph-border" />
        </>
      )}
      <div
        ref={list}
        role="tablist"
        data-slot="tablist"
        data-orientation="vertical"
        aria-label={ariaLabel}
        aria-orientation="vertical"
        hidden={collapsed}
        onKeyDown={(e) => onListKeyDown(e, 'vertical')}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2 pb-2"
      >
        <ListContext.Provider value={ready}>{items}</ListContext.Provider>
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
  const { motion: motionPref } = useTabs('RailGroup');
  const items = usePresence(children, resolveMotion(motionPref) !== 'none');
  return (
    <div role="presentation" className={cn('flex flex-col gap-0.5', className)} {...rest}>
      <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-wide text-ph-fg-muted">
        <span>{label}</span>
        {meta !== undefined && <span className={mono}>{meta}</span>}
      </div>
      {items}
    </div>
  );
}

// ── Tab + parts ───────────────────────────────────────────────────────────
export interface TabsTabProps extends ComponentPropsWithRef<'div'> {
  value: string;
  /** Kind colour (plugin tabColor): tints the active fill, stripes, Chip and any `data-slot="icon"` child. */
  color?: string;
  /** Unsaved changes: Close shows a dot until hovered. */
  dirty?: boolean;
  /** Not selectable, skipped by arrow keys, Close hidden. */
  disabled?: boolean;
}

const triggerFocusRing =
  'has-[[data-slot=tab-trigger]:focus-visible]:outline-2 has-[[data-slot=tab-trigger]:focus-visible]:outline-offset-2 has-[[data-slot=tab-trigger]:focus-visible]:outline-[var(--ph-focus)]';

/**
 * Outer wrapper (data-slot="tab": gets ref/style/rest, e.g. Sortable's drag
 * listeners) holding the role="tab" trigger and, as its sibling, the Close button.
 */
function TabRoot({ value, color, dirty, disabled, className, style, children, onClick, ref, ...rest }: TabsTabProps) {
  const ghost = useContext(TabGhostContext);
  const { value: active, select, orientation, id, motion: motionPref, density } = useTabs('Tab');
  const ready = useContext(ListContext);
  const [label, setLabel] = useState<string>();
  const node = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLDivElement>(null);
  const selected = active === value;
  const horizontal = orientation === 'horizontal';
  const compact = density === 'compact';
  const exiting = (rest as Record<string, unknown>)['data-exiting'] !== undefined;

  const parts = Children.toArray(children);
  const close = parts.find((c): c is ReactElement<TabsTabCloseProps> => isValidElement(c) && c.type === TabClose);
  const body = parts.filter((c) => c !== close);

  const setNode = (el: HTMLDivElement | null) => {
    node.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };

  // Enter: only tabs added after the list mounted.
  useLayoutEffect(() => {
    const el = node.current;
    const m = resolveMotion(motionPref);
    if (!el || typeof el.animate !== 'function' || m === 'none' || !ready?.current) return;
    const from = horizontal ? 'translateY(4px) scale(0.92)' : 'translateX(-4px) scale(0.92)';
    el.animate(m === 'standard' ? [{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }] : [{ opacity: 0 }, { opacity: 1 }], {
      duration: ENTER_MS,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  // Exit: usePresence keeps the tab mounted for EXIT_MS.
  useLayoutEffect(() => {
    const el = node.current;
    const m = resolveMotion(motionPref);
    if (!exiting || !el || typeof el.animate !== 'function' || m === 'none') return;
    el.animate(m === 'standard' ? [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.92)' }] : [{ opacity: 1 }, { opacity: 0 }], {
      duration: EXIT_MS,
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
      fill: 'forwards',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- exit only
  }, [exiting]);

  // Keep the selected tab visible in an overflowing strip/rail (selection changes, not first mount).
  useEffect(() => {
    if (selected && !exiting && ready?.current)
      node.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: scrollBehavior(motionPref) });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selection changes only
  }, [selected]);

  return (
    <TabContext.Provider value={{ value, selected, color, dirty, label, setLabel, trigger }}>
      <div
        ref={setNode}
        data-slot="tab"
        data-selected={selected || undefined}
        data-dirty={dirty || undefined}
        data-disabled={disabled || undefined}
        data-orientation={orientation}
        inert={exiting || undefined}
        onClick={(e) => {
          if (!disabled && !exiting) select(value);
          onClick?.(e);
        }}
        style={color ? ({ '--tab-color': color, ...style } as CSSProperties) : style}
        className={cn(
          'group relative flex shrink-0 select-none gap-2',
          compact ? 'text-xs' : 'text-sm',
          motion,
          triggerFocusRing,
          horizontal
            ? cn(
                'min-w-[var(--tab-min-width,7rem)] max-w-[var(--tab-max-width,15rem)] items-center rounded-t-[var(--ph-radius)]',
                compact ? 'h-8 px-2' : 'h-9 px-2.5',
              )
            : cn('w-full items-start rounded-[var(--ph-radius)]', compact ? 'min-h-8 px-2 py-1' : 'min-h-9 px-2 py-1.5'),
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          selected
            ? cn('text-ph-fg-strong', color ? 'bg-[color-mix(in_oklab,var(--tab-color)_7%,var(--ph-surface-2))]' : 'bg-ph-surface-2')
            : cn('text-ph-fg-sage', !disabled && 'hover:bg-ph-surface-2/60 hover:text-ph-fg'),
          // Active indicator: top edge (sheets) / left edge (rail), kind colour or primary.
          selected &&
            (horizontal
              ? 'before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:rounded-t-[var(--ph-radius)]'
              : 'before:absolute before:inset-y-1 before:left-0 before:w-0.5'),
          selected && (color ? 'before:bg-[var(--tab-color)]' : 'before:bg-ph-primary'),
          // Inactive sheet with a kind colour: muted bottom stripe.
          !selected &&
            color &&
            horizontal &&
            'after:absolute after:inset-x-1.5 after:bottom-0 after:h-0.5 after:bg-[color-mix(in_oklab,var(--tab-color)_35%,transparent)]',
          color && '[&_[data-slot=icon]]:text-[var(--tab-color)]',
          // Windows high contrast drops backgrounds: outline the selected tab, keep stripes as system colours.
          'forced-colors:before:[forced-color-adjust:none] forced-colors:after:[forced-color-adjust:none]',
          selected &&
            'forced-colors:outline forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight] forced-colors:before:bg-[Highlight]',
          !selected && color && 'forced-colors:after:bg-[GrayText]',
          className,
        )}
        {...rest}
      >
        <div
          ref={trigger}
          role={ghost ? undefined : 'tab'}
          data-slot="tab-trigger"
          id={ghost ? undefined : `${id}-tab-${value}`}
          aria-selected={ghost ? undefined : selected}
          aria-controls={ghost ? undefined : `${id}-panel-${value}`}
          aria-disabled={disabled || undefined}
          tabIndex={ghost ? -1 : selected ? 0 : -1}
          onKeyDown={(e) => {
            if (e.defaultPrevented || e.target !== e.currentTarget || disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              select(value);
            } else if (e.key === 'Delete' && close) {
              e.preventDefault();
              closeTab(trigger.current, close.props.onClose);
            }
          }}
          className={cn('flex min-w-0 flex-1 items-center gap-2 self-stretch outline-none', !horizontal && 'flex-wrap')}
        >
          {body}
        </div>
        {!disabled && close}
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
  const { setLabel, trigger } = useTab('Label');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(children);
  // Stops the blur that follows Enter/Escape from committing again.
  const done = useRef(false);
  useEffect(() => {
    setLabel(children);
  }, [children, setLabel]);
  const end = (save: boolean, refocus: boolean) => {
    if (done.current) return;
    done.current = true;
    const name = draft.trim();
    if (save && name && name !== children) onRename?.(name);
    setEditing(false);
    if (refocus) trigger.current?.focus();
  };
  if (editing) {
    return (
      <input
        autoFocus
        data-slot="label"
        value={draft}
        aria-label="Rename tab"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => end(true, false)}
        onClick={(e) => e.stopPropagation()}
        // Selecting text must never start a drag.
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') end(true, true);
          if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(children);
            end(false, true);
          }
        }}
        onFocus={(e) => e.currentTarget.select()}
        className="h-6 min-w-0 flex-1 rounded-[var(--ph-radius)] border border-ph-primary bg-ph-field px-1 text-sm text-ph-fg outline-none"
      />
    );
  }
  return (
    <span
      data-slot="label"
      title={children}
      onDoubleClick={
        onRename &&
        (() => {
          done.current = false;
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
      data-slot="chip"
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
  return <span data-slot="meta" className={cn('basis-full truncate text-xs text-ph-fg-muted', mono, className)} {...rest} />;
}

export interface TabsTabCloseProps extends Omit<ComponentPropsWithRef<'button'>, 'onClick'> {
  onClose: () => void;
  /** Name used in "Close {label} tab". Defaults to the Tab.Label text. */
  label?: string;
  /** When the button shows. 'hover' (default): on hover, focus-within, or when selected. */
  visibility?: 'hover' | 'always' | 'selected';
}

const closeVisibility = {
  hover: 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-data-[selected]:opacity-100',
  selected: 'opacity-0 focus-visible:opacity-100 group-data-[selected]:opacity-100',
  always: '',
} as const;

function TabClose({ onClose, label, visibility = 'hover', className, ...rest }: TabsTabCloseProps) {
  const { dirty, label: tabLabel, trigger } = useTab('Close');
  const name = label ?? tabLabel ?? 'this';
  return (
    <button
      type="button"
      data-slot="close"
      aria-label={dirty ? `Close ${name} tab (unsaved changes)` : `Close ${name} tab`}
      onClick={(e) => {
        e.stopPropagation();
        closeTab(trigger.current, onClose);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        // Native button activation; keep the key from the tab's own handlers (e.g. a keyboard drag sensor).
        if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
      }}
      className={cn(
        'relative grid size-5 shrink-0 place-items-center rounded-[var(--ph-radius)] text-ph-fg-muted hover:bg-ph-surface-3 hover:text-ph-fg',
        motion,
        focusRing,
        !dirty && closeVisibility[visibility],
        'forced-colors:text-[ButtonText]',
        className,
      )}
      {...rest}
    >
      {dirty && <span aria-hidden className="size-2 rounded-full bg-ph-primary group-hover:hidden forced-colors:bg-[ButtonText]" />}
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
  const { value: active, id } = useTabs('Panel');
  const selected = active === value;
  if (!selected && !keepMounted) return null;
  return (
    <div
      role="tabpanel"
      data-slot="panel"
      id={`${id}-panel-${value}`}
      aria-labelledby={`${id}-tab-${value}`}
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
