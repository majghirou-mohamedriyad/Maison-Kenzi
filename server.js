/**
 * Serveur de Production Node.js Autonome — Maison Kenzi
 *
 * Ce serveur haute performance sert les fichiers statiques optimisés (dist/)
 * avec support SPA (Single Page Application) et prend en charge nativement les routes API :
 * - /api/create-payment-intent (Stripe)
 * - /api/whatsapp (Notifications OpenWA / WAHA)
 * - /api/deepl (Santé traduction)
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, "dist");

// Import des handlers API serveur
import createPaymentIntentHandler from "./api/create-payment-intent.js";
import whatsappHandler from "./api/whatsapp.js";
import deeplHandler from "./api/deepl.js";

// Table des types MIME pour les fichiers statiques
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

// Wrapper d'adaptation pour les fonctions serverless (req, res)
const wrapApiHandler = (handler) => async (req, res) => {
  let bodyData = "";
  req.on("data", (chunk) => {
    bodyData += chunk;
  });

  req.on("end", async () => {
    try {
      req.body = bodyData ? JSON.parse(bodyData) : {};
    } catch {
      req.body = {};
    }

    // Extraction des query params si présents
    const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    req.query = Object.fromEntries(parsedUrl.searchParams.entries());

    const resAdapter = {
      statusCode: 200,
      setHeader(name, value) {
        res.setHeader(name, value);
        return this;
      },
      status(code) {
        res.statusCode = code;
        return this;
      },
      json(data) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify(data));
      },
      end(data) {
        res.end(data);
      },
    };

    try {
      await handler(req, resAdapter);
    } catch (err) {
      console.error("[Erreur Serveur API]:", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ error: err?.message || "Erreur interne du serveur" }));
    }
  });
};

const routes = {
  "/api/create-payment-intent": wrapApiHandler(createPaymentIntentHandler),
  "/api/whatsapp": wrapApiHandler(whatsappHandler),
  "/api/deepl": wrapApiHandler(deeplHandler),
};

// Création du serveur HTTP
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  // 1. Routage des appels API backend
  if (routes[pathname]) {
    return routes[pathname](req, res);
  }

  // 2. Service des fichiers statiques du dossier dist/
  let filePath = path.join(DIST_DIR, pathname);

  // Sécurité contre le Directory Traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.end("Accès interdit");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || "application/octet-stream";

      // Mise en cache des assets immuables (Vite génère des hash uniques)
      if (pathname.startsWith("/assets/")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        res.setHeader("Cache-Control", "public, max-age=3600");
      }

      res.setHeader("Content-Type", mime);
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // 3. Fallback SPA : rediriger vers index.html pour React Router
    const indexPath = path.join(DIST_DIR, "index.html");
    fs.readFile(indexPath, (indexErr, content) => {
      if (indexErr) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Fichiers de production non trouvés. Veuillez exécuter 'npm run build'.");
        return;
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`[Maison Kenzi] Serveur de production actif sur le port ${PORT}`);
});
