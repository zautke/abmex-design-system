// Conversation + timeline types. Mirrors the extension's src/shared/types.ts +
// src/shared/db.ts shape WITHOUT importing Dexie or the extension. Consumers
// supply their own persistence implementation via PersistenceAdapter.

export type ChatRole = 'user' | 'assistant';

export interface TokenUsage {
  providerId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  /** Provider-reported generation duration in nanoseconds (e.g. Ollama eval_duration). */
  generationDurationNs?: number;
}

export interface ModelSnapshot {
  providerId: string;
  providerName: string;
  modelId: string;
  displayName: string;
  contextWindowTokens?: number;
}

interface TimelineItemBase {
  id: string;
  kind: 'chat' | 'model-info' | 'ooc';
  raw?: unknown;
}

export interface ChatMessage extends TimelineItemBase {
  kind: 'chat';
  role: ChatRole;
  content: string;
  streaming?: boolean;
  error?: string;
  usage?: TokenUsage;
  modelSnapshot?: ModelSnapshot;
}

export interface ModelInfoMessage extends TimelineItemBase {
  kind: 'model-info';
  label: string;
  modelSnapshot: ModelSnapshot;
}

export type OOCMessageType = 'conversation_interrupted';

export interface OOCMessage extends TimelineItemBase {
  kind: 'ooc';
  type: OOCMessageType;
  content: string;
}

export type ConversationItem = ChatMessage | ModelInfoMessage | OOCMessage;

export type ConversationTitleSource = 'default' | 'auto' | 'manual';

export interface Conversation {
  id: string;
  title: string;
  titleSource?: ConversationTitleSource;
  autoRenamedAt?: number;
  manualRenamedAt?: number;
  updatedAt: number;
}

export type DbConversationItem = ConversationItem & {
  createdAt: number;
  conversationId: string;
};
