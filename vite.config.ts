import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const OFFICIAL_DEEPL_KEY = "77993c1b-141d-4362-b6d2-4eaae702d6d5:fx";

/**
 * Plugin Middleware Vite pour exécuter /api/deepl en local (npm run dev)
 * Élimine l'erreur de navigateur CORS 'Failed to fetch' en environnement de développement.
 */
const deeplDevPlugin = (): Plugin => ({
  name: "deepl-dev-server",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url && (req.url === "/api/deepl" || req.url.startsWith("/api/deepl?") || req.url.startsWith("/api/deepl/"))) {
        const url = new URL(req.url, "http://localhost:8080");
        const action = url.searchParams.get("action");

        let body: any = {};
        if (req.method === "POST") {
          try {
            const rawBody = await new Promise<string>((resolve) => {
              let str = "";
              req.on("data", (chunk) => {
                str += chunk;
              });
              req.on("end", () => {
                resolve(str);
              });
              req.on("error", () => {
                resolve("");
              });
            });
            if (rawBody) {
              body = JSON.parse(rawBody);
            }
          } catch {
            body = {};
          }
        }

        const apiKey = (
          body?.apiKey ||
          url.searchParams.get("apiKey") ||
          OFFICIAL_DEEPL_KEY
        ).trim();

        const isFreeKey = apiKey.endsWith(":fx");
        const baseUrl = isFreeKey ? "https://api-free.deepl.com/v2" : "https://api.deepl.com/v2";

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Api-Key");

        if (req.method === "OPTIONS") {
          res.statusCode = 200;
          res.end();
          return;
        }

        // Action de vérification de quota / diagnostic
        if (req.method === "GET" || action === "usage" || body?.action === "usage") {
          try {
            const usageRes = await fetch(`${baseUrl}/usage`, {
              headers: { Authorization: `DeepL-Auth-Key ${apiKey}` },
            });
            const data = await usageRes.json();
            if (!usageRes.ok) {
              res.statusCode = usageRes.status;
              res.end(JSON.stringify({ ok: false, error: data.message || `Erreur auth DeepL (${usageRes.status})` }));
              return;
            }
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                ok: true,
                isFreeKey,
                character_count: data.character_count || 0,
                character_limit: data.character_limit || 500000,
              })
            );
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, error: `Erreur serveur local DeepL: ${e.message || String(e)}` }));
            return;
          }
        }

        // Action de Traduction POST
        if (req.method === "POST") {
          const text = body?.text;
          const targetLang = (body?.target_lang || "EN").toUpperCase();
          const textsToTranslate = Array.isArray(text) ? text : [text];

          try {
            const transRes = await fetch(`${baseUrl}/translate`, {
              method: "POST",
              headers: {
                Authorization: `DeepL-Auth-Key ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: textsToTranslate,
                target_lang: targetLang === "EN" ? "EN-US" : targetLang,
              }),
            });
            const data = await transRes.json();
            if (!transRes.ok) {
              res.statusCode = transRes.status;
              res.end(JSON.stringify({ success: false, error: data.message || "Erreur de traduction DeepL" }));
              return;
            }
            const translations = (data.translations || []).map((t: any) => t.text);
            res.statusCode = 200;
            res.end(
              JSON.stringify({
                success: true,
                translations,
                translatedText: Array.isArray(text) ? translations : translations[0] || "",
              })
            );
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: `Erreur traduction locale: ${e.message || String(e)}` }));
            return;
          }
        }
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
      "/api/deepl-free": {
        target: "https://api-free.deepl.com/v2",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/deepl-free/, ""),
      },
      "/api/deepl-pro": {
        target: "https://api.deepl.com/v2",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/deepl-pro/, ""),
      },
    },
  },
  plugins: [
    react(),
    deeplDevPlugin(),
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
