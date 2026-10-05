import { useEffect, useId, useRef, useState, type ComponentPropsWithRef, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { focusRing, motion, useTabsOptional } from './Tabs';

export interface SwitcherItem {
  value: string;
  label: string;
  /** Mono meta, e.g. "Markdown · 2m". */
  meta?: ReactNode;
  /** Kind colour (plugin tabColor). */
  color?: string;
}

export interface SwitcherGroup {
  label: string;
  items: SwitcherItem[];
}

export interface TabsSwitcherProps extends Omit<ComponentPropsWithRef<'div'>, 'onSelect'> {
  groups: SwitcherGroup[];
  /** Defaults to the enclosing Tabs value. */
  value?: string;
  /** Defaults to selecting in the enclosing Tabs. */
  onSelect?: (value: string) => void;
  /**
   * "Ctrl+K" style hint shown in the label and `aria-keyshortcuts`. The kit binds
   * no global keys: the consumer owns the shortcut (use `matchesShortcut` and the
   * controlled `open` / `onOpenChange`). `null` hides the hint.
   */
  shortcut?: string | null;
  /** Controlled open state; omit for uncontrolled. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  'aria-label'?: string;
}

/** True when a keydown matches a "Ctrl+K"-style shortcut (Ctrl or Meta). */
export function matchesShortcut(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey'>, shortcut: string) {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts.pop();
  const mod = parts.includes('ctrl') || parts.includes('mod') || parts.includes('meta');
  return e.key.toLowerCase() === key && (!mod || e.ctrlKey || e.metaKey) && e.shiftKey === parts.includes('shift');
}

/** Direction C: caret icon button opening a filterable jump list of open documents. */
export function Switcher({
  groups,
  value,
  onSelect,
  shortcut = 'Ctrl+K',
  open: openProp,
  onOpenChange,
  className,
  'aria-label': ariaLabel = 'Switch document',
  ...rest
}: TabsSwitcherProps) {
  const tabs = useTabsOptional();
  const current = value ?? tabs?.value;
  const select = onSelect ?? tabs?.select;
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  };
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const q = query.trim().toLowerCase();
  const visible = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !q || i.label.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length);
  const flat = visible.flatMap((g) => g.items);
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  const close = (refocus = true) => {
    setOpen(false);
    setQuery('');
    if (refocus) trigger.current?.focus();
  };
  const show = () => {
    setCursor(Math.max(0, flat.findIndex((i) => i.value === current)));
    setOpen(true);
  };
  const activate = (item: SwitcherItem | undefined) => {
    if (!item) return;
    select?.(item.value);
    close();
  };

  // Opened from outside (controlled): start the cursor on the current document.
  useEffect(() => {
    if (open) setCursor(Math.max(0, flat.findIndex((i) => i.value === current)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on open only
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const activeId = flat[cursor] ? `${listId}-${flat[cursor].value}` : undefined;
  const kbd = cn('rounded-[var(--ph-radius)] border border-ph-border px-1 font-[family-name:var(--ph-font-mono)] text-[10px]');

  return (
    <div ref={root} className={cn('relative inline-flex', className)} {...rest}>
      <button
        ref={trigger}
        type="button"
        aria-label={shortcut ? `${ariaLabel} (${shortcut})` : ariaLabel}
        aria-keyshortcuts={shortcut ? shortcut.replace(/ctrl/i, 'Control') : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close() : show())}
        className={cn(
          'grid size-9 place-items-center rounded-[var(--ph-radius)] text-ph-fg-sage hover:bg-ph-surface-2 hover:text-ph-fg',
          open && 'bg-ph-surface-2 text-ph-fg',
          motion,
          focusRing,
        )}
      >
        <ChevronDown aria-hidden className="size-4" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={ariaLabel}
          className="absolute right-0 top-full z-50 mt-1 flex w-80 max-w-[calc(100vw-2rem)] flex-col rounded-[var(--ph-radius)] border border-ph-border bg-ph-overlay text-ph-fg shadow-[var(--ph-shadow-overlay)]"
        >
          <div className="flex items-center gap-2 border-b border-ph-border px-2.5 py-2">
            <input
              autoFocus
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={activeId}
              aria-label="Filter open documents"
              placeholder="Jump to document…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCursor(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  if (flat.length) setCursor((c) => (c + (e.key === 'ArrowDown' ? 1 : -1) + flat.length) % flat.length);
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  activate(flat[cursor]);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  close();
                }
              }}
              className="h-7 min-w-0 flex-1 bg-transparent text-sm text-ph-fg outline-none placeholder:text-ph-fg-muted"
            />
            <span className="shrink-0 font-[family-name:var(--ph-font-mono)] text-xs text-ph-fg-muted">{total} open</span>
          </div>
          <div id={listId} role="listbox" aria-label="Open documents" className="max-h-80 overflow-y-auto p-1">
            {visible.map((g) => (
              <div key={g.label} role="group" aria-label={g.label}>
                <div className="px-2 pb-0.5 pt-2 text-xs font-semibold uppercase tracking-wide text-ph-fg-muted">{g.label}</div>
                {g.items.map((item) => {
                  const idx = flat.indexOf(item);
                  return (
                    <div
                      key={item.value}
                      id={`${listId}-${item.value}`}
                      role="option"
                      aria-selected={idx === cursor}
                      aria-current={item.value === current || undefined}
                      onPointerMove={() => setCursor(idx)}
                      onClick={() => activate(item)}
                      className={cn(
                        'flex h-9 cursor-pointer items-center gap-2 rounded-[var(--ph-radius)] px-2 text-sm',
                        idx === cursor ? 'bg-ph-surface-2 text-ph-fg-strong' : 'text-ph-fg-sage',
                      )}
                    >
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: item.color ?? 'var(--ph-border-strong)' }}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.value === current && <span className="size-1.5 rounded-full bg-ph-primary" aria-hidden />}
                      {item.meta && (
                        <span className="shrink-0 font-[family-name:var(--ph-font-mono)] text-xs text-ph-fg-muted">{item.meta}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            {!flat.length && <div className="px-2 py-3 text-sm text-ph-fg-muted">No open document matches “{query}”.</div>}
          </div>
          <div className="flex gap-3 border-t border-ph-border px-2.5 py-1.5 text-xs text-ph-fg-muted">
            <span><kbd className={kbd}>↑↓</kbd> move</span>
            <span><kbd className={kbd}>Enter</kbd> open</span>
            <span><kbd className={kbd}>Esc</kbd> close</span>
          </div>
        </div>
      )}
    </div>
  );
}
