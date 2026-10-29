import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface ControllableStateOptions<T> {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}

/** Controlled values always win; uncontrolled values start from defaultValue. */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): readonly [T, Dispatch<SetStateAction<T>>] {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const controlled = value !== undefined;
  const currentValue = controlled ? value : internalValue;

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    next => {
      const resolved = typeof next === 'function'
        ? (next as (current: T) => T)(currentValue)
        : next;
      onChange?.(resolved);
      if (!controlled) setInternalValue(resolved);
    },
    [controlled, currentValue, onChange],
  );

  return [currentValue, setValue] as const;
}

export interface PersistentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type PersistentStateErrorCode =
  | 'read'
  | 'parse'
  | 'version'
  | 'migration'
  | 'validation'
  | 'write';

export class PersistentStateError extends Error {
  constructor(
    readonly code: PersistentStateErrorCode,
    readonly key: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'PersistentStateError';
  }
}

export interface UsePersistentStateOptions<T> {
  /** The in-memory value used when persistence is disabled or unreadable. */
  initialValue: T | (() => T);
  /** Omit to keep this state in memory only. */
  key?: string;
  /** Envelope version written with the value. Defaults to 1. */
  version?: number;
  /** Omit to use browser localStorage; pass null to disable persistence. */
  storage?: PersistentStorage | null;
  /** Listen for matching browser storage events. Defaults to false. */
  syncAcrossTabs?: boolean;
  /** Convert a stored value from an older schema version. */
  migrate?: (value: unknown, fromVersion: number) => T;
  /** Runtime validation for values read from storage. */
  validate?: (value: unknown) => value is T;
  /** Storage and data errors are reported here while memory behavior continues. */
  onError?: (error: PersistentStateError) => void;
}

interface PersistentSnapshot<T> {
  key?: string;
  version: number;
  storage?: PersistentStorage | null;
  value: T;
  writable: boolean;
}

function report(
  callback: UsePersistentStateOptions<unknown>['onError'],
  error: PersistentStateError,
): void {
  callback?.(error);
}

function browserStorage(): PersistentStorage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function decodeStoredValue<T>(
  serialized: string,
  key: string,
  version: number,
  migrate?: (value: unknown, fromVersion: number) => T,
  validate?: (value: unknown) => value is T,
): T {
  let stored: unknown;
  try {
    stored = JSON.parse(serialized);
  } catch (cause) {
    throw new PersistentStateError('parse', key, 'Stored state is not valid JSON.', { cause });
  }

  if (!stored || typeof stored !== 'object' || !('version' in stored) || !('value' in stored)) {
    throw new PersistentStateError('parse', key, 'Stored state has an invalid envelope.');
  }

  const storedVersion = (stored as { version: unknown }).version;
  if (typeof storedVersion !== 'number' || !Number.isSafeInteger(storedVersion) || storedVersion < 0) {
    throw new PersistentStateError('version', key, 'Stored state has an invalid version.');
  }

  let nextValue = (stored as { value: unknown }).value;
  if (storedVersion !== version) {
    if (storedVersion > version || !migrate) {
      throw new PersistentStateError('version', key, `Stored version ${storedVersion} cannot be read as version ${version}.`);
    }
    try {
      nextValue = migrate(nextValue, storedVersion);
    } catch (cause) {
      throw new PersistentStateError('migration', key, 'Stored state migration failed.', { cause });
    }
  }

  if (validate && !validate(nextValue)) {
    throw new PersistentStateError('validation', key, 'Stored state failed validation.');
  }
  return nextValue as T;
}

/** In-memory by default; a key opts into versioned, replaceable storage. */
export function usePersistentState<T>({
  initialValue,
  key,
  version = 1,
  storage,
  syncAcrossTabs = false,
  migrate,
  validate,
  onError,
}: UsePersistentStateOptions<T>): readonly [T, Dispatch<SetStateAction<T>>] {
  const [fallbackValue] = useState<T>(initialValue);
  const [snapshot, setSnapshot] = useState<PersistentSnapshot<T>>(() => ({
    key,
    version,
    storage,
    value: fallbackValue,
    writable: false,
  }));
  const onErrorRef = useRef(onError);
  const migrateRef = useRef(migrate);
  const validateRef = useRef(validate);
  onErrorRef.current = onError;
  migrateRef.current = migrate;
  validateRef.current = validate;

  const matchesConfig = (candidate: PersistentSnapshot<T>) => candidate.key === key
    && (!key || (candidate.version === version && candidate.storage === storage));
  const value = matchesConfig(snapshot) ? snapshot.value : fallbackValue;

  useEffect(() => {
    if (!key || storage === null) {
      setSnapshot(previous => matchesConfig(previous)
        ? { ...previous, writable: false }
        : { key, version, storage, value: fallbackValue, writable: false });
      return;
    }

    const saveSnapshot = (nextValue: T, writable: boolean) => {
      setSnapshot({ key, version, storage, value: nextValue, writable });
    };

    let target: PersistentStorage | null;
    try {
      target = storage ?? browserStorage();
    } catch (cause) {
      report(onErrorRef.current, new PersistentStateError('read', key, 'Could not access persistent storage.', { cause }));
      saveSnapshot(fallbackValue, false);
      return;
    }
    if (!target) {
      saveSnapshot(fallbackValue, false);
      return;
    }

    let serialized: string | null;
    try {
      serialized = target.getItem(key);
    } catch (cause) {
      report(onErrorRef.current, new PersistentStateError('read', key, 'Could not read persistent state.', { cause }));
      saveSnapshot(fallbackValue, false);
      return;
    }
    if (serialized === null) {
      saveSnapshot(fallbackValue, true);
      return;
    }

    try {
      const nextValue = decodeStoredValue<T>(serialized, key, version, migrateRef.current, validateRef.current);
      saveSnapshot(nextValue, true);
    } catch (error) {
      const persistentError = error instanceof PersistentStateError
        ? error
        : new PersistentStateError('parse', key, 'Stored state could not be decoded.', { cause: error });
      report(onErrorRef.current, persistentError);
      saveSnapshot(fallbackValue, false);
    }
  }, [key, version, storage, fallbackValue]);

  useEffect(() => {
    if (!syncAcrossTabs || !key || storage === null || typeof window === 'undefined') return;

    let target: PersistentStorage | null;
    try {
      target = storage ?? browserStorage();
    } catch (cause) {
      report(onErrorRef.current, new PersistentStateError('read', key, 'Could not access persistent storage for synchronization.', { cause }));
      return;
    }
    if (!target) return;

    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== (target as unknown as Storage) || (event.key !== key && event.key !== null)) return;
      if (event.newValue === null) {
        setSnapshot({ key, version, storage, value: fallbackValue, writable: false });
        return;
      }
      try {
        const nextValue = decodeStoredValue<T>(event.newValue, key, version, migrateRef.current, validateRef.current);
        setSnapshot({ key, version, storage, value: nextValue, writable: false });
      } catch (error) {
        const persistentError = error instanceof PersistentStateError
          ? error
          : new PersistentStateError('parse', key, 'Synchronized state could not be decoded.', { cause: error });
        report(onErrorRef.current, persistentError);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [syncAcrossTabs, key, storage, version, fallbackValue]);

  const setPersistentValue = useCallback<Dispatch<SetStateAction<T>>>(next => {
    setSnapshot(previous => {
      const current = matchesConfig(previous) ? previous.value : fallbackValue;
      const nextValue = typeof next === 'function'
        ? (next as (current: T) => T)(current)
        : next;
      return { key, version, storage, value: nextValue, writable: true };
    });
  }, [key, version, storage, fallbackValue]);

  useEffect(() => {
    if (!key || storage === null || !matchesConfig(snapshot) || !snapshot.writable) return;
    try {
      const target = storage ?? browserStorage();
      if (!target) return;
      target.setItem(key, JSON.stringify({ version, value: snapshot.value }));
    } catch (cause) {
      report(onErrorRef.current, new PersistentStateError('write', key, 'Could not write persistent state.', { cause }));
    }
  }, [key, storage, version, snapshot]);

  return [value, setPersistentValue] as const;
}
