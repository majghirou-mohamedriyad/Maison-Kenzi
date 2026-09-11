import { X, Minus, Plus, Trash2, ShoppingBag as BagIcon, ArrowRight, ShieldCheck, Truck, Sparkles, MessageCircle, Crown, Flame, Flower2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/store/cart";
import { SIZE_META, formatMAD } from "@/lib/sizes";
import { useAppSettings } from "@/hooks/useAppSettings";

interface ShoppingBagProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShoppingBag = ({ isOpen, onClose }: ShoppingBagProps) => {
  const { items, totalItems, subtotal, updateQuantity, removeItem } = useCart();
  const { settings } = useAppSettings();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const rawPhone = settings.whatsapp_phone || "212752850156";
  const waNumber = rawPhone.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Bonjour Maison Kenzi, j'aimerais valider ma commande pour un total de ${formatMAD(subtotal)}.`
  )}`;

  return (
    <div className="fixed inset-0 z-[110] h-screen overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Slide-in Drawer */}
      <div className="absolute right-0 top-0 h-screen w-full sm:w-[420px] bg-background/95 dark:bg-[#12141a]/95 backdrop-blur-2xl border-l border-border/80 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/70 bg-card/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <BagIcon size={16} />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-foreground">
                Mon Panier
              </h2>
              <span className="text-[11px] text-muted-foreground block -mt-0.5">
                {totalItems} article{totalItems > 1 ? "s" : ""} sélectionné{totalItems > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            aria-label="Fermer le panier"
          >
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping / Delivery Assurance Banner */}
        <div className="bg-primary/5 border-b border-primary/15 px-4 py-2.5 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-primary font-medium">
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>Livraison 24–48h partout au Maroc</span>
          </span>
          <span className="text-muted-foreground font-light text-[10px]">Paiement Cash</span>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-5">
          {items.length === 0 ? (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-card border border-border/80 flex items-center justify-center text-primary/60 shadow-xs">
                <BagIcon size={28} strokeWidth={1.5} />
              </div>
              <div className="space-y-1 max-w-xs">
                <h3 className="font-serif text-base font-semibold text-foreground">
                  Votre panier est vide
                </h3>
                <p className="text-xs text-muted-foreground font-light leading-relaxed">
                  Découvrez nos sélections de parfums d'exception et laissez-vous tenter par une nouvelle signature.
                </p>
              </div>

              {/* Quick Discovery Navigation */}
              <div className="w-full pt-2 space-y-2 max-w-xs">
                <Button
                  asChild
                  className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold uppercase tracking-wider h-10 shadow-xs cursor-pointer"
                  onClick={onClose}
                >
                  <Link to="/collection/all" className="flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Découvrir la Collection</span>
                  </Link>
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-xl border-border hover:border-primary/40 text-xs h-9 cursor-pointer"
                    onClick={onClose}
                  >
                    <Link to="/collection/homme" className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-primary" /> Homme
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="rounded-xl border-border hover:border-primary/40 text-xs h-9 cursor-pointer"
                    onClick={onClose}
                  >
                    <Link to="/collection/femme" className="flex items-center gap-1">
                      <Flower2 className="w-3 h-3 text-primary" /> Femme
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Items List */
            <>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 divide-y divide-border/40">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="pt-3 first:pt-0 flex gap-3 group"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-18 sm:w-18 sm:h-20 bg-card border border-border/80 rounded-xl p-1 flex items-center justify-center shrink-0 overflow-hidden relative">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-multiply transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-[9px] font-serif text-primary/80 text-center px-1 break-all">
                          {item.imageLabel}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <div className="min-w-0 pr-1">
                            <p className="text-[9px] tracking-widest uppercase font-semibold text-primary/80 truncate">
                              {item.maison}
                            </p>
                            <h4 className="text-xs sm:text-sm font-serif font-bold text-foreground truncate">
                              {item.name}
                            </h4>
                          </div>

                          {/* Line Total */}
                          <p className="text-xs sm:text-sm font-semibold tracking-tight text-primary whitespace-nowrap">
                            {formatMAD(item.price * item.quantity)}
                          </p>
                        </div>

                        {/* Format Badge */}
                        <div className="mt-0.5">
                          <span className="inline-block text-[9px] font-semibold text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded border border-border/60">
                            {SIZE_META[item.size]?.label || item.size} {SIZE_META[item.size]?.sub ? `(${SIZE_META[item.size].sub})` : ""}
                          </span>
                        </div>
                      </div>

                      {/* Stepper and Delete */}
                      <div className="flex items-center justify-between mt-2 pt-1">
                        <div className="flex items-center bg-card border border-border/80 rounded-lg overflow-hidden shadow-xs">
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            aria-label="Diminuer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="px-2 text-xs font-semibold text-foreground min-w-[24px] text-center select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            aria-label="Augmenter"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        {/* Direct Delete */}
                        <button
                          onClick={() => removeItem(item.id, item.size)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer text-xs flex items-center gap-1"
                          title="Supprimer du panier"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Checkout Controls */}
              <div className="border-t border-border/80 pt-4 space-y-3 mt-auto bg-background/50">
                <div className="space-y-1 bg-card/60 border border-border/60 rounded-xl p-3">
                  <div className="flex justify-between items-center text-xs text-muted-foreground font-light">
                    <span>Sous-total</span>
                    <span className="font-semibold text-foreground tracking-tight">{formatMAD(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground font-light">
                    <span>Livraison Maroc</span>
                    <span className="text-[11px] text-primary font-semibold">Calculée à la commande</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/40">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">Total Estimé</span>
                    <span className="text-base font-bold tracking-tight text-primary">{formatMAD(subtotal)}</span>
                  </div>
                </div>

                {/* Primary Checkout Button */}
                <Button
                  asChild
                  className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider text-xs h-12 shadow-md gap-2 cursor-pointer"
                  onClick={onClose}
                >
                  <Link to="/checkout" className="flex items-center justify-center">
                    <span>Commander Maintenant</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>

                {/* Secondary Action */}
                <button
                  onClick={onClose}
                  className="w-full text-center text-[11px] uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
                >
                  Continuer mes achats
                </button>

                {/* Reassurance Footer */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-muted-foreground/80 border-t border-border/40 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span>100% Authentique</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-primary" />
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
