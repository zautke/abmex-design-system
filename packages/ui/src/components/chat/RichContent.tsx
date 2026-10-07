import { Circle, CircleCheck, CircleDot, ShieldAlert } from 'lucide-react';
import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface TaskItem {
  id: string;
  text: string;
  status: 'pending' | 'in_progress' | 'done';
}

export interface TaskListProps extends Omit<ComponentPropsWithRef<'ul'>, 'children'> {
  items: readonly TaskItem[];
  renderItem?: (item: TaskItem) => ReactNode;
  statusLabels?: Record<TaskItem['status'], string>;
}

const taskIcons = { pending: Circle, in_progress: CircleDot, done: CircleCheck };

export function TaskList({ items, renderItem, statusLabels = { pending: 'pending', in_progress: 'in progress', done: 'done' }, className, ...props }: TaskListProps) {
  if (!items.length) return null;
  return <ul aria-label="Plan" className={cn('not-prose my-2 space-y-1 rounded-lg border code-surface px-3 py-2 text-sm', className)} {...props}>
    {items.map(item => {
      const Icon = taskIcons[item.status] ?? Circle;
      return <li key={item.id} data-status={item.status} className={cn('flex items-start gap-2', item.status === 'done' && 'opacity-60 line-through')}>
        <Icon aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-md-code-block-link" />
        <span className="sr-only">{statusLabels[item.status]}</span>
        <span>{renderItem ? renderItem(item) : item.text}</span>
      </li>;
    })}
  </ul>;
}

export interface ToolResultProps extends ComponentPropsWithRef<'details'> {
  summary: ReactNode;
  summaryProps?: ComponentPropsWithRef<'summary'>;
}

export function ToolResult({ summary, summaryProps, className, children, ...props }: ToolResultProps) {
  return <details className={cn('not-prose my-2 rounded-lg border code-surface px-3 py-2 text-sm', className)} {...props}>
    <summary {...summaryProps} className={cn('cursor-pointer font-medium', summaryProps?.className)}>{summary}</summary>
    <div className="mt-2 whitespace-pre-wrap text-xs opacity-80">{children}</div>
  </details>;
}

export function ImageGallery({ className, ...props }: ComponentPropsWithRef<'ul'>) {
  return <ul aria-label="Attached images" className={cn('mb-1 flex flex-wrap gap-3 p-1.5', className)} {...props} />;
}

export interface ImageTileProps extends ComponentPropsWithRef<'li'> {
  src?: string;
  alt: string;
  muted?: boolean;
  placeholder?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  imageProps?: ComponentPropsWithRef<'img'>;
  linkProps?: ComponentPropsWithRef<'a'>;
}

/** URL acquisition and revocation belong to the consumer. */
export function ImageTile({ src, alt, muted, placeholder = 'Image unavailable', badge, actions, imageProps, linkProps, children, className, ...props }: ImageTileProps) {
  return <li data-muted={muted || undefined} className={cn('group relative motion-safe:animate-pop-in', className)} {...props}>
    <div className="overflow-hidden rounded-lg border border-chat-bubble-ai-border">
      {children ?? (src ? <a href={src} target="_blank" rel="noopener noreferrer" {...linkProps}>
        <img src={src} alt={alt} {...imageProps} className={cn('h-32 w-auto max-w-full object-cover', muted && 'opacity-40 grayscale', imageProps?.className)} />
      </a> : <div role="status" className="flex h-32 w-40 items-center justify-center text-xs opacity-60">{placeholder}</div>)}
      {badge != null && <span className="absolute bottom-1 left-1 rounded bg-backdrop px-1.5 py-0.5 text-xs text-primary-fg">{badge}</span>}
    </div>
    {actions}
  </li>;
}

export interface ApprovalRequestProps extends ComponentPropsWithRef<'div'> {
  heading: ReactNode;
  icon?: ReactNode;
  onApprove: () => void;
  onReject: () => void;
  approveLabel?: ReactNode;
  rejectLabel?: ReactNode;
  approveProps?: ComponentPropsWithRef<'button'>;
  rejectProps?: ComponentPropsWithRef<'button'>;
  actions?: ReactNode;
}

/** Inline decision surface; the host owns the pending request and execution. */
export function ApprovalRequest({ heading, icon = <ShieldAlert aria-hidden className="h-4 w-4" />, onApprove, onReject, approveLabel = 'Allow', rejectLabel = 'Deny', approveProps, rejectProps, actions, className, children, ...props }: ApprovalRequestProps) {
  const headingId = useId();
  return <div role="group" aria-labelledby={props['aria-label'] ? undefined : headingId} className={cn('rounded-lg border border-warning bg-warning-soft p-3 text-xs text-warning-soft-fg', className)} {...props}>
    <div id={headingId} className="mb-1 flex items-center gap-2 font-medium">{icon}<span>{heading}</span></div>
    <div className="mb-2 max-h-32 overflow-auto whitespace-pre-wrap break-all font-mono text-2xs opacity-80">{children}</div>
    {actions ?? <div className="flex gap-2">
      <button type="button" {...approveProps} className={cn('rounded bg-warning px-3 py-1 font-medium text-warning-fg hover:bg-warning', approveProps?.className)} onClick={event => {
        approveProps?.onClick?.(event);
        if (!event.defaultPrevented) onApprove();
      }}>{approveLabel}</button>
      <button type="button" {...rejectProps} className={cn('rounded border border-warning px-3 py-1 font-medium hover:bg-warning-soft', rejectProps?.className)} onClick={event => {
        rejectProps?.onClick?.(event);
        if (!event.defaultPrevented) onReject();
      }}>{rejectLabel}</button>
    </div>}
  </div>;
}
