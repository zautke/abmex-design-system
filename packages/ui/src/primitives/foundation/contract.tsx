import { createContext, createElement, useContext, useMemo } from 'react';
import type { ComponentPropsWithRef, ComponentType, CSSProperties, ElementType, ReactElement, ReactNode, Ref, RefCallback } from 'react';
import { cn } from '../../utils/cn';
import type { TextProps } from './Text';
import type { IconProps } from './Icon';
import type { ButtonProps } from './Button';
import type { IconButtonProps } from './IconButton';
import type { BaseLayoutContainerProps } from './BaseLayoutContainer';
import type { LayoutContainerProps } from '../../components/layout/LayoutContainer';
import type { SidebarOptions, SidebarProps } from '../../components/sidebar/Sidebar';
import type { SidebarSearchFormProps } from '../../components/sidebar-search/RecipeSearchSidebarDemo';

export type StateValue<T, S> = T | ((state: S) => T);
export type PrimitiveName = 'Text' | 'Icon' | 'Button' | 'IconButton' | 'BaseLayoutContainer' | 'LayoutContainer' | 'Sidebar' | 'SidebarSearchForm';
export interface PrimitiveState { unstyled: boolean }
export interface PartAppearance<S, P extends string = 'root'> {
  unstyled?: boolean;
  classNames?: Partial<Record<P, StateValue<string, S>>>;
  styles?: Partial<Record<P, StateValue<CSSProperties, S>>>;
}
type RootCallbackProps<C extends ElementType, Excluded extends keyof ComponentPropsWithRef<C>> =
  Partial<Omit<ComponentPropsWithRef<C>, Excluded>> & Partial<Record<Excluded, never>>;
export type RootContract<C extends ElementType, S, CallbackExcluded extends keyof ComponentPropsWithRef<C> = never> = {
  /** Replacement receives target props and must honor as and forward ref. */
  slots?: { root?: ComponentType<ComponentPropsWithRef<C> & { as?: C }> };
  slotProps?: { root?: Partial<ComponentPropsWithRef<C>> | ((state: S) => RootCallbackProps<C, CallbackExcluded>) };
};
export type PrimitiveProps<C extends ElementType, Own, S, CallbackExcluded extends keyof ComponentPropsWithRef<C> = never> = Own & RootContract<C, S, CallbackExcluded> &
  { as?: C } & Omit<ComponentPropsWithRef<NoInfer<C>>, keyof Own | 'as' | 'slots' | 'slotProps'>;
export interface PrimitiveComponent<D extends ElementType, Own, S, CallbackExcluded extends PropertyKey = never> {
  <C extends ElementType>(props: PrimitiveProps<C, Own, S, Extract<CallbackExcluded, keyof ComponentPropsWithRef<C>>> & { as: C }): ReactElement;
  (props: PrimitiveProps<D, Own, S, Extract<CallbackExcluded, keyof ComponentPropsWithRef<D>>>): ReactElement;
}

// Internal erased boundary: public component signatures retain target-specific props.
export type PropBag = Record<string, unknown>;
export function resolveState<T, S>(value: StateValue<T, S> | undefined, state: S): T | undefined {
  return typeof value === 'function' ? (value as (state: S) => T)(state) : value;
}

/** Later props win; all handlers run in override-first order until cancelled. */
export function mergePartProps(...layers: Array<PropBag | undefined>): PropBag {
  const out: PropBag = {};
  for (const layer of layers) {
    if (!layer) continue;
    for (const [key, value] of Object.entries(layer)) {
      if (value === undefined) continue;
      const prior = out[key];
      if (key === 'className') out[key] = cn(prior as string, value as string);
      else if (key === 'ref' && prior && value) out[key] = composeRefs(prior as Ref<unknown>, value as Ref<unknown>);
      else if (key === 'style') out[key] = { ...prior as CSSProperties, ...value as CSSProperties };
      else if (/^on[A-Z]/.test(key) && typeof prior === 'function' && typeof value === 'function') {
        out[key] = (event: { defaultPrevented?: boolean }, ...args: unknown[]) => {
          value(event, ...args);
          if (!event.defaultPrevented) prior(event, ...args);
        };
      } else out[key] = value;
    }
  }
  return out;
}

/** Supports object refs, legacy callbacks, and React 19 callback cleanup. */
interface RefCacheNode { children: WeakMap<object, RefCacheNode>; callback?: RefCallback<unknown> }
const EMPTY_REF = {};
const refCache: RefCacheNode = { children: new WeakMap() };
export function composeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  let cache = refCache;
  for (const ref of refs) {
    const key = (ref ?? EMPTY_REF) as object;
    let next = cache.children.get(key);
    if (!next) cache.children.set(key, next = { children: new WeakMap() });
    cache = next;
  }
  if (cache.callback) return cache.callback as RefCallback<T>;
  const callback: RefCallback<T> = node => {
    const cleanups = refs.map(ref => {
      if (typeof ref === 'function') {
        const cleanup = ref(node);
        return typeof cleanup === 'function' ? cleanup : () => { ref(null); };
      }
      if (ref) ref.current = node;
      return () => { if (ref) ref.current = null; };
    });
    return () => { for (const cleanup of cleanups) cleanup(); };
  };
  cache.callback = callback as RefCallback<unknown>;
  return callback;
}

export interface ComponentDefaultOptions {
  Text: { tone?: 'inherit' | 'muted' | 'strong'; truncate?: boolean };
  Icon: { size?: 'sm' | 'md' | 'lg' };
  Button: { size?: 'sm' | 'md' | 'lg'; variant?: 'solid' | 'outline' | 'ghost' };
  IconButton: ComponentDefaultOptions['Button'];
  BaseLayoutContainer: { display?: 'block' | 'flex' | 'grid'; direction?: 'row' | 'column'; gap?: CSSProperties['gap']; overflow?: CSSProperties['overflow']; contain?: CSSProperties['contain'] };
  LayoutContainer: ComponentDefaultOptions['BaseLayoutContainer'];
  Sidebar: SidebarOptions;
  SidebarSearchForm: Record<string, never>;
}
export interface ComponentPropMap {
  Text: TextProps; Icon: IconProps; Button: ButtonProps; IconButton: IconButtonProps;
  BaseLayoutContainer: BaseLayoutContainerProps; LayoutContainer: LayoutContainerProps; Sidebar: SidebarProps;
  SidebarSearchForm: SidebarSearchFormProps;
}
export type ComponentDefaults = { [K in PrimitiveName]?: Partial<ComponentPropMap[K]> };

function mergeComponentProps(base: PropBag = {}, override: PropBag = {}, name?: PrimitiveName): PropBag {
  const out = mergePartProps(base, override);
  out.options = { ...base.options as object, ...override.options as object };
  out.slots = { ...base.slots as object, ...override.slots as object };
  for (const channel of ['classNames', 'styles', 'slotProps']) {
    const a = base[channel] as PropBag | undefined;
    const b = override[channel] as PropBag | undefined;
    const parts: PropBag = { ...a, ...b };
    for (const key of Object.keys(parts)) {
      if (a?.[key] === undefined || b?.[key] === undefined) continue;
      const merge = (state: PrimitiveState) => {
        const first = resolveState(a[key] as StateValue<unknown, PrimitiveState>, state);
        const last = resolveState(b[key] as StateValue<unknown, PrimitiveState>, state);
        if (channel === 'classNames') return cn(first as string, last as string);
        if (channel === 'styles') return { ...first as object, ...last as object };
        return mergePartProps(first as PropBag, last as PropBag);
      };
      parts[key] = typeof a[key] === 'function' || typeof b[key] === 'function'
        ? merge : merge({ unstyled: false });
    }
    out[channel] = parts;
  }
  if ((name === 'Button' || name === 'IconButton') && typeof (out.slotProps as PropBag | undefined)?.root === 'function') {
    const baseRoot = ((base.slotProps as PropBag | undefined)?.root ?? {}) as PropBag;
    const overrideRoot = ((override.slotProps as PropBag | undefined)?.root ?? {}) as PropBag;
    const rootDefaults = { ...baseRoot, ...overrideRoot };
    if (override.disabled !== undefined) out.disabled = override.disabled;
    else if (overrideRoot.disabled !== undefined) out.disabled = overrideRoot.disabled;
    else if (out.disabled === undefined && rootDefaults.disabled !== undefined) out.disabled = rootDefaults.disabled;
    if (override['aria-disabled'] !== undefined) out['aria-disabled'] = override['aria-disabled'];
    else if (overrideRoot['aria-disabled'] !== undefined) out['aria-disabled'] = overrideRoot['aria-disabled'];
    else if (out['aria-disabled'] === undefined && rootDefaults['aria-disabled'] !== undefined) out['aria-disabled'] = rootDefaults['aria-disabled'];
  }
  return out;
}
const DefaultsContext = createContext<ComponentDefaults>({});
export function ComponentDefaultsProvider({ defaults, children }: { defaults: ComponentDefaults; children?: ReactNode }) {
  const parent = useContext(DefaultsContext);
  const value = useMemo(() => {
    const merged = { ...parent };
    for (const key of Object.keys(defaults) as PrimitiveName[]) {
      merged[key] = mergeComponentProps(parent[key] as PropBag, defaults[key] as PropBag, key) as never;
    }
    return merged;
  }, [parent, defaults]);
  return <DefaultsContext value={value}>{children}</DefaultsContext>;
}
export function useComponentDefaults<K extends PrimitiveName>(name: K) { return useContext(DefaultsContext)[name]; }
export function useComponentProps<P extends object>(name: PrimitiveName, props: P): P {
  return mergeComponentProps(useComponentDefaults(name) as PropBag, props as PropBag, name) as P;
}

export interface RenderProps extends PropBag {
  as?: ElementType;
  slots?: { root?: ElementType };
  slotProps?: { root?: StateValue<PropBag, PrimitiveState> };
  classNames?: { root?: StateValue<string, PrimitiveState> };
  styles?: { root?: StateValue<CSSProperties, PrimitiveState> };
  ref?: Ref<unknown>;
  unstyled?: boolean;
}
export function useRoot<S extends PrimitiveState>(props: RenderProps, state: S, defaultTarget: ElementType, defaults: PropBag = {}) {
  const { as, slots, slotProps, classNames, styles, unstyled: _unstyled, ...native } = props;
  const target = as ?? defaultTarget;
  const part = resolveState(slotProps?.root, state);
  const ref = useMemo(() => composeRefs(native.ref, part?.ref as Ref<unknown>), [native.ref, part?.ref]);
  const merged = mergePartProps(defaults, native, part, {
    className: resolveState(classNames?.root, state), style: resolveState(styles?.root, state),
  });
  merged.ref = ref;
  merged['data-slot'] ??= 'root';
  if (slots?.root) merged.as = target;
  return { target, props: merged, render: (next: PropBag = merged) => createElement(slots?.root ?? target, next) };
}
