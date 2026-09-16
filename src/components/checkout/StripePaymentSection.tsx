/**
 * Composant de Paiement Sécurisé par Carte & Apple Pay — Stripe Elements
 * Maison Kenzi — Charte Graphique Minimaliste Haute Couture (Option 4 — Apple / Harrods Edition)
 *
 * Design :
 * - Approche ultra-épurée et minimaliste inspirée des boutiques de luxe internationales (Harrods, Apple)
 * - Intégration transparente et fluide de Stripe Elements sans boîte lourde
 * - Ligne de commande claire avec récapitulatif instantané du montant
 * - Bouton de paiement ergonomique monochrome / or haute précision
 * - Ruban de réassurance horizontal ultra-fin (SSL 256-bit, 3D-Secure, 100% Original)
 * - Zéro Emoji — Icônes vectorielles lucide-react exclusivement.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  CreditCard,
  Lock,
  AlertCircle,
  Loader2,
  Info,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { formatEUR } from "@/lib/sizes";
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

  // Montant direct en Euro
  const finalEurAmount = Math.max(Number(total || 0), 0.50);
  const formattedEur = formatEUR(total);

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
        setErrorMsg("Impossible de charger la passerelle de paiement sécurisée Stripe. Veuillez rafraîchir la page.");
      }
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);

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

        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalEurAmount,
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

        if (paymentElementContainerRef.current) {
          paymentElementContainerRef.current.innerHTML = "";
        }

        const isDarkMode = document.documentElement.classList.contains("dark");
        const elements = stripe.elements({
          clientSecret: data.clientSecret,
          appearance: {
            theme: "flat",
            variables: {
              colorPrimary: "#C9A96E",
              colorBackground: isDarkMode ? "#12100E" : "#FFFFFF",
              colorText: isDarkMode ? "#F5E6CC" : "#1A1816",
              colorDanger: "#ef4444",
              fontFamily: "Manrope, system-ui, sans-serif",
              fontSizeBase: "13px",
              borderRadius: "12px",
              spacingUnit: "4px",
            },
            rules: {
              ".Input": {
                border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid hsl(30, 15%, 88%)",
                backgroundColor: isDarkMode ? "#181512" : "#FAFAF8",
                boxShadow: "none",
                padding: "12px 14px",
                transition: "all 0.2s ease",
              },
              ".Input:focus": {
                border: "1px solid #C9A96E",
                boxShadow: "0 0 0 1px #C9A96E",
                backgroundColor: isDarkMode ? "#1C1814" : "#FFFFFF",
              },
              ".Label": {
                fontSize: "11px",
                fontWeight: "600",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: isDarkMode ? "#C9A96E" : "hsl(25, 10%, 40%)",
                marginBottom: "5px",
              },
              ".Tab": {
                border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid hsl(30, 15%, 90%)",
                backgroundColor: isDarkMode ? "#181512" : "#FAFAF8",
                borderRadius: "12px",
                padding: "10px 14px",
              },
              ".Tab--selected": {
                borderColor: "#C9A96E",
                backgroundColor: isDarkMode ? "rgba(201, 169, 110, 0.12)" : "rgba(201, 169, 110, 0.08)",
                boxShadow: "none",
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
  }, [stripeLoaded, total, finalEurAmount, publishableKey]);

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
    <div className="space-y-4 pt-1">
      {/* SECTION MINIMALISTE HAUTE COUTURE (OPTION 4) */}
      <div className="rounded-3xl p-5 sm:p-6 bg-card/60 dark:bg-[#141210]/90 border border-border/70 dark:border-white/10 space-y-4">
        {/* En-tête minimaliste & direct */}
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" strokeWidth={1.8} />
            <h3 className="font-sans text-xs sm:text-sm font-bold text-foreground">
              Paiement Sécurisé
            </h3>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span className="text-xs text-muted-foreground font-light">Total :</span>
            <span className="font-sans font-bold text-xs sm:text-sm text-primary tracking-tight">
              {formattedEur}
            </span>
          </div>
        </div>

        {/* Moyens acceptés en pilules sobres */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/80 text-[10px] font-medium text-foreground border border-border/60">
              <CreditCard className="w-3 h-3 text-primary" />
              <span>Cartes Bancaires</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/80 text-[10px] font-medium text-foreground border border-border/60">
              <Smartphone className="w-3 h-3 text-primary" />
              <span>Apple Pay</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10.5px] font-medium">
            <Lock className="w-3 h-3" />
            <span>SSL 256-bit</span>
          </div>
        </div>

        {isTestMode && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-[11px] text-amber-700 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <span className="font-semibold block text-xs">Mode Démonstration Stripe</span>
              <span className="font-light leading-relaxed">
                Carte test : <strong className="font-mono font-semibold">4242 4242 4242 4242</strong> (CVC 123).
              </span>
            </div>
          </div>
        )}

        {/* FORMULAIRE STRIPE ELEMENTS */}
        <div className="space-y-3.5 pt-1">
          {loadingIntent && (
            <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-xs">Chargement sécurisé…</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Erreur d'initialisation</span>
              </div>
              <p className="text-[11px] font-light leading-relaxed">{errorMsg}</p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-[11px] font-medium hover:bg-destructive/90 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Réessayer</span>
                </button>
              </div>
            </div>
          )}

          {/* Montage Stripe Elements */}
          <div ref={paymentElementContainerRef} className="min-h-[140px]" />

          {/* Bouton de Règlement Ergonomique Pleine Largeur */}
          <Button
            type="button"
            onClick={handlePay}
            disabled={processing || loadingIntent || !stripeLoaded}
            className="w-full h-12 sm:h-13 rounded-2xl bg-foreground text-background hover:bg-primary hover:text-primary-foreground font-sans font-semibold text-xs sm:text-sm tracking-wide shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Traitement en cours…</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Payer {formattedEur}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StripePaymentSection;
