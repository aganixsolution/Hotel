import { MongoClient, Db } from "mongodb";
import type { SyncState } from "./sync-server";

// Cache client globally across serverless invocations (Vercel best practice)
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const DEFAULT_DB_NAME = "savirasa_db";

export function getMongoUri(): string | undefined {
  return process.env.MONGODB_URI;
}

export function isMongoConfigured(): boolean {
  const uri = getMongoUri();
  return Boolean(uri && !uri.includes("<db_password>") && uri.startsWith("mongodb"));
}

export async function getMongoClient(): Promise<MongoClient | null> {
  const uri = getMongoUri();
  if (!isMongoConfigured() || !uri) {
    return null;
  }

  try {
    if (!globalThis._mongoClientPromise) {
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      globalThis._mongoClientPromise = client.connect();
    }
    return await globalThis._mongoClientPromise;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    globalThis._mongoClientPromise = undefined;
    return null;
  }
}

export async function getDatabase(): Promise<Db | null> {
  const client = await getMongoClient();
  if (!client) return null;
  return client.db(DEFAULT_DB_NAME);
}

/**
 * Fetch all synced collections from MongoDB
 */
export async function getMongoState(): Promise<SyncState | null> {
  const db = await getDatabase();
  if (!db) return null;

  try {
    const [orders, menu, tables, hotelDoc, metaDoc] = await Promise.all([
      db.collection("orders").find({}).sort({ createdAt: -1 }).toArray(),
      db.collection("menu").find({}).toArray(),
      db.collection("tables").find({}).sort({ number: 1 }).toArray(),
      db.collection("hotel").findOne({ id: "current" }),
      db.collection("meta").findOne({ id: "sync_meta" }),
    ]);

    // Clean _id field from documents
    const cleanDoc = (doc: any) => {
      if (!doc) return doc;
      const { _id, ...rest } = doc;
      return rest;
    };

    return {
      orders: orders.map(cleanDoc),
      menu: menu.length > 0 ? menu.map(cleanDoc) : undefined as any,
      tables: tables.length > 0 ? tables.map(cleanDoc) : undefined as any,
      hotel: hotelDoc ? cleanDoc(hotelDoc) : undefined,
      categories: undefined as any,
      timestamp: metaDoc?.timestamp || Date.now(),
    };
  } catch (err) {
    console.warn("Failed to fetch state from MongoDB:", err);
    return null;
  }
}

/**
 * Upsert and persist state to MongoDB collections
 */
export async function saveMongoState(key: string, value: any): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    const timestamp = Date.now();

    if (key === "orders" && Array.isArray(value)) {
      const ordersCol = db.collection("orders");
      const paymentsCol = db.collection("payments");

      // Upsert orders
      for (const order of value) {
        if (!order.id) continue;
        const { _id, ...orderData } = order;
        await ordersCol.updateOne(
          { id: order.id },
          { $set: orderData },
          { upsert: true }
        );

        // Record in payment history collection (Razorpay ready)
        await paymentsCol.updateOne(
          { orderId: order.id },
          {
            $set: {
              orderId: order.id,
              tableId: order.tableId,
              tableLabel: order.tableLabel,
              customerName: order.customerName,
              phone: order.phone,
              amount: order.total,
              subtotal: order.subtotal,
              tax: order.tax,
              paymentMethod: order.paymentMethod,
              paymentStatus: order.paymentStatus,
              paymentRef: order.paymentRef || null,
              // Prepared fields for Razorpay integration
              razorpay: {
                orderId: order.razorpayOrderId || null,
                paymentId: order.razorpayPaymentId || null,
                signature: order.razorpaySignature || null,
              },
              createdAt: order.createdAt,
              updatedAt: timestamp,
            },
          },
          { upsert: true }
        );
      }
    } else if (key === "menu" && Array.isArray(value)) {
      const menuCol = db.collection("menu");
      for (const item of value) {
        if (!item.id) continue;
        const { _id, ...itemData } = item;
        await menuCol.updateOne({ id: item.id }, { $set: itemData }, { upsert: true });
      }
    } else if (key === "tables" && Array.isArray(value)) {
      const tablesCol = db.collection("tables");
      for (const tbl of value) {
        if (!tbl.id) continue;
        const { _id, ...tblData } = tbl;
        await tablesCol.updateOne({ id: tbl.id }, { $set: tblData }, { upsert: true });
      }
    } else if (key === "hotel" && value) {
      const hotelCol = db.collection("hotel");
      const { _id, ...hotelData } = value;
      await hotelCol.updateOne({ id: "current" }, { $set: { id: "current", ...hotelData } }, { upsert: true });
    }

    // Update global timestamp metadata
    await db.collection("meta").updateOne(
      { id: "sync_meta" },
      { $set: { id: "sync_meta", timestamp } },
      { upsert: true }
    );

    return true;
  } catch (err) {
    console.error("Failed to save state to MongoDB:", err);
    return false;
  }
}

/**
 * Reset MongoDB collections back to default seed
 */
export async function resetMongoState(defState: SyncState): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    await Promise.all([
      db.collection("orders").deleteMany({}),
      db.collection("payments").deleteMany({}),
    ]);

    // Re-seed menu and tables
    const menuCol = db.collection("menu");
    await menuCol.deleteMany({});
    if (defState.menu.length > 0) {
      await menuCol.insertMany(defState.menu.map((m) => ({ ...m })));
    }

    const tablesCol = db.collection("tables");
    await tablesCol.deleteMany({});
    if (defState.tables.length > 0) {
      await tablesCol.insertMany(defState.tables.map((t) => ({ ...t })));
    }

    const hotelCol = db.collection("hotel");
    await hotelCol.updateOne(
      { id: "current" },
      { $set: { id: "current", ...defState.hotel } },
      { upsert: true }
    );

    await db.collection("meta").updateOne(
      { id: "sync_meta" },
      { $set: { id: "sync_meta", timestamp: Date.now() } },
      { upsert: true }
    );

    return true;
  } catch (err) {
    console.error("Failed to reset MongoDB:", err);
    return false;
  }
}
