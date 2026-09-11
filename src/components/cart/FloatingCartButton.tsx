/**
 * Bouton Flottant de Panier — Maison Kenzi
 *
 * S'affiche élégamment en bas à gauche de l'écran dès que le panier contient
 * au moins un produit pour attirer l'attention de l'utilisateur avec halo doré,
 * compteur dynamique d'articles, montant du sous-total et ouverture directe du tiroir panier.
 */

import React from "react";
import { ShoppingBag, ChevronRight, Sparkles } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatMAD } from "@/lib/sizes";
import { useLocation } from "react-router-dom";

export const FloatingCartButton = () => {
  const { totalItems, subtotal, isOpen, openCart } = useCart();
  const location = useLocation();

  // Masquer sur les pages d'administration, de finalisation (checkout) ou quand le panier est déjà ouvert
  const isHiddenRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname === "/checkout";

  if (totalItems <= 0 || isHiddenRoute || isOpen) {
    return null;
  }

  return (
    <aside
      aria-label="Accès rapide au panier"
      className="fixed bottom-5 left-5 sm:bottom-6 sm:left-6 z-40 animate-in fade-in slide-in-from-bottom-6 zoom-in-95 duration-400 select-none"
    >
      {/* Halo d'ambiance doré pour attirer l'attention */}
      <div className="absolute -inset-1 rounded-full bg-primary/30 blur-md animate-pulse pointer-events-none" />

      <button
        type="button"
        onClick={openCart}
        aria-label={`Ouvrir le panier avec ${totalItems} article${totalItems > 1 ? "s" : ""}`}
        className="group relative flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full bg-background/95 dark:bg-[#1A1815]/95 text-foreground border border-primary/40 hover:border-primary shadow-xl hover:shadow-2xl hover:shadow-primary/20 backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
      >
        {/* Icône Panier avec Badge Compteur */}
        <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary text-primary-foreground shadow-sm group-hover:rotate-[-6deg] transition-transform duration-300 shrink-0">
          <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center border border-background shadow-xs">
            {totalItems}
          </span>
        </div>

        {/* Détails : Libellé & Sous-total */}
        <div className="flex flex-col text-left pr-1 min-w-[70px]">
          <div className="flex items-center gap-1 text-[9.5px] uppercase tracking-widest text-primary font-semibold">
            <Sparkles className="w-2.5 h-2.5 shrink-0" />
            <span>Panier ({totalItems})</span>
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-tight text-foreground -mt-0.5">
            {formatMAD(subtotal)}
          </span>
        </div>

        {/* Flèche d'action subtile */}
        <div className="hidden sm:flex items-center justify-center w-5 h-5 rounded-full bg-secondary/80 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all">
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </button>
    </aside>
  );
};

export default FloatingCartButton;
