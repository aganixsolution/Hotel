import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { seedCategories, seedHotel, seedMenu, seedTables } from "../data/seed";
import {
  isMongoConfigured,
  getMongoState,
  saveMongoState,
  resetMongoState,
} from "./mongodb";

export interface SyncState {
  orders: any[];
  hotel: any;
  menu: any[];
  tables: any[];
  categories: any[];
  timestamp: number;
}

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// On Vercel serverless, root fs is read-only, use os.tmpdir()
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const STORE_PATH = isServerless
  ? path.resolve(os.tmpdir(), "savirasa-live-store.json")
  : path.resolve(process.cwd(), "src/data/live-store.json");

export function getDefaultState(): SyncState {
  return {
    orders: [],
    hotel: { ...seedHotel, name: "SaviRasa" },
    menu: [...seedMenu],
    tables: [...seedTables],
    categories: [...seedCategories],
    timestamp: Date.now(),
  };
}

let currentState: SyncState = loadInitialState();

function loadInitialState(): SyncState {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        hotel: parsed.hotel || { ...seedHotel, name: "SaviRasa" },
        menu: Array.isArray(parsed.menu) ? parsed.menu : [...seedMenu],
        tables: Array.isArray(parsed.tables) ? parsed.tables : [...seedTables],
        categories: Array.isArray(parsed.categories) ? parsed.categories : [...seedCategories],
        timestamp: parsed.timestamp || Date.now(),
      };
    }
  } catch (err) {
    console.warn("Could not load store file, using defaults", err);
  }
  const def = getDefaultState();
  saveState(def);
  return def;
}

function saveState(state: SyncState) {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not save store file", err);
  }
}

async function getKvState(): Promise<SyncState | null> {
  if (!KV_URL || !KV_TOKEN) return null;
  try {
    const res = await fetch(`${KV_URL}/get/savirasa:state`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.result ? (typeof json.result === "string" ? JSON.parse(json.result) : json.result) : null;
  } catch (err) {
    console.warn("Failed to fetch from Upstash/KV:", err);
    return null;
  }
}

async function setKvState(state: SyncState) {
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await fetch(`${KV_URL}/set/savirasa:state`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      body: JSON.stringify(state),
    });
  } catch (err) {
    console.warn("Failed to save to Upstash/KV:", err);
  }
}

export function getNetworkIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    if (
      name.includes("Virtual") ||
      name.includes("Pseudo") ||
      name.includes("vEthernet") ||
      name.includes("Default Switch")
    ) {
      continue;
    }
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;
    for (const iface of ifaceList) {
      if (iface.family === "IPv4" && !iface.internal && iface.address !== "127.0.0.1") {
        return iface.address;
      }
    }
  }
  return "localhost";
}

export async function handleSyncApi(
  pathname: string,
  method: string,
  bodyText: string,
  port = 3000,
  hostHeader = ""
) {
  const ip = getNetworkIp();
  const isVercel = Boolean(process.env.VERCEL);

  if (pathname === "/api/network-info") {
    const qrBaseUrl = isVercel && hostHeader
      ? `https://${hostHeader}`
      : `http://${ip}:${port}`;

    return {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        ip,
        port,
        qrBaseUrl,
        isVercel,
        hasCloudKv: Boolean(KV_URL && KV_TOKEN),
        hasMongo: isMongoConfigured(),
      }),
    };
  }

  if (pathname === "/api/sync") {
    if (method === "GET") {
      // 1. Check MongoDB first if configured
      if (isMongoConfigured()) {
        try {
          const mongoState = await getMongoState();
          if (mongoState) {
            currentState = {
              orders: mongoState.orders || [],
              menu: mongoState.menu || currentState.menu,
              tables: mongoState.tables || currentState.tables,
              hotel: mongoState.hotel || currentState.hotel,
              categories: currentState.categories,
              timestamp: mongoState.timestamp || Date.now(),
            };
          }
        } catch (err) {
          console.warn("Mongo fetch failed, falling back:", err);
        }
      } else {
        // 2. Check KV / Upstash
        const cloudState = await getKvState();
        if (cloudState) {
          currentState = cloudState;
        }
      }

      return {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(currentState),
      };
    }

    if (method === "POST") {
      try {
        const payload = JSON.parse(bodyText || "{}");

        if (payload.action === "reset") {
          currentState = getDefaultState();
          saveState(currentState);

          if (isMongoConfigured()) {
            await resetMongoState(currentState);
          }
          await setKvState(currentState);

          return {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ ok: true, state: currentState }),
          };
        }

        if (payload.key && payload.value !== undefined) {
          (currentState as any)[payload.key] = payload.value;
          currentState.timestamp = Date.now();
          saveState(currentState);

          // Save to MongoDB asynchronously
          if (isMongoConfigured()) {
            await saveMongoState(payload.key, payload.value);
          }
          await setKvState(currentState);
        }

        return {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ ok: true, timestamp: currentState.timestamp }),
        };
      } catch (err: any) {
        return {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: err.message }),
        };
      }
    }
  }

  return null;
}
