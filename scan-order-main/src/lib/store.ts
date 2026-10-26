import { useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed store.
 * - Works during SSR (returns the seed value on the server).
 * - Syncs across browser tabs through the `storage` event, so the admin
 *   dashboard in one tab sees customer orders placed in another tab.
 */
export interface PersistentStore<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  update: (updater: (prev: T) => T) => void;
  reset: () => void;
  subscribe: (listener: () => void) => () => void;
  getServerSnapshot: () => T;
}

const PREFIX = "aganix:";

export function createPersistentStore<T>(key: string, seed: T): PersistentStore<T> {
  const storageKey = PREFIX + key;
  const listeners = new Set<() => void>();
  let cache: T | undefined;
  let loaded = false;

  const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

  const read = (): T => {
    if (!canUseStorage()) return seed;
    if (loaded) return cache as T;
    try {
      const raw = window.localStorage.getItem(storageKey);
      cache = raw ? (JSON.parse(raw) as T) : seed;
    } catch {
      cache = seed;
    }
    loaded = true;
    return cache as T;
  };

  const emit = () => listeners.forEach((l) => l());

  const set: PersistentStore<T>["set"] = (next) => {
    const prev = read();
    const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
    cache = value;
    loaded = true;
    if (canUseStorage()) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
      } catch (err) {
        console.warn("Could not save to localStorage", err);
      }
    }
    emit();
  };

  const reset = () => {
    if (canUseStorage()) window.localStorage.removeItem(storageKey);
    cache = seed;
    loaded = true;
    emit();
  };

  const onStorage = (e: StorageEvent) => {
    if (e.key === storageKey || e.key === null) {
      loaded = false;
      emit();
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    if (listeners.size === 1 && typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && typeof window !== "undefined") {
        window.removeEventListener("storage", onStorage);
      }
    };
  };

  const update: PersistentStore<T>["update"] = (updater) => set(updater);

  return { get: read, set, update, reset, subscribe, getServerSnapshot: () => seed };
}

export function useStore<T>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}
