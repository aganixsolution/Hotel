import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const uri = process.env.MONGODB_URI;
console.log("Using URI:", uri ? uri.replace(/:[^:]*@/, ":****@") : "None");

if (!uri || uri.includes("<db_password>")) {
  console.error("Please ensure MONGODB_URI is set with your actual password in .env");
  process.exit(1);
}

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas successfully!");
    const db = client.db("savirasa_db");

    // 1. Hotel Info
    await db.collection("hotel").updateOne(
      { id: "current" },
      {
        $set: {
          id: "current",
          name: "SaviRasa",
          tagline: "Authentic Flavours & Modern Hospitality",
          address: "12 MG Road, Bengaluru, Karnataka 560001",
          phone: "+91 80 4567 8900",
          gstin: "29ABCDE1234F1Z5",
          taxPercent: 5,
          qrBaseUrl: "",
        },
      },
      { upsert: true }
    );
    console.log("Seeded hotel collection!");

    // 2. Tables
    const tablesCount = await db.collection("tables").countDocuments();
    if (tablesCount === 0) {
      await db.collection("tables").insertMany([
        { id: "t1", number: 1, label: "Table 1", seats: 2, area: "Window", isActive: true },
        { id: "t2", number: 2, label: "Table 2", seats: 4, area: "Window", isActive: true },
        { id: "t3", number: 3, label: "Table 3", seats: 4, area: "Main Hall", isActive: true },
        { id: "t4", number: 4, label: "Table 4", seats: 6, area: "Main Hall", isActive: true },
        { id: "t5", number: 5, label: "Table 5", seats: 4, area: "Courtyard", isActive: true },
        { id: "t6", number: 6, label: "Table 6", seats: 8, area: "Private Dining", isActive: true },
      ]);
      console.log("Seeded tables collection!");
    }

    // 3. Menu
    const menuCount = await db.collection("menu").countDocuments();
    if (menuCount === 0) {
      await db.collection("menu").insertMany([
        {
          id: "paneer-tikka",
          name: "Paneer Tikka",
          description: "Cottage cheese cubes marinated in hung curd and spices, char-grilled in tandoor.",
          price: 289,
          categoryId: "starters",
          image: "/images/paneer-tikka.jpg",
          isVeg: true,
          isAvailable: true,
          isBestseller: true,
          spiceLevel: 2,
        },
        {
          id: "chicken-65",
          name: "Chicken 65",
          description: "Crispy Chennai-style fried chicken tossed with curry leaves and green chillies.",
          price: 319,
          categoryId: "starters",
          image: "/images/chicken-65.jpg",
          isVeg: false,
          isAvailable: true,
          spiceLevel: 3,
        },
        {
          id: "butter-chicken",
          name: "Butter Chicken",
          description: "Tandoori chicken simmered in a velvety tomato, butter and cream gravy.",
          price: 399,
          categoryId: "mains",
          image: "/images/butter-chicken.jpg",
          isVeg: false,
          isAvailable: true,
          isBestseller: true,
          spiceLevel: 1,
        },
        {
          id: "dal-makhani",
          name: "Dal Makhani",
          description: "Black lentils slow-cooked overnight with butter and cream. A house classic.",
          price: 279,
          categoryId: "mains",
          image: "/images/dal-makhani.jpg",
          isVeg: true,
          isAvailable: true,
          spiceLevel: 1,
        },
        {
          id: "palak-paneer",
          name: "Palak Paneer",
          description: "Soft paneer in a silky spinach gravy finished with garlic tadka.",
          price: 299,
          categoryId: "mains",
          image: "/images/palak-paneer.jpg",
          isVeg: true,
          isAvailable: true,
          spiceLevel: 1,
        },
        {
          id: "chicken-biryani",
          name: "Hyderabadi Chicken Biryani",
          description: "Aged basmati and tender chicken dum-cooked with saffron, mint and fried onions.",
          price: 379,
          categoryId: "biryani",
          image: "/images/chicken-biryani.jpg",
          isVeg: false,
          isAvailable: true,
          isBestseller: true,
          spiceLevel: 2,
        },
        {
          id: "veg-biryani",
          name: "Veg Dum Biryani",
          description: "Seasonal vegetables and basmati layered with whole spices and sealed in handi.",
          price: 299,
          categoryId: "biryani",
          image: "/images/veg-biryani.jpg",
          isVeg: true,
          isAvailable: true,
          spiceLevel: 2,
        },
        {
          id: "butter-naan",
          name: "Butter Naan",
          description: "Leavened flatbread baked in the tandoor and brushed with butter.",
          price: 69,
          categoryId: "breads",
          image: "/images/naan.jpg",
          isVeg: true,
          isAvailable: true,
        },
        {
          id: "garlic-naan",
          name: "Garlic Naan",
          description: "Tandoor-baked naan topped with roasted garlic and fresh coriander.",
          price: 89,
          categoryId: "breads",
          image: "/images/naan.jpg",
          isVeg: true,
          isAvailable: true,
        },
        {
          id: "masala-dosa",
          name: "Masala Dosa",
          description: "Crisp rice and lentil crepe with spiced potato, served with sambar and chutney.",
          price: 179,
          categoryId: "south",
          image: "/images/masala-dosa.jpg",
          isVeg: true,
          isAvailable: true,
          isBestseller: true,
          spiceLevel: 1,
        },
        {
          id: "gulab-jamun",
          name: "Gulab Jamun",
          description: "Warm milk dumplings soaked in rose and cardamom syrup.",
          price: 129,
          categoryId: "desserts",
          image: "/images/gulab-jamun.jpg",
          isVeg: true,
          isAvailable: true,
        },
        {
          id: "rasmalai",
          name: "Rasmalai",
          description: "Soft chenna discs in chilled saffron milk with pistachio.",
          price: 149,
          categoryId: "desserts",
          image: "/images/rasmalai.jpg",
          isVeg: true,
          isAvailable: true,
        },
        {
          id: "masala-chai",
          name: "Masala Chai",
          description: "Assam tea brewed with milk, ginger, cardamom and cinnamon.",
          price: 59,
          categoryId: "beverages",
          image: "/images/masala-chai.jpg",
          isVeg: true,
          isAvailable: true,
        },
        {
          id: "mango-lassi",
          name: "Mango Lassi",
          description: "Thick Alphonso mango and yoghurt smoothie with a hint of cardamom.",
          price: 119,
          categoryId: "beverages",
          image: "/images/mango-lassi.jpg",
          isVeg: true,
          isAvailable: true,
          isBestseller: true,
        },
      ]);
      console.log("Seeded menu collection!");
    }

    // 4. Ensure index on orders and payments
    await db.collection("orders").createIndex({ id: 1 }, { unique: true });
    await db.collection("payments").createIndex({ orderId: 1 }, { unique: true });

    // 5. Initialize metadata
    await db.collection("meta").updateOne(
      { id: "sync_meta" },
      { $set: { id: "sync_meta", timestamp: Date.now() } },
      { upsert: true }
    );

    const collections = await db.listCollections().toArray();
    console.log("Current collections in savirasa_db:", collections.map((c) => c.name));

    await client.close();
    console.log("MongoDB initialization successful! Database 'savirasa_db' is now live on MongoDB Atlas.");
  } catch (err) {
    console.error("MongoDB seed error:", err);
  }
}

seed();
