import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import { seedCategories, seedHotel, seedMenu, seedTables } from "../data/seed";

export interface SyncState {
  orders: any[];
  hotel: any;
  menu: any[];
  tables: any[];
  categories: any[];
  timestamp: number;
}

const STORE_PATH = path.resolve(process.cwd(), "src/data/live-store.json");

function getDefaultState(): SyncState {
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
    console.warn("Could not load live-store.json, using defaults", err);
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
    console.warn("Could not save live-store.json", err);
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

export function handleSyncApi(pathname: string, method: string, bodyText: string, port = 3000) {
  const ip = getNetworkIp();

  if (pathname === "/api/network-info") {
    return {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        ip,
        port,
        qrBaseUrl: `http://${ip}:${port}`,
      }),
    };
  }

  if (pathname === "/api/sync") {
    if (method === "GET") {
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
