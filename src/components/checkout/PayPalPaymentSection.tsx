/**
 * Composant de Paiement — Maison Kenzi
 * Statut : Module de paiement en ligne temporairement indisponible à la demande de la cliente
 * Zéro Emoji — Icônes vectorielles lucide-react uniquement
 */

import { ShieldAlert, Lock, AlertCircle, ShieldCheck } from "lucide-react";
import { formatMAD } from "@/lib/sizes";
import { Button } from "@/components/ui/button";

interface PayPalPaymentSectionProps {
  total: number;
  isFormValid?: boolean;
  onValidateForm?: () => boolean;
  onPaymentSuccess?: (details: any) => Promise<void>;
}

export const PayPalPaymentSection = ({
  total,
}: PayPalPaymentSectionProps) => {
  return (
    <div className="space-y-4 pt-2">
      {/* Alerte d'indisponibilité du module de paiement */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-semibold text-xs sm:text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>Paiement en Ligne Temporairement Indisponible</span>
        </div>
        <p className="text-xs text-muted-foreground font-light leading-relaxed">
          Le module de paiement en ligne est actuellement désactivé. Aucun prélèvement ou transaction en ligne ne peut être effectué directement sur le site pour le moment.
        </p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-2 border-t border-amber-500/20">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Pour toute question ou demande de commande, veuillez contacter la conciergerie WhatsApp.</span>
        </div>
      </div>

      {/* Bouton de paiement totalement incliquable / désactivé */}
      <Button
        type="button"
        disabled={true}
        className="w-full h-12 sm:h-13 rounded-2xl bg-muted text-muted-foreground cursor-not-allowed opacity-60 font-serif font-bold text-sm tracking-wide shadow-none flex items-center justify-center gap-2.5 select-none"
      >
        <Lock className="w-4 h-4" />
        <span>Paiement Indisponible — {formatMAD(total)}</span>
      </Button>

      {/* Badges de Réassurance */}
      <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>Flacons 100% Originaux & Scellés d'Origine</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Lock className="w-3 h-3 text-primary" />
          <span>Plateforme certifiée Maison Kenzi</span>
        </div>
      </div>
    </div>
  );
};
