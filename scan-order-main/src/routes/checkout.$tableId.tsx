import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CreditCard, Loader2, ShoppingBag, Smartphone, Store } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PaymentDialog } from "@/components/checkout/PaymentDialog";
import { BillSummary } from "@/components/shared/BillSummary";
import { FullPageMessage, LoadingScreen } from "@/components/shared/FullPageMessage";
import { VegMark } from "@/components/shared/VegMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useHydrated } from "@/hooks/use-hydrated";
import { getCartStore, hotelStore, menuStore, tablesStore } from "@/lib/app-store";
import { formatINR } from "@/lib/format";
import { placeOrder } from "@/lib/orders";
import { calculateTotals, resolveCart } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

export const Route = createFileRoute("/checkout/$tableId")({
  head: () => ({
    meta: [
      { title: "Checkout — Aganix Grand" },
      { name: "description", content: "Review your order and choose how to pay." },
      { property: "og:title", content: "Checkout — Aganix Grand" },
      { property: "og:description", content: "Review your order and choose how to pay." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const METHODS: { id: PaymentMethod; title: string; text: string; icon: typeof Smartphone }[] = [
  { id: "upi", title: "UPI", text: "GPay, PhonePe, Paytm — demo", icon: Smartphone },
  { id: "card", title: "Credit / Debit card", text: "Visa, Mastercard, RuPay — demo", icon: CreditCard },
  { id: "counter", title: "Pay at counter", text: "Cash or card when you leave", icon: Store },
];

function CheckoutPage() {
  const { tableId } = Route.useParams();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const hotel = useStore(hotelStore);
  const menu = useStore(menuStore);
  const tables = useStore(tablesStore);
  const cart = useStore(getCartStore(tableId));

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [instructions, setInstructions] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [payOpen, setPayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const table = tables.find((t) => t.id === tableId);
  const lines = resolveCart(cart, menu);
  const totals = calculateTotals(lines, hotel.taxPercent);

  if (!hydrated) return <LoadingScreen />;

  if (!table || lines.length === 0) {
    return (
      <FullPageMessage
        icon={<ShoppingBag className="size-8" />}
        title={table ? "Your cart is empty" : "Table not found"}
        description="Head back to the menu to add some dishes."
        action={
          <Button asChild variant="hero">
            {table ? (
              <Link to="/menu/$tableId" params={{ tableId }}>
                Browse menu
              </Link>
            ) : (
              <Link to="/">Go home</Link>
            )}
          </Button>
        }
      />
    );
  }

  const finish = (paymentRef?: string) => {
    try {
      const order = placeOrder({ tableId, customerName: name, phone, instructions, paymentMethod: method, paymentRef });
      toast.success(`Order ${order.id} sent to the kitchen`);
      navigate({ to: "/order/$orderId", params: { orderId: order.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
      setSubmitting(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (method === "counter") {
      setSubmitting(true);
      window.setTimeout(() => finish(), 500);
    } else {
      setPayOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-ember">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link
          to="/menu/$tableId"
          params={{ tableId }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to menu
        </Link>
        <h1 className="mt-4 text-4xl font-semibold">Checkout</h1>
        <p className="text-muted-foreground">
          {table.label} · {table.area}
        </p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="text-xl font-semibold">Your details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ananya" maxLength={60} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Mobile (optional)</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXX XXXXX" inputMode="tel" maxLength={15} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="notes">Cooking instructions</Label>
                  <Textarea id="notes" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Less spicy, no onion, extra chutney…" maxLength={300} rows={3} />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="text-xl font-semibold">Payment</h2>
              <div role="radiogroup" className="mt-4 grid gap-3">
                {METHODS.map((m) => {
                  const selected = method === m.id;
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        "flex items-center gap-4 rounded-xl border p-4 text-left transition",
                        selected ? "border-primary bg-primary/10" : "hover:border-primary/40",
                      )}
                    >
                      <span className={cn("grid size-11 place-items-center rounded-xl", selected ? "bg-brass text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <m.icon className="size-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold">{m.title}</span>
                        <span className="block text-sm text-muted-foreground">{m.text}</span>
                      </span>
                      <span className={cn("grid size-5 place-items-center rounded-full border-2", selected ? "border-primary" : "border-border")}>
                        {selected && <span className="size-2.5 rounded-full bg-primary" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="h-fit space-y-5 rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-6">
            <h2 className="text-xl font-semibold">Order summary</h2>
            <ul className="space-y-3">
              {lines.map((l) => (
                <li key={l.itemId} className="flex items-start gap-2 text-sm">
                  <VegMark isVeg={l.item.isVeg} className="mt-0.5 size-3.5" />
                  <span className="flex-1">
                    {l.item.name} <span className="text-muted-foreground">× {l.quantity}</span>
                  </span>
                  <span className="tabular-nums">{formatINR(l.price * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <BillSummary {...totals} taxPercent={hotel.taxPercent} className="border-t pt-4" />
            <Button type="submit" variant="hero" size="xl" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              {method === "counter" ? "Place order" : `Pay ${formatINR(totals.total)}`}
            </Button>
          </aside>
        </form>
      </div>

      {method !== "counter" && (
        <PaymentDialog
          open={payOpen}
          onOpenChange={setPayOpen}
          method={method}
          amount={totals.total}
          merchantName={hotel.name}
          onSuccess={(ref) => {
            setPayOpen(false);
            finish(ref);
          }}
        />
      )}
    </div>
  );
}
