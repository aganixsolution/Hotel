import { CheckCircle2, CreditCard, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/format";

type Phase = "input" | "processing" | "success";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: "upi" | "card";
  amount: number;
  merchantName: string;
  onSuccess: (paymentRef: string) => void;
}

/** Simulated payment gateway — no real money moves. */
export function PaymentDialog({ open, onOpenChange, method, amount, merchantName, onSuccess }: Props) {
  const [phase, setPhase] = useState<Phase>("input");

  useEffect(() => {
    if (open) setPhase("input");
  }, [open]);

  const pay = () => {
    setPhase("processing");
    window.setTimeout(() => {
      setPhase("success");
      const ref = `${method.toUpperCase()}-DEMO-${Math.floor(10000 + Math.random() * 89999)}`;
      window.setTimeout(() => onSuccess(ref), 900);
    }, 1600);
  };

  const upiLink = `upi://pay?pa=aganix@demoupi&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR`;

  return (
    <Dialog open={open} onOpenChange={(o) => phase !== "processing" && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            {method === "upi" ? <Smartphone className="size-5 text-primary" /> : <CreditCard className="size-5 text-primary" />}
            {method === "upi" ? "Pay with UPI" : "Pay with card"}
          </DialogTitle>
          <DialogDescription>
            Demo payment · {merchantName} · <span className="font-semibold text-foreground">{formatINR(amount)}</span>
          </DialogDescription>
        </DialogHeader>

        {phase === "input" && method === "upi" && (
          <div className="space-y-5">
            <div className="mx-auto w-fit rounded-2xl bg-foreground p-4">
              <QRCodeSVG value={upiLink} size={180} bgColor="transparent" fgColor="currentColor" className="text-background" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Scan with any UPI app, or tap an app below to simulate a payment.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {["GPay", "PhonePe", "Paytm"].map((app) => (
                <Button key={app} variant="outline" onClick={pay}>
                  {app}
                </Button>
              ))}
            </div>
            <Button variant="hero" size="xl" className="w-full" onClick={pay}>
              Simulate successful payment
            </Button>
          </div>
        )}

        {phase === "input" && method === "card" && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              pay();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="card">Card number</Label>
              <Input id="card" defaultValue="4111 1111 1111 1111" inputMode="numeric" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="exp">Expiry</Label>
                <Input id="exp" defaultValue="12/29" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cvv">CVV</Label>
                <Input id="cvv" defaultValue="123" type="password" required />
              </div>
            </div>
            <Button type="submit" variant="hero" size="xl" className="w-full">
              Pay {formatINR(amount)}
            </Button>
          </form>
        )}

        {phase === "processing" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="font-semibold">Processing payment…</p>
            <p className="text-sm text-muted-foreground">Please don't close this window</p>
          </div>
        )}

        {phase === "success" && (
          <div className="flex flex-col items-center gap-3 py-10 animate-rise">
            <CheckCircle2 className="size-14 text-success" />
            <p className="text-lg font-semibold">Payment successful</p>
            <p className="text-sm text-muted-foreground">Sending your order to the kitchen…</p>
          </div>
        )}

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" /> Demo mode — no real money is charged
        </p>
      </DialogContent>
    </Dialog>
  );
}
