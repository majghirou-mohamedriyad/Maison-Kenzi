import type { Size } from "@/types/database";

export const SIZES: Size[] = ["5ml", "10ml", "full"];

export const SIZE_META: Record<Size, { label: string; sub: string }> = {
  "5ml": { label: "5 ml", sub: "Découverte" },
  "10ml": { label: "10 ml", sub: "Voyage" },
  full: { label: "Bouteille complète", sub: "Flacon scellé" },
};

type PriceSource = {
  price_5ml: number;
  price_10ml: number;
  full_bottle_price?: number | null;
};

export const priceFor = (prices: PriceSource, size: Size): number => {
  switch (size) {
    case "5ml":
      return Number(prices.price_5ml);
    case "10ml":
      return Number(prices.price_10ml);
    case "full":
      return Number(prices.full_bottle_price ?? 0);
  }
};

/**
 * Formatage universel des prix exclusivement en Euro (€) — Maison Kenzi
 */
export const formatEUR = (n: number | string | null | undefined): string => {
  const num = Number(n || 0);
  const formatted = num.toLocaleString("fr-FR", {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).replace(/[\u00A0\u202F\s]/g, " ");

  return `${formatted} €`;
};

export const formatMAD = formatEUR;
export const formatPrice = formatEUR;
export const formatGlobalPrice = formatEUR;

export type ParfumPricingSummary = {
  priceText: string;
  volumeText: string;
  startingPrice: number;
};

/**
 * Calcule et formate de façon élégante le prix d'appel et la contenance / format
 */
export const getParfumPricingSummary = (parfum: {
  category?: string | null;
  categories?: string[] | null;
  has_custom_options?: boolean;
  sale_mode?: "decant" | "full_bottle" | string;
  price_5ml?: number | null;
  price_10ml?: number | null;
  full_bottle_price?: number | null;
  full_bottle_volume_ml?: number | null;
  weight_value?: string | null;
  weight_unit?: string | null;
  volume_value?: string | null;
  volume_unit?: string | null;
}): ParfumPricingSummary => {
  const isFull = parfum.sale_mode === "full_bottle";
  if (isFull) {
    const price = Number(parfum.full_bottle_price ?? 0);
    const parts: string[] = [];
    if (parfum.weight_value) {
      parts.push(`${parfum.weight_value} ${parfum.weight_unit || "g"}`);
    }
    if (parfum.volume_value) {
      parts.push(`${parfum.volume_value} ${parfum.volume_unit || "ml"}`);
    }

    const catStr = ((parfum.category || "") + " " + (parfum.categories || []).join(" ")).toLowerCase();
    const isNonParfum =
      catStr.includes("bazar") ||
      catStr.includes("chic") ||
      catStr.includes("antique") ||
      catStr.includes("artisan") ||
      !!parfum.has_custom_options;

    let volumeText = "";
    if (parts.length > 0) {
      volumeText = parts.join(" · ");
    } else if (parfum.full_bottle_volume_ml) {
      volumeText = `Flacon · ${parfum.full_bottle_volume_ml} ml`;
    } else if (isNonParfum) {
      volumeText = "";
    } else {
      volumeText = "Flacon complet";
    }

    return {
      priceText: formatMAD(price),
      volumeText,
      startingPrice: price,
    };
  }

  const p5 = Number(parfum.price_5ml || 0);
  const p10 = Number(parfum.price_10ml || 0);

  if (p5 > 0 && p10 > 0) {
    return {
      priceText: `Dès ${formatMAD(p5)}`,
      volumeText: "5 ml · 10 ml",
      startingPrice: p5,
    };
  } else if (p5 > 0) {
    return {
      priceText: formatMAD(p5),
      volumeText: "Décant 5 ml",
      startingPrice: p5,
    };
  } else if (p10 > 0) {
    return {
      priceText: formatMAD(p10),
      volumeText: "Décant 10 ml",
      startingPrice: p10,
    };
  }

  return {
    priceText: formatMAD(p5 || p10 || 0),
    volumeText: "",
    startingPrice: p5 || p10 || 0,
  };
};
