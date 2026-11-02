import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Smartphone,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Image as ImageIcon,
  QrCode,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import type { HotelUpiConfig } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  tableLabel: string;
  customerName: string;
  upiRef: string;
  onConfirmPayment: (data: { upiRef: string; utr?: string | undefined }) => void;
}

export function UpiPaymentDialog({
  open,
  onOpenChange,
  amount,
  tableLabel,
  customerName,
  upiRef,
  onConfirmPayment,
}: Props) {
  const [config, setConfig] = useState<HotelUpiConfig>({
    upiId: "gafargafar456456@okhdfcbank",
    upiName: "Gafar H",
    qrImage: "/images/gpay-merchant-qr.jpg",
    provider: "google_pay",
  });

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [utr, setUtr] = useState("");
  const [viewMode, setViewMode] = useState<"dynamic_qr" | "merchant_qr">("dynamic_qr");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch live configured UPI details from server
  useEffect(() => {
    if (open) {
      fetch("/api/upi-config")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.upiId) {
            setConfig(data);
          }
        })
        .catch(() => {
          // fallback to defaults
        });
    }
  }, [open]);

  // Clean NPCI UPI URL:
  // Note: Avoid 'tr=' parameter for personal/standard VPAs (@okhdfcbank) as NPCI risk filters
  // (Paytm Protect / PhonePe) flag 'tr' on non-registered corporate aggregator accounts.
  const cleanNote = `SaviRasa Order ${tableLabel}`.slice(0, 30);
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(config.upiId)}&pn=${encodeURIComponent(
    config.upiName
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;

  const copyToClipboard = (text: string, type: "upi" | "ref") => {
    navigator.clipboard?.writeText(text);
    if (type === "upi") {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
      toast.success("UPI ID copied!");
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
      toast.success("Transaction Ref copied!");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onConfirmPayment({
      upiRef,
      utr: utr.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-display">
            <Smartphone className="h-6 w-6 text-primary" />
            <span>Pay with Google Pay / UPI</span>
          </DialogTitle>
          <DialogDescription>
            Pay <span className="font-bold text-foreground">{formatINR(amount)}</span> directly to{" "}
            <span className="font-semibold text-foreground">{config.upiName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Amount & Reference Highlight Card */}
          <div className="rounded-xl border bg-muted/50 p-3.5 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Total Payable</span>
              <span className="text-xl font-bold font-display text-primary">{formatINR(amount)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t text-xs">
              <span className="text-muted-foreground">Order Reference:</span>
              <button
                type="button"
                onClick={() => copyToClipboard(upiRef, "ref")}
                className="font-mono font-semibold inline-flex items-center gap-1 text-foreground hover:text-primary transition"
              >
                <span>{upiRef}</span>
                {copiedRef ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 opacity-60" />}
              </button>
            </div>
          </div>

          {/* Direct UPI Intent Button (Mobile) */}
          <div className="space-y-2">
            <a
              href={upiIntentUrl}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold py-3 px-4 shadow-sm hover:bg-primary/90 transition text-sm text-center"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open in Google Pay / Any UPI App</span>
            </a>
            <p className="text-[11px] text-center text-muted-foreground">
              On mobile phones, tapping above opens Google Pay, PhonePe, or Paytm with the exact amount pre-filled.
            </p>
          </div>

          {/* QR Code Section */}
          <div className="rounded-xl border bg-card p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 pb-1">
              <Button
                type="button"
                variant={viewMode === "dynamic_qr" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setViewMode("dynamic_qr")}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Exact Amount QR</span>
              </Button>
              <Button
                type="button"
                variant={viewMode === "merchant_qr" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setViewMode("merchant_qr")}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Google Pay Standee QR</span>
              </Button>
            </div>

            {viewMode === "dynamic_qr" ? (
              <div className="space-y-2">
                <div className="mx-auto w-fit rounded-2xl bg-white p-3 border shadow-sm">
                  <QRCodeSVG
                    value={upiIntentUrl}
                    size={175}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Scan this code with Google Pay, PhonePe, or Paytm to pay <strong>{formatINR(amount)}</strong>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto w-fit max-w-[210px] rounded-xl overflow-hidden border shadow-sm bg-white p-2">
                  <img
                    src={config.qrImage}
                    alt="Google Pay Merchant QR"
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Hotel Google Pay QR: <strong>{config.upiName}</strong>
                </p>
              </div>
            )}

            {/* Merchant UPI ID Copy Pill */}
            <div className="pt-1">
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
                <span className="text-muted-foreground">UPI ID:</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(config.upiId, "upi")}
                  className="font-mono font-medium text-foreground hover:text-primary inline-flex items-center gap-1.5 transition"
                >
                  <span>{config.upiId}</span>
                  {copiedUpi ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Customer Confirmation Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="utr" className="text-xs font-medium">
                12-digit UPI UTR / Transaction ID (Optional)
              </Label>
              <Input
                id="utr"
                placeholder="e.g. 430128492019"
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 16))}
                maxLength={16}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Found in your payment app under transaction details. Helps staff verify your order instantly.
              </p>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="xl"
              className="w-full text-sm font-semibold gap-2"
              disabled={isSubmitting}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>I Have Completed Payment</span>
            </Button>
          </form>

          {/* Verification Protocol Notice */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-muted-foreground flex items-start gap-2 text-left">
            <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Orders paid via UPI are received by the kitchen with <strong>Awaiting Staff Verification</strong> status and confirmed against Google Pay merchant records.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
