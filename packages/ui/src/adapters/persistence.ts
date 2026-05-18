// PersistenceAdapter — abstract over Dexie (extension) or in-memory (examples/tests).

import type { Conversation, DbConversationItem } from '../types/conversation';

export interface PersistenceAdapter {
  listConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(seed: { title?: string }): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;
  renameConversation(id: string, title: string): Promise<void>;
  appendItem(conversationId: string, item: DbConversationItem): Promise<void>;
  /** Returns an unsubscribe function. */
  observeConversation(
    id: string,
    cb: (items: DbConversationItem[]) => void,
  ): () => void;
}
