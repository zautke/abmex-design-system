import { useEffect, useRef, useState } from 'react';
import { Button, Dropdown, Label } from '@heroui/react';
import { MessageSquare, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { Conversation } from '../../types/conversation';
import { cn } from '../../utils/cn';

export interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  /** Omit to hide the Rename action entirely — the row has no rename affordance it cannot fulfil. */
  onRename?: (id: string, title: string) => void;
  className?: string;
}

/**
 * One row of the conversations list: select, inline rename, overflow menu.
 *
 * Two accessibility defects in the source are fixed here rather than carried over:
 *
 *   1. The row was a `<div onClick>` — unreachable by keyboard and announced as
 *      nothing. It is now a real `<button>`, so Tab and Enter work.
 *   2. The overflow menu was a hand-rolled div with a document-level mousedown
 *      listener: no menu roles, no arrow-key navigation, no Escape, no focus
 *      return. HeroUI's Dropdown supplies all of it.
 *
 * The rename input is a sibling of the select button, never a child — a button
 * nested inside a button is invalid HTML and browsers disagree about the result.
 *
 * Delete is a two-state confirm, mirroring the rename idiom (local state stands
 * in for a dialog): choosing Delete swaps the overflow menu for an inline
 * "Delete? [Delete] [Cancel]" cluster. Escape, Tab/click away, any other row
 * action, or ~4s of inactivity disarm it — only the explicit Delete button
 * calls `onDelete`.
 */
export function ConversationListItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
  className,
}: ConversationListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title);
  const [pendingDelete, setPendingDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const deleteGroupRef = useRef<HTMLDivElement>(null);
  const deleteConfirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!pendingDelete) return;
    deleteConfirmRef.current?.focus();
    // Clicking/tapping elsewhere cancels. Blur alone can't carry this: Safari
    // and macOS Firefox don't move focus to buttons on pointer click.
    const onPointerDown = (e: PointerEvent) => {
      if (!deleteGroupRef.current?.contains(e.target as Node)) setPendingDelete(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    const timer = window.setTimeout(() => setPendingDelete(false), 4000);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.clearTimeout(timer);
    };
  }, [pendingDelete]);

  const commitRename = () => {
    const next = draftTitle.trim();
    // An empty title is a cancel, not a destructive rename to "".
    if (next && next !== conversation.title) onRename?.(conversation.id, next);
    setIsEditing(false);
  };

  const startRename = () => {
    setPendingDelete(false); // any other row action disarms the confirm
    setDraftTitle(conversation.title);
    setIsEditing(true);
  };

  const confirmDelete = () => {
    setPendingDelete(false);
    onDelete(conversation.id);
  };

  return (
    <li
      className={cn(
        'group relative flex items-center justify-between gap-2 rounded-md p-2 transition-colors',
        isActive
          ? 'bg-drawer-item-bg-active text-drawer-item-text-active'
          : 'text-drawer-item-text hover:bg-drawer-item-bg-hover hover:text-drawer-item-text-hover',
        className,
      )}
    >
      {isEditing ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <MessageSquare size={14} className="shrink-0 text-drawer-item-icon" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            aria-label={`Rename ${conversation.title}`}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            onBlur={commitRename}
            className="min-w-0 flex-1 rounded border border-drawer-edit-border bg-drawer-edit-bg px-1.5 py-0.5 text-sm outline-none"
          />
        </div>
      ) : pendingDelete ? (
        <>
          <span className="truncate text-sm">{conversation.title}</span>
          <div
            ref={deleteGroupRef}
            role="group"
            aria-label="Confirm delete conversation"
            className="flex shrink-0 items-center gap-1"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation(); // cancel the confirm, not the drawer
                setPendingDelete(false);
              }
            }}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setPendingDelete(false);
              }
            }}
          >
            <span className="text-xs text-ph-danger-soft-fg">Delete?</span>
            <Button
              ref={deleteConfirmRef}
              variant="ghost"
              size="sm"
              onPress={confirmDelete}
              className="text-ph-danger-soft-fg"
            >
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => setPendingDelete(false)}
              className="text-drawer-item-text"
            >
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onSelect(conversation.id)}
            aria-current={isActive ? 'true' : undefined}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <MessageSquare
              size={14}
              aria-hidden
              className={cn('shrink-0', isActive ? 'text-drawer-item-icon-active' : 'text-drawer-item-icon')}
            />
            <span className="truncate text-sm">{conversation.title}</span>
          </button>

          <Dropdown>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Options for ${conversation.title}`}
              className="shrink-0 opacity-0 transition group-hover:opacity-100 data-[pressed]:opacity-100 focus-visible:opacity-100"
            >
              <MoreVertical size={16} />
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu
                onAction={(key) => {
                  if (key === 'rename') startRename();
                  if (key === 'delete') setPendingDelete(true);
                }}
              >
                {onRename ? (
                  <Dropdown.Item id="rename" textValue="Rename">
                    <Pencil size={14} aria-hidden />
                    <Label>Rename</Label>
                  </Dropdown.Item>
                ) : null}
                <Dropdown.Item id="delete" textValue="Delete" variant="danger">
                  <Trash2 size={14} aria-hidden />
                  <Label>Delete</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </>
      )}
    </li>
  );
}
