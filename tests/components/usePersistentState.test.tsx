// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PersistentStateError,
  useControllableState,
  usePersistentState,
} from '../../packages/ui/src/hooks/usePersistentState';
import type { PersistentStorage } from '../../packages/ui/src/hooks/usePersistentState';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.removeItem('persistent-state-test');
  localStorage.removeItem('persistent-state-sync');
  localStorage.removeItem('persistent-state-sync-malformed');
  localStorage.removeItem('persistent-state-sync-cleanup');
});

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const storage: PersistentStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  return { storage, values };
}

function PersistentCounter({
  storage,
  onError,
}: {
  storage: PersistentStorage;
  onError?: (error: PersistentStateError) => void;
}) {
  const [count, setCount] = usePersistentState({
    initialValue: 2,
    key: 'counter',
    storage,
    onError,
  });
  return <button onClick={() => setCount(current => current + 1)}>{count}</button>;
}

describe('useControllableState', () => {
  it('uses local state by default and lets controlled values stay authoritative', () => {
    const onChange = vi.fn();
    function Counter({ value }: { value?: number }) {
      const [count, setCount] = useControllableState({ value, defaultValue: 3, onChange });
      return <button onClick={() => setCount(current => current + 1)}>{count}</button>;
    }

    const view = render(<Counter />);
    expect(screen.getByRole('button').textContent).toBe('3');
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button').textContent).toBe('4');

    view.rerender(<Counter value={10} />);
    onChange.mockClear();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button').textContent).toBe('10');
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button').textContent).toBe('10');
    expect(onChange).toHaveBeenCalledWith(11);
  });
});

describe('usePersistentState', () => {
  it('works in memory when no persistence key is supplied', () => {
    function Counter() {
      const [count, setCount] = usePersistentState({ initialValue: 4 });
      return <button onClick={() => setCount(current => current + 1)}>{count}</button>;
    }

    render(<Counter />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button').textContent).toBe('5');
  });

  it('uses browser localStorage for a keyed state when no adapter is supplied', async () => {
    const key = 'persistent-state-test';
    localStorage.setItem(key, JSON.stringify({ version: 1, value: 'saved' }));
    function Value() {
      const [value] = usePersistentState({ initialValue: 'initial', key });
      return <span>{value}</span>;
    }

    render(<Value />);
    await waitFor(() => expect(screen.getByText('saved')).toBeTruthy());
  });

  it('syncs valid storage events without echo-writing them', async () => {
    const key = 'persistent-state-sync';
    localStorage.setItem(key, JSON.stringify({ version: 1, value: 1 }));
    function Value() {
      const [value] = usePersistentState({ initialValue: 0, key, syncAcrossTabs: true });
      return <span>{value}</span>;
    }

    render(<Value />);
    await waitFor(() => expect(screen.getByText('1')).toBeTruthy());
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const next = JSON.stringify({ version: 1, value: 2 });
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: next, storageArea: localStorage }));
    await waitFor(() => expect(screen.getByText('2')).toBeTruthy());
    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.getItem(key)).toBe(JSON.stringify({ version: 1, value: 1 }));
    setItem.mockRestore();
  });

  it('preserves current state and storage when a synchronized event is malformed', async () => {
    const key = 'persistent-state-sync-malformed';
    const original = JSON.stringify({ version: 1, value: 7 });
    localStorage.setItem(key, original);
    const onError = vi.fn();
    function Value() {
      const [value] = usePersistentState({ initialValue: 0, key, syncAcrossTabs: true, onError });
      return <span>{value}</span>;
    }

    render(<Value />);
    await waitFor(() => expect(screen.getByText('7')).toBeTruthy());
    window.dispatchEvent(new StorageEvent('storage', { key, newValue: '{broken', storageArea: localStorage }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'parse', key })));
    expect(screen.getByText('7')).toBeTruthy();
    expect(localStorage.getItem(key)).toBe(original);
  });

  it('removes the storage listener on unmount', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    function Value() {
      const [value] = usePersistentState({ initialValue: 0, key: 'persistent-state-sync-cleanup', syncAcrossTabs: true });
      return <span>{value}</span>;
    }

    const view = render(<Value />);
    const listener = add.mock.calls.find(([type]) => type === 'storage')?.[1];
    expect(listener).toBeDefined();
    view.unmount();
    expect(remove).toHaveBeenCalledWith('storage', listener);
    add.mockRestore();
    remove.mockRestore();
  });

  it('loads, migrates, validates and rewrites a versioned value', async () => {
    const { storage, values } = memoryStorage({
      counter: JSON.stringify({ version: 1, value: '8' }),
    });
    const migrate = vi.fn((value: unknown) => Number(value));
    function Counter() {
      const [count] = usePersistentState({
        initialValue: 0,
        key: 'counter',
        version: 2,
        storage,
        migrate,
        validate: (value): value is number => typeof value === 'number',
      });
      return <span>{count}</span>;
    }

    render(<Counter />);
    await waitFor(() => expect(screen.getByText('8')).toBeTruthy());
    expect(migrate).toHaveBeenCalledWith('8', 1);
    await waitFor(() => expect(JSON.parse(values.get('counter')!)).toEqual({ version: 2, value: 8 }));
  });

  it('preserves malformed stored data until a user change makes it writable', async () => {
    const original = '{broken';
    const { storage, values } = memoryStorage({ counter: original });
    const onError = vi.fn();

    render(<PersistentCounter storage={storage} onError={onError} />);
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'parse', key: 'counter' })));
    expect(values.get('counter')).toBe(original);
    expect(screen.getByRole('button').textContent).toBe('2');

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(JSON.parse(values.get('counter')!)).toEqual({ version: 1, value: 3 }));
  });

  it('keeps values that fail validation untouched and reports a typed error', async () => {
    const original = JSON.stringify({ version: 1, value: 'not-a-number' });
    const { storage, values } = memoryStorage({ counter: original });
    const onError = vi.fn();

    function Counter() {
      const [count] = usePersistentState({
        initialValue: 6,
        key: 'counter',
        storage,
        validate: (value): value is number => typeof value === 'number',
        onError,
      });
      return <span>{count}</span>;
    }

    render(<Counter />);
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'validation' })));
    expect(screen.getByText('6')).toBeTruthy();
    expect(values.get('counter')).toBe(original);
  });

  it('does not copy the prior key value over unreadable data after a storage switch', async () => {
    const storageA = memoryStorage({ counter: JSON.stringify({ version: 1, value: 9 }) });
    const originalB = '{broken';
    const storageB = memoryStorage({ counter: originalB });
    const onError = vi.fn();
    function Counter({ storage }: { storage: PersistentStorage }) {
      const [count] = usePersistentState({
        initialValue: 0,
        key: 'counter',
        storage,
        onError,
      });
      return <span>{count}</span>;
    }

    const view = render(<Counter storage={storageA.storage} />);
    await waitFor(() => expect(screen.getByText('9')).toBeTruthy());
    view.rerender(<Counter storage={storageB.storage} />);
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'parse' })));

    expect(screen.getByText('0')).toBeTruthy();
    expect(storageB.values.get('counter')).toBe(originalB);
  });

  it('reports storage read failures as typed errors and keeps memory usable', async () => {
    const onError = vi.fn();
    const storage: PersistentStorage = {
      getItem: () => { throw new Error('read failed'); },
      setItem: vi.fn(),
    };

    render(<PersistentCounter storage={storage} onError={onError} />);
    await waitFor(() => expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(PersistentStateError));
    expect(onError.mock.calls[0]?.[0].code).toBe('read');
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button').textContent).toBe('3');
    expect(storage.setItem).toHaveBeenCalled();
  });
});
