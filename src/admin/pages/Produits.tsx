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
} from "lucide-react";
import ProductTable from "../components/ProductTable";
import ProductModal from "../components/ProductModal";
import DeleteDialog from "../components/DeleteDialog";
import { deleteProduct, useProducts, type AdminParfum } from "@/store/useProductStore";
import { deleteParfumFromSupabase } from "@/admin/lib/syncParfum";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type FilterCategory = "Tous" | "Homme" | "Femme" | "Mixte" | "packs" | "deodorants-stick" | "full_bottle";
type StatusFilter = "Tous" | "in_stock" | "out_of_stock";
type SortOption = "name_asc" | "name_desc" | "maison_asc" | "price_asc" | "price_desc" | "stock_asc" | "stock_desc";

const Produits = () => {
  const products = useProducts();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("Tous");
  const [maisonFilter, setMaisonFilter] = useState<string>("Toutes");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Tous");
  const [sortOption, setSortOption] = useState<SortOption>("name_asc");

  // Load persisted view mode from localStorage (default to 'table')
  const [viewMode, setViewMode] = useState<"table" | "grid">(() => {
    try {
      const saved = localStorage.getItem("tabat_admin_product_view_mode");
      if (saved === "grid" || saved === "table") return saved;
    } catch {}
    return "table";
  });

  const changeViewMode = (mode: "table" | "grid") => {
    setViewMode(mode);
    try {
      localStorage.setItem("tabat_admin_product_view_mode", mode);
    } catch {}
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminParfum | null>(null);
  const [deleting, setDeleting] = useState<AdminParfum | null>(null);

  // Extract unique Maisons list from current products
  const uniqueMaisons = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.maison).filter(Boolean))).sort();
    return list;
  }, [products]);

  // Handle column header sort toggles
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

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    // 1. Filtering
    const result = products.filter((p) => {
      // Category filter
      if (categoryFilter === "Homme" && p.gender !== "Homme") return false;
      if (categoryFilter === "Femme" && p.gender !== "Femme") return false;
      if (categoryFilter === "Mixte" && p.gender !== "Mixte") return false;
      if (
        categoryFilter === "packs" &&
        p.category !== "packs" &&
        !p.id.startsWith("pack-") &&
        !p.name.toLowerCase().includes("pack")
      )
        return false;
      if (
        categoryFilter === "deodorants-stick" &&
        p.category !== "deodorants-stick" &&
        !p.id.includes("deodorant") &&
        !p.id.includes("old-spice")
      )
        return false;
      if (
        categoryFilter === "full_bottle" &&
        p.sale_mode !== "full_bottle" &&
        p.category !== "deodorants-stick" &&
        p.category !== "packs"
      )
        return false;

      // Maison filter
      if (maisonFilter !== "Toutes" && p.maison !== maisonFilter) return false;

      // Status & Stock filter
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

      // Search query
      if (q) {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesMaison = p.maison.toLowerCase().includes(q);
        const matchesCat = p.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesMaison && !matchesCat) return false;
      }

      return true;
    });

    // 2. Sorting
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

  const onAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const onEdit = (p: AdminParfum) => {
    setEditing(p);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleting) {
      const id = deleting.id;
      deleteProduct(id);
      try {
        await deleteParfumFromSupabase(id);
      } catch (e) {
        console.error(e);
      }
      toast.success(`${deleting.name} supprimé avec succès`);
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card border border-border/80 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl text-foreground font-bold">
            Gestion du Catalogue Produits
          </h1>
          <p className="text-xs text-muted-foreground font-light mt-0.5">
            {products.length} produits enregistrés • {filteredAndSorted.length} affichés
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Mode Toggle: Table vs Grid Card */}
          <div className="inline-flex items-center bg-background border border-border/80 rounded-xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => changeViewMode("table")}
              className={`p-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
              title="Affichage en Tableau"
            >
              <Table2 className="w-4 h-4" />
              <span className="hidden md:inline">Tableau</span>
            </button>

            <button
              type="button"
              onClick={() => changeViewMode("grid")}
              className={`p-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
              title="Affichage en Grille de Cartes"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Cartes</span>
            </button>
          </div>

          {/* Add Product Button */}
          <Button
            onClick={onAdd}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold uppercase tracking-wider h-10 px-4 gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Produit</span>
          </Button>
        </div>
      </div>

      {/* Multi-Filters & Sorting Control Bar */}
      <div className="bg-card border border-border/80 p-4 rounded-2xl space-y-3.5 shadow-xs">
        {/* Row 1: Search & Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, maison..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-background border border-border/80 rounded-xl focus:outline-none focus:border-primary transition-colors text-foreground h-10"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Maison */}
          <div className="relative">
            <select
              value={maisonFilter}
              onChange={(e) => setMaisonFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:border-primary text-foreground h-10 cursor-pointer"
            >
              <option value="Toutes">Toutes les Maisons</option>
              {uniqueMaisons.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Catégorie */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as FilterCategory)}
              className="w-full py-2 px-3 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:border-primary text-foreground h-10 cursor-pointer"
            >
              <option value="Tous">Toutes Catégories</option>
              <option value="Homme">Parfums Homme</option>
              <option value="Femme">Parfums Femme</option>
              <option value="Mixte">Parfums Mixtes</option>
              <option value="packs">Packs & Coffrets</option>
              <option value="deodorants-stick">Déodorants Stick</option>
              <option value="full_bottle">Flacons Complets</option>
            </select>
          </div>

          {/* Filter Statut / Stock */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full py-2 px-3 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:border-primary text-foreground h-10 cursor-pointer"
            >
              <option value="Tous">Tous les Statuts</option>
              <option value="in_stock">En stock uniquement</option>
              <option value="out_of_stock">Rupture de stock</option>
            </select>
          </div>
        </div>

        {/* Row 2: Sort by Selector & Active Filter Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground flex items-center gap-1 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" /> Trier par :
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="py-1 px-2.5 text-xs bg-background border border-border/80 rounded-lg focus:outline-none focus:border-primary text-foreground font-semibold cursor-pointer"
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

          {/* Clear active filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-bold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Product Table or Card Grid */}
      <ProductTable
        products={filteredAndSorted}
        viewMode={viewMode}
        onEdit={onEdit}
        onDelete={(p) => setDeleting(p)}
        sortBy={sortOption}
        onSortChange={handleSortHeader}
      />

      {/* Product Edit / Add Modal */}
      <ProductModal open={modalOpen} onOpenChange={setModalOpen} initial={editing} />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={confirmDelete}
        productName={deleting?.name}
      />
    </div>
  );
};

export default Produits;
