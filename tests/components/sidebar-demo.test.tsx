// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { InspectorSidebarDemo, SidebarDemo } from '../../packages/ui/src/components/sidebar-demo';
import type { SidebarDemoItem } from '../../packages/ui/src/components/sidebar-demo';

afterEach(cleanup);

const items: SidebarDemoItem[] = [
  { id: 'overview', label: 'Overview', group: 'Workspace', content: <p>Overview content</p> },
  { id: 'projects', label: 'Projects', group: 'Workspace', content: <p>Project content</p>, keywords: ['campaign'] },
];

describe('SidebarDemo compositions', () => {
  it('changes ContentPane when fixture navigation is selected', () => {
    render(<SidebarDemo items={items} />);

    expect(screen.getByText('Overview content')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Projects/ }));
    expect(screen.getByText('Project content')).toBeTruthy();
  });

  it('filters actual local navigation results', () => {
    render(<SidebarDemo items={items} />);
    const search = screen.getByRole('textbox', { name: 'Search navigation' });

    fireEvent.change(search, { target: { value: 'campaign' } });
    expect(screen.getByRole('button', { name: /Projects/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Overview/ })).toBeNull();
  });

  it('keeps scoped theme changes independent between instances', () => {
    const { container } = render(
      <>
        <SidebarDemo items={items} />
        <SidebarDemo items={items} />
      </>,
    );
    const scopes = container.querySelectorAll<HTMLElement>('[data-theme]');
    expect(scopes).toHaveLength(2);
    expect(scopes[0].dataset.theme).toBe('dark');
    expect(scopes[1].dataset.theme).toBe('dark');

    fireEvent.click(within(scopes[0]).getByRole('button', { name: 'Switch to light theme' }));
    expect(scopes[0].dataset.theme).toBe('light');
    expect(scopes[1].dataset.theme).toBe('dark');
  });

  it('shows replaceable inspector content and changes contextual panel', () => {
    render(
      <InspectorSidebarDemo
        title="Campaign board"
        details={<p>Campaign owner: Mira</p>}
        activity={<p>Latest update: today</p>}
      />,
    );

    expect(screen.getByText('Campaign owner: Mira')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Activity/ }));
    expect(screen.getByText('Latest update: today')).toBeTruthy();
  });
});
