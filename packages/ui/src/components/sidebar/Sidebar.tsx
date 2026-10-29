import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import type {
  ComponentPropsWithRef,
  ComponentType,
  CSSProperties,
  ElementType,
  HTMLAttributes,
  MouseEventHandler,
  PointerEvent as ReactPointerEvent,
  ReactElement,
  ReactNode,
  Ref,
} from 'react';
import { useControllableState, usePersistentState } from '../../hooks/usePersistentState';
import type { UsePersistentStateOptions } from '../../hooks/usePersistentState';
import { cn } from '../../utils/cn';
import { composeRefs, mergePartProps, useComponentProps } from '../../primitives/foundation/contract';
import { Icon as FoundationIcon } from '../../primitives/foundation/Icon';
import { Text as FoundationText } from '../../primitives/foundation/Text';

export type SidebarSide = 'left' | 'right';
export type SidebarPart = 'root' | 'header' | 'content' | 'footer' | 'group' | 'groupLabel' | 'item' | 'itemBody' | 'itemAction' | 'interactiveContent' | 'trigger' | 'rail';
export interface SidebarState {
  collapsed: boolean;
  width: number;
  side: SidebarSide;
  unstyled: boolean;
}

export interface SidebarPersistence extends Pick<UsePersistentStateOptions<SidebarStoredState>, 'key' | 'version' | 'storage' | 'migrate' | 'validate' | 'onError' | 'syncAcrossTabs'> {}
export interface SidebarStoredState { collapsed: boolean; width: number }
export interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (next: boolean | ((current: boolean) => boolean)) => void;
  toggleCollapsed: () => void;
  width: number;
  setWidth: (next: number | ((current: number) => number)) => void;
  side: SidebarSide;
  minWidth: number;
  maxWidth: number;
  collapsedWidth: number;
  collapsible: boolean;
  collapseToIcons: boolean;
  contentId: string;
  unstyled: boolean;
  slots?: SidebarSlots<any>;
  slotProps?: SidebarSlotProps;
  classNames?: SidebarClassNames;
  styles?: SidebarStyles;
  options?: SidebarOptions;
}
export interface SidebarOptions extends Partial<Pick<SidebarOwnProps, 'minWidth' | 'maxWidth' | 'collapsedWidth' | 'collapsible' | 'collapseToIcons' | 'side' | 'showToggle' | 'showRail' | 'defaultCollapsed' | 'defaultWidth'>> {}

export interface SidebarSlots<C extends ElementType = 'nav'> {
  root?: ComponentType<ComponentPropsWithRef<C> & { as?: C }>;
  header?: ElementType;
  content?: ElementType;
  footer?: ElementType;
  group?: ElementType;
  groupLabel?: ElementType;
  item?: ElementType;
  itemBody?: ElementType;
  itemAction?: ElementType;
  interactiveContent?: ElementType;
  trigger?: ElementType;
  rail?: ElementType;
}
type SidebarSlotValue<P> = P | ((state: SidebarState) => P | undefined);
export type SidebarSlotProps<C extends ElementType = 'nav'> = {
  root?: SidebarSlotValue<Partial<ComponentPropsWithRef<C>>>;
} & Partial<Record<Exclude<SidebarPart, 'root'>, SidebarSlotValue<HTMLAttributes<HTMLElement>>>>;
export type SidebarClassNames = Partial<Record<SidebarPart, string | ((state: SidebarState) => string | undefined)>>;
export type SidebarStyles = Partial<Record<SidebarPart, CSSProperties | ((state: SidebarState) => CSSProperties | undefined)>>;

export interface SidebarOwnProps<C extends ElementType = 'nav'> {
  children?: ReactNode;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  width?: number;
  defaultWidth?: number;
  onWidthChange?: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  collapsedWidth?: number;
  collapsible?: boolean;
  collapseToIcons?: boolean;
  side?: SidebarSide;
  persistence?: SidebarPersistence;
  showToggle?: boolean;
  showRail?: boolean;
  unstyled?: boolean;
  slots?: SidebarSlots<C>;
  slotProps?: SidebarSlotProps<C>;
  classNames?: SidebarClassNames;
  styles?: SidebarStyles;
}
export type SidebarProps<C extends ElementType = 'nav'> = SidebarOwnProps<C> &
  { as?: C } & Omit<ComponentPropsWithRef<C>, keyof SidebarOwnProps<C> | 'as' | 'ref'> & { ref?: ComponentPropsWithRef<C>['ref'] };

const SidebarContext = createContext<SidebarContextValue | null>(null);
const DEFAULT_MIN_WIDTH = 200;
const DEFAULT_MAX_WIDTH = 480;
const DEFAULT_WIDTH = 280;
const DEFAULT_COLLAPSED_WIDTH = 64;
const sidebarClasses: Record<SidebarPart, string> = {
  root: 'relative flex h-full min-h-0 flex-col border-border bg-surface text-fg',
  header: 'flex shrink-0 items-center gap-2 border-b border-border p-2',
  content: 'min-h-0 flex-1 overflow-y-auto p-2',
  footer: 'shrink-0 border-t border-border p-2',
  group: 'mb-3',
  groupLabel: 'px-2 py-1 text-xs font-medium text-fg-muted',
  item: 'flex w-full items-center rounded-md text-sm text-fg',
  itemBody: 'flex min-w-0 flex-1 items-center gap-2',
  itemAction: 'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-2 focus-visible:outline-focus',
  interactiveContent: 'ml-auto shrink-0',
  trigger: 'inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-focus',
  rail: 'absolute inset-y-0 z-10 w-1 cursor-col-resize touch-none bg-transparent hover:bg-primary/40 focus-visible:bg-primary/40 focus-visible:outline-focus',
};
const sidebarStructure: Record<SidebarPart, string> = {
  root: 'relative flex h-full min-h-0 flex-col', header: 'flex shrink-0 items-center',
  content: 'min-h-0 flex-1 overflow-y-auto', footer: 'shrink-0', group: '', groupLabel: '',
  item: 'flex w-full items-center', itemBody: 'flex min-w-0 flex-1 items-center',
  itemAction: 'flex min-w-0 flex-1 items-center', interactiveContent: 'ml-auto shrink-0',
  trigger: 'inline-flex size-8 shrink-0 items-center justify-center',
  rail: 'absolute inset-y-0 z-10 w-1 cursor-col-resize touch-none',
};
const defaultValidate = (value: unknown): value is SidebarStoredState => !!value && typeof value === 'object' &&
  typeof (value as SidebarStoredState).collapsed === 'boolean' &&
  Number.isFinite((value as SidebarStoredState).width);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
function stateValue<T>(value: T | ((state: SidebarState) => T | undefined) | undefined, state: SidebarState): T | undefined {
  return typeof value === 'function' ? (value as (state: SidebarState) => T | undefined)(state) : value;
}
function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('Sidebar parts must be rendered inside <Sidebar>.');
  return context;
}

export function useSidebar(): SidebarContextValue {
  return useSidebarContext();
}

function partProps(part: Exclude<SidebarPart, 'root'>, context: SidebarContextValue, extraClass?: string, defaultProps?: Record<string, unknown>) {
  const state: SidebarState = { collapsed: context.collapsed, width: context.width, side: context.side, unstyled: context.unstyled };
  return mergePartProps(
    { 'data-slot': part, className: cn(sidebarStructure[part], context.unstyled ? undefined : sidebarClasses[part], stateValue(context.classNames?.[part], state), extraClass), style: stateValue(context.styles?.[part], state) },
    stateValue(context.slotProps?.[part] as SidebarSlotValue<Record<string, unknown>> | undefined, state),
    defaultProps,
  );
}

function SidebarRoot<C extends ElementType = 'nav'>(input: SidebarProps<C>) {
  const props = useComponentProps('Sidebar', input);
  const {
  children,
  as,
  collapsed,
  defaultCollapsed = props.options?.defaultCollapsed ?? false,
  onCollapsedChange,
  width,
  defaultWidth = props.options?.defaultWidth ?? DEFAULT_WIDTH,
  onWidthChange,
  minWidth = props.options?.minWidth ?? DEFAULT_MIN_WIDTH,
  maxWidth = props.options?.maxWidth ?? DEFAULT_MAX_WIDTH,
  collapsedWidth = props.options?.collapsedWidth ?? DEFAULT_COLLAPSED_WIDTH,
  collapsible = props.options?.collapsible ?? true,
  collapseToIcons = props.options?.collapseToIcons ?? false,
  side = props.options?.side ?? 'left',
  persistence,
  showToggle = props.options?.showToggle ?? true,
  showRail = props.options?.showRail ?? true,
  unstyled = false,
  slots,
  slotProps,
  classNames,
  styles,
  options: _options,
  className,
  style,
  id,
  ref,
  ...native
  } = props;
  const generatedId = useId();
  const contentId = id ? `${id}-content` : `sidebar-content-${generatedId}`;
  const min = Math.max(1, minWidth);
  const max = Math.max(min, maxWidth);
  const collapsedSize = clamp(collapsedWidth, 1, min);
  const defaultSize = clamp(defaultWidth, min, max);
  const [stored, setStored] = usePersistentState<SidebarStoredState>({
    initialValue: { collapsed: defaultCollapsed, width: defaultSize },
    key: persistence?.key,
    version: persistence?.version,
    storage: persistence?.storage,
    migrate: persistence?.migrate,
    validate: persistence?.validate ?? defaultValidate,
    onError: persistence?.onError,
    syncAcrossTabs: persistence?.syncAcrossTabs,
  });
  const [controlledCollapsed, setControlledCollapsed] = useControllableState({
    value: collapsed ?? stored.collapsed,
    defaultValue: defaultCollapsed,
    onChange: onCollapsedChange,
  });
  const [controlledWidth, setControlledWidth] = useControllableState({
    value: width === undefined ? stored.width : clamp(width, min, max),
    defaultValue: defaultSize,
    onChange: onWidthChange,
  });
  const currentWidth = clamp(controlledWidth, min, max);
  const setCollapsed = useCallback((next: boolean | ((current: boolean) => boolean)) => {
    const value = typeof next === 'function' ? next(controlledCollapsed) : next;
    controlledCollapsed === value || setControlledCollapsed(value);
    if (collapsed === undefined) setStored(current => ({ ...current, collapsed: value }));
  }, [collapsed, controlledCollapsed, setControlledCollapsed, setStored]);
  const setWidth = useCallback((next: number | ((current: number) => number)) => {
    const value = clamp(typeof next === 'function' ? next(currentWidth) : next, min, max);
    currentWidth === value || setControlledWidth(value);
    if (width === undefined) setStored(current => ({ ...current, width: value }));
  }, [currentWidth, max, min, setControlledWidth, setStored, width]);
  const toggleCollapsed = useCallback(() => setCollapsed(value => !value), [setCollapsed]);
  const context = useMemo<SidebarContextValue>(() => ({
    collapsed: controlledCollapsed,
    setCollapsed,
    toggleCollapsed,
    width: currentWidth,
    setWidth,
    side,
    minWidth: min,
    maxWidth: max,
    collapsedWidth: collapsedSize,
    collapsible,
    collapseToIcons,
    contentId,
    unstyled,
    slots,
    slotProps,
    classNames,
    styles,
  }), [controlledCollapsed, setCollapsed, toggleCollapsed, currentWidth, setWidth, side, min, max, collapsedSize, collapsible, collapseToIcons, contentId, unstyled, slots, slotProps, classNames, styles]);
  const state: SidebarState = { collapsed: controlledCollapsed, width: currentWidth, side, unstyled };
  const Root = slots?.root ?? as ?? 'nav';
  const rootSlot = stateValue(slotProps?.root as SidebarSlotValue<Record<string, unknown>> | undefined, state);
  const mergedRoot = mergePartProps(
    { 'data-slot': 'root', 'data-sidebar-side': side, 'data-sidebar-collapsed': controlledCollapsed, 'aria-label': 'Sidebar', className: cn(sidebarStructure.root, unstyled ? undefined : sidebarClasses.root, stateValue(classNames?.root, state), className), style: { width: controlledCollapsed ? collapsedSize : currentWidth, flex: '0 0 auto', ...stateValue(styles?.root, state), ...style } },
    native as Record<string, unknown>,
    rootSlot,
  );
  mergedRoot.ref = composeRefs((native as { ref?: Ref<HTMLElement> }).ref, rootSlot?.ref as Ref<HTMLElement> | undefined, ref);
  if (slots?.root) mergedRoot.as = as ?? 'nav';
  return (
    <SidebarContext value={context}>
      {createElement(Root as ElementType, mergedRoot as any,
        showToggle && collapsible ? <SidebarTrigger aria-controls={contentId} /> : null,
        children,
        showRail ? <SidebarRail /> : null,
      )}
    </SidebarContext>
  );
}

export const Sidebar = SidebarRoot;

export type SidebarElementProps<C extends ElementType = 'div'> = Omit<ComponentPropsWithRef<C>, 'part' | 'as' | 'ref'> & {
  as?: C;
  ref?: ComponentPropsWithRef<C>['ref'];
  children?: ReactNode;
};
function SidebarPartComponent<C extends ElementType = 'div'>({ part, as, children, className, style, ref, ...props }: SidebarElementProps<C> & { part: Exclude<SidebarPart, 'root'> }) {
  const context = useSidebarContext();
  const Component = as ?? context.slots?.[part] ?? 'div';
  const merged = partProps(part, context, className, { ...props, style: { ...partProps(part, context).style as CSSProperties, ...style }, ref });
  return createElement(Component, merged, children);
}

export function SidebarHeader<C extends ElementType = 'div'>(props: SidebarElementProps<C>) {
  return <SidebarPartComponent part="header" {...props} />;
}
export function SidebarContent<C extends ElementType = 'div'>({ children, hidden: _hidden, inert: _inert, 'aria-hidden': _ariaHidden, ...props }: SidebarElementProps<C>) {
  const context = useSidebarContext();
  const hidden = context.collapsed && !context.collapseToIcons;
  return createElement(SidebarPartComponent as ComponentType<any>, {
    part: 'content', ...props, id: context.contentId, 'aria-hidden': hidden || undefined, hidden, inert: hidden,
  }, children);
}
export function SidebarFooter<C extends ElementType = 'div'>(props: SidebarElementProps<C>) {
  return <SidebarPartComponent part="footer" {...props} />;
}
export function SidebarGroup<C extends ElementType = 'div'>(props: SidebarElementProps<C>) {
  return <SidebarPartComponent part="group" role="group" {...props} />;
}
export function SidebarGroupLabel<C extends ElementType = 'div'>(props: SidebarElementProps<C>) {
  return <SidebarPartComponent part="groupLabel" {...props} />;
}

export interface IconLabelOwnProps<C extends ElementType = 'span'> {
  icon?: ReactNode;
  label?: ReactNode;
  collapsed?: boolean;
  unstyled?: boolean;
  slots?: { root?: ComponentType<ComponentPropsWithRef<C> & { as?: C }>; icon?: ElementType; label?: ElementType };
  slotProps?: { root?: Partial<ComponentPropsWithRef<C>>; icon?: HTMLAttributes<HTMLElement>; label?: HTMLAttributes<HTMLElement> };
  classNames?: Partial<Record<'root' | 'icon' | 'label', string>>;
  styles?: Partial<Record<'root' | 'icon' | 'label', CSSProperties>>;
}
export type IconLabelProps<C extends ElementType = 'span'> = IconLabelOwnProps<C> & { as?: C; ref?: ComponentPropsWithRef<C>['ref'] } &
  Omit<ComponentPropsWithRef<C>, keyof IconLabelOwnProps<C> | 'as' | 'ref'>;
export function IconLabel<C extends ElementType = 'span'>({ icon, label, collapsed = false, unstyled = false, slots, slotProps, classNames, styles, as, ref, className, ...props }: IconLabelProps<C>) {
  const Root = slots?.root ?? as ?? 'span';
  const Icon = slots?.icon ?? FoundationIcon;
  const Label = slots?.label ?? FoundationText;
  const rootProps = mergePartProps({ 'data-slot': 'root', className: cn('inline-flex min-w-0 items-center', !unstyled && 'gap-2', classNames?.root, className), style: styles?.root }, slotProps?.root as Record<string, unknown> | undefined, props as Record<string, unknown>, { ref });
  if (slots?.root) rootProps.as = as ?? 'span';
  rootProps.ref = composeRefs(ref, slotProps?.root?.ref as Ref<unknown> | undefined);
  return createElement(Root as ElementType, rootProps as any,
    icon == null ? null : createElement(Icon, mergePartProps({ ...(!slots?.icon && { unstyled }), 'data-slot': 'icon', 'aria-hidden': true, className: cn('inline-flex shrink-0 items-center justify-center', classNames?.icon), style: styles?.icon }, slotProps?.icon as Record<string, unknown> | undefined), icon),
    label == null ? null : createElement(Label, mergePartProps({ ...(!slots?.label && { unstyled }), 'data-slot': 'label', className: cn('min-w-0 truncate', classNames?.label), style: styles?.label }, slotProps?.label as Record<string, unknown> | undefined, { hidden: collapsed, inert: collapsed }), label),
  );
}

export interface SidebarItemOwnProps {
  label?: ReactNode;
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  children?: ReactNode;
  /** Separate trailing control. Consumer must provide its own action and accessible name. */
  interactiveContent?: ReactNode;
  slots?: { body?: ElementType; action?: ElementType; interactiveContent?: ElementType };
  slotProps?: { body?: HTMLAttributes<HTMLElement>; action?: HTMLAttributes<HTMLElement>; interactiveContent?: HTMLAttributes<HTMLElement> };
}
export type SidebarItemProps<C extends ElementType = 'button'> = SidebarItemOwnProps & {
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  as?: C;
  ref?: ComponentPropsWithRef<C>['ref'];
} & Omit<ComponentPropsWithRef<C>, keyof SidebarItemOwnProps | 'href' | 'onClick' | 'as' | 'ref'>;
export function SidebarItem(props: SidebarItemProps<'a'> & { href: string; as?: 'a' }): ReactElement;
export function SidebarItem(props: SidebarItemProps<'button'> & { href?: undefined; as?: 'button' }): ReactElement;
export function SidebarItem<C extends ElementType>(props: SidebarItemProps<C> & { as: C }): ReactElement;
export function SidebarItem({ label, icon, active = false, disabled = false, href, onClick, children, interactiveContent, as, ref, slots, slotProps, className, ...props }: SidebarItemProps<any>) {
  const context = useSidebarContext();
  const isCollapsed = context.collapsed && context.collapseToIcons;
  const Component = as ?? context.slots?.item ?? (href ? 'a' : 'button');
  const state: SidebarState = { collapsed: context.collapsed, width: context.width, side: context.side, unstyled: context.unstyled };
  const itemClass = cn(sidebarStructure.item, context.unstyled ? undefined : sidebarClasses.item, active && !context.unstyled && 'bg-primary/10 text-primary', stateValue(context.classNames?.item, state), className);
  const itemDefaults: Record<string, unknown> = href
    ? { href, 'aria-current': active ? 'page' : undefined, 'aria-disabled': disabled || undefined, tabIndex: disabled ? -1 : undefined }
    : { type: 'button', 'aria-current': active ? 'page' : undefined, disabled };
  if (isCollapsed && typeof label === 'string') itemDefaults['aria-label'] = label;
  const item = mergePartProps(itemDefaults, props as Record<string, unknown>, stateValue(context.slotProps?.itemAction as SidebarSlotValue<Record<string, unknown>> | undefined, state), slotProps?.action as Record<string, unknown> | undefined, {
    'data-slot': 'itemAction', className: cn(sidebarStructure.itemAction, context.unstyled ? undefined : sidebarClasses.itemAction, stateValue(context.classNames?.itemAction, state)),
    style: stateValue(context.styles?.itemAction, state), onClick: disabled ? (event: React.MouseEvent<HTMLElement>) => event.preventDefault() : onClick, ref,
  });
  if (disabled) {
    item['aria-disabled'] = true;
    if (href) item.tabIndex = -1;
    else item.disabled = true;
  }
  const Body = slots?.body ?? context.slots?.itemBody ?? 'span';
  const Primary = slots?.action ?? Component;
  const body = children ?? <IconLabel icon={icon} label={label} collapsed={isCollapsed} unstyled={context.unstyled} />;
  const bodyProps = mergePartProps({ 'data-slot': 'itemBody', className: cn(context.unstyled ? undefined : sidebarClasses.itemBody, stateValue(context.classNames?.itemBody, state)), style: stateValue(context.styles?.itemBody, state), title: isCollapsed && typeof label === 'string' ? label : undefined }, stateValue(context.slotProps?.itemBody as SidebarSlotValue<Record<string, unknown>> | undefined, state), slotProps?.body as Record<string, unknown> | undefined);
  const row = mergePartProps({ 'data-slot': 'item', className: itemClass, style: stateValue(context.styles?.item, state) }, stateValue(context.slotProps?.item as SidebarSlotValue<Record<string, unknown>> | undefined, state));
  const Interactive = slots?.interactiveContent ?? context.slots?.interactiveContent ?? 'span';
  const interactiveProps = mergePartProps({ 'data-slot': 'interactiveContent', className: cn(context.unstyled ? undefined : sidebarClasses.interactiveContent, stateValue(context.classNames?.interactiveContent, state)), style: stateValue(context.styles?.interactiveContent, state) }, stateValue(context.slotProps?.interactiveContent as SidebarSlotValue<Record<string, unknown>> | undefined, state), slotProps?.interactiveContent as Record<string, unknown> | undefined);
  return createElement('div', row,
    createElement(Primary, item, createElement(Body, bodyProps, body)),
    interactiveContent == null ? null : createElement(Interactive, interactiveProps, interactiveContent),
  );
}

export type SidebarTriggerProps<C extends ElementType = 'button'> = Omit<ComponentPropsWithRef<C>, 'as' | 'ref' | 'children' | 'onClick'> & {
  children?: ReactNode;
  as?: C;
  ref?: ComponentPropsWithRef<C>['ref'];
  onClick?: MouseEventHandler<HTMLElement>;
};
export function SidebarTrigger<C extends ElementType = 'button'>({ children, as, ref, onClick, className, ...props }: SidebarTriggerProps<C>) {
  const context = useSidebarContext();
  const Component = as ?? context.slots?.trigger ?? 'button';
  const state: SidebarState = { collapsed: context.collapsed, width: context.width, side: context.side, unstyled: context.unstyled };
  const slot = stateValue(context.slotProps?.trigger as SidebarSlotValue<Record<string, unknown>> | undefined, state);
  const slotOnClick = slot?.onClick as ((event: React.MouseEvent<HTMLElement>) => void) | undefined;
  const defaultName = context.collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  const triggerProps = partProps('trigger', context, className, {
    type: 'button', 'aria-label': props['aria-label'] ?? (children == null ? defaultName : undefined), 'aria-expanded': !context.collapsed,
    'aria-controls': context.contentId,
    ref, ...props,
  });
  triggerProps.onClick = (event: React.MouseEvent<HTMLElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) slotOnClick?.(event);
    if (!event.defaultPrevented && !triggerProps.disabled && context.collapsible) context.toggleCollapsed();
  };
  return createElement(Component, triggerProps, children ?? (context.collapsed ? '›' : '‹'));
}

export type SidebarRailProps<C extends ElementType = 'div'> = Omit<ComponentPropsWithRef<C>, 'as' | 'ref' | 'onPointerDown' | 'onKeyDown'> & {
  as?: C;
  ref?: ComponentPropsWithRef<C>['ref'];
  label?: string;
  step?: number;
  onPointerDown?: React.PointerEventHandler<HTMLElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLElement>;
};
export function SidebarRail<C extends ElementType = 'div'>({ as, ref, label = 'Sidebar width', step = 10, onPointerDown, onKeyDown, className, ...props }: SidebarRailProps<C>) {
  const context = useSidebarContext();
  const dragging = useRef<{ pointerId: number; originX: number; originWidth: number } | null>(null);
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), []);
  const Component = as ?? context.slots?.rail ?? 'div';
  const state: SidebarState = { collapsed: context.collapsed, width: context.width, side: context.side, unstyled: context.unstyled };
  const slot = stateValue(context.slotProps?.rail as SidebarSlotValue<Record<string, unknown>> | undefined, state);
  const slotPointerDown = slot?.onPointerDown as ((event: React.PointerEvent<HTMLElement>) => void) | undefined;
  const slotKeyDown = slot?.onKeyDown as ((event: React.KeyboardEvent<HTMLElement>) => void) | undefined;
  const changeByKey = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    const unit = event.shiftKey ? step * 5 : step;
    if (event.key === 'Home') context.setWidth(context.minWidth);
    else if (event.key === 'End') context.setWidth(context.maxWidth);
    else if (event.key === 'ArrowLeft') context.setWidth(width => width + (context.side === 'left' ? (event.shiftKey ? -unit : -unit) : unit));
    else if (event.key === 'ArrowRight') context.setWidth(width => width + (context.side === 'left' ? unit : -unit));
    else return;
    event.preventDefault();
  };
  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.defaultPrevented || event.button !== 0) return;
    cleanup.current?.();
    dragging.current = { pointerId: event.pointerId, originX: event.clientX, originWidth: context.width };
    const move = (next: PointerEvent) => {
      const origin = dragging.current;
      if (!origin || next.pointerId !== origin.pointerId) return;
      const direction = context.side === 'left' ? 1 : -1;
      context.setWidth(origin.originWidth + (next.clientX - origin.originX) * direction);
    };
    const stop = (next: PointerEvent) => {
      if (dragging.current?.pointerId !== next.pointerId) return;
      dragging.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      cleanup.current = null;
    };
    cleanup.current = () => {
      dragging.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
  };
  const railProps = mergePartProps({ style: { [context.side === 'left' ? 'right' : 'left']: 0 } }, partProps('rail', context, className, {
    ...props, role: 'separator', tabIndex: 0, 'aria-orientation': 'vertical', 'aria-label': props['aria-label'] ?? label,
    'aria-valuemin': context.minWidth, 'aria-valuemax': context.maxWidth, 'aria-valuenow': context.width,
    'aria-controls': context.contentId,
    ref,
  }));
  railProps.onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    onPointerDown?.(event);
    if (!event.defaultPrevented) slotPointerDown?.(event);
    if (!event.defaultPrevented) startDrag(event);
  };
  railProps.onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (!event.defaultPrevented) slotKeyDown?.(event);
    if (!event.defaultPrevented) changeByKey(event);
  };
  return createElement(Component, railProps);
}
