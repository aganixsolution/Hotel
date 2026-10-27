// @lovable.dev/vite-tanstack-config already includes standard plugins
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { handleSyncApi } from "./src/server/sync-server";

function syncDevPlugin() {
  return {
    name: "vite-plugin-sync",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
        if (url.pathname.startsWith("/api/")) {
          let bodyText = "";
          if (req.method === "POST") {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
            }
            bodyText = Buffer.concat(chunks).toString("utf-8");
          }
          const port = Number(url.port) || 3000;
          const hostHeader = req.headers.host || "";
          const apiRes = await handleSyncApi(url.pathname, req.method, bodyText, port, hostHeader);
          if (apiRes) {
            res.statusCode = apiRes.status;
            for (const [k, v] of Object.entries(apiRes.headers)) {
              res.setHeader(k, v);
            }
            res.end(apiRes.body);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [syncDevPlugin()],
    server: {
      host: "0.0.0.0",
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
