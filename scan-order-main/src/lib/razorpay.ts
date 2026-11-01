/** Client-side Razorpay Checkout (UPI only). */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load Razorpay. Check your internet connection."));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export async function payWithRazorpayUpi(opts: {
  amount: number;
  tableId: string;
  merchantName: string;
  customerName: string;
  phone?: string;
}): Promise<RazorpaySuccess> {
  await loadScript();

  const res = await fetch("/api/razorpay/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: opts.amount, tableId: opts.tableId, customerName: opts.customerName }),
  });
  const order = await res.json();
  if (!res.ok) throw new Error(order?.error || "Could not start payment");

  const result = await new Promise<RazorpaySuccess>((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: opts.merchantName,
      description: `Table ${opts.tableId} order`,
      prefill: { name: opts.customerName, contact: opts.phone || "" },
      theme: { color: "#c8932f" },
      // Show ONLY UPI inside Razorpay checkout
      config: {
        display: {
          blocks: {
            upi: { name: "Pay using UPI", instruments: [{ method: "upi" }] },
          },
          sequence: ["block.upi"],
          preferences: { show_default_blocks: false },
        },
      },
      handler: (response: RazorpaySuccess) => resolve(response),
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    rzp.on("payment.failed", (resp: any) => reject(new Error(resp?.error?.description || "Payment failed")));
    rzp.open();
  });

  const verify = await fetch("/api/razorpay/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });
  const v = await verify.json();
  if (!verify.ok || !v.verified) throw new Error(v?.error || "Payment verification failed");

  return result;
}
