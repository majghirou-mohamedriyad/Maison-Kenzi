import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const stripeDevApiPlugin = () => ({
  name: "stripe-dev-api",
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url && req.url.startsWith("/api/create-payment-intent") && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => {
          body += chunk;
        });
        req.on("end", async () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            const { default: handler } = await import("./api/create-payment-intent.js");
            const mockRes = {
              statusCode: 200,
              setHeader(k: string, v: string) {
                res.setHeader(k, v);
              },
              status(code: number) {
                res.statusCode = code;
                return this;
              },
              json(data: any) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(data));
              },
              end() {
                res.end();
              },
            };
            req.body = parsed;
            await handler(req, mockRes);
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: e?.message || "Internal server error" }));
          }
        });
        return;
      }
      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/supabase": {
        target: "http://185.197.249.4:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/supabase/, ""),
      },
      "/api/openwa": {
        target: "http://185.197.249.4:2785",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openwa/, ""),
      },
    },
  },
  plugins: [
    react(),
    stripeDevApiPlugin(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/react-router-dom/")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/jspdf") || id.includes("node_modules/jspdf-autotable")) {
            return "vendor-pdf";
          }
          if (id.includes("node_modules/@supabase")) {
            return "vendor-supabase";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-ui";
          }
        },
      },
    },
  },
}));
