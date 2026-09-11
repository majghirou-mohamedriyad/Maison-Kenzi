/**
 * Modale de Suivi de Commande — Maison Kenzi
 *
 * Fenêtre modale élégante en verre dépoli permettant la consultation instantanée
 * du statut d'une commande via son code généré automatiquement (MK-XXXXXX).
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { OrderTrackingView } from "./OrderTrackingView";
import { Sparkles, Truck } from "lucide-react";

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const OrderTrackingModal = ({
  isOpen,
  onClose,
  initialCode,
}: OrderTrackingModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-2xl border-2 border-primary/30 p-5 sm:p-8 rounded-3xl shadow-2xl">
        <DialogHeader className="text-center space-y-2 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-[10px] uppercase tracking-[0.25em] font-medium mx-auto">
            <Sparkles className="w-3 h-3" />
            <span>Atelier & Expéditions</span>
          </div>

          <DialogTitle className="font-serif text-2xl sm:text-3xl font-light text-foreground tracking-tight">
            Suivi de Votre Commande
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-muted-foreground font-light max-w-md mx-auto leading-relaxed">
            Consultez en temps réel l'avancement de la préparation et de l'acheminement de vos flacons.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          <OrderTrackingView initialCode={initialCode} onClose={onClose} isModal />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderTrackingModal;
