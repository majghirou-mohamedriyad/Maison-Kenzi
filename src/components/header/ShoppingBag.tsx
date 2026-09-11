/**
 * Tiroir de Panier & Tunnel d'Achat Haute Parfumerie — Maison Kenzi
 *
 * Panneau coulissant premium avec gestion dynamique des quantités, jauge de livraison offerte,
 * garanties de conciergerie (100% authentique, paiement cash à la livraison),
 * récapitulatif détaillé et validation instantanée vers la commande.
 */

import React, { useState } from "react";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingBag as BagIcon,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Flame,
  Flower2,
  MessageCircle,
  PackageCheck,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/store/cart";
import { SIZE_META, formatMAD } from "@/lib/sizes";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useProducts } from "@/store/useProductStore";

interface ShoppingBagProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShoppingBag = ({ isOpen, onClose }: ShoppingBagProps) => {
  const { items, totalItems, subtotal, updateQuantity, removeItem, clear } = useCart();
  const { settings } = useAppSettings();
  const navigate = useNavigate();
  const allProducts = useProducts();
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Déclenche l'animation de sortie fluide avant d'appeler onClose
  const handleClose = React.useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280);
  }, [isClosing, onClose]);

  // Si non ouvert et pas en train de se fermer, ne rien afficher
  if (!isOpen && !isClosing) return null;

  const rawPhone = settings.whatsapp_phone || "212752850156";
  const waNumber = rawPhone.replace(/[^0-9]/g, "");

  // Seuil dynamique de livraison gratuite configuré depuis l'administration
  const freeShippingThreshold = Number(settings.free_shipping_threshold) > 0 ? Number(settings.free_shipping_threshold) : 500;

  // Calcul du progrès pour la livraison gratuite
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const remainingForFree = Math.max(0, freeShippingThreshold - subtotal);

  // Suggestions de découverte (parfums non encore dans le panier)
  const cartIds = new Set(items.map((i) => i.id));
  const suggestedProducts = allProducts
    .filter((p) => p.active !== false && !cartIds.has(p.id))
    .slice(0, 3);

  const handleCheckoutNavigation = () => {
    handleClose();
    setTimeout(() => {
      navigate("/checkout");
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-[110] h-screen overflow-hidden select-none">
      {/* Superposition d'arrière-plan avec flou cinématographique et fondu entrée/sortie */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isClosing
            ? "animate-out fade-out-0 duration-280 fill-mode-forwards"
            : "animate-in fade-in-0 duration-300"
        }`}
        onClick={handleClose}
      />

      {/* Tiroir Coulissant Latéral avec animation d'entrée et de sortie */}
      <div
        className={`absolute right-0 top-0 h-screen w-full sm:w-[440px] bg-background/95 dark:bg-[#12141a]/95 backdrop-blur-2xl border-l border-border/80 shadow-2xl flex flex-col z-10 ${
          isClosing
            ? "animate-out slide-out-to-right duration-280 fill-mode-forwards"
            : "animate-in slide-in-from-right duration-300"
        }`}
      >
        
        {/* En-tête du Panier */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/70 bg-card/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shadow-xs border border-primary/20">
              <BagIcon size={17} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base sm:text-lg font-bold text-foreground tracking-tight">
                  Mon Panier
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-tight">
                  {totalItems} {totalItems > 1 ? "articles" : "article"}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground block">
                Maison Kenzi · Haute Parfumerie
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirmClear) {
                    clear();
                    setConfirmClear(false);
                  } else {
                    setConfirmClear(true);
                    setTimeout(() => setConfirmClear(false), 3000);
                  }
                }}
                className={`text-[11px] px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  confirmClear
                    ? "bg-destructive/15 text-destructive font-bold border border-destructive/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                title="Vider le panier"
              >
                {confirmClear ? "Confirmer ?" : "Vider"}
              </button>
            )}

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
              aria-label="Fermer le panier"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Jauge Dynamique de Livraison Offerte */}
        <div className="bg-primary/5 border-b border-primary/15 px-5 py-2.5">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="flex items-center gap-1.5 text-primary font-semibold">
              <Truck className="w-3.5 h-3.5 shrink-0" />
              {remainingForFree === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  Livraison Express Offerte partout au Maroc !
                </span>
              ) : (
                <span>
                  Plus que <strong className="font-bold underline">{formatMAD(remainingForFree)}</strong> pour la livraison offerte
                </span>
              )}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              {progressPercent}%
            </span>
          </div>

          <div className="w-full h-1.5 bg-secondary/80 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                remainingForFree === 0
                  ? "bg-emerald-500 shadow-xs shadow-emerald-500/50"
                  : "bg-primary"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Corps du Tiroir */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-5">
          {items.length === 0 ? (
            /* État Panier Vide */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-card border border-border flex items-center justify-center text-primary/60 shadow-md">
                  <BagIcon size={32} strokeWidth={1.5} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-xs">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  Votre panier est vide
                </h3>
                <p className="text-xs text-muted-foreground font-light leading-relaxed">
                  Explorez nos sillages d'exception en décants ou flacons et composez votre garde-robe olfactive.
                </p>
              </div>

              {/* Navigation Rapide vers le Catalogue */}
              <div className="w-full pt-2 max-w-xs">
                <Button
                  asChild
                  className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-bold uppercase tracking-wider h-11 shadow-md cursor-pointer"
                  onClick={handleClose}
                >
                  <Link to="/collection/all" className="flex items-center justify-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Découvrir le Catalogue</span>
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            /* Liste des Articles dans le Panier */
            <>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 divide-y divide-border/40">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="pt-3.5 first:pt-0 flex gap-3 group animate-in fade-in duration-200"
                  >
                    {/* Miniature du Produit */}
                    <div className="w-16 h-20 sm:w-18 sm:h-22 bg-card border border-border/80 rounded-xl p-1.5 flex items-center justify-center shrink-0 overflow-hidden relative shadow-xs">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/50 rounded-lg p-1 text-center">
                          <span className="text-[9px] font-serif text-primary/80 line-clamp-2">
                            {item.imageLabel || item.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Détails du Produit */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex justify-between items-start gap-1.5">
                          <div className="min-w-0 pr-1">
                            <p className="text-[9px] tracking-widest uppercase font-semibold text-primary/90 truncate">
                              {item.maison}
                            </p>
                            <h4 className="text-xs sm:text-sm font-serif font-bold text-foreground truncate leading-tight">
                              {item.name}
                            </h4>
                          </div>

                          {/* Montant Total Ligne */}
                          <p className="text-xs sm:text-sm font-semibold tracking-tight text-primary whitespace-nowrap">
                            {formatMAD(item.price * item.quantity)}
                          </p>
                        </div>

                        {/* Format & Prix Unitaire */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-block text-[9.5px] font-semibold text-foreground/80 bg-secondary/90 px-2 py-0.5 rounded-md border border-border/70">
                            {SIZE_META[item.size]?.label || item.size}
                            {SIZE_META[item.size]?.sub ? ` · ${SIZE_META[item.size].sub}` : ""}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            ({formatMAD(item.price)} / u)
                          </span>
                        </div>
                      </div>

                      {/* Sélecteur de Quantité & Suppression */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/20">
                        <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden shadow-xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus size={11} strokeWidth={2.5} />
                          </button>
                          <span className="px-2.5 text-xs font-semibold text-foreground min-w-[24px] text-center select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus size={11} strokeWidth={2.5} />
                          </button>
                        </div>

                        {/* Bouton de Suppression */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id, item.size)}
                          className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-destructive/10 transition-colors cursor-pointer text-xs flex items-center gap-1"
                          title="Supprimer cet article"
                          aria-label={`Supprimer ${item.name}`}
                        >
                          <Trash2 size={13} />
                          <span className="text-[10px] hidden sm:inline">Retirer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bloc Inférieur de Commande & Récapitulatif */}
              <div className="border-t border-border/80 pt-3.5 space-y-3 mt-auto bg-background/60">
                {/* Carte des Totaux */}
                <div className="space-y-1.5 bg-card/70 border border-border/70 rounded-xl p-3.5 shadow-xs">
                  <div className="flex justify-between items-center text-xs text-muted-foreground font-light">
                    <span>Sous-total ({totalItems} article{totalItems > 1 ? "s" : ""})</span>
                    <span className="font-semibold text-foreground tracking-tight">{formatMAD(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground font-light">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3 text-primary" />
                      <span>Livraison partout au Maroc</span>
                    </span>
                    {remainingForFree === 0 ? (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        GRATUITE
                      </span>
                    ) : (
                      <span className="text-[11px] text-primary font-semibold">
                        Calculée à la commande
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border/50">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
                        Total Estimé
                      </span>
                      <span className="text-[10px] text-muted-foreground">Paiement à la réception</span>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-primary">
                      {formatMAD(subtotal)}
                    </span>
                  </div>
                </div>

                {/* Bouton de Validation de Commande */}
                <Button
                  type="button"
                  className="w-full rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold uppercase tracking-wider text-xs h-12 shadow-lg shadow-primary/20 gap-2 cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                  onClick={handleCheckoutNavigation}
                >
                  <span>Valider ma Commande</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>

                {/* Continuer les Achats */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full text-center text-[11px] uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
                >
                  Continuer mes découvertes
                </button>

                {/* Réassurance & Garanties */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-muted-foreground/90 border-t border-border/40 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>100% Authentique</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Paiement à la livraison</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingBag;

