import { getCartStore } from "@/lib/app-store";
import type { CartLine } from "@/types";

export function setQuantity(cart: CartLine[], itemId: string, quantity: number): CartLine[] {
  const q = Math.max(0, Math.min(99, Math.floor(quantity)));
  const exists = cart.some((l) => l.itemId === itemId);
  if (q === 0) return cart.filter((l) => l.itemId !== itemId);
  if (!exists) return [...cart, { itemId, quantity: q }];
  return cart.map((l) => (l.itemId === itemId ? { ...l, quantity: q } : l));
}

export const cartActions = (tableId: string) => {
  const store = getCartStore(tableId);
  return {
    add: (itemId: string) => {
      const current = store.get().find((l) => l.itemId === itemId)?.quantity ?? 0;
      store.set((c) => setQuantity(c, itemId, current + 1));
    },
    setQty: (itemId: string, qty: number) => store.set((c) => setQuantity(c, itemId, qty)),
    clear: () => store.set([]),
  };
};
