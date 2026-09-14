/**
 * Composant de Paiement en Ligne Sécurisé — Maison Kenzi
 *
 * Intégration officielle du SDK PayPal Checkout avec boutons de paiement dynamique
 * (PayPal et Carte Bancaire Visa, Mastercard).
 * Gère la validation préalable du formulaire de commande, la conversion MAD -> EUR et la capture sécurisée.
 */

import { useEffect, useRef, useState } from "react";
import { CreditCard, ShieldCheck, Lock, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatMAD } from "@/lib/sizes";

interface PayPalPaymentSectionProps {
  total: number;
  isFormValid: boolean;
  onValidateForm: () => boolean;
  onPaymentSuccess: (details: {
    paypalOrderId: string;
    payerName?: string;
    payerEmail?: string;
  }) => Promise<void>;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

// Taux de change indicatif pour la conversion du Dirham Marocain (MAD) en Euro (EUR)
// PayPal ne prenant pas en charge le MAD en devise de facturation directe
const MAD_TO_EUR_RATE = 10.8;

export const PayPalPaymentSection = ({
  total,
  isFormValid,
  onValidateForm,
  onPaymentSuccess,
}: PayPalPaymentSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkLoading, setSdkLoading] = useState(true);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const clientId =
    import.meta.env.VITE_PAYPAL_CLIENT_ID ||
    "AQw6B6dxX9jW-ZCuHLHSpMmEVnBMSRqevH09FqQURUurFoBQSmOXMoJlwJfeBE-ylFQyq-FOzJ7Eo6vZ";

  const totalEur = Math.max(1, Math.round((Number(total || 0) / MAD_TO_EUR_RATE) * 100) / 100).toFixed(2);

  // Chargement dynamique du script PayPal SDK officiel
  useEffect(() => {
    if (!clientId) {
      setSdkError("Identifiant client PayPal (Client ID) non configuré.");
      setSdkLoading(false);
      return;
    }

    const scriptId = "paypal-sdk-script";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    const onScriptLoaded = () => {
      setSdkReady(true);
      setSdkLoading(false);
      setSdkError(null);
    };

    if (existingScript) {
      if (window.paypal) {
        onScriptLoaded();
      } else {
        existingScript.addEventListener("load", onScriptLoaded);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&currency=EUR&intent=capture&enable-funding=card`;
    script.async = true;

    script.onload = () => {
      onScriptLoaded();
    };

    script.onerror = () => {
      setSdkError("Impossible de charger le module de paiement sécurisé PayPal. Veuillez vérifier vos identifiants ou votre connexion.");
      setSdkLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      // Conservation du script pour les navigations ultérieures
    };
  }, [clientId]);

  const totalRef = useRef(total);
  const totalEurRef = useRef(totalEur);
  const isFormValidRef = useRef(isFormValid);
  const onValidateFormRef = useRef(onValidateForm);
  const onPaymentSuccessRef = useRef(onPaymentSuccess);

  useEffect(() => {
    totalRef.current = total;
    totalEurRef.current = totalEur;
    isFormValidRef.current = isFormValid;
    onValidateFormRef.current = onValidateForm;
    onPaymentSuccessRef.current = onPaymentSuccess;
  }, [total, totalEur, isFormValid, onValidateForm, onPaymentSuccess]);

  // Rendu stable des boutons de paiement PayPal et Carte Bancaire
  useEffect(() => {
    if (!sdkReady || !window.paypal || !containerRef.current) return;

    let isMounted = true;
    const targetElement = containerRef.current;
    targetElement.innerHTML = "";

    const isFormRejectedRef = { current: false };

    try {
      const buttonsInstance = window.paypal.Buttons({
        style: {
          layout: "vertical",
          color: "gold",
          shape: "rect",
          label: "pay",
          height: 48,
        },
        onClick: (data: any, actions: any) => {
          const valid = onValidateFormRef.current();
          if (!valid) {
            isFormRejectedRef.current = true;
            return actions.reject();
          }
          isFormRejectedRef.current = false;
          return actions.resolve();
        },
        createOrder: (data: any, actions: any) => {
          const amountToCharge = totalEurRef.current;

          return actions.order
            .create({
              purchase_units: [
                {
                  amount: {
                    currency_code: "EUR",
                    value: amountToCharge,
                  },
                },
              ],
            })
            .catch((err: any) => {
              console.error("Détail createOrder PayPal:", err);
              throw err;
            });
        },
        onApprove: async (data: any, actions: any) => {
          setProcessingPayment(true);
          try {
            const details = await actions.order.capture();
            const payerName = details?.payer?.name?.given_name
              ? `${details.payer.name.given_name} ${details.payer.name.surname || ""}`.trim()
              : undefined;
            const payerEmail = details?.payer?.email_address;

            await onPaymentSuccessRef.current({
              paypalOrderId: details.id || data.orderID,
              payerName,
              payerEmail,
            });
          } catch (err: any) {
            console.error("Erreur capture PayPal:", err);
            toast.error("Une erreur est survenue lors de la confirmation du paiement.");
          } finally {
            if (isMounted) {
              setProcessingPayment(false);
            }
          }
        },
        onCancel: () => {
          toast.info("Paiement interrompu. Aucun débit n'a été effectué.");
        },
        onError: (err: any) => {
          if (isFormRejectedRef.current) {
            isFormRejectedRef.current = false;
            return;
          }
          const errStr = String(err || "");
          if (errStr.includes("detected popup close") || errStr.includes("popup_closed") || errStr.includes("window closed")) {
            return;
          }
          console.error("Détail callback PayPal onError:", err);
          toast.error("Vérifiez les informations de paiement ou réessayez.");
        },
      });

      if (buttonsInstance.isEligible()) {
        buttonsInstance.render(targetElement).catch((renderErr: any) => {
          if (isMounted) {
            console.warn("Notice rendu PayPal Buttons:", renderErr);
          }
        });
      }
    } catch (err) {
      console.error("Erreur initialisation PayPal Buttons:", err);
    }

    return () => {
      isMounted = false;
    };
  }, [sdkReady]);

  return (
    <div className="space-y-4 pt-2">
      {/* En-tête sécurisé avec récapitulatif */}
      <div className="bg-background/90 border border-primary/25 rounded-2xl p-4 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold text-xs sm:text-sm">
            <CreditCard className="w-4 h-4 text-primary" />
            <span>Paiement Sécurisé en Ligne</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>SSL 256-bit</span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground font-light leading-relaxed">
          Réglez directement par <strong className="text-foreground font-medium">Carte Bancaire</strong> (Visa, Mastercard) ou avec votre compte <strong className="text-foreground font-medium">PayPal</strong>.
        </p>

        <div className="pt-1.5 border-t border-border/50 flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-light">Montant à régler :</span>
          <div className="text-right">
            <span className="font-semibold text-foreground">{formatMAD(total)}</span>
            <span className="text-[10px] text-muted-foreground ml-1.5 font-light">
              (soit env. {totalEur} €)
            </span>
          </div>
        </div>
      </div>

      {/* Zone d'affichage des boutons PayPal Checkout */}
      <div className="min-h-[120px] flex flex-col justify-center relative">
        {sdkLoading && (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Chargement sécurisé du module de paiement…</span>
          </div>
        )}

        {sdkError && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{sdkError}</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-light">
              Veuillez vérifier votre connexion internet ou vos identifiants PayPal.
            </p>
          </div>
        )}

        {processingPayment && (
          <div className="absolute inset-0 bg-background/85 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-3 z-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-semibold text-foreground">
              Confirmation et enregistrement sécurisé de votre commande…
            </p>
          </div>
        )}

        {/* Conteneur DOM où le SDK PayPal injecte les boutons */}
        <div
          ref={containerRef}
          className={`space-y-2 transition-opacity duration-300 ${
            sdkLoading || sdkError ? "hidden" : "block"
          }`}
        />
      </div>

      {/* Badges de réassurance de paiement */}
      <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>Protection des acheteurs PayPal</span>
        </div>
        <div className="flex items-center gap-2 uppercase tracking-wider font-mono text-[9px]">
          <span>CB</span>
          <span>•</span>
          <span>Visa</span>
          <span>•</span>
          <span>Mastercard</span>
          <span>•</span>
          <span>PayPal</span>
        </div>
      </div>
    </div>
  );
};
