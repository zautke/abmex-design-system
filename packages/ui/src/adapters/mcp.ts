// McpAdapter — abstract over src/core/mcp/* persistence + status.

export type McpServerStatus = 'online' | 'offline' | 'error' | 'companion-unavailable';

export interface McpServerInfo {
  name: string;
  status: McpServerStatus;
  transport: string;
}

export interface McpAdapter {
  listServers(): Promise<McpServerInfo[]>;
  getServerStatus(name: string): Promise<McpServerStatus>;
  invokeTool(
    server: string,
    tool: string,
    args: Record<string, unknown>,
  ): Promise<unknown>;
}
