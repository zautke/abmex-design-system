// McpServerList / McpServerRow — read-only status readout for a set of servers.
//
// The source (McpSection) polled a live status hook every 2s, held a Dexie-backed
// secrets store, and owned its own `statusColor` switch. All three are gone. This
// renders a plain array of view models and nothing else: no polling, no client,
// no adapter. Whatever produces `McpServerView[]` — a hook, a websocket, a
// static fixture in a story — is the consumer's business.

import { StatusDot, type StatusTone } from '../../primitives/StatusDot';
import { SettingsList, SettingsRow } from './SettingsLayout';
import { cn } from '../../utils/cn';

/**
 * Presentational status vocabulary. The app's `McpServerStatusSnapshot['status']`
 * maps onto this; anything unrecognized should map to 'idle'.
 */
export type McpServerViewStatus = 'idle' | 'connecting' | 'ready' | 'reloading' | 'error';

export interface McpServerView {
  id: string;
  name: string;
  status: McpServerViewStatus;
  toolCount?: number;
  error?: string;
}

const STATUS_TONE: Record<McpServerViewStatus, StatusTone> = {
  ready: 'success',
  connecting: 'warning',
  reloading: 'warning',
  error: 'danger',
  idle: 'neutral',
};

export interface McpServerRowProps {
  server: McpServerView;
}

export function McpServerRow({ server }: McpServerRowProps) {
  const settling = server.status === 'connecting' || server.status === 'reloading';

  return (
    <li>
      <SettingsRow
        trailing={
          <>
            {server.toolCount !== undefined ? (
              <span>
                {server.toolCount} tool{server.toolCount === 1 ? '' : 's'}
              </span>
            ) : null}
            {server.error ? (
              <span className="max-w-[160px] truncate text-conn-disconnected" title={server.error}>
                {server.error}
              </span>
            ) : null}
          </>
        }
      >
        <StatusDot
          tone={STATUS_TONE[server.status]}
          pulse={settling}
          label={`${server.name}: ${server.status}`}
        />
        <span className="truncate font-mono text-2xs text-fg">{server.name}</span>
        <span className="flex-shrink-0 text-xs tracking-wide text-fg-muted uppercase">
          {server.status}
        </span>
      </SettingsRow>
    </li>
  );
}

export interface McpServerListProps {
  servers: ReadonlyArray<McpServerView>;
  /** Shown when `servers` is empty. */
  emptyMessage?: string;
  className?: string;
}

export function McpServerList({
  servers,
  emptyMessage = 'No servers connected yet.',
  className,
}: McpServerListProps) {
  if (servers.length === 0) {
    return <p className={cn('text-xs text-fg-muted', className)}>{emptyMessage}</p>;
  }

  return (
    <SettingsList className={className}>
      {servers.map((server) => (
        <McpServerRow key={server.id} server={server} />
      ))}
    </SettingsList>
  );
}
