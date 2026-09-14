/**
 * Bouton Rond d'Ajout Rapide au Panier — Maison Kenzi
 *
 * Bouton d'action circulaire de prestige sans texte avec icône vectorielle ShoppingBag et indicateur d'ajout,
 * structure en verre dépoli (glassmorphism), cerclage doré champagne,
 * halo lumineux au survol et micro-animation de confirmation au clic.
 */

import React, { useState } from "react";
import { ShoppingBag, Check, Plus } from "lucide-react";
import { useCart } from "@/store/cart";
import { useLanguage } from "@/contexts/LanguageContext";
import { Parfum, Size } from "@/types/database";
import { formatMAD, priceFor } from "@/lib/sizes";
import { getProductName, getProductSubtitle } from "@/lib/productLocalization";
import { toast } from "sonner";

interface QuickAddToCartButtonProps {
  parfum: Parfum;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const QuickAddToCartButton = ({
  parfum,
  className = "",
  size = "sm",
}: QuickAddToCartButtonProps) => {
  const { language, t } = useLanguage();
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const isFull = parfum.sale_mode === "full_bottle";
  const fullStock = parfum.full_bottle_stock ?? 0;
  const outOfStock =
    parfum.is_active === false ||
    parfum.stock_status === "rupture" ||
    (isFull && typeof parfum.full_bottle_stock === "number" && fullStock <= 0);

  if (outOfStock) return null;

  const currentDisplayName = getProductName(parfum, language);
  const currentSubtitle = getProductSubtitle(parfum, language);

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
      toast.error(language === "en" ? "Format currently unavailable" : "Format actuellement indisponible");
      return;
    }

    addItem({
      id: parfum.id,
      name: parfum.name,
      name_en: parfum.name_en,
      maison: parfum.maison,
      size: chosenSize,
      quantity: 1,
      price: chosenPrice,
      imageLabel: parfum.image_label,
      imageLabel_en: parfum.image_label_en,
      imageUrl: parfum.image_url,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);

    toast.success(language === "en" ? "Added to bag" : "Ajouté au panier", {
      description: `${currentDisplayName} · ${sizeLabel} (${formatMAD(chosenPrice)})`,
    });
  };

  const dimensions =
    size === "sm"
      ? "w-8 h-8 sm:w-8.5 sm:h-8.5"
      : size === "lg"
      ? "w-10 h-10 sm:w-11 sm:h-11"
      : "w-9 h-9 sm:w-9.5 sm:h-9.5";

  const iconSize =
    size === "sm"
      ? "w-3.5 h-3.5 sm:w-4 sm:h-4"
      : size === "lg"
      ? "w-5 h-5"
      : "w-4 h-4 sm:w-4.5 sm:h-4.5";

  return (
    <button
      type="button"
      onClick={handleQuickAdd}
      aria-label={`Ajouter ${parfum.name} au panier`}
      title={`Ajouter au panier (${isFull ? "Flacon" : "Décant 5ml"})`}
      className={`group/btn relative z-20 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer select-none shrink-0 ${
        isAdded
          ? "bg-emerald-600 text-white scale-110 shadow-lg shadow-emerald-600/30 border border-emerald-400/50"
          : "bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/35 hover:border-primary shadow-xs hover:shadow-md hover:shadow-primary/25 backdrop-blur-md hover:scale-110 active:scale-95"
      } ${dimensions} ${className}`}
    >
      {isAdded ? (
        <Check className={`${iconSize} stroke-[2.5] animate-in zoom-in-50 duration-200`} />
      ) : (
        <div className="relative flex items-center justify-center">
          <ShoppingBag className={`${iconSize} stroke-[2] transition-transform duration-300 group-hover/btn:-translate-y-0.5`} />
          <Plus className="w-2 h-2 stroke-[3] absolute -bottom-1 -right-1 opacity-90 group-hover/btn:scale-125 transition-transform duration-300" />
        </div>
      )}
    </button>
  );
};

export default QuickAddToCartButton;
