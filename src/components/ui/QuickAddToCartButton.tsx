/**
 * Bouton d'Ajout Rapide au Panier — Maison Kenzi
 *
 * Permet aux clients d'ajouter instantanément un parfum au panier directement
 * depuis les cartes du catalogue, carrousels et sélections, avec micro-animation
 * et confirmation toast immédiate sans quitter la page.
 *
 * Supporte 2 modes :
 * - variant="button" : Bouton complet avec texte « Ajouter au panier » et icône
 * - variant="icon" : Bouton d'action circulaire en verre dépoli
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
  variant?: "button" | "icon";
  size?: "sm" | "md";
}

export const QuickAddToCartButton = ({
  parfum,
  className = "",
  variant = "button",
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
    setTimeout(() => setIsAdded(false), 1400);

    toast.success("Ajouté au panier", {
      description: `${parfum.name} · ${sizeLabel} (${formatMAD(chosenPrice)})`,
    });
  };

  const isSmall = size === "sm";

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleQuickAdd}
        aria-label={`Ajouter ${parfum.name} au panier`}
        className={`w-full h-8 sm:h-9 rounded-xl flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-xs cursor-pointer ${
          isAdded
            ? "bg-emerald-600 text-white border border-emerald-600 shadow-emerald-500/20"
            : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 hover:border-primary hover:shadow-md active:scale-95"
        } ${className}`}
      >
        {isAdded ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>Ajouté au panier</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Ajouter au panier</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleQuickAdd}
      aria-label={`Ajouter ${parfum.name} au panier`}
      title={`Ajouter au panier (${isFull ? "Flacon" : "Décant 5ml"})`}
      className={`relative z-20 flex items-center justify-center rounded-full transition-all duration-300 shadow-md cursor-pointer ${
        isAdded
          ? "bg-emerald-600 text-white scale-110 shadow-emerald-500/20"
          : "bg-background/90 dark:bg-[#1A1815]/90 text-foreground hover:bg-primary hover:text-primary-foreground border border-border/80 hover:border-primary/50 backdrop-blur-md hover:scale-105 active:scale-95 hover:shadow-lg"
      } ${
        isSmall
          ? "w-8 h-8 text-xs"
          : "w-8.5 h-8.5 sm:w-9 sm:h-9 text-xs"
      } ${className}`}
    >
      {isAdded ? (
        <Check className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
      ) : (
        <ShoppingBag className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
      )}
    </button>
  );
};

export default QuickAddToCartButton;
