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
} from "lucide-react";
import ProductTable from "../components/ProductTable";
import ProductModal from "../components/ProductModal";
import DeleteDialog from "../components/DeleteDialog";
import { deleteProduct, useProducts, type AdminParfum } from "@/store/useProductStore";
import { deleteParfumFromSupabase } from "@/admin/lib/syncParfum";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/store/useCategoryStore";

type StatusFilter = "Tous" | "in_stock" | "out_of_stock";
type SortOption = "name_asc" | "name_desc" | "maison_asc" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc";

const Produits = () => {
  const products = useProducts();
  const categories = useCategories();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("Tous");
  const [maisonFilter, setMaisonFilter] = useState<string>("Toutes");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Tous");
  const [sortOption, setSortOption] = useState<SortOption>("name_asc");

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
      // Filtre catégorie dynamique
      if (categoryFilter !== "Tous") {
        const matchesCategory = p.category === categoryFilter;
        const matchesGender = p.gender?.toLowerCase() === categoryFilter.toLowerCase();
        if (!matchesCategory && !matchesGender) return false;
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
        const matchesCat = p.category?.toLowerCase().includes(q);
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
  }, [products, search, categoryFilter, maisonFilter, statusFilter, sortOption]);

  const hasActiveFilters =
    search.trim() !== "" || categoryFilter !== "Tous" || maisonFilter !== "Toutes" || statusFilter !== "Tous";

  const resetFilters = () => {
    setSearch("");
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
        {/* Ligne 1: Recherche & Sélecteurs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Recherche */}
          <div className="relative lg:col-span-2">
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
              onChange={(e) => setCategoryFilter(e.target.value as FilterCategory)}
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

          {/* Filtre Statut / Stock */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full py-2 px-3 text-xs bg-[#FAF7F2]/80 dark:bg-[#1C1A17]/80 border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#F3EFEA] h-10 cursor-pointer"
            >
              <option value="Tous">Tous les Statuts</option>
              <option value="in_stock">En stock uniquement</option>
              <option value="out_of_stock">Rupture de stock</option>
            </select>
          </div>
        </div>

        {/* Ligne 2: Tri & Réinitialisation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EAE3D8] dark:border-[#24211E] text-xs">
          <div className="flex items-center gap-2">
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

      {/* Tableau principal ou grille de cartes */}
      <ProductTable
        products={filteredAndSorted}
        viewMode={viewMode}
        onEdit={onEdit}
        onDelete={onDelete}
        sortBy={sortOption}
        onSortChange={handleSortHeader}
      />

      {/* Modale d'ajout / modification de parfum */}
      <ProductModal open={modalOpen} onOpenChange={setModalOpen} initial={editingProduct} />

      {/* Modale de confirmation de suppression */}
      <DeleteDialog
        open={!!deletingProduct}
        onOpenChange={(o) => !o && setDeletingProduct(null)}
        onConfirm={confirmDelete}
        productName={deletingProduct?.name}
      />
    </div>
  );
};

export default Produits;

