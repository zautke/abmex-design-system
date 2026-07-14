import { useEffect } from 'react';
import { Button } from '@heroui/react';
import { Plus, X } from 'lucide-react';
import type { Conversation } from '../../types/conversation';
import { cn } from '../../utils/cn';
import { ConversationEmptyState } from './ConversationEmptyState';
import { ConversationListItem } from './ConversationListItem';
import { ConversationSearchField } from './ConversationSearchField';

export interface ConversationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * WIRING: already-filtered. The drawer renders what it is given — searching is
   * the consumer's job, because only the consumer knows whether that means a
   * substring match in memory or a query against an index.
   */
  conversations: Conversation[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat?: (id: string, newTitle: string) => void;
  /** Selecting a conversation or starting a new one dismisses the drawer. */
  closeOnSelect?: boolean;
  className?: string;
}

/**
 * Slide-in conversations drawer.
 *
 * Deliberately NOT HeroUI's `Drawer`: this panel is absolutely positioned inside
 * the app shell (a browser side panel), while HeroUI's Drawer portals to
 * `document.body` with modal semantics. Adopting it would rip the drawer out of
 * its container and cover the whole viewport. The shell stays bespoke; the parts
 * where HeroUI actually pays — the row menu and the search field — use it.
 *
 * Escape-to-close is added here; the source had no keyboard dismissal at all.
 */
export function ConversationsDrawer({
  isOpen,
  onClose,
  conversations,
  searchQuery,
  setSearchQuery,
  activeId,
  onSelect,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  closeOnSelect = true,
  className,
}: ConversationsDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = (id: string) => {
    onSelect(id);
    if (closeOnSelect) onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="absolute inset-0 z-40 bg-drawer-backdrop transition-opacity"
          onClick={onClose}
          aria-hidden
        />
      )}

      <div
        role="dialog"
        aria-label="Conversations"
        aria-hidden={!isOpen}
        // The panel stays mounted so the slide transition can run in both
        // directions; `inert` keeps its controls out of the tab order while
        // it is off-screen, which `display:none` would have done for free but
        // a transform cannot.
        inert={!isOpen ? true : undefined}
        className={cn(
          'absolute bottom-0 left-0 top-0 z-50 flex w-3/4 max-w-[280px] flex-col border-r border-drawer-border bg-drawer-bg transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-drawer-header-border bg-drawer-header-bg p-3">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 bg-drawer-newbtn-bg text-drawer-newbtn-text hover:bg-drawer-newbtn-bg-hover"
            onPress={() => {
              onNewChat();
              if (closeOnSelect) onClose();
            }}
          >
            <Plus size={16} aria-hidden />
            New Chat
          </Button>
          <Button variant="ghost" size="sm" aria-label="Close conversations" onPress={onClose}>
            <X size={18} aria-hidden />
          </Button>
        </div>

        <div className="border-b border-drawer-search-border bg-drawer-search-bg p-3">
          <ConversationSearchField value={searchQuery} onChange={setSearchQuery} />
        </div>

        {conversations.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-2">
            <ConversationEmptyState filtered={searchQuery.length > 0} />
          </div>
        ) : (
          <ul className="flex-1 space-y-1 overflow-y-auto p-2">
            {conversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeId === conversation.id}
                onSelect={handleSelect}
                onDelete={onDeleteChat}
                {...(onRenameChat ? { onRename: onRenameChat } : {})}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
