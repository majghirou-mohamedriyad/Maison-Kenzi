/**
 * Composant d'Affichage du Suivi de Commande — Maison Kenzi
 *
 * Expérience Haute Parfumerie permettant au client de suivre en direct l'état
 * d'avancement de son colis (En attente, Confirmée/Préparation, Livrée, Annulée).
 * Respecte le Luxury Nude Design System, zéro emoji et typographie d'exception.
 */

import { useState } from "react";
import { useOrderTracking } from "@/hooks/useOrderTracking";
import { formatMAD } from "@/lib/sizes";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Clock,
  Package,
  CheckCircle2,
  XCircle,
  Truck,
  MapPin,
  Calendar,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import type { OrderStatus } from "@/types/database";

interface OrderTrackingViewProps {
  initialCode?: string;
  onClose?: () => void;
  isModal?: boolean;
}

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return iso;
  }
};

const STATUS_STEPS = [
  {
    key: "en_attente" as OrderStatus,
    stepNumber: "01",
    label: "Commande Reçue",
    sublabel: "Enregistrée & en attente de traitement",
    icon: Clock,
  },
  {
    key: "confirmee" as OrderStatus,
    stepNumber: "02",
    label: "Confirmée & En Préparation",
    sublabel: "Vérification du scellé & conditionnement soigné à l'atelier",
    icon: Package,
  },
  {
    key: "livree" as OrderStatus,
    stepNumber: "03",
    label: "Expédiée / Livrée",
    sublabel: "Remise en main propre par le transporteur express",
    icon: Truck,
  },
];

const getStepProgressIndex = (status: OrderStatus) => {
  switch (status) {
    case "en_attente":
      return 0;
    case "confirmee":
      return 1;
    case "livree":
      return 2;
    case "annulee":
      return -1;
    default:
      return 0;
  }
};

export const OrderTrackingView = ({ initialCode, onClose, isModal = false }: OrderTrackingViewProps) => {
  const { settings } = useAppSettings();
  const {
    orderNumberInput,
    setOrderNumberInput,
    order,
    loading,
    error,
    searched,
    fetchOrder,
    lastSavedOrderNumber,
  } = useOrderTracking(initialCode);

  const [inputVal, setInputVal] = useState(initialCode || lastSavedOrderNumber || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(inputVal);
  };

  const rawPhone = settings.whatsapp_phone || settings.store_phone || "212752850156";
  const waNumber = rawPhone.replace(/[^0-9]/g, "") || "212752850156";

  const waOrderHelpUrl = order
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
        `Bonjour Maison Kenzi, je souhaite obtenir une assistance concernant ma commande n° ${order.order_number}.`
      )}`
    : `https://wa.me/${waNumber}?text=${encodeURIComponent(
        "Bonjour Maison Kenzi, j'aurais besoin d'un renseignement sur ma commande."
      )}`;

  const currentStepIdx = order ? getStepProgressIndex(order.status) : 0;
  const isCancelled = order?.status === "annulee";

  return (
    <div className="space-y-6 text-foreground">
      {/* Search Bar Form */}
      <div className="bg-card/70 border border-primary/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <label className="block text-xs uppercase tracking-[0.2em] font-semibold text-primary">
            Saisissez votre code de commande
          </label>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-primary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value.toUpperCase())}
                placeholder="Ex : MK-849201"
                className="pl-10 h-11 text-xs sm:text-sm font-mono uppercase rounded-xl bg-background/90 border-border/80 focus:border-primary tracking-wider"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !inputVal.trim()}
              className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover text-xs uppercase tracking-wider font-semibold px-6 shadow-sm transition-all hover:scale-[1.02] gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Recherche...</span>
                </>
              ) : (
                <>
                  <span>Suivre</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Suggestion du dernier code mémorisé */}
        {lastSavedOrderNumber && lastSavedOrderNumber !== inputVal && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <span>Dernière commande passée :</span>
            <button
              type="button"
              onClick={() => {
                setInputVal(lastSavedOrderNumber);
                fetchOrder(lastSavedOrderNumber);
              }}
              className="font-mono text-primary hover:underline font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{lastSavedOrderNumber}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Error / Not Found message */}
      {error && searched && !loading && (
        <div className="p-4 sm:p-6 rounded-2xl border border-destructive/30 bg-destructive/5 text-center space-y-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <XCircle className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm text-foreground font-light max-w-md mx-auto leading-relaxed">
            {error}
          </p>
          <div className="pt-2">
            <a
              href={waOrderHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Demander de l'aide sur WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* Active Order Tracking Result Card */}
      {order && !loading && (
        <div className="space-y-6 animate-fade-in">
          {/* Order Header Summary */}
          <div className="bg-card/90 border border-primary/30 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-sm relative overflow-hidden space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold">
                    Commande
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Synchronisé en direct" />
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground tracking-tight mt-0.5">
                  {order.order_number}
                </h2>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-light">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Enregistrée le {formatDate(order.created_at)}</span>
                </span>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {isCancelled ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/20">
                    <XCircle className="w-4 h-4" />
                    <span>Commande Annulée</span>
                  </span>
                ) : order.status === "livree" ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Colis Livré / Expédié</span>
                  </span>
                ) : order.status === "confirmee" ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30 shadow-xs">
                    <Package className="w-4 h-4" />
                    <span>En Préparation à l'Atelier</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    <Clock className="w-4 h-4" />
                    <span>En Attente de Confirmation</span>
                  </span>
                )}
              </div>
            </div>

            {/* TIMELINE / PROGRESS STEPPER */}
            {!isCancelled ? (
              <div className="py-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                  {STATUS_STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const isCompleted = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;

                    return (
                      <div
                        key={step.key}
                        className={`rounded-xl p-3.5 border transition-all duration-300 relative ${
                          isCurrent
                            ? "bg-primary/10 border-primary shadow-sm"
                            : isCompleted
                            ? "bg-card border-primary/40 text-foreground"
                            : "bg-card/40 border-border/60 opacity-60 text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-1.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              isCurrent
                                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                : isCompleted
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <StepIcon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <span className="text-[9px] uppercase tracking-widest text-primary font-bold block">
                              Étape {step.stepNumber}
                            </span>
                            <span className="font-serif text-xs sm:text-sm font-semibold text-foreground block truncate">
                              {step.label}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] font-light text-muted-foreground leading-relaxed pl-11">
                          {step.sublabel}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive leading-relaxed">
                Cette commande a été annulée. Si vous souhaitez réactiver votre commande ou obtenir plus de détails, vous pouvez échanger avec notre conciergerie olfactive.
              </div>
            )}

            {/* Client & Delivery Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background/80 border border-border/80 rounded-xl p-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Destinataire</span>
                <p className="font-medium text-foreground text-sm">{order.customer_name}</p>
                {order.customer_phone && (
                  <p className="text-muted-foreground font-mono text-xs">{order.customer_phone}</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary" /> Adresse de Livraison
                </span>
                <p className="font-light text-foreground leading-relaxed">
                  {order.customer_address || "Non précisée"}
                </p>
              </div>
            </div>

            {/* Items Listing Breakdown */}
            <div className="border border-border/70 rounded-xl overflow-hidden">
              <div className="bg-secondary/60 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                <span>Créations Parfumées ({order.items.length})</span>
                <span>Total</span>
              </div>

              <div className="divide-y divide-border/60 bg-card/60">
                {order.items.map((it, idx) => {
                  const itemName = it.parfum_name || it.name || "Création Maison Kenzi";
                  const itemPrice = Number(it.price || it.unit_price || 0);
                  const itemQty = Number(it.quantity || 1);

                  return (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-serif font-semibold text-foreground text-xs sm:text-sm truncate">
                          {itemName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-light">
                          <span className="bg-secondary px-1.5 py-0.2 rounded border border-border/50 text-[10px] font-medium">
                            Format : {it.size || "10ml"}
                          </span>
                          <span>× {itemQty}</span>
                        </div>
                      </div>

                      <span className="font-semibold tracking-tight text-primary shrink-0 text-xs sm:text-sm">
                        {formatMAD(itemPrice * itemQty)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total Row */}
              <div className="bg-secondary/40 p-3.5 flex items-center justify-between border-t border-border/70 text-xs sm:text-sm font-bold">
                <span className="text-foreground">Montant à régler à la livraison (COD) :</span>
                <span className="text-base sm:text-lg font-bold tracking-tight text-primary">
                  {formatMAD(order.total_amount)}
                </span>
              </div>
            </div>

            {/* Assistance Contact Link */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-light">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Paiement en espèces à la réception partout au Maroc</span>
              </div>

              <a
                href={waOrderHelpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold uppercase tracking-wider shadow-sm transition-all hover:scale-105"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Assistance WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
