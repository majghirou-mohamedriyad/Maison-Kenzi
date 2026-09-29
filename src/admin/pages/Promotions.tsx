/**
 * Page d'Administration des Promotions & Codes Coupons — Maison Kenzi
 *
 * Interface de gestion, création, modification et suivi des codes promotionnels.
 * Comprend des KPIs interactifs, un générateur de codes aléatoires, un sélecteur de conditions,
 * des interrupteurs d'activation en 1 clic et une validation anti-fraude.
 * Conforme aux règles d'ingénierie : zéro emoji, icônes vectorielles lucide-react, commentaires en français.
 */

import React, { useState, useMemo } from "react";
import {
  Tag,
  Plus,
  Search,
  Pencil,
  Trash2,
  Copy,
  Check,
  Percent,
  Coins,
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Layers,
  ArrowUpDown,
  Filter,
  Users,
} from "lucide-react";
import { usePromo } from "@/contexts/PromoContext";
import type { PromoCode, PromoType, PromoCategoryTarget } from "@/types/promotions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Catégories disponibles pour le ciblage
const CATEGORY_OPTIONS = [
  { value: "all", label: "Tout le catalogue (Toutes catégories)" },
  { value: "parfums", label: "Parfums de Niche uniquement" },
  { value: "cosmetiques", label: "Produits Cosmétiques uniquement" },
  { value: "artisanat", label: "Artisanat & Décoration" },
  { value: "bazar-chic", label: "Bazar Chic & Trésors" },
];

// Générateur de code promotionnel élégant
const generateRandomPromoCode = (prefix = "KENZI"): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${randomPart}`;
};

const Promotions: React.FC = () => {
  const { promotions, savePromo, removePromoById, togglePromoActive, isLoading } = usePromo();

  // Filtres et recherche
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // État de copie de code
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modale d'édition / création
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);

  // Formulaire de promotion
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<PromoType>("percentage");
  const [formValue, setFormValue] = useState<number>(10);
  const [formMinOrder, setFormMinOrder] = useState<number>(0);
  const [formMaxUses, setFormMaxUses] = useState<string>("");
  const [formOncePerCustomer, setFormOncePerCustomer] = useState<boolean>(true);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formStartDate, setFormStartDate] = useState<string>("");
  const [formEndDate, setFormEndDate] = useState<string>("");
  const [formCategory, setFormCategory] = useState<PromoCategoryTarget>("all");
  const [isSaving, setIsSaving] = useState(false);

  // Modale de confirmation de suppression
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Copie d'un code dans le presse-papier
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Code copié dans le presse-papier", { description: code });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Ouverture modale de création
  const handleOpenCreateModal = () => {
    setEditingPromo(null);
    setFormCode(generateRandomPromoCode("KENZI"));
    setFormDescription("");
    setFormType("percentage");
    setFormValue(10);
    setFormMinOrder(0);
    setFormMaxUses("");
    setFormOncePerCustomer(true);
    setFormIsActive(true);
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormEndDate("");
    setFormCategory("all");
    setIsModalOpen(true);
  };

  // Ouverture modale d'édition
  const handleOpenEditModal = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormCode(promo.code);
    setFormDescription(promo.description || "");
    setFormType(promo.type);
    setFormValue(promo.value);
    setFormMinOrder(promo.min_order_amount || 0);
    setFormMaxUses(promo.max_uses !== null && promo.max_uses !== undefined ? String(promo.max_uses) : "");
    setFormOncePerCustomer(promo.once_per_customer ?? true);
    setFormIsActive(promo.is_active);
    setFormStartDate(promo.start_date ? promo.start_date.split("T")[0] : "");
    setFormEndDate(promo.end_date ? promo.end_date.split("T")[0] : "");
    setFormCategory(promo.target_category || "all");
    setIsModalOpen(true);
  };

  // Soumission du formulaire
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = formCode.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Veuillez saisir un code promotionnel.");
      return;
    }

    if (formType !== "free_shipping" && (!formValue || formValue <= 0)) {
      toast.error("Veuillez renseigner une valeur de remise valide.");
      return;
    }

    if (formType === "percentage" && formValue > 100) {
      toast.error("Le pourcentage de réduction ne peut pas excéder 100%.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: PromoCode = {
        id: editingPromo?.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `promo-${Date.now()}`),
        code: cleanCode,
        description: formDescription.trim(),
        type: formType,
        value: formType === "free_shipping" ? 0 : Number(formValue),
        min_order_amount: Number(formMinOrder) || 0,
        max_uses: formMaxUses ? Number(formMaxUses) : null,
        current_uses: editingPromo?.current_uses || 0,
        once_per_customer: formOncePerCustomer,
        is_active: formIsActive,
        start_date: formStartDate ? new Date(formStartDate).toISOString() : null,
        end_date: formEndDate ? new Date(formEndDate).toISOString() : null,
        target_category: formCategory,
        created_at: editingPromo?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await savePromo(payload);
      toast.success(editingPromo ? "Code promotionnel modifié avec succès !" : "Nouveau code promotionnel créé !");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Erreur enregistrement promo :", err);
      toast.error("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setIsSaving(false);
    }
  };

  // Suppression confirmée
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await removePromoById(deleteTargetId);
      toast.success("Code promotionnel supprimé.");
    } catch (err) {
      console.error("Erreur suppression :", err);
      toast.error("Impossible de supprimer la promotion.");
    } finally {
      setDeleteTargetId(null);
    }
  };

  // Calcul des statistiques KPIs
  const kpis = useMemo(() => {
    const totalPromos = promotions.length;
    const activePromos = promotions.filter((p) => p.is_active).length;
    const totalUses = promotions.reduce((acc, p) => acc + (p.current_uses || 0), 0);

    const now = new Date();
    const expiredPromos = promotions.filter((p) => p.end_date && new Date(p.end_date) < now).length;

    return {
      totalPromos,
      activePromos,
      totalUses,
      expiredPromos,
    };
  }, [promotions]);

  // Filtrage des promotions
  const filteredPromotions = useMemo(() => {
    const now = new Date();
    return promotions.filter((p) => {
      // Filtre recherche
      if (search) {
        const query = search.toLowerCase();
        const matchCode = p.code.toLowerCase().includes(query);
        const matchDesc = p.description?.toLowerCase().includes(query);
        if (!matchCode && !matchDesc) return false;
      }

      // Filtre type
      if (typeFilter !== "all" && p.type !== typeFilter) return false;

      // Filtre statut
      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "inactive" && p.is_active) return false;
      if (statusFilter === "expired") {
        if (!p.end_date || new Date(p.end_date) >= now) return false;
      }

      return true;
    });
  }, [promotions, search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* En-tête de Prestige */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border/70 rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 text-primary mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-widest">Offres Privilèges</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-foreground">
            Promotions & Codes Réduction
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Créez et administrez vos coupons promotionnels, remises en pourcentage, montants fixes et livraisons offertes.
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="h-11 px-5 rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all font-medium text-xs uppercase tracking-wider shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Code Promo</span>
        </Button>
      </div>

      {/* Cartes d'Indicateurs KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : Codes Actifs */}
        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Tag className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
              Codes Actifs
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-semibold text-foreground">{kpis.activePromos}</span>
              <span className="text-xs text-muted-foreground">/ {kpis.totalPromos} total</span>
            </div>
          </div>
        </div>

        {/* KPI 2 : Total Utilisations */}
        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
              Utilisations Cumulées
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-semibold text-foreground">{kpis.totalUses}</span>
              <span className="text-xs text-muted-foreground">commandes remisées</span>
            </div>
          </div>
        </div>

        {/* KPI 3 : Types d'Offres */}
        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
              Types de Remises
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-semibold text-foreground">%, €, Gratuité</span>
            </div>
          </div>
        </div>

        {/* KPI 4 : Expirations */}
        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
              Offres Expirées
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-semibold text-foreground">{kpis.expiredPromos}</span>
              <span className="text-xs text-muted-foreground">codes archivés</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Champ de recherche */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par code ou description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-background/50 text-xs sm:text-sm border-border/80 focus:border-primary"
          />
        </div>

        {/* Filtres Type et Statut */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10 text-xs rounded-xl bg-background/50 border-border/80 w-full sm:w-44">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="percentage">Pourcentage (%)</SelectItem>
              <SelectItem value="fixed">Montant fixe (€)</SelectItem>
              <SelectItem value="free_shipping">Livraison Offerte</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 text-xs rounded-xl bg-background/50 border-border/80 w-full sm:w-36">
              <SelectValue placeholder="Tous statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Inactifs</SelectItem>
              <SelectItem value="expired">Expirés</SelectItem>
            </SelectContent>
          </Select>

          {(search || typeFilter !== "all" || statusFilter !== "all") && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setTypeFilter("all");
                setStatusFilter("all");
              }}
              className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground rounded-xl"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Tableau des Promotions */}
      <div className="bg-card border border-border/70 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-4 px-6">Code & Description</th>
                <th className="py-4 px-4">Type & Valeur</th>
                <th className="py-4 px-4">Conditions</th>
                <th className="py-4 px-4">Validité</th>
                <th className="py-4 px-4">Utilisations</th>
                <th className="py-4 px-4 text-center">Statut</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Tag className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="font-medium text-sm text-foreground">Aucun code promotionnel trouvé</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {search || typeFilter !== "all" || statusFilter !== "all"
                        ? "Essayez d'ajuster vos critères de recherche ou de réinitialiser les filtres."
                        : "Commencez par créer votre premier code promo pour dynamiser vos ventes."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((promo) => {
                  const now = new Date();
                  const isExpired = promo.end_date && new Date(promo.end_date) < now;
                  const isLimitReached =
                    promo.max_uses !== null &&
                    promo.max_uses !== undefined &&
                    (promo.current_uses || 0) >= promo.max_uses;

                  return (
                    <tr
                      key={promo.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      {/* Code & Description */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold tracking-wider text-foreground bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                            {promo.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(promo.code)}
                            className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded-md hover:bg-muted/50 cursor-pointer"
                            title="Copier le code"
                          >
                            {copiedCode === promo.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {promo.description && (
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 max-w-xs">
                            {promo.description}
                          </p>
                        )}
                      </td>

                      {/* Type & Valeur */}
                      <td className="py-4 px-4">
                        {promo.type === "percentage" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Percent className="w-3 h-3" />
                            -{promo.value}%
                          </span>
                        ) : promo.type === "fixed" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Coins className="w-3 h-3" />
                            -{promo.value.toFixed(2)} €
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Truck className="w-3 h-3" />
                            Livraison Offerte
                          </span>
                        )}
                      </td>

                      {/* Conditions */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <p className="text-foreground font-medium text-[11px]">
                            {promo.min_order_amount && promo.min_order_amount > 0
                              ? `Dès ${promo.min_order_amount.toFixed(2)} € d'achat`
                              : "Sans minimum d'achat"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {promo.target_category === "all" || !promo.target_category
                              ? "Tout le catalogue"
                              : `Catégorie : ${promo.target_category}`}
                          </p>
                        </div>
                      </td>

                      {/* Calendrier */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          {promo.start_date && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <span>Du {new Date(promo.start_date).toLocaleDateString("fr-FR")}</span>
                            </p>
                          )}
                          {promo.end_date ? (
                            <p
                              className={`text-[11px] flex items-center gap-1 ${
                                isExpired ? "text-rose-500 font-semibold" : "text-muted-foreground"
                              }`}
                            >
                              <span>Au {new Date(promo.end_date).toLocaleDateString("fr-FR")}</span>
                              {isExpired && <span className="text-[10px] uppercase tracking-wider">(Expiré)</span>}
                            </p>
                          ) : (
                            <p className="text-[11px] text-emerald-500">Durée illimitée</p>
                          )}
                        </div>
                      </td>

                      {/* Utilisations */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 font-medium text-foreground">
                            <span>{promo.current_uses || 0}</span>
                            <span className="text-muted-foreground text-[11px]">
                              / {promo.max_uses !== null && promo.max_uses !== undefined ? promo.max_uses : "∞"}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            {promo.once_per_customer ? (
                              <span className="text-primary font-medium">1x par client</span>
                            ) : (
                              <span>Multi-usages client</span>
                            )}
                          </p>
                          {isLimitReached && (
                            <span className="text-[10px] text-rose-500 font-semibold block">Quota atteint</span>
                          )}
                        </div>
                      </td>

                      {/* Statut Interrupteur */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={promo.is_active && !isExpired && !isLimitReached}
                            onCheckedChange={() => togglePromoActive(promo.id)}
                            className="cursor-pointer"
                          />
                          <span
                            className={`text-[10px] font-medium uppercase tracking-wider ${
                              promo.is_active && !isExpired && !isLimitReached
                                ? "text-emerald-500"
                                : "text-muted-foreground"
                            }`}
                          >
                            {promo.is_active && !isExpired && !isLimitReached ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditModal(promo)}
                            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer"
                            title="Modifier"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTargetId(promo.id)}
                            className="w-8 h-8 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale de Création / Modification de Promotion */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 bg-card border-border/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-light text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>{editingPromo ? "Modifier le Code Promo" : "Créer un Code Promotionnel"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configurez les paramètres de réduction, le montant minimum et les conditions de validité.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePromo} className="space-y-4 py-2">
            {/* Ligne 1 : Code + Bouton Générateur */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Code Coupon (Majuscules) *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                    placeholder="EXEMPLE10"
                    className="pl-10 h-10 rounded-xl font-mono uppercase tracking-wider font-semibold text-xs sm:text-sm bg-background/50 border-border/80 focus:border-primary"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormCode(generateRandomPromoCode("KENZI"))}
                  className="h-10 px-3 text-xs rounded-xl border-border/80 hover:bg-muted cursor-pointer"
                  title="Générer un code aléatoire"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-primary" />
                  Aléatoire
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Description ou Motif de l'offre</Label>
              <Input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ex: Offre de bienvenue -10% dès 50 €"
                className="h-10 rounded-xl text-xs sm:text-sm bg-background/50 border-border/80 focus:border-primary"
              />
            </div>

            {/* Ligne 2 : Type de Remise & Valeur */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Type de Réduction *</Label>
                <Select value={formType} onValueChange={(val) => setFormType(val as PromoType)}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-background/50 border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Montant fixe en Euro (€)</SelectItem>
                    <SelectItem value="free_shipping">Livraison Gratuite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  {formType === "percentage"
                    ? "Valeur du Pourcentage (%) *"
                    : formType === "fixed"
                    ? "Montant Déduit (€) *"
                    : "Valeur"}
                </Label>
                <Input
                  type="number"
                  min={formType === "percentage" ? 1 : 0}
                  max={formType === "percentage" ? 100 : 9999}
                  step="0.5"
                  disabled={formType === "free_shipping"}
                  value={formType === "free_shipping" ? 0 : formValue}
                  onChange={(e) => setFormValue(parseFloat(e.target.value) || 0)}
                  placeholder={formType === "percentage" ? "10" : "15"}
                  className="h-10 rounded-xl text-xs sm:text-sm bg-background/50 border-border/80 focus:border-primary"
                />
              </div>
            </div>

            {/* Ligne 3 : Montant Minimum & Quota Maximal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Panier Minimum Requis (€)</Label>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={formMinOrder}
                  onChange={(e) => setFormMinOrder(parseFloat(e.target.value) || 0)}
                  placeholder="0 (aucun minimum)"
                  className="h-10 rounded-xl text-xs sm:text-sm bg-background/50 border-border/80 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Quota Maximal d'Utilisations</Label>
                <Input
                  type="number"
                  min={1}
                  step="1"
                  value={formMaxUses}
                  onChange={(e) => setFormMaxUses(e.target.value)}
                  placeholder="Illimité"
                  className="h-10 rounded-xl text-xs sm:text-sm bg-background/50 border-border/80 focus:border-primary"
                />
              </div>
            </div>

            {/* Ligne 4 : Dates Début et Expiration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Date de Début</Label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="h-10 rounded-xl text-xs bg-background/50 border-border/80 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Date d'Expiration</Label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  placeholder="Illimité si vide"
                  className="h-10 rounded-xl text-xs bg-background/50 border-border/80 focus:border-primary"
                />
              </div>
            </div>

            {/* Ligne 5 : Catégorie Ciblée */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Catégorie de Produits Ciblée</Label>
              <Select value={formCategory} onValueChange={(val) => setFormCategory(val)}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-background/50 border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Options booléennes */}
            <div className="pt-2 space-y-2.5 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium text-foreground">Limiter à 1 seule utilisation par client</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Empêche un même numéro de téléphone ou email de réutiliser ce code.
                  </p>
                </div>
                <Switch
                  checked={formOncePerCustomer}
                  onCheckedChange={setFormOncePerCustomer}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium text-foreground">Activer immédiatement ce code promo</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Rend le coupon opérationnel sur le site dès l'enregistrement.
                  </p>
                </div>
                <Switch
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/50 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-10 rounded-xl text-xs"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-10 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-xs font-medium uppercase tracking-wider px-5 cursor-pointer"
              >
                {isSaving ? "Enregistrement..." : editingPromo ? "Mettre à jour" : "Créer le Code"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modale de Confirmation de Suppression */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent className="rounded-3xl bg-card border-border/80">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-lg font-light text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span>Supprimer ce code promotionnel ?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Cette action est irréversible. Les clients ne pourront plus appliquer ce code lors de leurs commandes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium uppercase tracking-wider cursor-pointer"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Promotions;
