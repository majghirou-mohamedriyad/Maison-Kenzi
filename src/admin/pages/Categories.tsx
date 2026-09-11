/**
 * Page d'Administration des Catégories & Univers — Maison Kenzi
 *
 * Permet la création, modification, réorganisation et suppression des catégories olfactives.
 * Synchronisation bidirectionnelle avec Supabase et le store réactif externe.
 */

import { useState, useMemo, useRef } from "react";
import {
  FolderTree,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Loader2,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  RotateCcw,
} from "lucide-react";
import {
  useCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  type AdminCategory,
} from "@/store/useCategoryStore";
import { useProducts } from "@/store/useProductStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { uploadProductImage } from "@/admin/lib/syncParfum";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const CategoriesAdmin = () => {
  const categories = useCategories();
  const products = useProducts();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<AdminCategory | null>(null);
  const [deletingCat, setDeletingCat] = useState<AdminCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Column Filters State (Sélecteurs dédiés par colonne)
  const [genderFilter, setGenderFilter] = useState<string>("Tous");
  const [productsFilter, setProductsFilter] = useState<string>("Tous");
  const [statusFilter, setStatusFilter] = useState<string>("Tous");

  // Column Sorting State
  type SortField = "name" | "description" | "products" | "status" | "default";
  type SortDirection = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("default");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [gender, setGender] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Product counts per category slug or gender
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      counts[cat.slug] = products.filter((p) => {
        if (cat.slug === "homme") return p.gender === "Homme";
        if (cat.slug === "femme") return p.gender === "Femme";
        if (cat.slug === "mixte") return p.gender === "Mixte";
        if (cat.slug === "deodorants-stick") return p.category === "deodorants-stick";
        if (cat.slug === "packs") return p.category === "packs";
        return p.category === cat.slug;
      }).length;
    });
    return counts;
  }, [categories, products]);

  const hasActiveFilters = Boolean(
    search.trim() ||
    genderFilter !== "Tous" ||
    productsFilter !== "Tous" ||
    statusFilter !== "Tous" ||
    sortField !== "default"
  );

  const resetAllFilters = () => {
    setSearch("");
    setGenderFilter("Tous");
    setProductsFilter("Tous");
    setStatusFilter("Tous");
    setSortField("default");
    setSortDirection("asc");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField("default");
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredCategories = useMemo(() => {
    let list = categories.filter((c) => {
      // 1. Recherche globale rapide (nom, slug, description)
      const qGlobal = search.trim().toLowerCase();
      if (qGlobal) {
        const matchGlobal =
          c.name.toLowerCase().includes(qGlobal) ||
          c.slug.toLowerCase().includes(qGlobal) ||
          (c.description && c.description.toLowerCase().includes(qGlobal));
        if (!matchGlobal) return false;
      }

      // 2. Filtre colonne Genre
      if (genderFilter !== "Tous") {
        if (genderFilter === "Sans genre") {
          if (c.gender) return false;
        } else {
          if ((c.gender || "").toLowerCase() !== genderFilter.toLowerCase()) return false;
        }
      }

      // 3. Filtre colonne Nombre de produits
      const count = categoryStats[c.slug] ?? 0;
      if (productsFilter === "with_products" && count === 0) return false;
      if (productsFilter === "no_products" && count > 0) return false;

      // 4. Filtre colonne Statut
      if (statusFilter === "active" && !c.is_active) return false;
      if (statusFilter === "inactive" && c.is_active) return false;
      if (statusFilter === "coming_soon" && !c.is_coming_soon) return false;
      if (statusFilter === "ready" && (!c.is_active || c.is_coming_soon)) return false;

      return true;
    });

    // Tri par colonne
    if (sortField !== "default") {
      list = [...list].sort((a, b) => {
        let comparison = 0;
        if (sortField === "name") {
          comparison = a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
        } else if (sortField === "description") {
          comparison = (a.description || "").localeCompare(b.description || "", "fr", { sensitivity: "base" });
        } else if (sortField === "products") {
          const countA = categoryStats[a.slug] ?? 0;
          const countB = categoryStats[b.slug] ?? 0;
          comparison = countA - countB;
        } else if (sortField === "status") {
          const scoreA = (a.is_active ? 2 : 0) + (a.is_coming_soon ? 1 : 0);
          const scoreB = (b.is_active ? 2 : 0) + (b.is_coming_soon ? 1 : 0);
          comparison = scoreA - scoreB;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return list;
  }, [
    categories,
    search,
    genderFilter,
    productsFilter,
    statusFilter,
    sortField,
    sortDirection,
    categoryStats,
  ]);

  const openAddModal = () => {
    setEditingCat(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
    setGender("");
    setIsActive(true);
    setIsComingSoon(false);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (cat: AdminCategory) => {
    setEditingCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setImage(cat.image || cat.icon || "");
    setGender(cat.gender || "");
    setIsActive(cat.is_active);
    setIsComingSoon(Boolean(cat.is_coming_soon));
    setErrors({});
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(slugify(val));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image valide (PNG, JPG, WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    setUploading(true);
    try {
      const targetId = editingCat?.id || slug || `category-${Date.now()}`;
      const url = await uploadProductImage(targetId, file);
      setImage(url);
      toast.success("Image téléversée avec succès");
    } catch {
      toast.error("Erreur lors du téléversement de l'image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Veuillez renseigner le nom de la catégorie";

    const finalSlug = slug.trim() || slugify(name.trim());
    if (!finalSlug) errs.name = "Le nom doit comporter des caractères valides";

    // Vérifier les doublons de slug
    const duplicate = categories.find((c) => c.slug === finalSlug && c.id !== editingCat?.id);
    if (duplicate) {
      errs.name = "Une catégorie portant un nom similaire existe déjà";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSaving(true);
    try {
      if (editingCat) {
        const res = await updateCategory(editingCat.id, {
          name: name.trim(),
          slug: finalSlug,
          description: description.trim(),
          image: image.trim() || undefined,
          icon: image.trim() || undefined,
          gender: gender || undefined,
          is_active: isActive,
          is_coming_soon: isComingSoon,
        });

        if (res.error) {
          toast.error("Erreur lors de la mise à jour dans la base de données");
        } else {
          toast.success("Catégorie mise à jour avec succès");
        }
      } else {
        const res = await addCategory({
          name: name.trim(),
          slug: finalSlug,
          description: description.trim(),
          image: image.trim() || undefined,
          icon: image.trim() || undefined,
          gender: gender || undefined,
          is_active: isActive,
          is_coming_soon: isComingSoon,
          order_index: categories.length + 1,
        });

        if (res.error) {
          toast.error("Erreur lors de l'enregistrement dans la base de données");
        } else {
          toast.success("Nouvelle catégorie créée avec succès");
        }
      }
      setModalOpen(false);
    } catch {
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deletingCat) {
      const res = await deleteCategory(deletingCat.id);
      if (res.error) {
        toast.error("Erreur lors de la suppression dans la base de données");
      } else {
        toast.success(`Catégorie "${deletingCat.name}" supprimée`);
      }
      setDeletingCat(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary" /> Gestion des Catégories
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organisez les rayons, collections et univers olfactifs de la boutique Maison Kenzi
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111827] hover:bg-[#1F2937] dark:bg-[#C9A96E] dark:hover:bg-[#B8985F] dark:text-[#111827] text-white text-xs font-bold rounded-xl shadow-md shadow-[#C9A96E]/20 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Nouvelle Catégorie
        </button>
      </div>

      {/* Top Bar: Search, Stats & Global Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Recherche globale (nom, slug, description)..."
            className="w-full pl-10 pr-10 py-2.5 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            <strong className="text-foreground font-semibold">{filteredCategories.length}</strong> / {categories.length} catégorie{categories.length > 1 ? "s" : ""}
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl transition-colors cursor-pointer"
              title="Réinitialiser tous les filtres"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories Grid Table with Column Filters & Sorting */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 text-muted-foreground text-[10px] uppercase tracking-wider border-b border-border font-bold">
              {/* Row 1: Column Titles with Sorting */}
              <tr>
                <th className="text-left px-5 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort("name")}
                    className="group inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>Catégorie & Univers</span>
                    {sortField === "name" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/60 group-hover:text-foreground" />
                    )}
                  </button>
                </th>

                <th className="text-left px-5 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort("description")}
                    className="group inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>Description</span>
                    {sortField === "description" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/60 group-hover:text-foreground" />
                    )}
                  </button>
                </th>

                <th className="text-center px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort("products")}
                    className="group inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer mx-auto"
                  >
                    <span>Produits</span>
                    {sortField === "products" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/60 group-hover:text-foreground" />
                    )}
                  </button>
                </th>

                <th className="text-center px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort("status")}
                    className="group inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer mx-auto"
                  >
                    <span>Statut</span>
                    {sortField === "status" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground/60 group-hover:text-foreground" />
                    )}
                  </button>
                </th>

                <th className="text-right px-5 py-3">Actions</th>
              </tr>

              {/* Row 2: Column Filter Selectors (Genre, Produits, Statut) */}
              <tr className="bg-muted/30 border-t border-border/70 font-normal">
                {/* Filter: Genre de la catégorie */}
                <th className="px-5 py-2">
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-[11px] font-normal bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
                  >
                    <option value="Tous">Genre: Tous</option>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                    <option value="Mixte">Mixte</option>
                    <option value="Sans genre">Sans genre</option>
                  </select>
                </th>

                {/* Description (Pas de filtre textuel redondant) */}
                <th className="px-5 py-2 text-muted-foreground/40 font-normal text-[10px]">
                  —
                </th>

                {/* Filter: Nombre de Produits */}
                <th className="px-4 py-2 text-center">
                  <select
                    value={productsFilter}
                    onChange={(e) => setProductsFilter(e.target.value)}
                    className="w-full max-w-[130px] mx-auto px-2 py-1.5 text-[11px] font-normal bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
                  >
                    <option value="Tous">Tous</option>
                    <option value="with_products">&gt; 0 parfum</option>
                    <option value="no_products">0 parfum</option>
                  </select>
                </th>

                {/* Filter: Statut */}
                <th className="px-4 py-2 text-center">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full max-w-[130px] mx-auto px-2 py-1.5 text-[11px] font-normal bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
                  >
                    <option value="Tous">Tous</option>
                    <option value="active">Actif</option>
                    <option value="inactive">Masqué</option>
                    <option value="coming_soon">À venir</option>
                    <option value="ready">Prêt (Actif)</option>
                  </select>
                </th>

                {/* Actions / Reset */}
                <th className="px-5 py-2 text-right">
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-md transition-colors cursor-pointer"
                      title="Effacer les filtres"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Effacer</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/60 font-normal">—</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredCategories.map((cat, idx) => {
                const count = categoryStats[cat.slug] ?? 0;
                const catImg = cat.image || cat.icon;
                return (
                  <tr
                    key={cat.id || cat.slug || `cat-row-${idx}`}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Name & Thumbnail */}
                    <td className="px-5 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-border bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {catImg ? (
                            <img
                              src={catImg}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            cat.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-serif font-bold text-sm text-foreground">
                            {cat.name}
                          </div>
                          {cat.gender && (
                            <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.2 rounded-full border border-border">
                              {cat.gender}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">
                      {cat.description || "—"}
                    </td>

                    {/* Products Count */}
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {count} parfum{count > 1 ? "s" : ""}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            cat.is_active
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cat.is_active ? "bg-emerald-500" : "bg-muted-foreground"
                            }`}
                          />
                          {cat.is_active ? "Actif" : "Masqué"}
                        </span>
                        {cat.is_coming_soon && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#C9A96E]/15 text-[#C9A96E] border border-[#C9A96E]/30">
                            <Clock className="w-2.5 h-2.5" /> À venir
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/collection/${cat.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          title="Voir sur la boutique"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCat(cat)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-xs font-medium text-foreground">
                        {hasActiveFilters
                          ? "Aucune catégorie ne correspond aux critères et filtres sélectionnés."
                          : "Aucune catégorie enregistrée pour le moment."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Effacer tous les filtres</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Edit / Add Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card max-w-lg w-[95vw] p-6 rounded-2xl shadow-2xl border border-border">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="text-base sm:text-lg font-serif font-bold text-foreground flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" />
              <span>{editingCat ? "Modifier la catégorie" : "Ajouter une nouvelle catégorie"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 text-left">
              {editingCat
                ? "Modifiez les informations et l'univers olfactif de cette catégorie."
                : "Configurez un nouvel univers olfactif pour organiser vos créations de niche."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Nom de la catégorie *
              </label>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Parfums d'Exception"
                className={`w-full px-3 py-2 text-xs bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.name ? "border-red-500 bg-red-50/50" : "border-border"
                }`}
              />
              {errors.name && (
                <div className="flex items-center gap-1 text-xs text-red-500 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            {/* Image de la catégorie */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Visuel & Image de la catégorie
                </label>
                <span className="text-[10px] text-muted-foreground font-medium">
                  Recommandé : 800 × 1000 px
                </span>
              </div>

              {image ? (
                <div className="relative group rounded-xl overflow-hidden border border-border bg-muted/20 aspect-[16/9] flex items-center justify-center">
                  <img
                    src={image}
                    alt="Aperçu catégorie"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white/95 dark:bg-black/90 text-foreground text-xs font-semibold rounded-lg shadow-sm hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Remplacer
                    </button>
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-5 h-5" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {uploading ? "Téléversement en cours..." : "Cliquez pour importer la photo de collection"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 max-w-xs">
                    Dimensions recommandées : <strong>800 × 1000 px</strong> (Portrait 4:5) ou <strong>1000 × 1000 px</strong> (Carré 1:1) • PNG, JPG, WebP max 5 Mo
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Description de la collection
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez l'univers olfactif de cette catégorie..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border cursor-pointer select-none">
                <div>
                  <div className="text-xs font-semibold text-foreground">Catégorie active</div>
                  <div className="text-[10px] text-muted-foreground">Visible sur la boutique</div>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-[#C9A96E]/30 bg-[#C9A96E]/5 cursor-pointer select-none">
                <div>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>À venir / Teaser</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">Bientôt disponible</div>
                </div>
                <Switch checked={isComingSoon} onCheckedChange={setIsComingSoon} />
              </label>
            </div>

            <DialogFooter className="gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#C9A96E] to-[#b39155] text-[#111827] shadow-md shadow-[#C9A96E]/20 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {isSaving ? "Enregistrement..." : editingCat ? "Mettre à jour" : "Créer la catégorie"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingCat} onOpenChange={(o) => !o && setDeletingCat(null)}>
        <DialogContent className="bg-card max-w-sm w-[95vw] p-6 rounded-2xl shadow-2xl border border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-serif font-bold text-foreground">
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground my-2">
              Êtes-vous sûr de vouloir supprimer la catégorie <strong className="text-foreground">{deletingCat?.name}</strong> ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeletingCat(null)}
              className="px-3.5 py-1.5 text-xs rounded-xl border border-border hover:bg-muted"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-sm"
            >
              Supprimer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesAdmin;
