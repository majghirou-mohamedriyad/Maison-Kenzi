/**
 * Composant de Paiement Sécurisé par Carte & Apple Pay — Stripe
 * Maison Kenzi — Charte Graphique Haute Parfumerie (Luxury Nude)
 *
 * Utilise Stripe Elements officiel pour intégrer le formulaire de carte bancaire,
 * Apple Pay et Google Pay de manière native sans redirection.
 * Zéro Emoji — Icônes vectorielles lucide-react exclusivement.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { CreditCard, Lock, ShieldCheck, AlertCircle, Loader2, Info, RefreshCw } from "lucide-react";
import { formatMAD } from "@/lib/sizes";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => any;
  }
}

interface StripePaymentSectionProps {
  total: number;
  customerName?: string;
  customerEmail?: string;
  isFormValid: boolean;
  onValidateForm: () => boolean;
  onPaymentSuccess: (details: {
    paymentIntentId: string;
    payerName?: string;
    payerEmail?: string;
  }) => Promise<void>;
}

export const StripePaymentSection = ({
  total,
  customerName,
  customerEmail,
  isFormValid,
  onValidateForm,
  onPaymentSuccess,
}: StripePaymentSectionProps) => {
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const paymentElementContainerRef = useRef<HTMLDivElement>(null);
  const stripeInstanceRef = useRef<any>(null);
  const elementsInstanceRef = useRef<any>(null);
  const paymentElementRef = useRef<any>(null);

  const rawPublishableKey =
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_51UFcdfDpritAiI2ImrMJnqnobmEpVkxqejhPtdNIuI0qQbwBCVsiT9CGDn4jTATsFGIOYZgJCoxYlmQaA38lvUbN0052SU5z2z";

  const publishableKey = String(rawPublishableKey).trim().replace(/^["']|["']$/g, "");

  const isTestMode = publishableKey.startsWith("pk_test_");

  // Fonction de réessai manuel en cas d'échec de chargement
  const handleRetry = useCallback(() => {
    setErrorMsg(null);
    setLoadingIntent(false);
    // Nettoyer l'ancien script s'il est en échec
    const oldScript = document.getElementById("stripe-v3-js");
    if (oldScript && !window.Stripe) {
      oldScript.remove();
    }
    setReloadTrigger((prev) => prev + 1);
  }, []);

  // 1. Chargement dynamique résilient du script officiel Stripe.js v3
  useEffect(() => {
    let interval: any = null;
    let isCancelled = false;

    // Vérifier si Stripe est déjà injecté globalement
    if (typeof window !== "undefined" && window.Stripe) {
      setStripeLoaded(true);
      setErrorMsg(null);
      return;
    }

    const checkGlobalStripe = () => {
      if (typeof window !== "undefined" && window.Stripe) {
        if (!isCancelled) {
          setStripeLoaded(true);
          setErrorMsg(null);
        }
        if (interval) clearInterval(interval);
        return true;
      }
      return false;
    };

    if (checkGlobalStripe()) return;

    const scriptId = "stripe-v3-js";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://js.stripe.com/v3/";
      script.async = true;
      document.head.appendChild(script);
    }

    const onLoad = () => {
      if (!isCancelled && window.Stripe) {
        setStripeLoaded(true);
        setErrorMsg(null);
      }
    };

    const onError = () => {
      if (!isCancelled && !window.Stripe) {
        setErrorMsg("Impossible de charger la passerelle de paiement sécurisée Stripe. Veuillez rafraîchir la page (Ctrl+F5) ou vérifier si une extension bloque les scripts.");
      }
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

    // Surveillance active pendant 5 secondes (au cas où l'événement load s'est déclenché avant l'écouteur)
    let checks = 0;
    interval = setInterval(() => {
      checks++;
      if (checkGlobalStripe() || checks > 25) {
        clearInterval(interval);
      }
    }, 200);

    return () => {
      isCancelled = true;
      if (interval) clearInterval(interval);
      if (script) {
        script.removeEventListener("load", onLoad);
        script.removeEventListener("error", onError);
      }
    };
  }, [reloadTrigger]);

  // 2. Initialisation de l'intention de paiement et montage de Stripe Elements
  useEffect(() => {
    if (!stripeLoaded || !window.Stripe || total <= 0) return;

    let isMounted = true;
    setLoadingIntent(true);
    setErrorMsg(null);

    const initStripeElements = async () => {
      try {
        const stripe = window.Stripe!(publishableKey);
        stripeInstanceRef.current = stripe;

        // Appel au point de terminaison pour générer le clientSecret
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            currency: "eur",
            orderNumber: `MK-T-${Date.now().toString().slice(-6)}`,
            customerName: customerName || undefined,
            customerEmail: customerEmail || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.clientSecret) {
          throw new Error(data.error || "Échec d'initialisation du paiement sécurisé.");
        }

        if (!isMounted) return;

        // Nettoyage du conteneur précédent
        if (paymentElementContainerRef.current) {
          paymentElementContainerRef.current.innerHTML = "";
        }

        // Configuration du design system Luxury Nude pour Stripe Elements
        const elements = stripe.elements({
          clientSecret: data.clientSecret,
          appearance: {
            theme: "flat",
            variables: {
              colorPrimary: "#C9A96E",
              colorBackground: "transparent",
              colorText: "#1A1816",
              colorDanger: "#ef4444",
              fontFamily: "Manrope, system-ui, sans-serif",
              fontSizeBase: "13px",
              borderRadius: "14px",
              spacingUnit: "4px",
            },
            rules: {
              ".Input": {
                border: "1px solid hsl(30, 15%, 85%)",
                backgroundColor: "hsl(36, 33%, 99%)",
                boxShadow: "none",
                padding: "10px 12px",
              },
              ".Input:focus": {
                border: "1px solid #C9A96E",
                boxShadow: "0 0 0 1px #C9A96E",
              },
              ".Label": {
                fontSize: "11px",
                fontWeight: "600",
                letterSpacing: "0.02em",
                color: "hsl(25, 10%, 40%)",
                marginBottom: "4px",
              },
            },
          },
        });

        elementsInstanceRef.current = elements;

        const paymentElement = elements.create("payment", {
          layout: {
            type: "tabs",
            defaultCollapsed: false,
          },
        });

        paymentElementRef.current = paymentElement;

        if (paymentElementContainerRef.current) {
          paymentElement.mount(paymentElementContainerRef.current);
        }

        setLoadingIntent(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Erreur initialisation Stripe Elements:", err);
        setErrorMsg(err.message || "Erreur lors de l'initialisation du formulaire bancaire.");
        setLoadingIntent(false);
      }
    };

    initStripeElements();

    return () => {
      isMounted = false;
      if (paymentElementRef.current) {
        try {
          paymentElementRef.current.destroy();
        } catch {
          // Ignore
        }
      }
    };
  }, [stripeLoaded, total, publishableKey]);

  // 3. Soumission et confirmation du règlement par Carte / Apple Pay
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!onValidateForm()) {
      toast.error("Veuillez renseigner vos coordonnées de livraison complètes.");
      return;
    }

    if (!stripeInstanceRef.current || !elementsInstanceRef.current) {
      toast.error("Le module de paiement n'est pas prêt. Veuillez patienter.");
      return;
    }

    setProcessing(true);

    try {
      const result = await stripeInstanceRef.current.confirmPayment({
        elements: elementsInstanceRef.current,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (result.error) {
        console.error("Erreur confirmation Stripe:", result.error);
        toast.error(result.error.message || "Le paiement a été refusé par votre banque.");
        setProcessing(false);
        return;
      }

      if (result.paymentIntent && (result.paymentIntent.status === "succeeded" || result.paymentIntent.status === "processing")) {
        toast.success("Paiement validé avec succès.");
        await onPaymentSuccess({
          paymentIntentId: result.paymentIntent.id,
          payerName: customerName,
          payerEmail: customerEmail,
        });
      } else {
        toast.warning("Statut du paiement en cours de traitement.");
      }
    } catch (err: any) {
      console.error("Exception paiement Stripe:", err);
      toast.error(err?.message || "Une erreur inattendue est survenue lors de la transaction.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* En-tête sécurisé avec récapitulatif */}
      <div className="bg-background/90 border border-primary/25 rounded-2xl p-4 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
            <CreditCard className="w-4 h-4 text-primary" />
            <span>Paiement Sécurisé par Carte & Apple Pay</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Chiffrement Bancaire SSL</span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground font-light leading-relaxed">
          Réglez directement en toute sécurité avec votre <strong className="text-foreground font-medium">Carte Bancaire</strong> (Visa, Mastercard, American Express) ou en un clic via <strong className="text-foreground font-medium">Apple Pay / Google Pay</strong>.
        </p>

        {isTestMode && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <span className="font-semibold block">Mode Test Stripe Actif</span>
              <span className="font-light">
                Utilisez la carte test : <strong className="font-mono font-semibold">4242 4242 4242 4242</strong>, avec n'importe quelle date future et n'importe quel code CVC (ex: <strong className="font-mono">123</strong>).
              </span>
            </div>
          </div>
        )}

        <div className="pt-1.5 border-t border-border/50 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-light">Total à régler :</span>
          <span className="font-serif font-bold text-base text-primary tracking-tight">
            {formatMAD(total)}
          </span>
        </div>
      </div>

      {/* Formulaire Stripe Elements */}
      <div className="bg-card/70 border border-border/80 rounded-2xl p-4 sm:p-5 space-y-4">
        {loadingIntent && (
          <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Chargement sécurisé du formulaire bancaire…</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Erreur d'initialisation</span>
            </div>
            <p className="text-[11px] font-light leading-relaxed">{errorMsg}</p>
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-[11px] font-medium hover:bg-destructive/90 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Réessayer le chargement</span>
              </button>
            </div>
          </div>
        )}

        {/* Conteneur du Payment Element monté par Stripe */}
        <div ref={paymentElementContainerRef} className="min-h-[140px]" />

        {/* Bouton de confirmation de commande */}
        <Button
          type="button"
          onClick={handlePay}
          disabled={processing || loadingIntent || !stripeLoaded}
          className="w-full h-12 sm:h-13 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-sans font-semibold text-xs sm:text-sm tracking-wide shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Traitement sécurisé en cours…</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Confirmer & Régler — {formatMAD(total)}</span>
            </>
          )}
        </Button>
      </div>

      {/* Badges de Réassurance */}
      <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>Flacons 100% Originaux & Scellés d'Origine</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Lock className="w-3 h-3 text-primary" />
          <span>Plateforme sécurisée & certifiée PCI-DSS</span>
        </div>
      </div>
    </div>
  );
};
