import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, ReceiptText, XCircle } from "lucide-react";
import { BillSummary } from "@/components/shared/BillSummary";
import { FullPageMessage, LoadingScreen } from "@/components/shared/FullPageMessage";
import { PaymentBadge, StatusBadge } from "@/components/shared/StatusBadge";
import { VegMark } from "@/components/shared/VegMark";
import { StatusTracker } from "@/components/order/StatusTracker";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { hotelStore, ordersStore } from "@/lib/app-store";
import { formatINR, formatTime } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/orders";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/order/$orderId")({
  head: () => ({
    meta: [
      { title: "Track your order — Aganix Grand" },
      { name: "description", content: "Live status of your table order." },
      { property: "og:title", content: "Track your order — Aganix Grand" },
      { property: "og:description", content: "Live status of your table order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { orderId } = Route.useParams();
  const hydrated = useHydrated();
  const orders = useStore(ordersStore);
  const hotel = useStore(hotelStore);
  const order = orders.find((o) => o.id === orderId);

  if (!hydrated) return <LoadingScreen />;
  if (!order) {
    return (
      <FullPageMessage
        icon={<ReceiptText className="size-8" />}
        title="Order not found"
        description="We couldn't find this order on this device."
        action={
          <Button asChild variant="hero">
            <Link to="/">Go home</Link>
          </Button>
        }
      />
    );
  }

  const taxPercent = order.subtotal ? Math.round((order.tax / order.subtotal) * 1000) / 10 : hotel.taxPercent;

  return (
    <div className="min-h-screen bg-ember">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="text-center animate-rise">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{hotel.name}</p>
          <h1 className="mt-2 text-4xl font-semibold">
            {order.status === "served" ? "Enjoy your meal!" : order.status === "cancelled" ? "Order cancelled" : "Order received"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {order.id} · {order.tableLabel} · {formatTime(order.createdAt)}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} />
          </div>
        </div>

        <section className="mt-8 rounded-2xl border bg-card p-6">
          {order.status === "cancelled" ? (
            <div className="flex items-center gap-3 text-destructive">
              <XCircle className="size-6" />
              <p>This order was cancelled by the restaurant. Please speak to our staff.</p>
            </div>
          ) : (
            <>
              <h2 className="mb-5 text-xl font-semibold">Live status</h2>
              <StatusTracker status={order.status} />
              <p className="mt-5 text-xs text-muted-foreground">This page updates automatically.</p>
            </>
          )}
        </section>

        <section className="mt-5 rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Bill</h2>
          <ul className="mt-4 space-y-3">
            {order.lines.map((l) => (
              <li key={l.itemId} className="flex items-start gap-2 text-sm">
                <VegMark isVeg={l.isVeg} className="mt-0.5 size-3.5" />
                <span className="flex-1">
                  {l.name} <span className="text-muted-foreground">× {l.quantity}</span>
                </span>
                <span className="tabular-nums">{formatINR(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <BillSummary subtotal={order.subtotal} tax={order.tax} total={order.total} taxPercent={taxPercent} className="mt-4 border-t pt-4" />
          <div className="mt-4 rounded-xl bg-muted p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Payment:</span> {PAYMENT_LABEL[order.paymentMethod]}
              {order.paymentRef && <span className="text-muted-foreground"> · Ref {order.paymentRef}</span>}
            </p>
            {order.paymentStatus === "unpaid" && (
              <p className="mt-1 text-warning">Please pay {formatINR(order.total)} at the counter.</p>
            )}
            {order.instructions && (
              <p className="mt-1">
                <span className="text-muted-foreground">Note:</span> {order.instructions}
              </p>
            )}
          </div>
        </section>

        <div className="mt-6 flex justify-center">
          <Button asChild variant="hero" size="xl">
            <Link to="/menu/$tableId" params={{ tableId: order.tableId }}>
              <Plus /> Order more
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
