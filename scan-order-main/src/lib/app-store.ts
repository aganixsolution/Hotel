import {
  seedCategories,
  seedHotel,
  seedMenu,
  seedOrders,
  seedTables,
} from "@/data/seed";
import { createPersistentStore, type PersistentStore } from "@/lib/store";
import type { CartLine, Category, HotelInfo, HotelTable, MenuItem, Order } from "@/types";

export const hotelStore = createPersistentStore<HotelInfo>("hotel", seedHotel);
export const categoriesStore = createPersistentStore<Category[]>("categories", seedCategories);
export const menuStore = createPersistentStore<MenuItem[]>("menu", seedMenu);
export const tablesStore = createPersistentStore<HotelTable[]>("tables", seedTables);
export const ordersStore = createPersistentStore<Order[]>("orders", seedOrders);

export interface AdminSession {
  email: string;
  loggedInAt: number;
}
export const sessionStore = createPersistentStore<AdminSession | null>("admin-session", null);

const cartStores = new Map<string, PersistentStore<CartLine[]>>();
const EMPTY_CART: CartLine[] = [];

export function getCartStore(tableId: string) {
  let store = cartStores.get(tableId);
  if (!store) {
    store = createPersistentStore<CartLine[]>(`cart:${tableId}`, EMPTY_CART);
    cartStores.set(tableId, store);
  }
  return store;
}

/** Resets every demo store back to the bundled sample data. */
export function resetDemoData() {
  [hotelStore, categoriesStore, menuStore, tablesStore, ordersStore].forEach((s) => s.reset());
  cartStores.forEach((s) => s.reset());
  if (typeof window !== "undefined") {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith("aganix:cart:"))
      .forEach((k) => window.localStorage.removeItem(k));
  }
}
