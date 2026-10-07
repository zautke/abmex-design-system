// @vitest-environment jsdom
//
// Migrated from McpSection.test.tsx — the server-status readout.
//
// McpSection read `db.appState['mcpServerStatus']` itself; McpServerList takes a
// plain `McpServerView[]`. The polling/Dexie half of the old test is covered by
// tests/hooks/useMcpServerStatus.test.ts, and SettingsHost maps a snapshot onto
// the view model. What is asserted here is what the source asserted about the
// rendered rows: name, tool count, and the truncated-but-title-attributed error.
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

import { McpServerList, type McpServerView } from '@abmex/ui';

afterEach(() => cleanup());

describe('McpServerList', () => {
  it('renders server status snapshots', () => {
    const servers: McpServerView[] = [
      { id: 'alpha', name: 'alpha', status: 'ready', toolCount: 3 },
      { id: 'beta', name: 'beta', status: 'error', toolCount: 0, error: 'Connection refused' },
    ];
    render(<McpServerList servers={servers} />);

    expect(screen.getByText('alpha')).toBeTruthy();
    expect(screen.getByText('beta')).toBeTruthy();
    expect(screen.getByText(/3 tools/i)).toBeTruthy();
    expect(screen.getByText(/Connection refused/i)).toBeTruthy();
  });

  it('exposes each row status to assistive tech via the status dot label', () => {
    render(
      <McpServerList
        servers={[{ id: 'alpha', name: 'alpha', status: 'ready', toolCount: 1 }]}
      />,
    );
    expect(screen.getByLabelText('alpha: ready')).toBeTruthy();
    // Singular tool count, not "1 tools".
    expect(screen.getByText('1 tool')).toBeTruthy();
  });

  it('renders companion-unavailable lastError with full text in title attr', () => {
    render(
      <McpServerList
        servers={[
          {
            id: 'iterm-mcp',
            name: 'iterm-mcp',
            status: 'error',
            toolCount: 0,
            error: 'companion not installed — run ./companion/native-host/install.sh (Chrome only)',
          },
        ]}
      />,
    );

    expect(screen.getByText('iterm-mcp')).toBeTruthy();
    const errSpan = screen.getByText(/companion not installed/i);
    expect(errSpan).toBeTruthy();
    expect(errSpan.getAttribute('title')).toMatch(/install\.sh/);
  });

  it('shows the empty message when there are no servers', () => {
    render(<McpServerList servers={[]} emptyMessage="No servers connected yet." />);
    expect(screen.getByText('No servers connected yet.')).toBeTruthy();
  });
});
