// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createRef } from 'react';
import { IconLabel, Sidebar, SidebarContent, SidebarHeader, SidebarItem, SidebarTrigger, SidebarRail, useSidebar } from '../../packages/ui/src/components/sidebar';

afterEach(cleanup);

function Probe({ name }: { name: string }) {
  const { collapsed, width, side } = useSidebar();
  return <output aria-label={`${name} state`}>{`${collapsed}|${width}|${side}`}</output>;
}

describe('Sidebar', () => {
  it('keeps label content mounted and inert while collapsed', () => {
    const label = <input aria-label="Label draft" defaultValue="start" />;
    const view = render(<IconLabel label={label} />);
    const input = screen.getByRole('textbox', { name: 'Label draft' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'edited' } });
    view.rerender(<IconLabel label={label} collapsed />);
    expect(screen.queryByRole('textbox', { name: 'Label draft' })).toBeNull();
    expect(input.isConnected).toBe(true);
    expect(input.parentElement?.hasAttribute('inert')).toBe(true);
    view.rerender(<IconLabel label={label} />);
    expect((screen.getByRole('textbox', { name: 'Label draft' }) as HTMLInputElement).value).toBe('edited');
  });
  it('retains essential layout and resize structure when unstyled', () => {
    render(<Sidebar unstyled><SidebarContent>Body</SidebarContent></Sidebar>);
    const root = screen.getByRole('navigation');
    expect(root.className).toContain('flex');
    expect(root.className).not.toContain('bg-surface');
    expect(screen.getByRole('separator').className).toContain('absolute');
  });
  it('merges rail callback, slot and instance styles property by property', () => {
    render(<Sidebar showRail={false} styles={{ rail: state => ({ opacity: state.collapsed ? 0.5 : 1, color: 'red' }) }}
      slotProps={{ rail: { style: { backgroundColor: 'blue' } } }}>
      <SidebarRail style={{ width: 8 }} />
    </Sidebar>);
    const rails = screen.getAllByRole('separator');
    const rail = rails.find(element => element.style.width === '8px')!;
    expect(rail.style.color).toBe('red');
    expect(rail.style.backgroundColor).toBe('blue');
    expect(rail.style.opacity).toBe('1');
    expect(rail.style.right).toBe('0px');
  });
  it('toggles by default while preserving mounted hidden content and removing it from interaction', () => {
    render(<Sidebar><SidebarHeader>Workspace</SidebarHeader><SidebarContent><button>Focusable item</button></SidebarContent></Sidebar>);
    const content = screen.getByText('Focusable item').parentElement;
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(content?.hasAttribute('inert')).toBe(true);
    expect(content?.hasAttribute('hidden')).toBe(true);
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeTruthy();
    expect(screen.getByText('Focusable item')).toBeTruthy();
  });

  it('keeps hidden content inert when consumer slot props attempt to expose it', () => {
    render(<Sidebar defaultCollapsed slotProps={{ content: { hidden: false, inert: false, 'aria-hidden': false } }}>
      <SidebarContent><button>Still hidden</button></SidebarContent>
    </Sidebar>);
    const content = screen.getByText('Still hidden').parentElement;
    expect(content?.hasAttribute('hidden')).toBe(true);
    expect(content?.hasAttribute('inert')).toBe(true);
    expect(content?.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps instances independent and controlled values authoritative', () => {
    const changed = vi.fn();
    render(<><Sidebar aria-label="Left" defaultWidth={260}><Probe name="left" /></Sidebar>
      <Sidebar aria-label="Right" collapsed={false} width={320} onCollapsedChange={changed}><Probe name="right" /></Sidebar></>);
    const left = screen.getByLabelText('left state');
    const right = screen.getByLabelText('right state');
    expect(left.textContent).toBe('false|260|left');
    expect(right.textContent).toBe('false|320|left');
    fireEvent.click(within(screen.getByLabelText('Right')).getByRole('button', { name: 'Collapse sidebar' }));
    expect(changed).toHaveBeenCalledWith(true);
    expect(right.textContent).toBe('false|320|left');
  });

  it('resizes with keyboard and clamps to configured bounds', () => {
    render(<Sidebar minWidth={220} maxWidth={340} defaultWidth={280}><SidebarContent>Pane</SidebarContent></Sidebar>);
    const rail = screen.getByRole('separator', { name: 'Sidebar width' });
    fireEvent.keyDown(rail, { key: 'End' });
    expect(rail.getAttribute('aria-valuenow')).toBe('340');
    fireEvent.keyDown(rail, { key: 'ArrowLeft', shiftKey: true });
    expect(rail.getAttribute('aria-valuenow')).toBe('290');
    fireEvent.keyDown(rail, { key: 'Home' });
    expect(rail.getAttribute('aria-valuenow')).toBe('220');
  });

  it('resizes by pointer and removes active drag listeners when unmounted', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const view = render(<Sidebar defaultWidth={280}><SidebarContent>Pane</SidebarContent></Sidebar>);
    const rail = screen.getByRole('separator');
    fireEvent.pointerDown(rail, { pointerId: 4, button: 0, clientX: 100 });
    fireEvent.pointerMove(window, { pointerId: 4, clientX: 125 });
    expect(rail.getAttribute('aria-valuenow')).toBe('305');
    view.unmount();
    expect(remove).toHaveBeenCalledWith('pointermove', expect.any(Function));
    remove.mockRestore();
  });

  it('lets rail prop and slot handlers cancel keyboard and pointer resizing', () => {
    const keydown = vi.fn(event => event.preventDefault());
    const pointerdown = vi.fn(event => event.preventDefault());
    render(<Sidebar slotProps={{ rail: { onKeyDown: keydown, onPointerDown: pointerdown } }}>
      <SidebarContent>Pane</SidebarContent>
    </Sidebar>);
    const rail = screen.getByRole('separator');
    fireEvent.keyDown(rail, { key: 'End' });
    fireEvent.pointerDown(rail, { pointerId: 9, button: 0, clientX: 100 });
    fireEvent.pointerMove(window, { pointerId: 9, clientX: 140 });
    expect(keydown).toHaveBeenCalledOnce();
    expect(pointerdown).toHaveBeenCalledOnce();
    expect(rail.getAttribute('aria-valuenow')).toBe('280');
  });

  it('persists uncontrolled state through the replaceable storage seam', async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
    const view = render(<Sidebar persistence={{ key: 'left-sidebar', storage }} defaultWidth={250}>
      <SidebarContent>Saved content</SidebarContent></Sidebar>);
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    fireEvent.keyDown(screen.getByRole('separator'), { key: 'End' });
    await waitFor(() => expect(values.has('left-sidebar')).toBe(true));
    view.unmount();
    render(<Sidebar persistence={{ key: 'left-sidebar', storage }}><Probe name="restored" /></Sidebar>);
    await waitFor(() => expect(screen.getByLabelText('restored state').textContent).toBe('true|480|left'));
  });

  it('supports as/ref, named part styling and replaceable item body beside separate controls', () => {
    const ref = createRef<HTMLElement>();
    const itemRef = createRef<HTMLAnchorElement>();
    render(<Sidebar as="aside" ref={ref} classNames={{ root: 'custom-root', itemAction: 'primary-item' }} styles={{ itemAction: { color: 'red' } }} slotProps={{ itemAction: { title: 'Shared action' } }}>
      <SidebarItem href="/home" ref={itemRef} label="Home" icon={<span>H</span>} slotProps={{ action: { title: 'Primary action' } }} interactiveContent={<button aria-label="Item options">…</button>} />
    </Sidebar>);
    expect(ref.current?.tagName).toBe('ASIDE');
    expect(ref.current?.className).toContain('custom-root');
    expect(screen.getByRole('link', { name: /Home/ }).getAttribute('href')).toBe('/home');
    expect(itemRef.current).toBe(screen.getByRole('link', { name: /Home/ }));
    expect(itemRef.current?.title).toBe('Primary action');
    expect(itemRef.current?.className).toContain('primary-item');
    expect(itemRef.current?.style.color).toBe('red');
    expect(screen.getByRole('button', { name: 'Item options' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Item options' }).closest('a')).toBeNull();
  });

  it('prevents disabled navigation links from activating', () => {
    const action = vi.fn();
    render(<Sidebar><SidebarItem href="/disabled" label="Disabled" disabled onClick={action} /></Sidebar>);
    const link = screen.getByRole('link', { name: 'Disabled' });
    expect(fireEvent.click(link)).toBe(false);
    expect(action).not.toHaveBeenCalled();
  });
  it('protects disabled navigation semantics from consumer overrides', () => {
    render(<Sidebar slotProps={{ itemAction: { tabIndex: 0, 'aria-disabled': false } }}>
      <SidebarItem href="/disabled" label="Protected" disabled tabIndex={0} aria-disabled={false} />
    </Sidebar>);
    const link = screen.getByRole('link', { name: 'Protected' });
    expect(link.tabIndex).toBe(-1);
    expect(link.getAttribute('aria-disabled')).toBe('true');
  });

  it('allows a consumer trigger callback to cancel the default toggle', () => {
    render(<Sidebar showToggle={false}><SidebarTrigger onClick={event => event.preventDefault()}>Hold</SidebarTrigger><Probe name="state" /></Sidebar>);
    fireEvent.click(screen.getByRole('button', { name: 'Hold' }));
    expect(screen.getByLabelText('state state').textContent).toBe('false|280|left');
  });

  it('runs trigger slot callbacks before its default toggle', () => {
    const slotClick = vi.fn(event => event.preventDefault());
    render(<Sidebar showToggle={false} slotProps={{ trigger: { onClick: slotClick } }}>
      <SidebarTrigger>Hold</SidebarTrigger><Probe name="slot" />
    </Sidebar>);
    fireEvent.click(screen.getByRole('button', { name: 'Hold' }));
    expect(slotClick).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('slot state').textContent).toBe('false|280|left');
  });
});
