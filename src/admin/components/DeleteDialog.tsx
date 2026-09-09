/**
 * Modale de Confirmation de Suppression — Maison Kenzi Admin
 *
 * Boîte de dialogue épurée pour valider la suppression d'un produit
 * ou d'une ressource sans action accidentelle.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
  productName?: string;
};

const DeleteDialog = ({ open, onOpenChange, onConfirm, productName }: Props) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="bg-[#FFFFFF]/95 dark:bg-[#141312]/95 backdrop-blur-xl border border-[#EAE3D8] dark:border-[#24211E] rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md">
      <AlertDialogHeader className="space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto sm:mx-0">
          <AlertTriangle className="w-5 h-5 stroke-[1.75]" />
        </div>
        <AlertDialogTitle className="font-serif text-xl font-medium text-[#1A1816] dark:text-[#FAF7F2]">
          Confirmer la suppression
        </AlertDialogTitle>
        <AlertDialogDescription className="text-xs text-[#7A726A] dark:text-[#A39B91] leading-relaxed">
          {productName ? (
            <span>
              Êtes-vous certain de vouloir retirer <strong className="text-[#1A1816] dark:text-[#FAF7F2] font-semibold">{productName}</strong> du catalogue Maison Kenzi ?
            </span>
          ) : (
            "Êtes-vous certain de vouloir supprimer cet élément du catalogue ?"
          )}
          <br />
          <span className="text-rose-600 dark:text-rose-400 mt-1 block">
            Cette action est irréversible et supprimera toutes les déclinaisons associées.
          </span>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="mt-6 gap-2 sm:gap-3">
        <AlertDialogCancel className="rounded-xl border border-[#E5DDD0] dark:border-[#332E28] bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[#4A453E] dark:text-[#D1C9BF] text-xs font-medium px-4 py-2.5">
          Annuler
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium px-5 py-2.5 shadow-sm"
        >
          Supprimer définitivement
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default DeleteDialog;

