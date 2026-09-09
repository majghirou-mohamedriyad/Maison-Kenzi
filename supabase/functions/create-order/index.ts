// Edge function: validate and create an order with authoritative server-side pricing.
// Public (no JWT) — but only accepts item ids + quantities; prices come from DB.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Size = "5ml" | "10ml" | "20ml" | "full";

interface Item {
  parfum_id: string;
  size: Size;
  quantity: number;
}

interface Payload {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  shipping_option?: "standard" | "express" | "overnight";
  notes?: string;
  items: Item[];
}

const SHIPPING_COST: Record<string, number> = {
  standard: 0,
  express: 60,
  overnight: 120,
};

const SHIPPING_LABEL: Record<string, string> = {
  standard: "Standard (3-5 jours)",
  express: "Express (1-2 jours)",
  overnight: "Livraison du lendemain (J+1)",
};

const SIZE_LABEL: Record<Size, string> = {
  "5ml": "5 ml",
  "10ml": "10 ml",
  "20ml": "20 ml",
  full: "Bouteille complète",
};

const priceColumn = (s: Size) =>
  s === "5ml" ? "price_5ml" : s === "10ml" ? "price_10ml" : s === "20ml" ? "price_20ml" : "full_bottle_price";

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ---- Input validation ----
  const errors: string[] = [];
  const name = (body.customer_name ?? "").trim();
  const email = (body.customer_email ?? "").trim().toLowerCase();
  const phone = (body.customer_phone ?? "").trim();
  const address = (body.customer_address ?? "").trim();
  const notes = (body.notes ?? "").trim().slice(0, 500);
  const shippingOption = body.shipping_option ?? "standard";

  if (name.length < 2 || name.length > 120) errors.push("customer_name invalid");
  if (!isEmail(email) || email.length > 255) errors.push("customer_email invalid");
  if (phone && phone.length > 40) errors.push("customer_phone too long");
  if (address && address.length > 500) errors.push("customer_address too long");
  if (!(shippingOption in SHIPPING_COST)) errors.push("shipping_option invalid");
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50)
    errors.push("items must be a non-empty array (max 50)");

  if (errors.length) {
    return new Response(JSON.stringify({ error: "Validation failed", details: errors }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Aggregate quantities per (id,size)
  const requested = new Map<string, { id: string; size: Size; quantity: number }>();
  for (const it of body.items) {
    if (!it || !isUuid(it.parfum_id)) {
      return new Response(JSON.stringify({ error: "Invalid parfum_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["5ml", "10ml", "20ml", "full"].includes(it.size)) {
      return new Response(JSON.stringify({ error: "Invalid size" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const qty = Math.floor(Number(it.quantity));
    if (!Number.isFinite(qty) || qty < 1 || qty > 99) {
      return new Response(JSON.stringify({ error: "Invalid quantity" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const key = `${it.parfum_id}__${it.size}`;
    const existing = requested.get(key);
    if (existing) existing.quantity += qty;
    else requested.set(key, { id: it.parfum_id, size: it.size, quantity: qty });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Fetch authoritative parfum data
  const ids = [...new Set([...requested.values()].map((r) => r.id))];
  const { data: parfums, error: fetchErr } = await admin
    .from("parfums")
    .select("id, name, maison, image_label, price_5ml, price_10ml, price_20ml, full_bottle_price, full_bottle_volume_ml, full_bottle_stock, sale_mode, is_active, stock_status")
    .in("id", ids);

  if (fetchErr) {
    return new Response(JSON.stringify({ error: "Lookup failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const byId = new Map((parfums ?? []).map((p: Record<string, unknown>) => [p.id as string, p]));
  const orderItems: Record<string, unknown>[] = [];
  let subtotal = 0;

  for (const r of requested.values()) {
    const p = byId.get(r.id) as Record<string, unknown> | undefined;
    if (!p || p.is_active === false || p.stock_status === "rupture") {
      return new Response(
        JSON.stringify({ error: `Article indisponible: ${r.id}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const isFull = r.size === "full";
    if (isFull) {
      if (p.sale_mode !== "full_bottle") {
        return new Response(
          JSON.stringify({ error: `Format indisponible pour ${p.name}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const fbStock = Number(p.full_bottle_stock ?? 0);
      if (fbStock <= 0) {
        return new Response(
          JSON.stringify({ error: `Rupture de stock: ${p.name}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else if (p.sale_mode === "full_bottle") {
      return new Response(
        JSON.stringify({ error: `Ce produit se vend en bouteille complète: ${p.name}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const unitPrice = Number(p[priceColumn(r.size)]);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return new Response(
        JSON.stringify({ error: `Prix indisponible pour ${p.name}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const lineSubtotal = unitPrice * r.quantity;
    subtotal += lineSubtotal;
    const sizeLabel = isFull
      ? `Bouteille complète (${p.full_bottle_volume_ml ?? "?"} ml)`
      : SIZE_LABEL[r.size];
    orderItems.push({
      parfum_id: r.id,
      parfum_name: p.name,
      maison: p.maison,
      size: r.size,
      size_label: sizeLabel,
      quantity: r.quantity,
      unit_price: unitPrice,
      subtotal: lineSubtotal,
      image_label: p.image_label,
    });
  }

  const shippingCost = SHIPPING_COST[shippingOption];
  const total = subtotal + shippingCost;

  const insertNotes = notes
    ? `${notes} | Livraison: ${SHIPPING_LABEL[shippingOption]} (${shippingCost === 0 ? "Offerte" : `${shippingCost} MAD`})`
    : `Livraison: ${SHIPPING_LABEL[shippingOption]} (${shippingCost === 0 ? "Offerte" : `${shippingCost} MAD`})`;

  const { data: inserted, error: insertErr } = await admin
    .from("orders")
    .insert({
      customer_name: name,
      customer_email: email,
      customer_phone: phone || null,
      customer_address: address || null,
      items: orderItems,
      total_amount: total,
      notes: insertNotes,
    })
    .select("id, order_number, total_amount")
    .single();

  if (insertErr) {
    console.error("Order insert failed", insertErr);
    return new Response(JSON.stringify({ error: "Unable to create order" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      order: inserted,
      subtotal,
      shipping_cost: shippingCost,
      shipping_label: SHIPPING_LABEL[shippingOption],
      total,
      items: orderItems,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
