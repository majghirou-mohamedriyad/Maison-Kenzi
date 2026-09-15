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
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, "dist");
const SUPABASE_TARGET_PORT = Number(process.env.SUPABASE_PORT) || 8000;
const OPENWA_TARGET_PORT = Number(process.env.OPENWA_PORT) || 2785;

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
  ".xml": "application/xml; charset=utf-8",
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

const proxyToPort = (targetPort, stripPrefix, req, res) => {
  const targetPath = req.url.replace(stripPrefix, "") || "/";
  const proxyReq = http.request(
    {
      hostname: "127.0.0.1",
      port: targetPort,
      path: targetPath,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${targetPort}`,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (err) => {
    console.error(`[Erreur Proxy vers port ${targetPort}]:`, err.message);
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: `Service indisponible sur le port ${targetPort}` }));
  });

  req.pipe(proxyReq);
};

// Générateur dynamique de sitemap.xml avec intégration de tous les produits
let sitemapCache = { xml: null, timestamp: 0 };
const SITEMAP_CACHE_TTL_MS = 60 * 60 * 1000; // 1 heure

const slugifyText = (text) => {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const handleSitemapXml = async (req, res) => {
  const now = Date.now();
  if (sitemapCache.xml && now - sitemapCache.timestamp < SITEMAP_CACHE_TTL_MS) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.end(sitemapCache.xml);
  }

  try {
    // 1. Récupération des produits actifs depuis l'instance locale Supabase (port 8000)
    const supabaseUrl = `http://127.0.0.1:${SUPABASE_TARGET_PORT}/rest/v1/parfums?select=id,name,maison,category,updated_at,created_at,is_active&is_active=eq.true`;
    const response = await fetch(supabaseUrl, {
      headers: {
        Accept: "application/json",
        apikey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
      },
    }).catch(() => null);

    let products = [];
    if (response && response.ok) {
      products = await response.json();
    }

    const today = new Date().toISOString().split("T")[0];

    // 2. Construction du XML avec l'ensemble des collections et pages institutionnelles
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    const staticUrls = [
      { loc: "https://maison-kenzi.com/", lastmod: today },
      { loc: "https://maison-kenzi.com/collection/all", lastmod: today },
      { loc: "https://maison-kenzi.com/collection/homme", lastmod: today },
      { loc: "https://maison-kenzi.com/collection/femme", lastmod: today },
      { loc: "https://maison-kenzi.com/collection/mixte", lastmod: today },
      { loc: "https://maison-kenzi.com/collection/cosmetiques", lastmod: today },
      { loc: "https://maison-kenzi.com/collection/artisanat", lastmod: today },
      { loc: "https://maison-kenzi.com/collection/antiques", lastmod: today },
      { loc: "https://maison-kenzi.com/collection/nouveautes", lastmod: today },
      { loc: "https://maison-kenzi.com/about/notre-histoire", lastmod: "2026-09-15" },
      { loc: "https://maison-kenzi.com/about/ingredients", lastmod: "2026-09-15" },
      { loc: "https://maison-kenzi.com/about/guide-des-tailles", lastmod: "2026-09-15" },
      { loc: "https://maison-kenzi.com/about/service-client", lastmod: "2026-09-15" },
      { loc: "https://maison-kenzi.com/about/livraison", lastmod: "2026-09-15" },
      { loc: "https://maison-kenzi.com/privacy-policy", lastmod: "2026-09-15" },
      { loc: "https://maison-kenzi.com/terms-of-service", lastmod: "2026-09-15" },
    ];

    for (const item of staticUrls) {
      xml += `  <url>\n    <loc>${item.loc}</loc>\n    <lastmod>${item.lastmod}</lastmod>\n  </url>\n`;
    }

    // 3. Fiches Produits Individuelles (Slugs conviviaux SEO)
    if (Array.isArray(products) && products.length > 0) {
      for (const p of products) {
        const namePart = (p.name || "").trim();
        const maisonPart = (p.maison || "").trim();
        let combined = namePart;
        if (maisonPart && !namePart.toLowerCase().includes(maisonPart.toLowerCase())) {
          combined = `${namePart} ${maisonPart}`;
        }
        const rawDate = p.updated_at || p.created_at;
        const productLastmod = rawDate ? String(rawDate).split("T")[0] : "2026-09-15";

        xml += `  <url>\n    <loc>https://maison-kenzi.com/parfum/${slug}</loc>\n    <lastmod>${productLastmod}</lastmod>\n  </url>\n`;
      }
    }

    xml += `</urlset>\n`;

    sitemapCache = { xml, timestamp: now };
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.end(xml);
  } catch (err) {
    console.error("[Sitemap Generator]:", err);
    const staticFile = path.join(DIST_DIR, "sitemap.xml");
    if (fs.existsSync(staticFile)) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      fs.createReadStream(staticFile).pipe(res);
    } else {
      res.statusCode = 500;
      res.end("Erreur génération sitemap");
    }
  }
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

  // 0. Sitemap XML Dynamique avec Fiches Produits
  if (pathname === "/sitemap.xml") {
    return handleSitemapXml(req, res);
  }

  // 1. Proxy vers Supabase (Port 8000)
  if (pathname.startsWith("/api/supabase")) {
    return proxyToPort(SUPABASE_TARGET_PORT, "/api/supabase", req, res);
  }

  // 2. Proxy direct vers Supabase Storage (Port 8000)
  if (pathname.startsWith("/storage")) {
    return proxyToPort(SUPABASE_TARGET_PORT, "", req, res);
  }

  // 3. Proxy vers OpenWA (Port 2785)
  if (pathname.startsWith("/api/openwa")) {
    return proxyToPort(OPENWA_TARGET_PORT, "/api/openwa", req, res);
  }

  // 3. Routage des appels API backend internes
  if (routes[pathname]) {
    return routes[pathname](req, res);
  }

  // 4. Service des fichiers statiques du dossier dist/
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

// Gestion des connexions WebSocket pour Supabase Realtime
server.on("upgrade", (req, socket, head) => {
  const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (parsedUrl.pathname.startsWith("/api/supabase")) {
    const targetPath = (req.url || "").replace("/api/supabase", "") || "/";
    const proxySocket = net.connect(SUPABASE_TARGET_PORT, "127.0.0.1", () => {
      let rawHeader = `${req.method} ${targetPath} HTTP/1.1\r\n`;
      for (const [key, value] of Object.entries(req.headers)) {
        if (key.toLowerCase() === "host") {
          rawHeader += `host: 127.0.0.1:${SUPABASE_TARGET_PORT}\r\n`;
        } else {
          rawHeader += `${key}: ${value}\r\n`;
        }
      }
      rawHeader += "\r\n";
      proxySocket.write(rawHeader);
      if (head && head.length > 0) {
        proxySocket.write(head);
      }
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });

    proxySocket.on("error", (err) => {
      console.error("[Erreur WebSocket Proxy Supabase]:", err.message);
      socket.destroy();
    });

    socket.on("error", () => {
      proxySocket.destroy();
    });
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`[Maison Kenzi] Serveur de production actif sur le port ${PORT}`);
});
