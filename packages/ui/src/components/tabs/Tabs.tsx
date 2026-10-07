import {
  Children,
  cloneElement,
  createContext,
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
import { ChevronLeft, ChevronRight, MoveHorizontal, MoveVertical, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useOverflowEdges } from '../../hooks/useOverflowEdges';
import { ButtonGroupContext } from '../button-group/ButtonGroup';

// Phosphor tab system. React + --* roles only — no component-library import in
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
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]';
export const motion = 'transition-colors duration-[var(--duration)] ease-[var(--ease)] motion-reduce:transition-none';
const mono = 'font-[family-name:var(--font-mono)]';

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
        data-slot="tabs"
        // Folder frame: the folder colour wraps the paper pane on the open sides (the strip/rail is the closed side).
        className={cn(
          'flex min-h-0 bg-folder p-1.5',
          orientation === 'horizontal' ? 'flex-col pt-0' : 'flex-row pl-0',
          className,
        )}
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
  const list = useRef<HTMLDivElement>(null);
  const ready = useListReady();
  const items = usePresence(children, resolveMotion(motionPref) !== 'none');
  // Overflow edges drive the arrows and, via data-overflow-*, the scroller's mask-fade.
  const { ref: setScroller, edges, node: scroller } = useOverflowEdges('x');
  useRovingFallback(list);
  useWheelToHorizontal(scroller);
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
          'grid shrink-0 place-items-center text-fg-sage',
          density === 'compact' ? 'size-8' : 'size-9',
          motion,
          focusRing,
          enabled ? 'hover:text-fg' : 'cursor-default opacity-40',
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
      className={cn('flex items-end bg-folder pt-1.5', className)}
      {...rest}
    >
      {arrow(-1, edges.start, ChevronLeft, 'Scroll tabs left')}
      <div ref={setScroller} data-slot="scroller" className="mask-fade min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
        {/* Inline padding = the flare width, so the end tabs' flares are not clipped by the scroller. */}
        <div
          ref={list}
          role="tablist"
          data-slot="tablist"
          data-orientation="horizontal"
          aria-label={ariaLabel}
          aria-orientation="horizontal"
          onKeyDown={(e) => onListKeyDown(e, 'horizontal')}
          className="flex w-max items-end px-[var(--tab-flare)]"
        >
          <ListContext.Provider value={ready}>{items}</ListContext.Provider>
        </div>
      </div>
      {arrow(1, edges.end, ChevronRight, 'Scroll tabs right')}
      {after && (
        <div className={cn('flex shrink-0 items-center gap-1 pl-1', density === 'compact' ? 'h-8' : 'h-9')}>
          <span aria-hidden data-slot="separator" className="h-5 border-l border-border" />
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
  const { ref: setList, node: list } = useOverflowEdges('y');
  const ready = useListReady();
  const items = usePresence(children, resolveMotion(motionPref) !== 'none');
  useRovingFallback(list);
  const Toggle = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <nav
      className={cn(
        'flex shrink-0 flex-col bg-folder',
        collapsed ? 'w-12' : 'w-[280px]',
        className,
      )}
      {...rest}
    >
      <div className="flex h-9 items-center gap-2 px-2">
        {!collapsed && <span className="flex-1 truncate text-sm font-semibold text-fg-strong">{title}</span>}
        {onCollapsedChange && (
          <button
            type="button"
            aria-label={collapsed ? 'Expand document rail' : 'Collapse document rail'}
            aria-expanded={!collapsed}
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn('grid size-8 place-items-center rounded-[var(--radius)] text-fg-sage hover:bg-surface-2 hover:text-fg', motion, focusRing)}
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
              'h-9 w-full rounded-[var(--radius)] border border-border bg-field px-2.5 text-sm text-fg placeholder:text-fg-muted',
              motion,
              focusRing,
            )}
          />
        </div>
      )}
      {!collapsed && after && (
        <>
          <div className="px-2 pb-2">{after}</div>
          <div aria-hidden data-slot="separator" className="mx-2 mb-2 border-t border-border" />
        </>
      )}
      <div
        ref={setList}
        role="tablist"
        data-slot="tablist"
        data-orientation="vertical"
        aria-label={ariaLabel}
        aria-orientation="vertical"
        hidden={collapsed}
        onKeyDown={(e) => onListKeyDown(e, 'vertical')}
        className="mask-fade mask-fade-x-0 mask-fade-y-6 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-2 pb-2"
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
      <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">
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
  /** Kind colour (plugin tabColor): tints the indicator, Chip and any `data-slot="icon"` child. */
  color?: string;
  /** Unsaved changes: Close shows a dot until hovered. */
  dirty?: boolean;
  /** Not selectable, skipped by arrow keys, Close hidden. */
  disabled?: boolean;
}

const triggerFocusRing =
  'has-[[data-slot=tab-trigger]:focus-visible]:outline-2 has-[[data-slot=tab-trigger]:focus-visible]:outline-offset-2 has-[[data-slot=tab-trigger]:focus-visible]:outline-[var(--focus)]';

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
          // --tab-bg: the paper this tab opens; --tab-ind: indicator colour (kind colour or primary).
          '[--tab-bg:var(--paper)] [--tab-ind:var(--tab-color,var(--primary))]',
          compact ? 'text-xs' : 'text-sm',
          motion,
          triggerFocusRing,
          horizontal
            ? cn(
                'min-w-[var(--tab-min-width,7rem)] max-w-[var(--tab-max-width,15rem)] items-center rounded-t-[var(--tab-flare)]',
                compact ? 'h-8 px-2' : 'h-9 px-2.5',
              )
            : cn('w-full items-start rounded-[var(--radius)]', compact ? 'min-h-8 px-2 py-1' : 'min-h-9 px-2 py-1.5'),
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          selected
            ? 'bg-[var(--tab-bg)] text-fg-strong'
            : cn(
                'text-fg-sage',
                !disabled && 'hover:bg-[color-mix(in_oklab,var(--paper)_50%,var(--folder))] hover:text-fg',
              ),
          // Active indicator: inset top edge (sheets) / left edge (rail).
          selected && (horizontal ? 'shadow-[inset_0_2px_0_0_var(--tab-ind)]' : 'shadow-[inset_2px_0_0_0_var(--tab-ind)]'),
          // Folder tab: the selected sheet sits on top of its neighbours and flares out at its foot
          // into the pane (concave quarter-circles in --tab-bg), so tab and paper read as one sheet.
          selected &&
            horizontal &&
            cn(
              'z-10',
              'before:absolute before:bottom-0 before:left-[calc(-1_*_var(--tab-flare))] before:size-[var(--tab-flare)]',
              'before:bg-[radial-gradient(circle_at_0_0,transparent_calc(var(--tab-flare)_-_0.5px),var(--tab-bg)_var(--tab-flare))]',
              'after:absolute after:bottom-0 after:right-[calc(-1_*_var(--tab-flare))] after:size-[var(--tab-flare)]',
              'after:bg-[radial-gradient(circle_at_100%_0,transparent_calc(var(--tab-flare)_-_0.5px),var(--tab-bg)_var(--tab-flare))]',
            ),
          // Inactive sheets: hairline divider on the left, except first and right after the selected tab.
          !selected &&
            horizontal &&
            'before:absolute before:inset-y-2.5 before:left-0 before:w-px before:bg-folder-edge first:before:hidden [[data-selected]+&]:before:hidden',
          color && '[&_[data-slot=icon]]:text-[var(--tab-color)]',
          // Windows high contrast drops backgrounds and box-shadows: outline the selected tab, hide
          // the flares (their gradient would paint the light paper colour), keep dividers as GrayText.
          selected &&
            'forced-colors:outline forced-colors:outline-2 forced-colors:-outline-offset-2 forced-colors:outline-[Highlight] forced-colors:before:hidden forced-colors:after:hidden',
          !selected && 'forced-colors:before:[forced-color-adjust:none] forced-colors:before:bg-[GrayText]',          className,
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
  /** Opt into middle truncation, keeping this many characters. Default: CSS end-ellipsis at the tab's width. */
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
        className="h-6 min-w-0 flex-1 rounded-[var(--radius)] border border-primary bg-field px-1 text-sm text-fg outline-none"
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
      {max === undefined ? children : middleTruncate(children, max)}
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
        'shrink-0 rounded-[var(--radius)] px-1 text-[10px] leading-4 font-medium uppercase',
        mono,
        !color && 'bg-surface-3 text-fg-sage',
        className,
      )}
      // Filled kind chip: a tint of the kind colour, text pulled toward fg-strong so it stays legible.
      style={
        color
          ? {
              color: `color-mix(in oklab, ${color} 55%, var(--fg-strong))`,
              backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)`,
              ...style,
            }
          : style
      }
      {...rest}
    />
  );
}

export interface TabsTabMetaProps extends ComponentPropsWithRef<'span'> {}

/** Second line in the rail: "Markdown · 2m ago". */
function TabMeta({ className, ...rest }: TabsTabMetaProps) {
  // Wraps under the label (vertical triggers flex-wrap); after an icon it indents by the icon
  // width (--tab-icon-size, default 0.875rem) plus the trigger gap so it aligns with the label.
  return (
    <span
      data-slot="meta"
      className={cn(
        'basis-full truncate text-xs text-fg-muted',
        '[[data-slot=icon]~&]:ps-[calc(var(--tab-icon-size,0.875rem)+0.5rem)]',
        mono,
        className,
      )}
      {...rest}
    />
  );
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
        'relative grid size-5 shrink-0 place-items-center rounded-[var(--radius)] text-fg-muted hover:bg-surface-3 hover:text-fg',
        motion,
        focusRing,
        !dirty && closeVisibility[visibility],
        'forced-colors:text-[ButtonText]',
        className,
      )}
      {...rest}
    >
      {dirty && <span aria-hidden className="size-2 rounded-full bg-primary group-hover:hidden forced-colors:bg-[ButtonText]" />}
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
      // Paper lying on the folder frame (Tabs root).
      className={cn('min-h-0 min-w-0 flex-1 rounded-[var(--radius)] bg-paper shadow-surface', focusRing, className)}
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
  /** Visible content per option. Defaults to lucide MoveHorizontal / MoveVertical icons. */
  labels?: Record<TabsOrientation, ReactNode>;
  /** Accessible name (and tooltip) per option; the default labels are icons. */
  itemLabels?: Record<TabsOrientation, string>;
  'aria-label'?: string;
}

function OrientationToggle({
  value,
  onValueChange,
  labels = {
    horizontal: <MoveHorizontal aria-hidden className="size-4" />,
    vertical: <MoveVertical aria-hidden className="size-4" />,
  },
  itemLabels = { horizontal: 'Horizontal tabs', vertical: 'Vertical tabs' },
  className,
  'aria-label': ariaLabel = 'Tab layout',
  ...rest
}: TabsOrientationToggleProps) {
  const options: TabsOrientation[] = ['horizontal', 'vertical'];
  // Inside a ButtonGroup the group draws the frame and the radios become flush segments.
  const grouped = useContext(ButtonGroupContext);
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
      className={cn(
        'inline-flex',
        grouped ? 'divide-x divide-border' : 'rounded-[var(--radius)] border border-border bg-field',
        className,
      )}
      {...rest}
    >
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          data-value={o}
          aria-checked={value === o}
          aria-label={itemLabels[o]}
          title={itemLabels[o]}
          tabIndex={value === o ? 0 : -1}
          onClick={() => onValueChange(o)}
          className={cn(
            'grid size-9 place-items-center text-sm',
            !grouped && 'first:rounded-l-[calc(var(--radius)-1px)] last:rounded-r-[calc(var(--radius)-1px)]',
            motion,
            focusRing,
            value === o ? 'bg-primary-soft text-primary-soft-fg' : 'text-fg-sage hover:bg-surface-2 hover:text-fg',
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
