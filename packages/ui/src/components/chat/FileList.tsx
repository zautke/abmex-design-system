import { AlertCircle, Download, File, FileArchive, FolderDown, Image, LoaderCircle } from 'lucide-react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface FileListEntry {
  id: string;
  name: string;
  directory?: string;
  sizeLabel?: string;
  icon?: ReactNode;
  mime?: string;
}

export interface FileListProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  entries: readonly FileListEntry[];
  heading?: ReactNode;
  summary?: ReactNode;
  loading?: boolean;
  error?: ReactNode;
  loadingLabel?: ReactNode;
  emptyLabel?: ReactNode;
  busyId?: string | null;
  allBusy?: boolean;
  onDownload?: (id: string) => void;
  onDownloadAll?: () => void;
  downloadLabel?: (entry: FileListEntry) => string;
  downloadAllLabel?: ReactNode;
  status?: ReactNode;
  actionError?: ReactNode;
  footer?: ReactNode;
  renderItem?: (entry: FileListEntry) => ReactNode;
  itemButtonProps?: (entry: FileListEntry) => ComponentPropsWithRef<'button'>;
}

/** File presentation only: the host supplies listing, size labels, and download actions. */
export function FileList({ entries, heading = 'Files', summary, loading, error, loadingLabel = 'Loading files…', emptyLabel = 'No files found.', busyId, allBusy, onDownload, onDownloadAll, downloadLabel = entry => `Download ${entry.name}`, downloadAllLabel = 'Download all', status, actionError, footer, renderItem, itemButtonProps, className, ...props }: FileListProps) {
  if (loading || error != null) return <div role={error != null ? 'alert' : 'status'} className={cn('not-prose my-1 inline-flex items-center gap-2 rounded-lg border code-surface px-3 py-2 text-sm opacity-70', className)} {...props}>
    {error != null ? <AlertCircle aria-hidden className="h-4 w-4" /> : <LoaderCircle aria-hidden className="h-4 w-4 motion-safe:animate-spin" />}
    <span>{error ?? loadingLabel}</span>
  </div>;
  return <div className={cn('not-prose my-2 max-w-full overflow-hidden rounded-lg border code-surface text-sm', className)} {...props}>
    <div className="flex items-center justify-between gap-2 border-b border-md-code-block-border bg-md-code-header-bg px-3 py-2">
      <span className="font-medium">{heading}</span><span className="text-xs opacity-60">{summary}</span>
    </div>
    {!entries.length ? <div className="px-3 py-3 text-xs opacity-70">{emptyLabel}</div> : <ul className="max-h-72 overflow-y-auto">
      {entries.map(entry => {
        const buttonProps = itemButtonProps?.(entry);
        const Icon = entry.mime?.startsWith('image/') ? Image : entry.mime === 'application/zip' ? FileArchive : File;
        return <li key={entry.id} className="border-b border-md-code-block-border last:border-b-0">
          {renderItem ? renderItem(entry) : <button type="button" {...buttonProps}
            disabled={buttonProps?.disabled || Boolean(busyId) || !onDownload}
            title={buttonProps?.title ?? downloadLabel(entry)}
            className={cn('flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left transition-colors motion-reduce:transition-none hover:bg-md-code-header-bg disabled:opacity-60', buttonProps?.className)}
            onClick={event => { buttonProps?.onClick?.(event); if (!event.defaultPrevented) onDownload?.(entry.id); }}>
            <span aria-hidden className="shrink-0 text-md-code-block-link">{entry.icon ?? <Icon className="h-3.5 w-3.5" />}</span>
            <span className="min-w-0 flex-1 truncate"><span className="font-medium text-md-code-block-link">{entry.name}</span>{entry.directory && <span className="ml-1.5 text-xs opacity-50">{entry.directory}</span>}</span>
            <span className="shrink-0 text-xs opacity-60">{entry.sizeLabel}</span>
            {busyId === entry.id ? <LoaderCircle aria-hidden className="h-3.5 w-3.5 shrink-0 motion-safe:animate-spin opacity-60" /> : <Download aria-hidden className="h-3.5 w-3.5 shrink-0 opacity-40" />}
          </button>}
        </li>;
      })}
    </ul>}
    {footer ?? <div className="flex items-center justify-between gap-2 border-t border-md-code-block-border px-3 py-2">
      <span role={actionError ? 'alert' : 'status'} className="min-w-0 truncate text-xs opacity-70">{actionError ?? status}</span>
      {onDownloadAll && <button type="button" onClick={onDownloadAll} disabled={allBusy || !entries.length}
        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-md-code-block-border px-2.5 py-1 text-xs font-medium transition-colors motion-reduce:transition-none hover:bg-md-code-header-bg disabled:cursor-default disabled:opacity-50">
        {allBusy ? <LoaderCircle aria-hidden className="h-3.5 w-3.5 motion-safe:animate-spin" /> : <FolderDown aria-hidden className="h-3.5 w-3.5" />}{downloadAllLabel}
      </button>}
    </div>}
  </div>;
}
