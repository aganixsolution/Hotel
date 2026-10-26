import type { CartLine, MenuItem } from "@/types";

export const round2 = (n: number) => Math.round(n * 100) / 100;

export interface Totals {
  itemCount: number;
  subtotal: number;
  tax: number;
  total: number;
}

/** Subtotal of priced lines, GST at `taxPercent`, and grand total (all in ₹, 2 decimals). */
export function calculateTotals(
  lines: { price: number; quantity: number }[],
  taxPercent: number,
): Totals {
  const subtotal = round2(lines.reduce((sum, l) => sum + l.price * l.quantity, 0));
  const tax = round2((subtotal * taxPercent) / 100);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
  return { itemCount, subtotal, tax, total: round2(subtotal + tax) };
}

/** Joins cart lines with menu items, dropping lines whose item no longer exists or is unavailable. */
export function resolveCart(cart: CartLine[], menu: MenuItem[]) {
  return cart
    .map((line) => {
      const item = menu.find((m) => m.id === line.itemId);
      return item && item.isAvailable && line.quantity > 0
        ? { ...line, item, price: item.price }
        : null;
    })
    .filter((l): l is CartLine & { item: MenuItem; price: number } => l !== null);
}
