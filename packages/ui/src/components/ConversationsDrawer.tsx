import { useState, useRef, useEffect } from 'react';
import { Search, Plus, MessageSquare, Trash2, X, MoreVertical, Pencil } from 'lucide-react';
import type { Conversation } from '../types/conversation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat?: (id: string, newTitle: string) => void;
}

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
  onRenameChat
}: Props) {
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    }
    if (activeDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdownId]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleRenameSubmit = (id: string) => {
    if (editTitle.trim() && onRenameChat) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="absolute inset-0 bg-drawer-backdrop z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`absolute top-0 left-0 bottom-0 w-3/4 max-w-[280px] bg-drawer-bg border-r border-drawer-border z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-drawer-header-border bg-drawer-header-bg">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex flex-1 items-center gap-2 px-3 py-1.5 text-sm font-medium text-drawer-newbtn-text bg-drawer-newbtn-bg hover:bg-drawer-newbtn-bg-hover rounded-md transition-colors"
          >
            <Plus size={16} />
            New Chat
          </button>
          <button 
            onClick={onClose}
            className="ml-2 p-1.5 text-drawer-closebtn-icon hover:text-drawer-closebtn-icon-hover hover:bg-drawer-closebtn-bg-hover rounded-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-drawer-search-border bg-drawer-search-bg">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-drawer-search-icon" />
            <input 
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-drawer-search-input-bg border border-drawer-search-input-border rounded-md focus:outline-none focus:border-drawer-search-input-border-focus focus:bg-drawer-search-input-bg-focus transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-center text-drawer-empty-text mt-4">
              {searchQuery ? 'No matches found.' : 'No conversations yet.'}
            </p>
          ) : (
            conversations.map((conv) => (
              <div 
                key={conv.id}
                className={`group relative flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                  activeId === conv.id 
                    ? 'bg-drawer-item-bg-active text-drawer-item-text-active' 
                    : 'text-drawer-item-text hover:bg-drawer-item-bg-hover hover:text-drawer-item-text-hover'
                }`}
                onClick={() => {
                  if (editingId !== conv.id) {
                    onSelect(conv.id);
                    onClose();
                  }
                }}
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                  <MessageSquare size={14} className={activeId === conv.id ? 'text-drawer-item-icon-active' : 'text-drawer-item-icon'} />
                  {editingId === conv.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit(conv.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onBlur={() => handleRenameSubmit(conv.id)}
                      className="flex-1 min-w-0 bg-drawer-edit-bg border border-drawer-edit-border rounded px-1.5 py-0.5 text-sm outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-sm truncate select-none">{conv.title}</span>
                  )}
                </div>
                
                {editingId !== conv.id && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownId(activeDropdownId === conv.id ? null : conv.id);
                      }}
                      className={`p-1 text-drawer-optbtn-icon hover:text-drawer-optbtn-icon-hover rounded-md hover:bg-drawer-optbtn-bg-hover transition-colors ${
                        activeDropdownId === conv.id ? 'opacity-100 bg-drawer-optbtn-bg-active' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      aria-label="Conversation options"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeDropdownId === conv.id && (
                      <div 
                        ref={dropdownRef}
                        className="absolute right-0 top-full mt-1 w-32 bg-drawer-dropdown-bg rounded-md shadow-lg border border-drawer-dropdown-border z-[60] py-1 overflow-hidden"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditTitle(conv.title);
                            setEditingId(conv.id);
                            setActiveDropdownId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-drawer-dropdown-item-text hover:bg-drawer-dropdown-item-bg-hover text-left"
                        >
                          <Pencil size={14} />
                          Rename
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(conv.id);
                            setActiveDropdownId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-drawer-dropdown-delete-text hover:bg-drawer-dropdown-delete-bg-hover text-left"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
