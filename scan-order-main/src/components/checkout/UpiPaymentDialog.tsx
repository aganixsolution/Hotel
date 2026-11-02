import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Image as ImageIcon,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Info,
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
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [utr, setUtr] = useState("");
  const [viewMode, setViewMode] = useState<"merchant_qr" | "dynamic_qr">("merchant_qr");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          // fallback
        });
    }
  }, [open]);

  // Clean UPI string for QR scanner (avoids risk policy triggers on camera scan)
  const cleanNote = `SaviRasa ${tableLabel}`.slice(0, 30);
  const upiQrString = `upi://pay?pa=${encodeURIComponent(config.upiId)}&pn=${encodeURIComponent(
    config.upiName
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utr.trim().replace(/\D/g, "");

    if (cleanUtr.length < 12) {
      toast.error("Please enter the complete 12-digit UPI UTR number from your payment app");
      return;
    }

    setIsSubmitting(true);
    onConfirmPayment({
      upiRef,
      utr: cleanUtr,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <QrCode className="h-5 w-5 text-primary" />
            <span>Scan UPI QR to Pay</span>
          </DialogTitle>
          <DialogDescription>
            Pay <span className="font-bold text-foreground">{formatINR(amount)}</span> to{" "}
            <span className="font-semibold text-foreground">{config.upiName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Amount Card */}
          <div className="rounded-xl border bg-primary/5 border-primary/20 p-3 flex justify-between items-center text-sm">
            <div>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">
                Exact Amount to Pay
              </span>
              <span className="text-2xl font-bold font-display text-primary">{formatINR(amount)}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => copyToClipboard(amount.toFixed(2), "amount")}
            >
              {copiedAmount ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              <span>Copy ₹</span>
            </Button>
          </div>

          {/* QR Code Section */}
          <div className="rounded-2xl border bg-card p-4 text-center space-y-3 shadow-sm">
            <div className="flex items-center justify-center gap-2">
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
              <Button
                type="button"
                variant={viewMode === "dynamic_qr" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setViewMode("dynamic_qr")}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>Auto-Amount QR</span>
              </Button>
            </div>

            {viewMode === "merchant_qr" ? (
              <div className="space-y-2">
                <div className="mx-auto w-fit max-w-[220px] rounded-xl overflow-hidden border shadow-sm bg-white p-2">
                  <img
                    src={config.qrImage}
                    alt="Hotel Google Pay Merchant QR"
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Scan with <strong>Google Pay</strong>, <strong>PhonePe</strong>, or <strong>Paytm</strong>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto w-fit rounded-2xl bg-white p-3 border shadow-sm">
                  <QRCodeSVG value={upiQrString} size={180} level="M" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Pre-fills <strong>{formatINR(amount)}</strong> when scanned
                </p>
              </div>
            )}

            {/* UPI ID Pill */}
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

          {/* 3 Step Guide */}
          <div className="rounded-xl border bg-muted/30 p-3 space-y-1.5 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground flex items-center gap-1.5 pb-1 border-b">
              <Info className="h-3.5 w-3.5 text-primary" />
              <span>How to complete your order:</span>
            </div>
            <p>1. Open <strong>Google Pay</strong>, <strong>PhonePe</strong>, or <strong>Paytm</strong></p>
            <p>2. Scan the QR code above and pay <strong>{formatINR(amount)}</strong></p>
            <p>3. Copy the <strong>12-digit UPI UTR</strong> from your payment receipt and enter below</p>
          </div>

          {/* Customer Confirmation Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <Label htmlFor="utr" className="text-xs font-semibold">
                  12-digit UPI UTR / Transaction ID <span className="text-rose-500">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {utr.replace(/\D/g, "").length}/12 digits
                </span>
              </div>
              <Input
                id="utr"
                placeholder="e.g. 430128492019"
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                maxLength={12}
                required
                className="font-mono text-sm tracking-wider"
              />
              <p className="text-[11px] text-muted-foreground">
                Found on your payment success screen under <em>UPI Transaction ID</em> or <em>UTR</em>.
              </p>
            </div>

            {/* Anti-Fraud Notice */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Verification Policy:</strong> Kitchen starts cooking only after restaurant staff verifies the payment in their Google Pay app. Fake UTRs will be rejected.
              </span>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="xl"
              className="w-full text-sm font-semibold gap-2"
              disabled={isSubmitting || utr.replace(/\D/g, "").length < 12}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Submit Payment for Verification</span>
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
