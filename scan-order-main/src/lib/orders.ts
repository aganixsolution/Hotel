import { getCartStore, hotelStore, menuStore, ordersStore, tablesStore } from "@/lib/app-store";
import { calculateTotals, resolveCart } from "@/lib/pricing";
import type { Order, OrderStatus, PaymentMethod } from "@/types";

export const STATUS_FLOW: OrderStatus[] = ["pending", "accepted", "preparing", "ready", "served"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "New order",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready to serve",
  served: "Served",
  cancelled: "Cancelled",
};

export const NEXT_ACTION: Partial<Record<OrderStatus, string>> = {
  pending: "Accept order",
  accepted: "Start preparing",
  preparing: "Mark ready",
  ready: "Mark served",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  upi: "UPI (online)",
  card: "Card (online)",
  counter: "Pay at counter",
};

export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(status);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? (STATUS_FLOW[i + 1] ?? null) : null;
}

/** Next sequential order number, e.g. AGX-1044 after AGX-1043. */
export function nextOrderId(existing: Pick<Order, "id">[]) {
  const max = existing.reduce((m, o) => {
    const n = Number(o.id.replace(/\D/g, ""));
    return Number.isFinite(n) && n > m ? n : m;
  }, 1000);
  return `AGX-${max + 1}`;
}

export interface PlaceOrderInput {
  tableId: string;
  customerName: string;
  phone?: string | undefined;
  instructions?: string | undefined;
  paymentMethod: PaymentMethod;
  paymentRef?: string | undefined;
}

export function placeOrder(input: PlaceOrderInput): Order {
  const cartStore = getCartStore(input.tableId);
  const lines = resolveCart(cartStore.get(), menuStore.get());
  if (lines.length === 0) throw new Error("Your cart is empty");

  const hotel = hotelStore.get();
  const table = tablesStore.get().find((t) => t.id === input.tableId);
  const totals = calculateTotals(lines, hotel.taxPercent);
  const now = Date.now();
  const isOnline = input.paymentMethod !== "counter";

  const order: Order = {
    id: nextOrderId(ordersStore.get()),
    tableId: input.tableId,
    tableLabel: table?.label ?? input.tableId,
    customerName: input.customerName.trim() || "Guest",
    phone: input.phone?.trim() || undefined,
    instructions: input.instructions?.trim() || undefined,
    lines: lines.map((l) => ({
      itemId: l.itemId,
      name: l.item.name,
      price: l.price,
      quantity: l.quantity,
      isVeg: l.item.isVeg,
    })),
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    paymentMethod: input.paymentMethod,
    paymentStatus: isOnline ? "paid" : "unpaid",
    paymentRef: input.paymentRef,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  ordersStore.set((orders) => [order, ...orders]);
  cartStore.set([]);
  return order;
}

export function updateOrder(id: string, patch: Partial<Order>) {
  ordersStore.set((orders) =>
    orders.map((o) => (o.id === id ? { ...o, ...patch, updatedAt: Date.now() } : o)),
  );
}

export const setOrderStatus = (id: string, status: OrderStatus) => updateOrder(id, { status });
export const markOrderPaid = (id: string) =>
  updateOrder(id, { paymentStatus: "paid", paymentRef: `COUNTER-${Date.now().toString().slice(-6)}` });
