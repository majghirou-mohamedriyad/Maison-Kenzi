/**
 * Page de Gestion du Catalogue Produits — Maison Kenzi Admin
 *
 * Interface de consultation, filtrage, création, modification
 * et suppression des parfums de niche avec vue tableau ou cartes.
 */

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Layers,
  User,
  Users,
  Gift,
  Sparkles,
  Wine,
  Table2,
  LayoutGrid,
  Filter,
  ArrowUpDown,
  X,
  Building2,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Package,
  Download,
  FolderTree,
  Trash2,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";
import ProductTable from "../components/ProductTable";
import ProductModal from "../components/ProductModal";
import DeleteDialog from "../components/DeleteDialog";
import { deleteProduct, updateProduct, useProducts, type AdminParfum } from "@/store/useProductStore";
import { deleteParfumFromSupabase, syncParfumToSupabase } from "@/admin/lib/syncParfum";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/store/useCategoryStore";
import { getParfumSeasons } from "@/lib/seasonsStore";
import { isParfumInCategory, getParfumCategories } from "@/lib/productCategories";
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

type StatusFilter = "Tous" | "in_stock" | "out_of_stock";
type SortOption = "name_asc" | "name_desc" | "maison_asc" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc";

const SEASON_FILTER_OPTIONS = ["Toutes", "Printemps", "Été", "Automne", "Hiver"] as const;
const GENDER_FILTER_OPTIONS = ["Tous", "Homme", "Femme", "Mixte"] as const;

const Produits = () => {
  const products = useProducts();
  const categories = useCategories();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Tous");
  const [maisonFilter, setMaisonFilter] = useState<string>("Toutes");
  const [genderFilter, setGenderFilter] = useState<string>("Tous");
  const [seasonFilter, setSeasonFilter] = useState<string>("Toutes");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Tous");
  const [sortOption, setSortOption] = useState<SortOption>("name_asc");

  // Multi-sélection des parfums
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategoryModalOpen, setBulkCategoryModalOpen] = useState(false);
  const [targetCategorySlug, setTargetCategorySlug] = useState("");
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Mémorisation du mode d'affichage
  const [viewMode, setViewMode] = useState<"table" | "grid">(() => {
    try {
      const saved = localStorage.getItem("mk_admin_product_view_mode");
      if (saved === "grid" || saved === "table") return saved;
    } catch {}
    return "table";
  });

  const changeViewMode = (mode: "table" | "grid") => {
    setViewMode(mode);
    try {
      localStorage.setItem("mk_admin_product_view_mode", mode);
    } catch {}
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminParfum | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<AdminParfum | null>(null);

  const onAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const onEdit = (p: AdminParfum) => {
    setEditingProduct(p);
    setModalOpen(true);
  };

  const onDelete = (p: AdminParfum) => {
    setDeletingProduct(p);
  };

  const handleSortHeader = (field: string) => {
    if (field === "name") {
      setSortOption((prev) => (prev === "name_asc" ? "name_desc" : "name_asc"));
    } else if (field === "maison") {
      setSortOption((prev) => (prev === "maison_asc" ? "name_asc" : "maison_asc"));
    } else if (field === "price") {
      setSortOption((prev) => (prev === "price_asc" ? "price_desc" : "price_asc"));
    } else if (field === "stock") {
      setSortOption((prev) => (prev === "stock_desc" ? "stock_asc" : "stock_desc"));
    } else if (field === "status") {
      setStatusFilter((prev) => (prev === "in_stock" ? "out_of_stock" : "in_stock"));
    }
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;
    try {
      deleteProduct(deletingProduct.id);
      await deleteParfumFromSupabase(deletingProduct.id);
      toast.success("Produit supprimé", {
        description: `Le parfum ${deletingProduct.name} a été retiré du catalogue.`,
      });
    } catch (err: any) {
      toast.error("Erreur de suppression", {
        description: err?.message || "Impossible de supprimer le produit.",
      });
    } finally {
      setDeletingProduct(null);
    }
  };

  // Gestion de la sélection multiple
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const allFilteredIds = filteredAndSorted.map((p) => p.id);
    if (selectedIds.length === allFilteredIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  const deselectAll = () => setSelectedIds([]);

  const isAllSelected =
    filteredAndSorted.length > 0 &&
    filteredAndSorted.every((p) => selectedIds.includes(p.id));

  // Action groupée 1 : Changer la catégorie
  const handleBulkCategoryChange = async () => {
    if (!targetCategorySlug || selectedIds.length === 0) return;
    setIsProcessingBulk(true);
    try {
      let count = 0;
      for (const id of selectedIds) {
        const prod = products.find((p) => p.id === id);
        if (prod) {
          const currentCats = Array.isArray(prod.categories) ? prod.categories : [];
          const updatedCats = currentCats.includes(targetCategorySlug)
            ? currentCats
            : [targetCategorySlug, ...currentCats];
          updateProduct(id, {
            category: targetCategorySlug,
            categories: updatedCats,
          });
          await syncParfumToSupabase({
            ...prod,
            category: targetCategorySlug,
            categories: updatedCats,
          });
          count++;
        }
      }
      toast.success("Catégorie mise à jour", {
        description: `${count} parfum(s) assigné(s) à la catégorie sélectionnée.`,
      });
      setBulkCategoryModalOpen(false);
      setTargetCategorySlug("");
      setSelectedIds([]);
    } catch (err: any) {
      toast.error("Erreur lors de la mise à jour groupée", {
        description: err?.message || "Une erreur est survenue.",
      });
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Action groupée 2 : Mettre en stock ou en rupture
  const handleBulkStockToggle = async (inStock: boolean) => {
    if (selectedIds.length === 0) return;
    setIsProcessingBulk(true);
    try {
      let count = 0;
      for (const id of selectedIds) {
        const prod = products.find((p) => p.id === id);
        if (prod) {
          const updates: Partial<AdminParfum> = {
            active: inStock,
            full_bottle_stock: inStock ? (prod.full_bottle_stock && prod.full_bottle_stock > 0 ? prod.full_bottle_stock : 10) : 0,
            stock_5ml: inStock ? (prod.stock_5ml && prod.stock_5ml > 0 ? prod.stock_5ml : 20) : 0,
            stock_10ml: inStock ? (prod.stock_10ml && prod.stock_10ml > 0 ? prod.stock_10ml : 20) : 0,
            stock: inStock ? (prod.stock && prod.stock > 0 ? prod.stock : 20) : 0,
          };
          updateProduct(id, updates);
          await syncParfumToSupabase({ ...prod, ...updates });
          count++;
        }
      }
      toast.success(inStock ? "Parfums remis en stock" : "Parfums mis en rupture", {
        description: `${count} parfum(s) mis à jour avec succès.`,
      });
      setSelectedIds([]);
    } catch (err: any) {
      toast.error("Erreur lors de la mise à jour du stock", {
        description: err?.message,
      });
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Action groupée 3 : Exporter la sélection en CSV
  const handleBulkExportCSV = () => {
    const selectedProds = products.filter((p) => selectedIds.includes(p.id));
    if (selectedProds.length === 0) return;

    const headers = ["ID", "Nom", "Maison", "Catégories", "Prix 5ml (MAD)", "Prix 10ml (MAD)", "Prix Flacon (MAD)", "Stock Global", "Statut"];
    const rows = selectedProds.map((p) => {
      const isPack = p.category === "packs" || p.id.startsWith("pack-") || p.name.toLowerCase().includes("pack");
      const isDeo = p.category === "deodorants-stick" || p.id.includes("deodorant") || p.id.includes("old-spice");
      const isFull = (p.sale_mode ?? "decant") === "full_bottle" || isPack || isDeo;
      const stock = isFull ? (p.full_bottle_stock ?? 0) : ((p.stock_5ml ?? 0) + (p.stock_10ml ?? 0));
      const cats = (Array.isArray(p.categories) ? p.categories : [p.category || ""]).join("; ");
      const inStock = (p.active ?? true) && stock > 0;

      return [
        `"${p.id}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.maison.replace(/"/g, '""')}"`,
        `"${cats.replace(/"/g, '""')}"`,
        p.prices?.["5ml"] ?? "",
        p.prices?.["10ml"] ?? "",
        p.full_bottle_price ?? "",
        stock,
        inStock ? "En Stock" : "Rupture",
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `maison_kenzi_parfums_selection_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export CSV téléchargé", {
      description: `${selectedProds.length} parfums exportés.`,
    });
  };

  // Action groupée 4 : Suppression groupée
  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessingBulk(true);
    try {
      let count = 0;
      for (const id of selectedIds) {
        deleteProduct(id);
        await deleteParfumFromSupabase(id);
        count++;
      }
      toast.success("Suppression groupée effectuée", {
        description: `${count} parfum(s) retiré(s) du catalogue.`,
      });
      setSelectedIds([]);
      setBulkDeleteModalOpen(false);
    } catch (err: any) {
      toast.error("Erreur de suppression groupée", {
        description: err?.message,
      });
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Liste unique des maisons existantes pour le filtre
  const uniqueMaisons = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.maison && p.maison.trim()) set.add(p.maison.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtrage et Tri combinés
  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    // 1. Filtrage
    const result = products.filter((p) => {
      // Filtre Genre
      if (genderFilter !== "Tous") {
        const pGender = (p.gender || "").toLowerCase().trim();
        if (pGender !== genderFilter.toLowerCase().trim()) return false;
      }

      // Filtre Saison
      if (seasonFilter !== "Toutes") {
        const pSeasons = getParfumSeasons(p);
        const targetSeasonNorm = seasonFilter
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
        const hasSeason = pSeasons.some(
          (s) =>
            (s || "")
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim() === targetSeasonNorm
        );
        if (!hasSeason) return false;
      }

      // Filtre catégorie dynamique
      if (categoryFilter !== "Tous") {
        if (!isParfumInCategory(p, categoryFilter)) return false;
      }

      // Filtre maison
      if (maisonFilter !== "Toutes" && p.maison !== maisonFilter) return false;

      // Filtre statut & stock
      const isPack = p.category === "packs" || p.id.startsWith("pack-") || p.name.toLowerCase().includes("pack");
      const isDeo = p.category === "deodorants-stick" || p.id.includes("deodorant") || p.id.includes("old-spice");
      const isFull = (p.sale_mode ?? "decant") === "full_bottle" || isPack || isDeo;
      const s5 = p.stock_5ml ?? 0;
      const s10 = p.stock_10ml ?? 0;
      const sFull = p.full_bottle_stock ?? 0;
      const stockTotal = isFull ? sFull : s5 + s10;
      const inStock = (p.active ?? true) && stockTotal > 0;

      if (statusFilter === "in_stock" && !inStock) return false;
      if (statusFilter === "out_of_stock" && inStock) return false;

      // Recherche textuelle
      if (q) {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesMaison = p.maison.toLowerCase().includes(q);
        const cats = getParfumCategories(p);
        const matchesCat = cats.some((c) => c.toLowerCase().includes(q)) || (p.category || "").toLowerCase().includes(q);
        if (!matchesName && !matchesMaison && !matchesCat) return false;
      }

      return true;
    });

    // 2. Tri
    result.sort((a, b) => {
      const getPrice = (p: AdminParfum) => {
        if (p.sale_mode === "full_bottle") return p.full_bottle_price ?? p.prices["5ml"] ?? 0;
        return p.prices["5ml"] ?? p.full_bottle_price ?? 0;
      };

      const getStock = (p: AdminParfum) => {
        const isPack = p.category === "packs" || p.id.startsWith("pack-") || p.name.toLowerCase().includes("pack");
        const isDeo = p.category === "deodorants-stick" || p.id.includes("deodorant") || p.id.includes("old-spice");
        const isFull = (p.sale_mode ?? "decant") === "full_bottle" || isPack || isDeo;
        return isFull ? (p.full_bottle_stock ?? 0) : ((p.stock_5ml ?? 0) + (p.stock_10ml ?? 0));
      };

      if (sortOption === "name_asc") return a.name.localeCompare(b.name);
      if (sortOption === "name_desc") return b.name.localeCompare(a.name);
      if (sortOption === "maison_asc") return a.maison.localeCompare(b.maison);
      if (sortOption === "price_asc") return getPrice(a) - getPrice(b);
      if (sortOption === "price_desc") return getPrice(b) - getPrice(a);
      if (sortOption === "stock_asc") return getStock(a) - getStock(b);
      if (sortOption === "stock_desc") return getStock(b) - getStock(a);
      return 0;
    });

    return result;
  }, [products, search, genderFilter, seasonFilter, categoryFilter, maisonFilter, statusFilter, sortOption]);

  const hasActiveFilters =
    search.trim() !== "" ||
    genderFilter !== "Tous" ||
    seasonFilter !== "Toutes" ||
    categoryFilter !== "Tous" ||
    maisonFilter !== "Toutes" ||
    statusFilter !== "Tous";

  const resetFilters = () => {
    setSearch("");
    setGenderFilter("Tous");
    setSeasonFilter("Toutes");
    setCategoryFilter("Tous");
    setMaisonFilter("Toutes");
    setStatusFilter("Tous");
    setSortOption("name_asc");
  };

  return (
    <div className="space-y-6">
      {/* Barre d'En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96E] font-medium">Catalogue & Créations</span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1A1816] dark:text-[#FAF7F2] font-medium tracking-tight mt-0.5">
            Gestion des Parfums
          </h1>
          <p className="text-xs text-[#7A726A] dark:text-[#A39B91] mt-1">
            {products.length} créations enregistrées • {filteredAndSorted.length} affichées
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Bascule Tableau / Cartes */}
          <div className="inline-flex items-center bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#E5DDD0] dark:border-[#332E28] rounded-xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => changeViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-[#1A1816] dark:bg-[#C9A96E] text-[#FAF7F2] dark:text-[#121110] font-semibold shadow-xs"
                  : "text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2]"
              }`}
              title="Affichage en Tableau"
            >
              <Table2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tableau</span>
            </button>

            <button
              type="button"
              onClick={() => changeViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-[#1A1816] dark:bg-[#C9A96E] text-[#FAF7F2] dark:text-[#121110] font-semibold shadow-xs"
                  : "text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2]"
              }`}
              title="Affichage en Grille de Cartes"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cartes</span>
            </button>
          </div>

          {/* Bouton Nouveau Produit */}
          <Button
            onClick={onAdd}
            className="rounded-xl bg-[#1A1816] hover:bg-[#2B2724] dark:bg-[#C9A96E] dark:hover:bg-[#B8985F] text-[#FAF7F2] dark:text-[#121110] text-xs font-medium uppercase tracking-[0.15em] h-10 px-5 gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Parfum</span>
          </Button>
        </div>
      </div>

      {/* Barre de Filtres & Recherche */}
      <div className="bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] p-5 rounded-2xl space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        {/* Ligne 1: Recherche & Sélecteurs (Genre, Saison, Maison, Catégorie, Statut) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Recherche */}
          <div className="relative sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C827A]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, maison de parfum…"
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#FAF7F2]/80 dark:bg-[#1C1A17]/80 border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl focus:outline-none focus:border-[#C9A96E] transition-colors text-[#1A1816] dark:text-[#F3EFEA] h-10 placeholder-[#9E958C]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#1A1816] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtre Genre */}
          <div className="relative">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-[#FAF7F2]/80 dark:bg-[#1C1A17]/80 border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#F3EFEA] h-10 cursor-pointer"
            >
              <option value="Tous">Tous les Genres</option>
              {GENDER_FILTER_OPTIONS.filter((g) => g !== "Tous").map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Saison */}
          <div className="relative">
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-[#FAF7F2]/80 dark:bg-[#1C1A17]/80 border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#F3EFEA] h-10 cursor-pointer"
            >
              <option value="Toutes">Toutes les Saisons</option>
              {SEASON_FILTER_OPTIONS.filter((s) => s !== "Toutes").map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Maison */}
          <div className="relative">
            <select
              value={maisonFilter}
              onChange={(e) => setMaisonFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-[#FAF7F2]/80 dark:bg-[#1C1A17]/80 border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#F3EFEA] h-10 cursor-pointer"
            >
              <option value="Toutes">Toutes les Maisons</option>
              {uniqueMaisons.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Catégorie */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-[#FAF7F2]/80 dark:bg-[#1C1A17]/80 border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#F3EFEA] h-10 cursor-pointer"
            >
              <option value="Tous">Toutes Catégories</option>
              {categories.map((cat) => (
                <option key={cat.id || cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ligne 2: Tri, Filtre de Statut & Réinitialisation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EAE3D8] dark:border-[#24211E] text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Statut & Disponibilité */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#8C827A] dark:text-[#9E958C] font-medium">Statut :</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="py-1 px-2.5 text-xs bg-[#FAF7F2]/80 dark:bg-[#1C1A17]/80 border border-[#E5DDD0] dark:border-[#2D2A26] rounded-lg focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#F3EFEA] font-medium cursor-pointer"
              >
                <option value="Tous">Tous les Statuts</option>
                <option value="in_stock">En stock uniquement</option>
                <option value="out_of_stock">Rupture de stock</option>
              </select>
            </div>

            {/* Tri */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#8C827A] dark:text-[#9E958C] flex items-center gap-1 font-medium">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#C9A96E]" /> Trier par :
              </span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="py-1 px-3 text-xs bg-[#FAF7F2]/80 dark:bg-[#1C1A17]/80 border border-[#E5DDD0] dark:border-[#2D2A26] rounded-lg focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#F3EFEA] font-medium cursor-pointer"
              >
                <option value="name_asc">Nom (A → Z)</option>
                <option value="name_desc">Nom (Z → A)</option>
                <option value="maison_asc">Maison (A → Z)</option>
                <option value="price_asc">Prix Vente (Croissant)</option>
                <option value="price_desc">Prix Vente (Décroissant)</option>
                <option value="stock_desc">Stock Total (Plus élevé)</option>
                <option value="stock_asc">Stock Total (Plus faible)</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-[#C9A96E] hover:text-[#B8985F] font-semibold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>
      </div>

      {/* Barre d'Actions Groupées Flottante */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-30 bg-[#1A1816] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1A1816] p-4 rounded-2xl shadow-2xl border border-[#C9A96E]/40 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C9A96E] animate-pulse" />
              <span className="font-semibold text-xs sm:text-sm tracking-wide">
                {selectedIds.length} parfum{selectedIds.length > 1 ? "s" : ""} sélectionné{selectedIds.length > 1 ? "s" : ""}
              </span>
            </div>
            <button
              type="button"
              onClick={deselectAll}
              className="text-xs text-[#C9A96E] hover:underline cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Désélectionner</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Changer de Catégorie */}
            <Button
              type="button"
              onClick={() => setBulkCategoryModalOpen(true)}
              variant="outline"
              size="sm"
              className="h-8 text-xs bg-white/10 dark:bg-black/10 border-white/20 dark:border-black/20 text-[#FAF7F2] dark:text-[#1A1816] hover:bg-white/20 gap-1.5 cursor-pointer rounded-xl"
            >
              <FolderTree className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span>Changer Catégorie</span>
            </Button>

            {/* Mettre en Stock */}
            <Button
              type="button"
              onClick={() => handleBulkStockToggle(true)}
              disabled={isProcessingBulk}
              variant="outline"
              size="sm"
              className="h-8 text-xs bg-emerald-500/20 border-emerald-500/40 text-emerald-300 dark:text-emerald-700 hover:bg-emerald-500/30 gap-1.5 cursor-pointer rounded-xl"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>En Stock</span>
            </Button>

            {/* Mettre en Rupture */}
            <Button
              type="button"
              onClick={() => handleBulkStockToggle(false)}
              disabled={isProcessingBulk}
              variant="outline"
              size="sm"
              className="h-8 text-xs bg-amber-500/20 border-amber-500/40 text-amber-300 dark:text-amber-700 hover:bg-amber-500/30 gap-1.5 cursor-pointer rounded-xl"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Rupture</span>
            </Button>

            {/* Exporter CSV */}
            <Button
              type="button"
              onClick={handleBulkExportCSV}
              variant="outline"
              size="sm"
              className="h-8 text-xs bg-white/10 dark:bg-black/10 border-white/20 dark:border-black/20 text-[#FAF7F2] dark:text-[#1A1816] hover:bg-white/20 gap-1.5 cursor-pointer rounded-xl"
            >
              <Download className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span>Exporter CSV</span>
            </Button>

            {/* Supprimer */}
            <Button
              type="button"
              onClick={() => setBulkDeleteModalOpen(true)}
              disabled={isProcessingBulk}
              size="sm"
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white gap-1.5 cursor-pointer rounded-xl"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer</span>
            </Button>
          </div>
        </div>
      )}

      {/* Tableau principal ou grille de cartes */}
      <ProductTable
        products={filteredAndSorted}
        viewMode={viewMode}
        onEdit={onEdit}
        onDelete={onDelete}
        sortBy={sortOption}
        onSortChange={handleSortHeader}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onSelectAll={selectAll}
        isAllSelected={isAllSelected}
      />

      {/* Modale d'ajout / modification de parfum */}
      <ProductModal open={modalOpen} onOpenChange={setModalOpen} initial={editingProduct} />

      {/* Modale de confirmation de suppression unitaire */}
      <DeleteDialog
        open={!!deletingProduct}
        onOpenChange={(o) => !o && setDeletingProduct(null)}
        onConfirm={confirmDelete}
        productName={deletingProduct?.name}
      />

      {/* Modale de changement groupé de catégorie */}
      <Dialog open={bulkCategoryModalOpen} onOpenChange={setBulkCategoryModalOpen}>
        <DialogContent className="max-w-md bg-card border border-border/80 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" />
              <span>Changer la catégorie des parfums</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Sélectionnez la catégorie à attribuer aux {selectedIds.length} parfums sélectionnés.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <label className="text-xs font-semibold text-foreground block">
              Nouvelle Catégorie Cible :
            </label>
            <select
              value={targetCategorySlug}
              onChange={(e) => setTargetCategorySlug(e.target.value)}
              className="w-full py-2.5 px-3.5 text-xs sm:text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary text-foreground cursor-pointer"
            >
              <option value="">-- Choisir une catégorie --</option>
              {categories.map((c) => (
                <option key={c.id || c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkCategoryModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleBulkCategoryChange}
              disabled={!targetCategorySlug || isProcessingBulk}
              className="rounded-xl bg-primary text-primary-foreground text-xs gap-2"
            >
              {isProcessingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Appliquer à la sélection</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale de confirmation de suppression groupée */}
      <AlertDialog open={bulkDeleteModalOpen} onOpenChange={setBulkDeleteModalOpen}>
        <AlertDialogContent className="max-w-md bg-card border border-border/80 rounded-3xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Supprimer {selectedIds.length} parfum(s) ?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-2">
              <p>
                Cette action retirera définitivement les {selectedIds.length} parfums sélectionnés du catalogue et de la base de données.
              </p>
              <p className="font-semibold text-destructive">
                Attention : Cette suppression est irréversible.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex items-center justify-end gap-2 pt-3">
            <AlertDialogCancel className="rounded-xl text-xs">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={isProcessingBulk}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs gap-2"
            >
              {isProcessingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Confirmer la suppression</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Produits;

