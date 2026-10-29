import { MongoClient } from "mongodb";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]);
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const uri = process.env.MONGODB_URI;

console.log("==================================================");
console.log("           SAVIRASA MONGODB ATLAS TEST            ");
console.log("==================================================");

if (!uri) {
  console.error("❌ MONGODB_URI not found in .env!");
  process.exit(1);
}

if (uri.includes("<db_password>")) {
  console.error("❌ Please replace <db_password> in your .env with your real password!");
  process.exit(1);
}

const masked = uri.replace(/:([^:@]+)@/, ":****@");
console.log(`Connecting to: ${masked}...`);

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });

async function run() {
  try {
    await client.connect();
    console.log("✅ Successfully connected to MongoDB Atlas!");

    const db = client.db("savirasa_db");
    const ping = await db.command({ ping: 1 });
    console.log("✅ Database ping OK:", ping);

    const collections = await db.listCollections().toArray();
    console.log("\n📁 Collections in database 'savirasa_db':");
    for (const c of collections) {
      const count = await db.collection(c.name).countDocuments();
      console.log(`  - ${c.name.padEnd(12)} : ${count} documents`);
    }

    console.log("\n==================================================");
    console.log("🎉 MongoDB connection is ACTIVE and READY!");
    console.log("==================================================");
    process.exit(0);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
