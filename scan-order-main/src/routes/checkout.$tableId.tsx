import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Loader2,
  ShoppingBag,
  Smartphone,
  Store,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useState, useEffect, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
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
import { placeOrder, generateUpiRef } from "@/lib/orders";
import { calculateTotals, resolveCart } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

export const Route = createFileRoute("/checkout/$tableId")({
  head: () => ({
    meta: [
      { title: "Checkout — SaviRasa" },
      { name: "description", content: "Review your order and choose how to pay." },
      { property: "og:title", content: "Checkout — SaviRasa" },
      { property: "og:description", content: "Review your order and choose how to pay." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const METHODS: { id: PaymentMethod; title: string; text: string; icon: typeof Smartphone }[] = [
  { id: "upi", title: "Scan Hotel UPI QR Code", text: "Scan & pay with Google Pay, PhonePe, or Paytm", icon: Smartphone },
  { id: "counter", title: "Cash at counter", text: "Pay cash at the counter when you leave", icon: Store },
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
  const [utr, setUtr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [qrType, setQrType] = useState<"standee" | "dynamic">("standee");

  const [upiConfig, setUpiConfig] = useState({
    upiId: "gafargafar456456@okhdfcbank",
    upiName: "Gafar H",
    qrImage: "/images/gpay-merchant-qr.jpg",
  });

  useEffect(() => {
    fetch("/api/upi-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.upiId) setUpiConfig(data);
      })
      .catch(() => {});
  }, []);

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

  const cleanNote = `SaviRasa ${table.label}`.slice(0, 30);
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(upiConfig.upiId)}&pn=${encodeURIComponent(
    upiConfig.upiName
  )}&am=${totals.total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;

  const copyToClipboard = (text: string, type: "upi" | "amount") => {
    navigator.clipboard?.writeText(text);
    if (type === "upi") {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
      toast.success("UPI ID copied!");
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
      toast.success("Amount copied!");
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (method === "upi") {
      const cleanUtr = utr.trim().replace(/\D/g, "");
      if (cleanUtr.length < 12) {
        toast.error("Please enter the 12-digit UPI Transaction ID / UTR from your payment app");
        return;
      }

      setSubmitting(true);
      try {
        const orderRef = generateUpiRef();
        const order = placeOrder({
          tableId,
          customerName: name,
          phone,
          instructions,
          paymentMethod: "upi",
          paymentRef: orderRef,
          upiTransactionReference: orderRef,
          providerTransactionId: cleanUtr,
        });

        toast.success(`Order ${order.id} placed! Awaiting staff verification.`);
        navigate({ to: "/order/$orderId", params: { orderId: order.id } });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not place order");
        setSubmitting(false);
      }
      return;
    }

    // Counter cash order
    setSubmitting(true);
    try {
      const order = placeOrder({
        tableId,
        customerName: name,
        phone,
        instructions,
        paymentMethod: "counter",
      });

      toast.success(`Order ${order.id} sent to the kitchen!`);
      navigate({ to: "/order/$orderId", params: { orderId: order.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
      setSubmitting(false);
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
            {/* Customer Details */}
            <section className="rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="text-xl font-semibold">Your details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ananya"
                    maxLength={60}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Mobile (optional)</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98XXX XXXXX"
                    inputMode="tel"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="notes">Cooking instructions</Label>
                  <Textarea
                    id="notes"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Less spicy, no onion, extra chutney…"
                    maxLength={300}
                    rows={3}
                  />
                </div>
              </div>
            </section>

            {/* Payment Method Selection */}
            <section className="rounded-2xl border bg-card p-5 sm:p-6 space-y-4">
              <h2 className="text-xl font-semibold">Payment Method</h2>
              <div role="radiogroup" className="grid gap-3">
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
                        selected ? "border-primary bg-primary/10" : "hover:border-primary/40"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-11 place-items-center rounded-xl",
                          selected ? "bg-brass text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}
                      >
                        <m.icon className="size-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold">{m.title}</span>
                        <span className="block text-sm text-muted-foreground">{m.text}</span>
                      </span>
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded-full border-2",
                          selected ? "border-primary" : "border-border"
                        )}
                      >
                        {selected && <span className="size-2.5 rounded-full bg-primary" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Direct UPI QR & Manual Payment Box */}
              {method === "upi" && (
                <div className="mt-4 rounded-2xl border bg-muted/20 p-5 space-y-5 animate-in fade-in-50 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div>
                      <h3 className="font-semibold text-base text-foreground">Step 1: Scan QR & Pay Exact Food Amount</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Scan with Google Pay, PhonePe, or Paytm and transfer the exact bill amount
                      </p>
                    </div>
                  </div>

                  {/* Bill Amount Pill */}
                  <div className="flex items-center justify-between rounded-xl bg-card border p-3">
                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">
                        Exact Amount of Food
                      </span>
                      <span className="text-2xl font-bold font-display text-primary">{formatINR(totals.total)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(totals.total.toFixed(2), "amount")}
                      className="text-xs gap-1.5"
                    >
                      {copiedAmount ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>Copy Amount</span>
                    </Button>
                  </div>

                  {/* QR Display */}
                  <div className="rounded-xl border bg-card p-4 text-center space-y-3 shadow-sm">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant={qrType === "standee" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => setQrType("standee")}
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Hotel Google Pay Standee</span>
                      </Button>
                      <Button
                        type="button"
                        variant={qrType === "dynamic" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => setQrType("dynamic")}
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Auto-Amount QR</span>
                      </Button>
                    </div>

                    {qrType === "standee" ? (
                      <div className="space-y-2">
                        <div className="mx-auto w-fit max-w-[210px] rounded-xl overflow-hidden border shadow-sm bg-white p-2">
                          <img
                            src={upiConfig.qrImage}
                            alt="Hotel Google Pay Standee QR"
                            className="w-full h-auto object-contain rounded-lg"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Pay to: <strong>{upiConfig.upiName}</strong>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="mx-auto w-fit rounded-2xl bg-white p-3 border shadow-sm">
                          <QRCodeSVG value={upiIntentUrl} size={175} level="M" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Pre-fills <strong>{formatINR(totals.total)}</strong> when scanned
                        </p>
                      </div>
                    )}

                    {/* UPI ID Pill */}
                    <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
                      <span className="text-muted-foreground">UPI ID:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(upiConfig.upiId, "upi")}
                        className="font-mono font-medium text-foreground hover:text-primary inline-flex items-center gap-1.5 transition"
                      >
                        <span>{upiConfig.upiId}</span>
                        {copiedUpi ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>

                    {/* Mobile Direct App Intent Link */}
                    <div className="pt-1">
                      <a
                        href={upiIntentUrl}
                        className="inline-flex items-center justify-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Or tap here to open Google Pay / Any UPI App on this phone</span>
                      </a>
                    </div>
                  </div>

                  {/* Step 2: UTR Entry (Required before placing order) */}
                  <div className="space-y-2.5 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="checkout-utr" className="text-sm font-semibold text-foreground">
                        Step 2: Enter 12-digit UPI UTR / Transaction ID <span className="text-rose-500">*</span>
                      </Label>
                      <span className="text-xs font-mono text-muted-foreground">
                        {utr.replace(/\D/g, "").length}/12 digits
                      </span>
                    </div>

                    <Input
                      id="checkout-utr"
                      placeholder="e.g. 430128492019"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                      maxLength={12}
                      className="font-mono text-base tracking-wider bg-background"
                      required
                    />

                    <p className="text-xs text-muted-foreground">
                      After paying on Google Pay / Paytm, copy the 12-digit <strong>UTR</strong> or <strong>UPI Ref</strong> from the success screen and enter it here.
                    </p>

                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                      <span>
                        <strong>Workflow Notice:</strong> The order is submitted to the kitchen only after you enter the UTR and click Place Order. Staff will verify the payment before preparing food.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Aside Order Summary */}
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

            <Button
              type="submit"
              variant="hero"
              size="xl"
              className="w-full text-sm font-semibold"
              disabled={submitting || (method === "upi" && utr.replace(/\D/g, "").length < 12)}
            >
              {submitting && <Loader2 className="animate-spin mr-2" />}
              {method === "counter"
                ? "Place Order (Pay at Counter)"
                : utr.replace(/\D/g, "").length < 12
                ? "Enter 12-digit UTR to Place Order"
                : `Submit Payment & Place Order (${formatINR(totals.total)})`}
            </Button>
          </aside>
        </form>
      </div>
    </div>
  );
}
