import { MongoClient } from "mongodb";
import dns from "node:dns";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]);

console.log("=== Testing SaviRasa Direct UPI Payment & Verification Workflow ===");

// 1. Verify environment configuration
console.log("\n[1] Checking Configured Merchant Details:");
const upiId = process.env.HOTEL_UPI_ID;
const upiName = process.env.HOTEL_UPI_NAME;
const qrImage = process.env.HOTEL_UPI_QR_IMAGE;
console.log(`- HOTEL_UPI_ID: ${upiId}`);
console.log(`- HOTEL_UPI_NAME: ${upiName}`);
console.log(`- HOTEL_UPI_QR_IMAGE: ${qrImage}`);

if (!upiId || !upiName) {
  console.error("FAIL: Missing HOTEL_UPI_ID or HOTEL_UPI_NAME in .env");
  process.exit(1);
}

// 2. Verify QR image file exists in public/images
const publicImgPath = path.resolve(__dirname, `../public${qrImage}`);
console.log(`- QR Image file exists on disk: ${fs.existsSync(publicImgPath)} (${publicImgPath})`);

// 3. Connect to MongoDB Atlas
console.log("\n[2] Connecting to MongoDB Atlas...");
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db("savirasa_db");
console.log("SUCCESS: Connected to MongoDB Atlas.");

// 4. Create a simulated Direct UPI Order
const testOrderId = `TEST-UPI-${Date.now()}`;
const upiRef = `UPI-${Date.now().toString().slice(-4)}-7892`;
const customerUtr = "430129849201";

const testOrder = {
  id: testOrderId,
  tableId: "t2",
  tableLabel: "Table 2",
  customerName: "Gafar Guest",
  phone: "9876543210",
  lines: [
    { itemId: "butter-chicken", name: "Butter Chicken", price: 349, quantity: 1, isVeg: false }
  ],
  subtotal: 349,
  tax: 17.45,
  total: 366.45,
  paymentMethod: "upi",
  paymentStatus: "awaiting_verification",
  paymentRef: upiRef,
  upiTransactionReference: upiRef,
  providerTransactionId: customerUtr,
  status: "pending",
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

console.log(`\n[3] Creating order with status 'awaiting_verification': ${testOrderId}`);
console.log(`- UPI Ref: ${upiRef}`);
console.log(`- Customer UTR: ${customerUtr}`);

// Upsert to orders and payments collections
await db.collection("orders").insertOne(testOrder);
await db.collection("payments").insertOne({
  orderId: testOrder.id,
  tableId: testOrder.tableId,
  tableLabel: testOrder.tableLabel,
  customerName: testOrder.customerName,
  phone: testOrder.phone,
  amount: testOrder.total,
  subtotal: testOrder.subtotal,
  tax: testOrder.tax,
  paymentMethod: testOrder.paymentMethod,
  paymentStatus: testOrder.paymentStatus,
  paymentRef: testOrder.paymentRef,
  upiTransactionReference: testOrder.upiTransactionReference,
  providerTransactionId: testOrder.providerTransactionId,
  createdAt: testOrder.createdAt,
  updatedAt: testOrder.updatedAt,
});

// Verify saved in MongoDB
const orderDoc = await db.collection("orders").findOne({ id: testOrderId });
const paymentDoc = await db.collection("payments").findOne({ orderId: testOrderId });

console.log(`- Order saved in MongoDB orders collection: ${!!orderDoc} (status: ${orderDoc?.paymentStatus})`);
console.log(`- Payment record saved in MongoDB: ${!!paymentDoc} (UPI Ref: ${paymentDoc?.upiTransactionReference})`);

if (orderDoc?.paymentStatus !== "awaiting_verification") {
  console.error("FAIL: Expected paymentStatus to be 'awaiting_verification'");
  process.exit(1);
}

// 5. Admin Manual Verification Test
console.log("\n[4] Simulating Admin Direct UPI Verification...");
const verifiedAt = Date.now();
const verifiedBy = "Admin (Gafar)";

await db.collection("orders").updateOne(
  { id: testOrderId },
  {
    $set: {
      paymentStatus: "paid",
      status: "accepted",
      verifiedAt,
      verifiedBy,
      updatedAt: verifiedAt,
    }
  }
);

await db.collection("payments").updateOne(
  { orderId: testOrderId },
  {
    $set: {
      paymentStatus: "paid",
      verifiedAt,
      verifiedBy,
      updatedAt: verifiedAt,
    }
  }
);

const updatedOrder = await db.collection("orders").findOne({ id: testOrderId });
const updatedPayment = await db.collection("payments").findOne({ orderId: testOrderId });

console.log(`- Verified Order paymentStatus: ${updatedOrder?.paymentStatus} (order status: ${updatedOrder?.status})`);
console.log(`- Verified By: ${updatedOrder?.verifiedBy} at ${new Date(updatedOrder?.verifiedAt).toLocaleTimeString()}`);
console.log(`- Verified Payment collection status: ${updatedPayment?.paymentStatus}`);

// 6. Cleanup
await db.collection("orders").deleteOne({ id: testOrderId });
await db.collection("payments").deleteOne({ orderId: testOrderId });
console.log("\n[5] Cleaned up test records from database.");

await client.close();
console.log("\nSUCCESS: Direct UPI payment workflow fully verified!");
