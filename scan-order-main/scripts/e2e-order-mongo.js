// End-to-end check: POST an order through /api/sync (same path the phone uses),
// then verify it is stored in MongoDB `orders` + `payments`, then clean up.
import { MongoClient } from "mongodb";
import dns from "node:dns";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]);

const BASE = process.argv[2] || "http://localhost:8080";
const id = `E2E-${Date.now()}`;
const order = {
  id,
  tableId: "t1",
  tableLabel: "Table 1",
  customerName: "E2E Test",
  phone: "9999999999",
  items: [{ menuItemId: "paneer-tikka", name: "Paneer Tikka", price: 289, quantity: 1 }],
  subtotal: 289,
  tax: 14.45,
  total: 303.45,
  status: "pending",
  paymentMethod: "counter",
  paymentStatus: "unpaid",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const cur = await (await fetch(`${BASE}/api/sync`)).json();
const res = await fetch(`${BASE}/api/sync`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ key: "orders", value: [order, ...(cur.orders || [])] }),
});
console.log("POST /api/sync:", res.status, await res.text());

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("savirasa_db");
const o = await db.collection("orders").findOne({ id });
const p = await db.collection("payments").findOne({ orderId: id });
console.log("orders doc found:  ", !!o, o ? `total=${o.total}` : "");
console.log("payments doc found:", !!p, p ? `amount=${p.amount} status=${p.paymentStatus}` : "");

const after = await (await fetch(`${BASE}/api/sync`)).json();
console.log("GET /api/sync returns order:", after.orders.some((x) => x.id === id));

await db.collection("orders").deleteOne({ id });
await db.collection("payments").deleteOne({ orderId: id });
console.log("cleaned up test order");
await client.close();
process.exit(o && p ? 0 : 1);
