// ToolExecutorAdapter — abstract over src/core/tools/toolRegistry.

import type { CanonicalTool, RuntimeEvent } from '../types/kernel';

export interface ToolExecutorAdapter {
  listTools(): Promise<CanonicalTool[]>;
  execute(name: string, args: Record<string, unknown>): Promise<unknown>;
  stream(
    name: string,
    args: Record<string, unknown>,
  ): AsyncIterable<RuntimeEvent>;
}
