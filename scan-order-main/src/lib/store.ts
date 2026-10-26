import { useSyncExternalStore } from "react";

/**
 * Shared Local & Network Synchronized Store.
 * - Local: localStorage cache with cross-tab storage event.
 * - Network: Real-time synchronization over the same Wi-Fi network via /api/sync.
 * - When a phone scans a table QR code and places an order, the order is
 *   instantly pushed to the server and received by the laptop admin dashboard!
 */
export interface PersistentStore<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  update: (updater: (prev: T) => T) => void;
  reset: () => void;
  subscribe: (listener: () => void) => () => void;
  getServerSnapshot: () => T;
  _applyRemote?: (val: T) => void;
}

const PREFIX = "savirasa:";
const OLD_PREFIX = "aganix:";

interface RegisteredStore {
  applyRemote: (val: any) => void;
  get: () => any;
}

const storeRegistry = new Map<string, RegisteredStore>();
let pollingStarted = false;
let lastServerTimestamp = 0;

function syncRemote(key: string, value: any) {
  if (typeof window === "undefined") return;
  // Don't sync sessionStore or table carts over network (those are per-device)
  if (key.startsWith("cart:") || key.includes("session")) return;

  fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  }).catch((err) => {
    // Network error or offline - local storage still works
    console.debug("Store network sync offline:", err);
  });
}

function initNetworkSync() {
  if (typeof window === "undefined" || pollingStarted) return;
  pollingStarted = true;

  const poll = async () => {
    try {
      const res = await fetch("/api/sync", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      if (data.timestamp && data.timestamp > lastServerTimestamp) {
        lastServerTimestamp = data.timestamp;

        for (const [key, registered] of storeRegistry.entries()) {
          if (data[key] !== undefined) {
            registered.applyRemote(data[key]);
          }
        }
      }
    } catch {
      // Server down or offline
    }
  };

  // Immediate poll on boot
  poll();

  // Poll every 1200ms for live updates across phone and laptop
  const interval = window.setInterval(poll, 1200);

  // Also poll immediately when window regains focus
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") poll();
  });
}

export function createPersistentStore<T>(key: string, seed: T): PersistentStore<T> {
  const storageKey = PREFIX + key;
  const oldStorageKey = OLD_PREFIX + key;
  const listeners = new Set<() => void>();
  let cache: T | undefined;
  let loaded = false;

  const canUseStorage = () => typeof window !== "undefined" && !!window.localStorage;

  const read = (): T => {
    if (!canUseStorage()) return seed;
    if (loaded) return cache as T;
    try {
      // Check current key, then migrate from old key if exists
      let raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        raw = window.localStorage.getItem(oldStorageKey);
      }
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
    syncRemote(key, value);
  };

  const reset = () => {
    if (canUseStorage()) {
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(oldStorageKey);
    }
    cache = seed;
    loaded = true;
    emit();
    syncRemote(key, seed);
  };

  const applyRemote = (remoteData: T) => {
    const current = read();
    const currentStr = JSON.stringify(current);
    const remoteStr = JSON.stringify(remoteData);

    if (currentStr !== remoteStr) {
      cache = remoteData;
      loaded = true;
      if (canUseStorage()) {
        try {
          window.localStorage.setItem(storageKey, remoteStr);
        } catch {}
      }
      emit();
    }
  };

  const onStorage = (e: StorageEvent) => {
    if (e.key === storageKey || e.key === oldStorageKey || e.key === null) {
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

  // Register for remote network sync
  if (typeof window !== "undefined" && !key.startsWith("cart:") && !key.includes("session")) {
    storeRegistry.set(key, { applyRemote, get: () => cache });
    initNetworkSync();
  }

  return {
    get: read,
    set,
    update,
    reset,
    subscribe,
    getServerSnapshot: () => seed,
    _applyRemote: applyRemote,
  };
}

export function useStore<T>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}
