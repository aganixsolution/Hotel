import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Razorpay server helpers.
 * Uses the Razorpay REST API directly (no SDK) so it works in Vite dev,
 * Node server and Vercel serverless alike. The KEY_SECRET never leaves the server.
 */

function readEnv(name: string): string | undefined {
  const existing = process.env[name];
  if (existing) return existing.trim();

  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "scan-order-main", ".env"),
    path.resolve(process.cwd(), "..", ".env"),
  ];
  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue;
      const text = fs.readFileSync(file, "utf-8");
      const match = text.match(new RegExp(`^\\s*${name}\\s*=\\s*(.+)$`, "m"));
      if (match?.[1]) {
        const val = match[1].trim().replace(/^["']|["']$/g, "");
        process.env[name] = val;
        return val;
      }
    } catch {
      // ignore
    }
  }
  return undefined;
}

function getKeys() {
  const keyId = readEnv("RAZORPAY_KEY_ID");
  const keySecret = readEnv("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
  }
  return { keyId, keySecret };
}

export async function createRazorpayOrder(amountInRupees: number, receipt: string, notes: Record<string, string> = {}) {
  const { keyId, keySecret } = getKeys();
  const amount = Math.round(amountInRupees * 100); // paise
  if (!Number.isFinite(amount) || amount < 100) {
    throw new Error("Amount must be at least ₹1");
  }

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({ amount, currency: "INR", receipt: receipt.slice(0, 40), notes }),
  });

  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.description || `Razorpay order failed (${res.status})`);
  }

  return { orderId: data.id as string, amount: data.amount as number, currency: data.currency as string, keyId };
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const { keySecret } = getKeys();
  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
