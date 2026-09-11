/**
 * Page Dédiée au Suivi de Commande — Maison Kenzi
 *
 * Route : /suivi-commande & /tracking
 * Permet aux clients d'accéder directement au suivi en temps réel de leur commande
 * avec timeline détaillée, récapitulatif des flacons et assistance WhatsApp.
 */

import { useSearchParams } from "react-router-dom";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import Seo from "@/components/Seo";
import { OrderTrackingView } from "@/components/orders/OrderTrackingView";
import { Sparkles, Truck, ShieldCheck, Clock } from "lucide-react";

const OrderTracking = () => {
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get("code") || undefined;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      <Seo
        title="Suivi de Commande en Direct | Maison Kenzi"
        description="Suivez l'état d'avancement de votre commande de parfums de niche en temps réel avec votre code de commande."
        path="/suivi-commande"
      />
      <Header />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs uppercase tracking-[0.25em] font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Conciergerie & Expéditions</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl text-foreground font-light tracking-tight mb-4 leading-tight">
              Suivi de Commande
            </h1>

            <p className="text-muted-foreground text-xs sm:text-sm font-light leading-relaxed max-w-lg mx-auto">
              Entrez votre référence de commande reçue lors de votre achat pour consulter son statut de préparation et d'expédition en direct.
            </p>

            <div className="w-14 h-[1px] bg-primary/40 mx-auto mt-6" />
          </div>

          {/* Tracking Component */}
          <OrderTrackingView initialCode={codeFromUrl} />

          {/* Information Reassurance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 text-center">
            <div className="p-4 rounded-xl border border-border/70 bg-card/40 backdrop-blur-sm space-y-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Clock className="w-4 h-4" />
              </div>
              <h4 className="font-serif text-sm font-semibold text-foreground">Préparation Soignée</h4>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">
                Contrôle d'intégrité du scellé et emballage haute protection sous 24h.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-card/40 backdrop-blur-sm space-y-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Truck className="w-4 h-4" />
              </div>
              <h4 className="font-serif text-sm font-semibold text-foreground">Livraison Express</h4>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">
                Acheminement rapide dans toutes les villes du Maroc sous 24 à 48 heures.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-card/40 backdrop-blur-sm space-y-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="font-serif text-sm font-semibold text-foreground">Paiement à la Livraison</h4>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">
                Réglez en espèces directement lors de la remise en main propre.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderTracking;
