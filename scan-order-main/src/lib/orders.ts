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
  upi: "Google Pay / UPI",
  card: "Card",
  counter: "Cash at counter",
};

export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(status);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? (STATUS_FLOW[i + 1] ?? null) : null;
}

/** Generate unique UPI transaction reference */
export function generateUpiRef(orderId?: string): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const cleanId = orderId ? orderId.replace(/\D/g, "") : Date.now().toString().slice(-4);
  return `UPI-${cleanId}-${randomSuffix}`;
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
  upiTransactionReference?: string | undefined;
  providerTransactionId?: string | undefined;
}

export function placeOrder(input: PlaceOrderInput): Order {
  const cartStore = getCartStore(input.tableId);
  const lines = resolveCart(cartStore.get(), menuStore.get());
  if (lines.length === 0) throw new Error("Your cart is empty");

  const hotel = hotelStore.get();
  const table = tablesStore.get().find((t) => t.id === input.tableId);
  const totals = calculateTotals(lines, hotel.taxPercent);
  const now = Date.now();
  const nextId = nextOrderId(ordersStore.get());

  // Determine initial payment status:
  // UPI direct transfer requires admin verification against GPay/bank records
  // Counter orders remain unpaid until collected at counter
  const initialPaymentStatus =
    input.paymentMethod === "upi" ? "awaiting_verification" : "unpaid";

  const upiRef =
    input.paymentMethod === "upi"
      ? input.upiTransactionReference || generateUpiRef(nextId)
      : undefined;

  const order: Order = {
    id: nextId,
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
    paymentStatus: initialPaymentStatus,
    paymentRef: input.paymentRef || upiRef,
    upiTransactionReference: upiRef,
    providerTransactionId: input.providerTransactionId?.trim() || undefined,
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

export const verifyUpiOrderPayment = (id: string, verifiedBy: string = "Admin") => {
  updateOrder(id, {
    paymentStatus: "paid",
    status: "accepted",
    verifiedAt: Date.now(),
    verifiedBy,
  });
};
