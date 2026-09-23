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
          // `overflow-visible` on the tile, `overflow-hidden` on the inner frame:
          // the × sits on the corner arc and must not be clipped.
          className="group relative m-1.5 h-14 w-14"
        >
          <div
            className={cn(
              'h-full w-full overflow-hidden rounded-lg border bg-inputbar-input-bg',
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
              <div className="absolute inset-0 animate-pulse rounded-lg bg-black/20" aria-hidden />
            )}
          </div>
          {onRemove && <CornerRemoveButton label={`Remove ${a.name}`} onClick={() => onRemove(a.id)} />}
        </li>
      ))}
    </ul>
  );
}

export interface CornerRemoveButtonProps {
  label: string;
  onClick: () => void;
  /** Swap the × for another glyph (e.g. a restore arrow). */
  children?: React.ReactNode;
  pressed?: boolean;
  className?: string;
}

/**
 * The remove badge: a white disc with a dark × whose centre sits on the
 * tile's rounded corner — offset `-6px` on a 16px disc puts the centre 2px
 * inside each edge, which is where an 8px corner arc passes at 45°. Shown
 * only while the tile (a `group` ancestor) is hovered, or while the button
 * itself has keyboard focus; the white disc keeps it legible on dark
 * thumbnails when it does appear (user direction 2026-09-23).
 */
export function CornerRemoveButton({ label, onClick, children, pressed, className }: CornerRemoveButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      {...(pressed !== undefined ? { 'aria-pressed': pressed } : {})}
      onClick={onClick}
      className={cn(
        'absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full border border-black/15 bg-white text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,.45)] opacity-0 transition-[opacity,transform] group-hover:opacity-100 hover:scale-110 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-inputbar-input-border-focus',
        className,
      )}
    >
      {children ?? <X size={11} strokeWidth={2.5} />}
    </button>
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
