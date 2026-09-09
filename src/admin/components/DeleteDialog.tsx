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

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
  productName?: string;
};

const DeleteDialog = ({ open, onOpenChange, onConfirm, productName }: Props) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="bg-[#FFFFFF] dark:bg-[#1A1A1A]">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-[#111827] dark:text-[#F9FAFB]">Supprimer ce produit ?</AlertDialogTitle>
        <AlertDialogDescription className="text-[#6B7280] dark:text-[#9CA3AF]">
          {productName ? <strong className="text-[#111827] dark:text-[#F9FAFB]">{productName}</strong> : "Ce produit"} sera retiré du catalogue. Cette action est irréversible.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="border-[#E5E7EB] dark:border-[#2A2A2A]">Annuler</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="bg-[#EF4444] hover:bg-[#DC2626] text-white"
        >
          Supprimer
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default DeleteDialog;
