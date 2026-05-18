// Kernel transport types. Structural mirror of src/kernel/contracts.ts so the
// UI package compiles without depending on Zod or the extension's kernel.

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface CanonicalTool {
  name: string;
  description: string;
  inputSchema: Record<string, JsonValue>;
}

export interface CanonicalToolCall {
  toolName: string;
  arguments: Record<string, JsonValue>;
  toolCallId: string;
}

export type CanonicalKernelMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: CanonicalToolCall[] }
  | { role: 'tool'; content: string; toolName: string; toolCallId: string };

export type RuntimeEvent =
  | { type: 'thinking-delta'; text: string }
  | { type: 'text-delta'; text: string }
  | {
      type: 'tool-call-requested';
      toolCallId: string;
      toolName: string;
      arguments: Record<string, JsonValue>;
    }
  | {
      type: 'tool-call-completed';
      toolCallId: string;
      toolName: string;
      result: JsonValue;
    }
  | { type: 'final-message'; message: string }
  | {
      type: 'usage';
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
    }
  | { type: 'error'; message: string };
