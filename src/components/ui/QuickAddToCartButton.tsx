/**
 * Bouton Rond d'Ajout Rapide au Panier — Maison Kenzi
 *
 * Bouton d'action circulaire sans texte avec icône vectorielle ShoppingBag,
 * fond en verre dépoli (glassmorphism), halo doré champagne et micro-animation
 * de confirmation visuelle (coche Check) au clic.
 */

import React, { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/store/cart";
import { Parfum, Size } from "@/types/database";
import { formatMAD, priceFor } from "@/lib/sizes";
import { toast } from "sonner";

interface QuickAddToCartButtonProps {
  parfum: Parfum;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const QuickAddToCartButton = ({
  parfum,
  className = "",
  size = "md",
}: QuickAddToCartButtonProps) => {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const isFull = parfum.sale_mode === "full_bottle";
  const fullStock = parfum.full_bottle_stock ?? 0;
  const outOfStock =
    parfum.is_active === false ||
    parfum.stock_status === "rupture" ||
    (isFull && typeof parfum.full_bottle_stock === "number" && fullStock <= 0);

  if (outOfStock) return null;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Déterminer le format et le prix par défaut
    let chosenSize: Size = "5ml";
    let chosenPrice = 0;
    let sizeLabel = "5 ml";

    if (isFull) {
      chosenSize = "full";
      chosenPrice = parfum.full_bottle_price ?? 0;
      sizeLabel = parfum.full_bottle_volume_ml ? `${parfum.full_bottle_volume_ml} ml` : "Flacon";
    } else {
      const price5 = priceFor(parfum, "5ml");
      const price10 = priceFor(parfum, "10ml");

      if (price5 && price5 > 0) {
        chosenSize = "5ml";
        chosenPrice = price5;
        sizeLabel = "5 ml";
      } else if (price10 && price10 > 0) {
        chosenSize = "10ml";
        chosenPrice = price10;
        sizeLabel = "10 ml";
      } else {
        chosenSize = "5ml";
        chosenPrice = price5 || price10 || 0;
        sizeLabel = "5 ml";
      }
    }

    if (chosenPrice <= 0) {
      toast.error("Format actuellement indisponible");
      return;
    }

    addItem({
      id: parfum.id,
      name: parfum.name,
      maison: parfum.maison,
      size: chosenSize,
      quantity: 1,
      price: chosenPrice,
      imageLabel: parfum.image_label,
      imageUrl: parfum.image_url,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1300);

    toast.success("Ajouté au panier", {
      description: `${parfum.name} · ${sizeLabel} (${formatMAD(chosenPrice)})`,
    });
  };

  const dimensions =
    size === "sm"
      ? "w-7 h-7 sm:w-7.5 sm:h-7.5"
      : size === "lg"
      ? "w-9 h-9 sm:w-10 sm:h-10"
      : "w-8 h-8 sm:w-8.5 sm:h-8.5";

  const iconSize =
    size === "sm"
      ? "w-3 h-3 sm:w-3.5 sm:h-3.5"
      : size === "lg"
      ? "w-4.5 h-4.5"
      : "w-3.5 h-3.5 sm:w-4 sm:h-4";

  return (
    <button
      type="button"
      onClick={handleQuickAdd}
      aria-label={`Ajouter ${parfum.name} au panier`}
      title={`Ajouter au panier (${isFull ? "Flacon" : "Décant 5ml"})`}
      className={`relative z-20 flex items-center justify-center rounded-full transition-all duration-300 shadow-sm cursor-pointer select-none shrink-0 ${
        isAdded
          ? "bg-emerald-600 text-white scale-105 shadow-emerald-500/30"
          : "bg-background/90 dark:bg-[#1A1815]/90 text-foreground hover:bg-primary hover:text-primary-foreground border border-border/80 dark:border-white/15 hover:border-primary/60 backdrop-blur-md hover:scale-105 active:scale-95 hover:shadow-md"
      } ${dimensions} ${className}`}
    >
      {isAdded ? (
        <Check className={`${iconSize} stroke-[2.2] animate-in zoom-in duration-150`} />
      ) : (
        <ShoppingBag className={`${iconSize} stroke-[1.8]`} />
      )}
    </button>
  );
};

export default QuickAddToCartButton;
