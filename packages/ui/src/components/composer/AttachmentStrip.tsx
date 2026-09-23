import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ComposerAttachment {
  id: string;
  name: string;
  /** Object URL (or data URL) for the thumbnail; absent while pending. */
  previewUrl?: string;
  status: 'pending' | 'ready' | 'error';
  /** Shown as the tile's title when status is 'error'. */
  error?: string;
}

export interface AttachmentStripProps {
  attachments: ComposerAttachment[];
  onRemove?: (id: string) => void;
  className?: string;
}

/**
 * Pending image chips above the textarea. Presentation only — the host owns
 * ingest, storage and the object URLs (and revokes them).
 */
export function AttachmentStrip({ attachments, onRemove, className }: AttachmentStripProps) {
  if (attachments.length === 0) return null;
  return (
    <ul className={cn('flex flex-wrap gap-2 px-2 pt-2', className)} aria-label="Pending attachments">
      {attachments.map((a) => (
        <li
          key={a.id}
          title={a.status === 'error' ? a.error ?? 'Could not attach' : a.name}
          className={cn(
            'group relative h-14 w-14 overflow-hidden rounded-lg border bg-inputbar-input-bg',
            a.status === 'error' ? 'border-chat-error-text' : 'border-inputbar-input-border',
          )}
        >
          {a.previewUrl ? (
            <img src={a.previewUrl} alt={a.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-inputbar-input-placeholder">
              {a.status === 'error' ? '!' : '…'}
            </div>
          )}
          {a.status === 'pending' && (
            <div className="absolute inset-0 animate-pulse bg-black/20" aria-hidden />
          )}
          {onRemove && (
            <button
              type="button"
              aria-label={`Remove ${a.name}`}
              onClick={() => onRemove(a.id)}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
            >
              <X size={12} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Image files from a paste or drop, extracted SYNCHRONOUSLY — the DataTransfer
 * is only readable while the event is dispatching. `files` wins when present
 * (Finder/Explorer copies, drops); otherwise the bitmap/html+png `items` path.
 * Never both: they describe the same data.
 */
export function imageFilesFromDataTransfer(dt: DataTransfer | null | undefined): File[] {
  if (!dt) return [];
  const fromFiles = Array.from(dt.files ?? []).filter((f) => f.type.startsWith('image/') || f.type === '');
  if (fromFiles.length > 0) return fromFiles.filter((f) => f.type.startsWith('image/') || looksLikeImageName(f.name));
  const out: File[] = [];
  for (const item of Array.from(dt.items ?? [])) {
    if (item.kind !== 'file' || !item.type.startsWith('image/')) continue;
    const file = item.getAsFile();
    if (file) out.push(file);
  }
  return out;
}

function looksLikeImageName(name: string): boolean {
  return /\.(png|jpe?g|gif|webp|bmp|heic|heif|avif)$/i.test(name);
}
