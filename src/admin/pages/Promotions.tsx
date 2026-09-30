/**
 * Page d'Administration des Promotions & Codes Coupons — Maison Kenzi
 *
 * Interface de gestion, création, modification et suivi des codes promotionnels.
 * Comprend des KPIs interactifs, un générateur de codes à préfixes rapides,
 * un sélecteur visuel de types de remise par cartes, des presets rapides de pourcentages et dates,
 * un sélecteur dynamique de catégories éligibles et une validation anti-fraude.
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
  Users,
  Gift,
  Zap,
  Loader2,
} from "lucide-react";
import { usePromo } from "@/contexts/PromoContext";
import { useCategories } from "@/store/useCategoryStore";
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
import { toast } from "sonner";

// Presets de pourcentages rapides
const PERCENTAGE_PRESETS = [10, 15, 20, 25, 30, 50];

// Presets de montants fixes rapides (€)
const FIXED_PRESETS = [5, 10, 15, 20, 30, 50];

// Préfixes rapides pour la génération aléatoire
const PREFIX_PRESETS = ["KENZI", "VIP", "PRIVILEGE", "ETE", "BIENVENUE", "FLASH"];

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
  const { promotions, savePromo, removePromoById, togglePromoActive, clearAllPromotions, isLoading } = usePromo();
  const categoriesList = useCategories();

  // Liste dynamique des catégories
  const categoryOptions = useMemo(() => {
    const base = [{ value: "all", label: "Tout le catalogue (Toutes catégories)" }];
    if (categoriesList && categoriesList.length > 0) {
      categoriesList.forEach((cat) => {
        base.push({
          value: cat.slug || cat.id,
          label: cat.name,
        });
      });
    } else {
      base.push(
        { value: "parfums", label: "Parfums de Niche uniquement" },
        { value: "cosmetiques", label: "Produits Cosmétiques uniquement" },
        { value: "artisanat", label: "Artisanat & Décoration" },
        { value: "bazar-chic", label: "Bazar Chic & Trésors" }
      );
    }
    return base;
  }, [categoriesList]);

  // Filtres et recherche
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // État de copie de code
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modale d'édition / création
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);

  // Modale de vidage complet
  const [isClearAllOpen, setIsClearAllOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

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

  // Vidage complet de la table
  const handleConfirmClearAll = async () => {
    setIsClearingAll(true);
    try {
      await clearAllPromotions();
      toast.success("Table des promotions vidée avec succès.");
      setIsClearAllOpen(false);
    } catch {
      toast.error("Erreur lors de la suppression globale des promotions.");
    } finally {
      setIsClearingAll(false);
    }
  };

  // Copie d'un code dans le presse-papier
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Code copié dans le presse-papier", { description: code });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Raccourci pour appliquer une durée rapide
  const handleApplyDurationPreset = (days: number | null) => {
    if (days === null) {
      setFormEndDate("");
      return;
    }
    const target = new Date();
    target.setDate(target.getDate() + days);
    setFormEndDate(target.toISOString().split("T")[0]);
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
      toast.error("Veuillez renseigner un code promotionnel.");
      return;
    }

    if (formType !== "free_shipping" && (!formValue || formValue <= 0)) {
      toast.error("Veuillez renseigner une valeur de réduction valide.");
      return;
    }

    if (formType === "percentage" && formValue > 100) {
      toast.error("Le pourcentage de remise ne peut pas dépasser 100%.");
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
      toast.success(editingPromo ? "Code promotionnel mis à jour avec succès !" : "Nouveau code promotionnel créé !");
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

  // Statistiques KPIs
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
            <span className="text-xs font-semibold uppercase tracking-widest">Offres & Fidélité</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-foreground">
            Promotions & Codes Réduction
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Créez et administrez vos coupons promotionnels, remises en pourcentage, montants fixes et livraisons offertes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {promotions.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsClearAllOpen(true)}
              disabled={isClearingAll}
              className="h-11 px-4 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 transition-all font-medium text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Vider la table</span>
            </Button>
          )}

          <Button
            onClick={handleOpenCreateModal}
            className="h-11 px-5 rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all font-medium text-xs uppercase tracking-wider shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Code Promo</span>
          </Button>
        </div>
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

        {/* KPI 3 : Types de Remises */}
        <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Percent className="w-6 h-6 stroke-[1.75]" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
              Types Disponibles
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
          <div className="w-full sm:w-44">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-xl bg-background/50 border border-border/80 text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">Tous les types</option>
              <option value="percentage">Pourcentage (%)</option>
              <option value="fixed">Montant fixe (€)</option>
              <option value="free_shipping">Livraison Offerte</option>
            </select>
          </div>

          <div className="w-full sm:w-36">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-xl bg-background/50 border border-border/80 text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="expired">Expirés</option>
            </select>
          </div>

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

      {/* AFFICHAGE RESPONSIVE : CARTES MOBILE (< lg) & TABLEAU DESKTOP (>= lg) */}
      {filteredPromotions.length === 0 ? (
        <div className="bg-card border border-border/70 rounded-3xl p-12 text-center text-muted-foreground shadow-sm">
          <Tag className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm text-foreground">Aucun code promotionnel trouvé</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || typeFilter !== "all" || statusFilter !== "all"
              ? "Essayez d'ajuster vos critères de recherche ou de réinitialiser les filtres."
              : "Commencez par créer votre premier code promo pour dynamiser vos ventes."}
          </p>
        </div>
      ) : (
        <>
          {/* 1. VUE MOBILE EN CARTES (< lg) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 lg:hidden">
            {filteredPromotions.map((promo) => {
              const now = new Date();
              const isExpired = promo.end_date && new Date(promo.end_date) < now;
              const isLimitReached =
                promo.max_uses !== null &&
                promo.max_uses !== undefined &&
                (promo.current_uses || 0) >= promo.max_uses;

              const catLabel =
                categoryOptions.find((c) => c.value === promo.target_category)?.label ||
                (promo.target_category === "all" || !promo.target_category ? "Tout le catalogue" : promo.target_category);

              return (
                <div
                  key={promo.id}
                  className="bg-card/95 border border-border/80 rounded-2xl p-4 shadow-xs space-y-3 hover:border-primary/40 transition-all"
                >
                  {/* En-tête de la carte */}
                  <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-primary bg-primary/10 border border-primary/25 px-2.5 py-1 rounded-lg">
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

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={promo.is_active && !isExpired && !isLimitReached}
                        onCheckedChange={() => togglePromoActive(promo.id)}
                        className="cursor-pointer scale-90"
                      />
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          promo.is_active && !isExpired && !isLimitReached
                            ? "text-emerald-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {promo.is_active && !isExpired && !isLimitReached ? "Actif" : "Inactif"}
                      </span>
                    </div>
                  </div>

                  {/* Description si présente */}
                  {promo.description && (
                    <p className="text-xs text-foreground/90 font-medium">
                      {promo.description}
                    </p>
                  )}

                  {/* Détails en grille */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Type & Valeur */}
                    <div className="bg-muted/30 p-2 rounded-xl space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Remise
                      </span>
                      {promo.type === "percentage" ? (
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          -{promo.value}%
                        </span>
                      ) : promo.type === "fixed" ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          -{promo.value.toFixed(2)} €
                        </span>
                      ) : (
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          Livraison Offerte
                        </span>
                      )}
                    </div>

                    {/* Utilisations */}
                    <div className="bg-muted/30 p-2 rounded-xl space-y-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                        Utilisations
                      </span>
                      <span className="font-bold text-foreground">
                        {promo.current_uses || 0} / {promo.max_uses !== null && promo.max_uses !== undefined ? promo.max_uses : "∞"}
                      </span>
                    </div>
                  </div>

                  {/* Conditions & Validité */}
                  <div className="space-y-1 text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                    <p className="flex items-center justify-between">
                      <span>Condition :</span>
                      <span className="text-foreground font-medium">
                        {promo.min_order_amount && promo.min_order_amount > 0
                          ? `Dès ${promo.min_order_amount.toFixed(2)} €`
                          : "Sans minimum"}
                      </span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Catégorie :</span>
                      <span className="text-foreground font-medium truncate max-w-[160px]">{catLabel}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Validité :</span>
                      <span className={isExpired ? "text-rose-500 font-semibold" : "text-foreground font-medium"}>
                        {promo.end_date ? `Jusqu'au ${new Date(promo.end_date).toLocaleDateString("fr-FR")}` : "Illimitée"}
                      </span>
                    </p>
                  </div>

                  {/* Boutons d'Action Mobile */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditModal(promo)}
                      className="h-8 px-3 text-xs gap-1.5 rounded-xl cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Modifier</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTargetId(promo.id)}
                      className="h-8 px-3 text-xs gap-1.5 rounded-xl border-rose-500/30 text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Supprimer</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. VUE TABLEAU DESKTOP (>= lg) */}
          <div className="hidden lg:block bg-card border border-border/70 rounded-3xl shadow-sm overflow-hidden">
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
                  {filteredPromotions.map((promo) => {
                    const now = new Date();
                    const isExpired = promo.end_date && new Date(promo.end_date) < now;
                    const isLimitReached =
                      promo.max_uses !== null &&
                      promo.max_uses !== undefined &&
                      (promo.current_uses || 0) >= promo.max_uses;

                    const catLabel =
                      categoryOptions.find((c) => c.value === promo.target_category)?.label ||
                      (promo.target_category === "all" || !promo.target_category ? "Tout le catalogue" : promo.target_category);

                    return (
                      <tr
                        key={promo.id}
                        className="hover:bg-muted/20 transition-colors group"
                      >
                        {/* Code & Description */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold tracking-wider text-foreground bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 shadow-sm">
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
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              <Percent className="w-3 h-3" />
                              -{promo.value}%
                            </span>
                          ) : promo.type === "fixed" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <Coins className="w-3 h-3" />
                              -{promo.value.toFixed(2)} €
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
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
                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                              {catLabel}
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
                                daylight savings text-muted-foreground`}
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
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modale Épurée & Intuitive : Création / Modification de Code Promo */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[560px] max-h-[92vh] overflow-y-auto rounded-3xl p-0 bg-card border-border/80 shadow-2xl flex flex-col">
          {/* En-tête Prestigieux */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-primary/15 via-background to-background border-b border-border/50 sticky top-0 z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0 shadow-inner">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="font-serif text-xl font-light text-foreground">
                  {editingPromo ? "Modifier le Code Promotionnel" : "Créer un Code Promotionnel"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Configurez les privilèges, remises et conditions de votre offre.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Formulaire Unique & Épuré */}
          <form onSubmit={handleSavePromo} className="p-5 sm:p-6 space-y-4 sm:space-y-5 flex-1">
            {/* 1. Code Promo & Générateur de Préfixes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  <span>Code Coupon (Majuscules) *</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">Sans espaces</span>
              </div>

              <div className="relative">
                <Input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  placeholder="EXEMPLE10"
                  className="h-11 rounded-xl font-mono uppercase tracking-widest font-bold text-sm bg-background/50 border-border/80 focus:border-primary pl-3.5"
                />
              </div>

              {/* Boutons de Préfixes Rapides */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mr-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Générer :
                </span>
                {PREFIX_PRESETS.map((prefix) => (
                  <button
                    key={prefix}
                    type="button"
                    onClick={() => setFormCode(generateRandomPromoCode(prefix))}
                    className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-lg bg-muted/60 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all border border-border/50 cursor-pointer"
                  >
                    {prefix}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Description de l'offre */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Description ou Motif de l'offre</Label>
              <Input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Ex: Offre de bienvenue -15% dès 80 € d'achat"
                className="h-10 rounded-xl text-xs sm:text-sm bg-background/50 border-border/80 focus:border-primary"
              />
            </div>

            {/* 3. Sélecteur Visuel de Type de Réduction (3 Cartes) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-primary" />
                <span>Type de Réduction *</span>
              </Label>

              <div className="grid grid-cols-3 gap-2">
                {/* Carte Pourcentage */}
                <button
                  type="button"
                  onClick={() => {
                    setFormType("percentage");
                    if (formValue === 0) setFormValue(10);
                  }}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[72px] ${
                    formType === "percentage"
                      ? "bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/30"
                      : "bg-background/40 border-border/70 text-muted-foreground hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <Percent className="w-4 h-4 mb-1" />
                  <div>
                    <p className="text-xs font-semibold">Pourcentage</p>
                    <p className="text-[10px] opacity-80">Remise en %</p>
                  </div>
                </button>

                {/* Carte Montant Fixe */}
                <button
                  type="button"
                  onClick={() => {
                    setFormType("fixed");
                    if (formValue === 0) setFormValue(15);
                  }}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[72px] ${
                    formType === "fixed"
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/30"
                      : "bg-background/40 border-border/70 text-muted-foreground hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <Coins className="w-4 h-4 mb-1" />
                  <div>
                    <p className="text-xs font-semibold">Montant Fixe</p>
                    <p className="text-[10px] opacity-80">Déduction en €</p>
                  </div>
                </button>

                {/* Carte Livraison Offerte */}
                <button
                  type="button"
                  onClick={() => {
                    setFormType("free_shipping");
                    setFormValue(0);
                  }}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[72px] ${
                    formType === "free_shipping"
                      ? "bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400 shadow-sm ring-1 ring-amber-500/30"
                      : "bg-background/40 border-border/70 text-muted-foreground hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <Truck className="w-4 h-4 mb-1" />
                  <div>
                    <p className="text-xs font-semibold">Livraison</p>
                    <p className="text-[10px] opacity-80">Frais offerts</p>
                  </div>
                </button>
              </div>
            </div>

            {/* 4. Valeur de Remise & Presets Rapides */}
            {formType !== "free_shipping" && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted/30 border border-border/60">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-medium text-foreground">
                    {formType === "percentage" ? "Valeur du Pourcentage (%) *" : "Montant de la Remise (€) *"}
                  </Label>
                  <span className="text-[11px] font-semibold text-primary">
                    {formType === "percentage" ? `-${formValue}%` : `-${formValue} €`}
                  </span>
                </div>

                <div className="relative">
                  <Input
                    type="number"
                    min={formType === "percentage" ? 1 : 0.5}
                    max={formType === "percentage" ? 100 : 9999}
                    step={formType === "percentage" ? 1 : 0.5}
                    value={formValue || ""}
                    onChange={(e) => setFormValue(parseFloat(e.target.value) || 0)}
                    placeholder={formType === "percentage" ? "Ex: 15" : "Ex: 20"}
                    className="h-10 rounded-xl text-xs sm:text-sm bg-background border-border/80 focus:border-primary font-semibold"
                  />
                </div>

                {/* Presets rapides de valeurs */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-muted-foreground mr-1">Raccourcis :</span>
                  {(formType === "percentage" ? PERCENTAGE_PRESETS : FIXED_PRESETS).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormValue(val)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all cursor-pointer ${
                        formValue === val
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-background hover:bg-muted text-muted-foreground border border-border/60"
                      }`}
                    >
                      {formType === "percentage" ? `${val}%` : `${val} €`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Conditions : Panier Minimum & Quota Maximal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Panier Minimum Requis (€)</Label>
                <Input
                  type="number"
                  min={0}
                  step={5}
                  value={formMinOrder || ""}
                  onChange={(e) => setFormMinOrder(parseFloat(e.target.value) || 0)}
                  placeholder="0 (aucun minimum)"
                  className="h-10 rounded-xl text-xs sm:text-sm bg-background/50 border-border/80 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Quota Max d'Utilisations</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={formMaxUses}
                  onChange={(e) => setFormMaxUses(e.target.value)}
                  placeholder="Illimité"
                  className="h-10 rounded-xl text-xs sm:text-sm bg-background/50 border-border/80 focus:border-primary"
                />
              </div>
            </div>

            {/* 6. Calendrier & Validité avec Presets */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Période de Validité</span>
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">Date de début</span>
                  <Input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="h-10 rounded-xl text-xs bg-background/50 border-border/80 focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">Date d'expiration</span>
                  <Input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    placeholder="Illimité si vide"
                    className="h-10 rounded-xl text-xs bg-background/50 border-border/80 focus:border-primary"
                  />
                </div>
              </div>

              {/* Presets de durées */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-muted-foreground mr-1">Durée :</span>
                <button
                  type="button"
                  onClick={() => handleApplyDurationPreset(7)}
                  className="px-2 py-0.5 text-[10px] rounded-md bg-muted/60 hover:bg-muted text-muted-foreground border border-border/50 cursor-pointer"
                >
                  7 jours
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyDurationPreset(30)}
                  className="px-2 py-0.5 text-[10px] rounded-md bg-muted/60 hover:bg-muted text-muted-foreground border border-border/50 cursor-pointer"
                >
                  30 jours
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyDurationPreset(90)}
                  className="px-2 py-0.5 text-[10px] rounded-md bg-muted/60 hover:bg-muted text-muted-foreground border border-border/50 cursor-pointer"
                >
                  3 mois
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyDurationPreset(null)}
                  className="px-2 py-0.5 text-[10px] rounded-md bg-muted/60 hover:bg-muted text-muted-foreground border border-border/50 cursor-pointer"
                >
                  Illimité
                </button>
              </div>
            </div>

            {/* 7. Catégorie ciblée (Sélecteur Direct & Fiable) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Catégorie de Produits Éligible</span>
              </Label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full h-11 px-3.5 text-xs sm:text-sm rounded-xl bg-background/50 border border-border/80 text-foreground focus:outline-none focus:border-primary cursor-pointer transition-colors"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-card text-foreground py-1.5">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 8. Options de Sécurité & Statut */}
            <div className="pt-2 space-y-3 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>Usage unique par client</span>
                  </Label>
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
                  <Label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Activer immédiatement ce code promo</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Le coupon sera utilisable sur le site dès l'enregistrement.
                  </p>
                </div>
                <Switch
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/50 flex items-center justify-end gap-2 sticky bottom-0 bg-card/95 backdrop-blur-md pb-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="h-11 rounded-xl text-xs px-5 cursor-pointer"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 text-xs font-semibold uppercase tracking-wider px-6 cursor-pointer shadow-md"
              >
                {isSaving ? "Enregistrement..." : editingPromo ? "Mettre à jour" : "Créer le Code Promo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modale de Confirmation de Vidage Complet de la Table */}
      <AlertDialog open={isClearAllOpen} onOpenChange={(open) => !open && setIsClearAllOpen(false)}>
        <AlertDialogContent className="rounded-3xl bg-card border-border/80 p-6">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span>Vider l'ensemble des promotions ?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Cette action supprimera définitivement tous les codes promotionnels créés ainsi que l'historique des coupons. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel className="rounded-xl text-xs cursor-pointer">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearAll}
              disabled={isClearingAll}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase tracking-wider cursor-pointer gap-2"
            >
              {isClearingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Vider Définitivement</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modale de Confirmation de Suppression Unitaire */}
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
            <AlertDialogCancel className="rounded-xl text-xs cursor-pointer">Annuler</AlertDialogCancel>
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
