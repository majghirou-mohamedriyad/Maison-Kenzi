/**
 * Fonction Serverless Vercel / Node.js — Création d'intention de paiement Stripe
 *
 * Reçoit le montant et les métadonnées de la commande pour initialiser un PaymentIntent
 * sécurisé auprès de l'API Stripe en utilisant la clé secrète côté serveur.
 */

import fs from "node:fs";
import path from "node:path";

const HARDCODED_STRIPE_SECRET = "sk_test_51UFcdfDpritAiI2IdzbOmdciSCLLCQGKA6yAUyUG7YjWM6nWUe9KI5MG85aOWZXGAcxC21cQLyD5FArUMzFkY18C00RkWPkovR";

function resolveSecretKey() {
  if (process.env.STRIPE_SECRET_KEY) {
    return process.env.STRIPE_SECRET_KEY.trim().replace(/^["']|["']$/g, "");
  }
  if (process.env.VITE_STRIPE_SECRET_KEY) {
    return process.env.VITE_STRIPE_SECRET_KEY.trim().replace(/^["']|["']$/g, "");
  }

  // Lecture de secours depuis le fichier .env si présent
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("STRIPE_SECRET_KEY=")) {
          const val = trimmed.substring("STRIPE_SECRET_KEY=".length).trim().replace(/^["']|["']$/g, "");
          if (val) return val;
        }
        if (trimmed.startsWith("VITE_STRIPE_SECRET_KEY=")) {
          const val = trimmed.substring("VITE_STRIPE_SECRET_KEY=".length).trim().replace(/^["']|["']$/g, "");
          if (val) return val;
        }
      }
    }
  } catch {
    // Ignorer si lecture impossible
  }

  return HARDCODED_STRIPE_SECRET;
}

export default async function handler(req, res) {
  // En-têtes CORS pour autoriser les requêtes depuis le frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée. Seul POST est accepté." });
  }

  const secretKey = resolveSecretKey();

  if (!secretKey) {
    return res.status(500).json({ error: "Clé secrète Stripe non configurée." });
  }

  try {
    const { amount, currency = "eur", orderNumber, customerEmail, customerName } = req.body || {};

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: "Montant invalide. Doit être supérieur à 0." });
    }

    // Conversion en centimes (ex: 45.00 € -> 4500 centimes)
    const amountInCents = Math.round(numAmount * 100);

    const params = new URLSearchParams();
    params.append("amount", String(amountInCents));
    params.append("currency", currency.toLowerCase());
    params.append("automatic_payment_methods[enabled]", "true");
    
    if (orderNumber) {
      params.append("description", `Commande ${orderNumber} — Maison Kenzi`);
      params.append("metadata[order_number]", orderNumber);
    }
    if (customerEmail) {
      params.append("receipt_email", customerEmail);
      params.append("metadata[customer_email]", customerEmail);
    }
    if (customerName) {
      params.append("metadata[customer_name]", customerName);
    }

    const stripeResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await stripeResponse.json();

    if (!stripeResponse.ok || data.error) {
      console.error("Erreur API Stripe:", data.error);
      return res.status(stripeResponse.status || 500).json({
        error: data.error?.message || "Impossible de créer l'intention de paiement Stripe.",
      });
    }

    return res.status(200).json({
      clientSecret: data.client_secret,
      id: data.id,
      amount: data.amount,
      currency: data.currency,
    });
  } catch (err) {
    console.error("Exception serveur create-payment-intent:", err);
    return res.status(500).json({
      error: "Erreur interne lors de la communication avec Stripe.",
    });
  }
}
