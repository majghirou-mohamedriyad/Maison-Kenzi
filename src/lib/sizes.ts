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

export const formatMAD = (n: number) => `${Number(n).toLocaleString("fr-FR")} €`;
export const formatEUR = formatMAD;
export const formatPrice = formatMAD;

export type ParfumPricingSummary = {
  priceText: string;
  volumeText: string;
  startingPrice: number;
};

/**
 * Calcule et formate de façon élégante le prix d'appel et la contenance en ML
 */
export const getParfumPricingSummary = (parfum: {
  sale_mode?: "decant" | "full_bottle" | string;
  price_5ml?: number | null;
  price_10ml?: number | null;
  full_bottle_price?: number | null;
  full_bottle_volume_ml?: number | null;
}): ParfumPricingSummary => {
  const isFull = parfum.sale_mode === "full_bottle";
  if (isFull) {
    const vol = parfum.full_bottle_volume_ml ? `${parfum.full_bottle_volume_ml} ml` : "100 ml";
    const price = Number(parfum.full_bottle_price ?? 0);
    return {
      priceText: formatMAD(price),
      volumeText: `Flacon · ${vol}`,
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
    volumeText: "Décant 5 ml",
    startingPrice: p5 || p10 || 0,
  };
};
