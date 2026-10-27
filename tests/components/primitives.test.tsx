// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import * as primitives from '../../packages/ui/src/primitives/foundation';

afterEach(cleanup);

describe('foundation public contract', () => {
  it('preserves static disabled slot defaults through provider and instance merging', () => {
    render(<primitives.ComponentDefaultsProvider defaults={{ Button: { slotProps: { root: { disabled: true } } } }}>
      <primitives.Button slotProps={{ root: { title: 'Merged' } }}>{state => String(state.disabled)}</primitives.Button>
    </primitives.ComponentDefaultsProvider>);
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('true');
    expect(button.title).toBe('Merged');
  });
  it('preserves provider disabled state when instance root props use a callback', () => {
    const root = vi.fn((state: primitives.ButtonState) => ({ title: state.disabled ? 'Disabled' : 'Enabled' }));
    render(<primitives.ComponentDefaultsProvider defaults={{ Button: { slotProps: { root: { disabled: true } } } }}>
      <primitives.Button slotProps={{ root }}>{state => String(state.disabled)}</primitives.Button>
    </primitives.ComponentDefaultsProvider>);
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(root).toHaveBeenCalledOnce();
    expect(root.mock.calls[0][0].disabled).toBe(true);
    expect(button.disabled).toBe(true);
    expect(button.title).toBe('Disabled');
    expect(button.textContent).toBe('true');
  });
  it('preserves later static slot precedence when provider layers are mixed with callbacks', () => {
    render(<primitives.ComponentDefaultsProvider defaults={{ Button: { slotProps: { root: { disabled: true } } } }}>
      <primitives.ComponentDefaultsProvider defaults={{ Button: { slotProps: { root: { disabled: false } } } }}>
        <primitives.Button slotProps={{ root: () => ({ title: 'Enabled' }) }}>Run</primitives.Button>
      </primitives.ComponentDefaultsProvider>
    </primitives.ComponentDefaultsProvider>);
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(button.title).toBe('Enabled');
  });
  it('inherits Button root defaults inside IconButton when no IconButton override is supplied', () => {
    render(<primitives.ComponentDefaultsProvider defaults={{ Button: {
      slotProps: { root: { title: 'Button default' } }, classNames: { root: 'button-default' },
    } }}><primitives.IconButton label="Close" /></primitives.ComponentDefaultsProvider>);
    const button = screen.getByRole('button');
    expect(button.title).toBe('Button default');
    expect(button.className).toContain('button-default');
  });
  it('preserves IconButton provider state when instance root props use a callback', () => {
    const root = vi.fn((state: primitives.ButtonState) => ({ title: state.disabled ? 'Disabled' : 'Enabled' }));
    render(<primitives.ComponentDefaultsProvider defaults={{ IconButton: { slotProps: { root: { disabled: true } } } }}>
      <primitives.IconButton label="Close" slotProps={{ root }}>{state => String(state.disabled)}</primitives.IconButton>
    </primitives.ComponentDefaultsProvider>);
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(root).toHaveBeenCalledOnce();
    expect(root.mock.calls[0][0].disabled).toBe(true);
    expect(button.disabled).toBe(true);
    expect(button.title).toBe('Disabled');
    expect(button.textContent).toBe('true');
  });
  it('honors slot naming and slot content', () => {
    render(<><primitives.Icon slotProps={{ root: () => ({ 'aria-label': 'Slot status' }) }} />
      <primitives.Button slotProps={{ root: { children: 'Slot action' } }} /></>);
    expect(screen.getByRole('img', { name: 'Slot status' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Slot action' })).toBeTruthy();
  });
  it('uses coherent disabled state and forwards native behavior to a custom button', () => {
    const Custom = (props: React.ComponentPropsWithRef<'button'>) => <button {...props} />;
    render(<primitives.Button as={Custom} aria-disabled classNames={{ root: s => s.disabled ? 'off' : 'on' }}>{s => String(s.disabled)}</primitives.Button>);
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.className).toContain('off');
    expect(button.textContent).toBe('true');
    expect(button.disabled).toBe(true);
    expect(button.type).toBe('button');
  });
  it('evaluates root and appearance callbacks once against the same disabled state', () => {
    const root = vi.fn((state: primitives.ButtonState) => ({ title: state.disabled ? 'disabled' : 'enabled' }));
    const appearance = vi.fn((state: primitives.ButtonState) => state.disabled ? 'off' : 'on');
    render(<primitives.Button disabled slotProps={{ root }} classNames={{ root: appearance }}>
      {state => String(state.disabled)}
    </primitives.Button>);
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(root).toHaveBeenCalledOnce();
    expect(appearance).toHaveBeenCalledOnce();
    expect(root.mock.calls[0][0]).toEqual(appearance.mock.calls[0][0]);
    expect(button.title).toBe('disabled');
    expect(button.className).toContain('off');
    expect(button.textContent).toBe('true');
  });
  it('keeps disabled behavior authoritative against conflicting JavaScript callback values', () => {
    const root = vi.fn(() => ({ disabled: true, 'aria-disabled': true, title: 'callback' } as any));
    const action = vi.fn();
    render(<primitives.Button slotProps={{ root }} onAction={action}>Run</primitives.Button>);
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(root).toHaveBeenCalledOnce();
    expect(button.disabled).toBe(false);
    expect(button.hasAttribute('aria-disabled')).toBe(false);
    expect(button.title).toBe('callback');
    fireEvent.click(button);
    expect(action).toHaveBeenCalledOnce();
  });
  it('replaces the named icon independently and inherits scoped part overrides', () => {
    const Graphic = (props: React.ComponentPropsWithRef<'span'>) => <span {...props}>Replacement</span>;
    render(<primitives.ComponentDefaultsProvider defaults={{ IconButton: { classNames: { root: 'p-8' }, slotProps: { root: { title: 'Scoped' } } } }}>
      <primitives.IconButton label="Replace" slots={{ icon: Graphic }} slotProps={{ icon: { title: 'Graphic' } }} classNames={{ root: 'p-2', icon: 'graphic' }} />
    </primitives.ComponentDefaultsProvider>);
    expect(screen.getByRole('button').title).toBe('Scoped');
    expect(screen.getByRole('button').className).toContain('p-2');
    expect(screen.getByRole('button').className).not.toContain('p-8');
    expect(screen.getByText('Replacement').title).toBe('Graphic');
    expect(screen.getByText('Replacement').className).toContain('graphic');
  });
  it('exports all six primitives', () => {
    for (const name of ['Text', 'Icon', 'Button', 'IconButton', 'BaseLayoutContainer', 'LayoutContainer']) {
      expect(primitives).toHaveProperty(name);
    }
  });

  it('forwards native props and target refs while merging styling by channel', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<primitives.Text as="a" href="/docs" ref={ref} className="p-2 keep"
      slotProps={{ root: { className: 'p-4', style: { color: 'red', margin: 1 } } }}
      classNames={{ root: 'p-6' }} styles={{ root: { color: 'blue' } }}>Docs</primitives.Text>);
    expect(ref.current).toBe(screen.getByRole('link'));
    expect(ref.current?.getAttribute('href')).toBe('/docs');
    expect(ref.current?.className).toContain('p-6');
    expect(ref.current?.className).not.toContain('p-2');
    expect(ref.current?.style.color).toBe('blue');
    expect(ref.current?.style.margin).toBe('1px');
  });

  it('runs consumer click handlers before cancellable action and suppresses disabled links', () => {
    const action = vi.fn();
    const consumer = vi.fn((event) => event.preventDefault());
    const { rerender } = render(<primitives.Button onClick={consumer} onAction={action}>Run</primitives.Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(consumer).toHaveBeenCalledOnce();
    expect(action).not.toHaveBeenCalled();
    rerender(<primitives.Button as="a" href="/run" disabled onAction={action}>Run</primitives.Button>);
    const link = screen.getByRole('link');
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.hasAttribute('disabled')).toBe(false);
    expect(fireEvent.click(link)).toBe(false);
    expect(action).not.toHaveBeenCalled();
  });

  it('composes React 19 cleanup refs and scoped defaults with instance overrides', () => {
    const stop = vi.fn();
    const ref = createRef<HTMLButtonElement>();
    const { unmount } = render(<primitives.ComponentDefaultsProvider defaults={{ Button: { options: { size: 'sm' } } }}>
      <primitives.Button ref={ref} slotProps={{ root: { ref: () => stop } }}
        options={{ size: 'lg' }}>Save</primitives.Button>
    </primitives.ComponentDefaultsProvider>);
    expect(ref.current?.dataset.size).toBe('lg');
    unmount();
    expect(stop).toHaveBeenCalledOnce();
    expect(ref.current).toBeNull();
  });

  it('keeps merged top-level React 19 refs stable across rerenders', () => {
    const providerCleanup = vi.fn();
    const instanceCleanup = vi.fn();
    const providerRef = vi.fn(() => providerCleanup);
    const instanceRef = vi.fn(() => instanceCleanup);
    const defaults = { Button: { ref: providerRef } };
    const { rerender, unmount } = render(<primitives.ComponentDefaultsProvider defaults={defaults}>
      <primitives.Button ref={instanceRef}>Save</primitives.Button>
    </primitives.ComponentDefaultsProvider>);
    rerender(<primitives.ComponentDefaultsProvider defaults={defaults}>
      <primitives.Button ref={instanceRef}>Save</primitives.Button>
    </primitives.ComponentDefaultsProvider>);
    expect(providerRef).toHaveBeenCalledOnce();
    expect(instanceRef).toHaveBeenCalledOnce();
    expect(providerCleanup).not.toHaveBeenCalled();
    expect(instanceCleanup).not.toHaveBeenCalled();
    unmount();
    expect(providerCleanup).toHaveBeenCalledOnce();
    expect(instanceCleanup).toHaveBeenCalledOnce();
  });

  it('keeps merged slot root React 19 refs stable across rerenders', () => {
    const providerCleanup = vi.fn();
    const instanceCleanup = vi.fn();
    const providerRef = vi.fn(() => providerCleanup);
    const instanceRef = vi.fn(() => instanceCleanup);
    const defaults = { Button: { slotProps: { root: { ref: providerRef } } } };
    const slotProps = { root: { ref: instanceRef } };
    const { rerender, unmount } = render(<primitives.ComponentDefaultsProvider defaults={defaults}>
      <primitives.Button slotProps={slotProps}>Save</primitives.Button>
    </primitives.ComponentDefaultsProvider>);
    rerender(<primitives.ComponentDefaultsProvider defaults={defaults}>
      <primitives.Button slotProps={slotProps}>Save</primitives.Button>
    </primitives.ComponentDefaultsProvider>);
    expect(providerRef).toHaveBeenCalledOnce();
    expect(instanceRef).toHaveBeenCalledOnce();
    expect(providerCleanup).not.toHaveBeenCalled();
    expect(instanceCleanup).not.toHaveBeenCalled();
    unmount();
    expect(providerCleanup).toHaveBeenCalledOnce();
    expect(instanceCleanup).toHaveBeenCalledOnce();
  });

  it('cleans replaced refs once and preserves the object ref on the existing node', () => {
    const objectRef = createRef<HTMLButtonElement>();
    const oldCleanup = vi.fn();
    const nextCleanup = vi.fn();
    const oldRef = vi.fn(() => oldCleanup);
    const nextRef = vi.fn(() => nextCleanup);
    const defaults = { Button: { ref: objectRef } };
    const { rerender, unmount } = render(<primitives.ComponentDefaultsProvider defaults={defaults}>
      <primitives.Button ref={oldRef}>Replace ref</primitives.Button>
    </primitives.ComponentDefaultsProvider>);
    const node = screen.getByRole('button', { name: 'Replace ref' });
    expect(objectRef.current).toBe(node);
    rerender(<primitives.ComponentDefaultsProvider defaults={defaults}>
      <primitives.Button ref={nextRef}>Replace ref</primitives.Button>
    </primitives.ComponentDefaultsProvider>);
    expect(oldRef).toHaveBeenCalledOnce();
    expect(oldCleanup).toHaveBeenCalledOnce();
    expect(nextRef).toHaveBeenCalledOnce();
    expect(nextCleanup).not.toHaveBeenCalled();
    expect(objectRef.current).toBe(node);
    unmount();
    expect(oldCleanup).toHaveBeenCalledOnce();
    expect(nextCleanup).toHaveBeenCalledOnce();
    expect(objectRef.current).toBeNull();
  });

  it('supports state callbacks and unstyled while preserving action semantics', () => {
    render(<primitives.Button unstyled disabled classNames={{ root: state => state.disabled ? 'custom-disabled' : '' }}>Save</primitives.Button>);
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.type).toBe('button');
    expect(button.className).toBe('custom-disabled');
  });

  it('names icons and icon buttons without exposing decorative graphics', () => {
    render(<><primitives.Icon><svg /></primitives.Icon><primitives.Icon label="Status"><svg /></primitives.Icon>
      <primitives.IconButton label="Close"><svg /></primitives.IconButton></>);
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Status' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('supports custom roots and preserves existing layout defaults additively', () => {
    const Root = ({ as: Tag = 'section', ...props }: { as?: React.ElementType } & React.HTMLAttributes<HTMLElement>) => <Tag {...props} />;
    const { container } = render(<primitives.LayoutContainer as="main" slots={{ root: Root }} region="body" id="layout">Body</primitives.LayoutContainer>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('MAIN');
    expect(root.dataset.layoutRegion).toBe('body');
    expect(root.className).toContain('overflow-hidden');
    expect(root.style.contain).toBe('inline-size layout paint');
  });

  it('preserves keyboard activation when a button renders a structural element', () => {
    const action = vi.fn();
    render(<primitives.Button as="div" onAction={action}>Action</primitives.Button>);
    const button = screen.getByRole('button', { name: 'Action' });
    expect(button.tabIndex).toBe(0);
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(action).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(button, { key: ' ' });
    fireEvent.keyUp(button, { key: ' ' });
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('preserves independent nested provider defaults', () => {
    render(<primitives.ComponentDefaultsProvider defaults={{ Button: { options: { size: 'sm', variant: 'outline' } } }}>
      <primitives.Button>Outer</primitives.Button>
      <primitives.ComponentDefaultsProvider defaults={{ Button: { options: { size: 'lg' } } }}>
        <primitives.Button>Inner</primitives.Button>
      </primitives.ComponentDefaultsProvider>
    </primitives.ComponentDefaultsProvider>);
    expect(screen.getByText('Outer').dataset.size).toBe('sm');
    expect(screen.getByText('Inner').dataset.size).toBe('lg');
    expect(screen.getByText('Inner').dataset.variant).toBe('outline');
  });
});
