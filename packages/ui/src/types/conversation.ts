// Conversation + timeline types. Mirrors the extension's src/shared/types.ts +
// src/shared/db.ts shape WITHOUT importing Dexie or the extension. Consumers
// supply their own persistence implementation via PersistenceAdapter.

export type ChatRole = 'user' | 'assistant';

/** Where the numbers came from. `partial` = some reported, some derived. */
export type UsageSource = 'reported' | 'estimated' | 'partial';

export interface CostUsd {
  input?: number;
  output?: number;
  cacheRead?: number;
  cacheWrite?: number;
  total?: number;
}

/**
 * Token usage for one scope (step, turn, or conversation). Field names follow
 * the OpenTelemetry GenAI conventions (gen_ai.usage.*).
 *
 * Every count is optional on purpose: `undefined` means the provider never
 * reported it (render "n/a"), `0` means it reported zero. Ollama reports no
 * cache fields at all — showing that as "0 cached" would be a fabrication.
 */
export interface TokenUsage {
  providerId: string;
  modelId?: string;
  /** Billable prompt tokens, including cache reads and writes. */
  inputTokens?: number;
  noCacheInputTokens?: number;
  cacheReadInputTokens?: number;
  cacheWriteInputTokens?: number;
  outputTokens?: number;
  textOutputTokens?: number;
  reasoningOutputTokens?: number;
  totalTokens?: number;
  /** Anthropic only: cache writes split by TTL, e.g. `{ '5m': 1200 }`. */
  cacheWriteByTtl?: Record<string, number>;
  /** Provider-reported generation duration in nanoseconds (e.g. Ollama eval_duration). */
  generationDurationNs?: number;
  timeToFirstOutputMs?: number;
  cost?: CostUsd;
  source?: UsageSource;
  /** Verbatim provider payload, for debug views only. */
  raw?: unknown;
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
