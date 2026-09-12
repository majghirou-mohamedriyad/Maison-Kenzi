/**
 * Page d'Administration des Catégories & Univers — Maison Kenzi
 *
 * Interface de consultation, filtrage, création, modification
 * et suppression des univers et collections olfactives avec vue tableau ou cartes.
 * Design aligné sur les standards Haute Parfumerie de la Gestion des Parfums.
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
  Table2,
  LayoutGrid,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  Star,
} from "lucide-react";
import {
  useCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  type AdminCategory,
} from "@/store/useCategoryStore";
import { useProducts } from "@/store/useProductStore";
import { isParfumInCategory } from "@/lib/productCategories";
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
import { toast } from "sonner";
import { uploadProductImage } from "@/admin/lib/syncParfum";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type StatusFilter = "Tous" | "active" | "inactive" | "coming_soon";
type SortOption = "name_asc" | "name_desc" | "products_asc" | "products_desc" | "status";

const CategoriesAdmin = () => {
  const categories = useCategories();
  const products = useProducts();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Tous");
  const [sortOption, setSortOption] = useState<SortOption>("name_asc");

  // Mémorisation du mode d'affichage (Tableau ou Grille de cartes)
  const [viewMode, setViewMode] = useState<"table" | "grid">(() => {
    try {
      const saved = localStorage.getItem("mk_admin_category_view_mode");
      if (saved === "grid" || saved === "table") return saved;
    } catch {}
    return "table";
  });

  const changeViewMode = (mode: "table" | "grid") => {
    setViewMode(mode);
    try {
      localStorage.setItem("mk_admin_category_view_mode", mode);
    } catch {}
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<AdminCategory | null>(null);
  const [deletingCat, setDeletingCat] = useState<AdminCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [gender, setGender] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Product counts per category slug or gender
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      counts[cat.slug] = products.filter((p) => isParfumInCategory(p, cat.slug)).length;
    });
    return counts;
  }, [categories, products]);

  const handleSortHeader = (field: "name" | "products" | "status") => {
    if (field === "name") {
      setSortOption((prev) => (prev === "name_asc" ? "name_desc" : "name_asc"));
    } else if (field === "products") {
      setSortOption((prev) => (prev === "products_desc" ? "products_asc" : "products_desc"));
    } else if (field === "status") {
      setSortOption("status");
    }
  };

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    // 1. Filtrage
    const result = categories.filter((c) => {
      // Filtre Statut
      if (statusFilter === "active" && !c.is_active) return false;
      if (statusFilter === "inactive" && c.is_active) return false;
      if (statusFilter === "coming_soon" && !c.is_coming_soon) return false;

      // Recherche textuelle globale
      if (q) {
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesSlug = c.slug.toLowerCase().includes(q);
        const matchesDesc = (c.description || "").toLowerCase().includes(q);
        if (!matchesName && !matchesSlug && !matchesDesc) return false;
      }

      return true;
    });

    // 2. Tri
    result.sort((a, b) => {
      const countA = categoryStats[a.slug] ?? 0;
      const countB = categoryStats[b.slug] ?? 0;

      if (sortOption === "name_asc") return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
      if (sortOption === "name_desc") return b.name.localeCompare(a.name, "fr", { sensitivity: "base" });
      if (sortOption === "products_asc") return countA - countB;
      if (sortOption === "products_desc") return countB - countA;
      if (sortOption === "status") {
        const scoreA = (a.is_active ? 2 : 0) + (a.is_coming_soon ? 1 : 0);
        const scoreB = (b.is_active ? 2 : 0) + (b.is_coming_soon ? 1 : 0);
        return scoreB - scoreA;
      }
      return 0;
    });

    return result;
  }, [categories, search, statusFilter, sortOption, categoryStats]);

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "Tous";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("Tous");
    setSortOption("name_asc");
  };

  const openAddModal = () => {
    setEditingCat(null);
    setName("");
    setSlug("");
    setDescription("");
    setImages([]);
    setUrlInput("");
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
    setDescription(cat.description || "");
    const initialImages =
      cat.images && cat.images.length > 0
        ? cat.images
        : cat.image || cat.icon
        ? [cat.image || cat.icon!]
        : [];
    setImages(initialImages);
    setUrlInput("");
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

  const handleMultipleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const validFiles: File[] = [];

    for (const file of fileList) {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" n'est pas un fichier image valide.`);
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`"${file.name}" dépasse la limite de 8 Mo.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(`0 / ${validFiles.length}`);

    const uploadedUrls: string[] = [];
    const targetId = editingCat?.id || slug || `category-${Date.now()}`;

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress(`${i + 1} / ${validFiles.length}`);
        const url = await uploadProductImage(targetId, file);
        if (url) {
          uploadedUrls.push(url);
        }
      }

      if (uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls]);
        toast.success(
          uploadedUrls.length === 1
            ? "1 photo de bannière ajoutée"
            : `${uploadedUrls.length} photos de bannières ajoutées`
        );
      }
    } catch {
      toast.error("Erreur lors du téléversement des images");
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetPrimaryImage = (indexToMakePrimary: number) => {
    if (indexToMakePrimary === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(indexToMakePrimary, 1);
      return [item, ...copy];
    });
    toast.success("Photo définie comme bannière principale");
  };

  const handleAddImageUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (images.includes(trimmed)) {
      toast.error("Cette image est déjà dans la liste.");
      return;
    }
    setImages((prev) => [...prev, trimmed]);
    setUrlInput("");
    toast.success("Image ajoutée");
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
    const primaryImage = images.length > 0 ? images[0] : undefined;

    try {
      if (editingCat) {
        const res = await updateCategory(editingCat.id, {
          name: name.trim(),
          slug: finalSlug,
          description: description.trim(),
          image: primaryImage,
          icon: primaryImage,
          images: images,
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
          image: primaryImage,
          icon: primaryImage,
          images: images,
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
      {/* Barre d'En-tête Identique à Gestion des Parfums */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96E] font-medium">
            Univers & Collections
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#1A1816] dark:text-[#FAF7F2] font-medium tracking-tight mt-0.5">
            Gestion des Catégories
          </h1>
          <p className="text-xs text-[#7A726A] dark:text-[#A39B91] mt-1">
            {categories.length} univers enregistrés • {filteredAndSorted.length} affichés
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

          {/* Bouton Nouvelle Catégorie */}
          <Button
            onClick={openAddModal}
            className="rounded-xl bg-[#1A1816] hover:bg-[#2B2724] dark:bg-[#C9A96E] dark:hover:bg-[#B8985F] text-[#FAF7F2] dark:text-[#121110] text-xs font-medium uppercase tracking-[0.15em] h-10 px-5 gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Catégorie</span>
          </Button>
        </div>
      </div>

      {/* Barre de Filtres & Recherche */}
      <div className="bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] p-5 rounded-2xl space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Recherche */}
          <div className="relative sm:col-span-2 md:col-span-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C827A]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, univers olfactif ou description…"
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

          {/* Filtre Statut */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full py-2 px-3 text-xs bg-[#FAF7F2]/80 dark:bg-[#1C1A17]/80 border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#F3EFEA] h-10 cursor-pointer"
            >
              <option value="Tous">Tous les Statuts</option>
              <option value="active">Actives uniquement</option>
              <option value="coming_soon">À venir uniquement</option>
              <option value="inactive">Masquées</option>
            </select>
          </div>
        </div>

        {/* Ligne 2 : Filtres Actifs & Réinitialisation */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#EAE3D8] dark:border-[#24211E] text-xs text-[#7A726A] dark:text-[#A39B91]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-[#1A1816] dark:text-[#FAF7F2]">Filtres actifs :</span>
              {search && (
                <span className="inline-flex items-center gap-1 bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#E5DDD0] dark:border-[#332E28] px-2.5 py-1 rounded-full text-[11px] text-[#1A1816] dark:text-[#FAF7F2]">
                  Recherche : « {search} »
                  <button onClick={() => setSearch("")} className="hover:text-red-500 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter !== "Tous" && (
                <span className="inline-flex items-center gap-1 bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#E5DDD0] dark:border-[#332E28] px-2.5 py-1 rounded-full text-[11px] text-[#1A1816] dark:text-[#FAF7F2]">
                  Statut : {statusFilter === "active" ? "Actives" : statusFilter === "coming_soon" ? "À venir" : "Masquées"}
                  <button onClick={() => setStatusFilter("Tous")} className="hover:text-red-500 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              onClick={resetFilters}
              className="text-[#C9A96E] hover:underline font-medium cursor-pointer ml-auto text-xs"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        )}
      </div>

      {/* Vue 1: GRILLE DE CARTES */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSorted.map((cat) => {
            const count = categoryStats[cat.slug] ?? 0;
            const catImg = cat.image || cat.icon;

            return (
              <div
                key={cat.id || cat.slug}
                className="group relative bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] hover:border-[#C9A96E]/50 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Visuel & Statut */}
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#E5DDD0] dark:border-[#2D2A26] mb-3">
                    {catImg ? (
                      <img
                        src={catImg}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#C9A96E] font-serif text-3xl font-bold bg-[#FAF7F2] dark:bg-[#1C1A18]">
                        {cat.name.charAt(0)}
                      </div>
                    )}

                    {/* Badge Statut */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md border ${
                          cat.is_active
                            ? "bg-emerald-500/90 text-white border-emerald-400/40"
                            : "bg-stone-500/90 text-white border-stone-400/40"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cat.is_active ? "bg-white" : "bg-white/60"}`} />
                        {cat.is_active ? "Actif" : "Masqué"}
                      </span>

                      {cat.is_coming_soon && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md bg-[#C9A96E]/90 text-[#121110] border border-[#C9A96E]/40">
                          <Clock className="w-2.5 h-2.5" /> À venir
                        </span>
                      )}

                      {cat.images && cat.images.length > 1 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md bg-[#1A1816]/80 text-[#FAF7F2] border border-white/20">
                          <Layers className="w-2.5 h-2.5 text-[#C9A96E]" /> {cat.images.length} photos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Titre & Description */}
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-base font-bold text-[#1A1816] dark:text-[#FAF7F2] truncate" title={cat.name}>
                      {cat.name}
                    </h3>
                    {cat.gender && (
                      <span className="text-[9px] uppercase tracking-wider text-[#7A726A] dark:text-[#A39B91] bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#E5DDD0] dark:border-[#332E28] px-2 py-0.5 rounded-full font-medium shrink-0">
                        {cat.gender}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#7A726A] dark:text-[#A39B91] line-clamp-2 mt-1 min-h-[2rem]">
                    {cat.description || "Aucune description renseignée."}
                  </p>
                </div>

                {/* Pied de Carte : Compteur & Actions */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#EAE3D8] dark:border-[#24211E]">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/20">
                    {count} parfum{count > 1 ? "s" : ""}
                  </span>

                  <div className="flex items-center gap-1">
                    <a
                      href={`/collection/${cat.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#7A726A] dark:text-[#A39B91] hover:text-[#C9A96E] transition-colors"
                      title="Voir sur la boutique"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2] transition-colors cursor-pointer"
                      title="Modifier"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCat(cat)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#7A726A] dark:text-[#A39B91] hover:text-red-500 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vue 2: TABLEAU DE LUXE */
        <div className="bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#FAF7F2]/80 dark:bg-[#1C1A17]/80 text-[#7A726A] dark:text-[#A39B91] text-[10px] uppercase tracking-wider border-b border-[#EAE3D8] dark:border-[#24211E] font-bold">
                <tr>
                  <th className="text-left px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleSortHeader("name")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#1A1816] dark:hover:text-[#FAF7F2] transition-colors cursor-pointer"
                    >
                      <span>Catégorie</span>
                      {sortOption === "name_asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-[#C9A96E]" />
                      ) : sortOption === "name_desc" ? (
                        <ArrowDown className="w-3.5 h-3.5 text-[#C9A96E]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#7A726A]/50 group-hover:text-[#1A1816]" />
                      )}
                    </button>
                  </th>

                  <th className="text-left px-5 py-3.5">Description</th>

                  <th className="text-center px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleSortHeader("products")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#1A1816] dark:hover:text-[#FAF7F2] transition-colors cursor-pointer mx-auto"
                    >
                      <span>Produits</span>
                      {sortOption === "products_asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-[#C9A96E]" />
                      ) : sortOption === "products_desc" ? (
                        <ArrowDown className="w-3.5 h-3.5 text-[#C9A96E]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#7A726A]/50 group-hover:text-[#1A1816]" />
                      )}
                    </button>
                  </th>

                  <th className="text-center px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleSortHeader("status")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#1A1816] dark:hover:text-[#FAF7F2] transition-colors cursor-pointer mx-auto"
                    >
                      <span>Statut</span>
                      {sortOption === "status" ? (
                        <ArrowDown className="w-3.5 h-3.5 text-[#C9A96E]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#7A726A]/50 group-hover:text-[#1A1816]" />
                      )}
                    </button>
                  </th>

                  <th className="text-right px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D8]/60 dark:divide-[#24211E]/60">
                {filteredAndSorted.map((cat, idx) => {
                  const count = categoryStats[cat.slug] ?? 0;
                  const catImg = cat.image || cat.icon;
                  const bannerCount = cat.images && cat.images.length > 0 ? cat.images.length : (cat.image || cat.icon ? 1 : 0);
                  return (
                    <tr
                      key={cat.id || cat.slug || `cat-row-${idx}`}
                      className="hover:bg-[#FAF7F2]/50 dark:hover:bg-[#1C1A17]/50 transition-colors group"
                    >
                      {/* Name & Thumbnail */}
                      <td className="px-5 py-4 font-medium text-[#1A1816] dark:text-[#FAF7F2]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#E5DDD0] dark:border-[#2D2A26] bg-[#FAF7F2] dark:bg-[#1C1A18] text-[#C9A96E] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
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
                            <div className="flex items-center gap-2">
                              <span className="font-serif font-bold text-sm text-[#1A1816] dark:text-[#FAF7F2]">
                                {cat.name}
                              </span>
                              {bannerCount > 1 && (
                                <span className="inline-flex items-center gap-1 text-[9px] text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/20 px-1.5 py-0.2 rounded-md font-medium">
                                  <Layers className="w-2.5 h-2.5" /> {bannerCount}
                                </span>
                              )}
                            </div>
                            {cat.gender && (
                              <span className="text-[10px] text-[#7A726A] dark:text-[#A39B91] bg-[#FAF7F2] dark:bg-[#1C1A18] px-2 py-0.2 rounded-full border border-[#E5DDD0] dark:border-[#332E28]">
                                {cat.gender}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-4 text-[#7A726A] dark:text-[#A39B91] max-w-xs truncate">
                        {cat.description || "—"}
                      </td>

                      {/* Products Count */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/20">
                          {count} parfum{count > 1 ? "s" : ""}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              cat.is_active
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : "bg-stone-500/10 text-stone-600 dark:text-stone-400 border border-stone-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                cat.is_active ? "bg-emerald-500" : "bg-stone-400"
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
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#7A726A] dark:text-[#A39B91] hover:text-[#C9A96E] transition-colors cursor-pointer"
                            title="Voir sur la boutique"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2] transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCat(cat)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#7A726A] dark:text-[#A39B91] hover:text-red-500 transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* État Vide */}
      {filteredAndSorted.length === 0 && (
        <div className="bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] rounded-2xl p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/20 text-[#C9A96E] flex items-center justify-center mx-auto">
            <FolderTree className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#1A1816] dark:text-[#FAF7F2]">
            Aucune catégorie trouvée
          </h3>
          <p className="text-xs text-[#7A726A] dark:text-[#A39B91]">
            {hasActiveFilters
              ? "Aucune catégorie ne correspond à vos filtres de recherche actuels."
              : "Commencez par créer votre première catégorie ou univers olfactif."}
          </p>
          {hasActiveFilters && (
            <Button
              onClick={resetFilters}
              variant="outline"
              className="mt-2 text-xs rounded-xl border-[#C9A96E]/40 text-[#C9A96E] hover:bg-[#C9A96E]/10"
            >
              Effacer les filtres
            </Button>
          )}
        </div>
      )}

      {/* Modal Ajout / Édition Catégorie */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-[#FFFFFF]/95 dark:bg-[#141312]/95 backdrop-blur-xl max-w-lg w-[95vw] p-6 rounded-2xl shadow-2xl border border-[#EAE3D8] dark:border-[#24211E]">
          <DialogHeader className="pb-3 border-b border-[#EAE3D8] dark:border-[#24211E]">
            <DialogTitle className="text-base sm:text-lg font-serif font-bold text-[#1A1816] dark:text-[#FAF7F2] flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-[#C9A96E]" />
              <span>{editingCat ? "Modifier la catégorie" : "Ajouter une nouvelle catégorie"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#7A726A] dark:text-[#A39B91] mt-1 text-left">
              {editingCat
                ? "Modifiez les informations et l'univers olfactif de cette catégorie."
                : "Configurez un nouvel univers olfactif pour organiser vos créations de niche."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-[#1A1816] dark:text-[#FAF7F2] mb-1">
                Nom de la catégorie *
              </label>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Parfums d'Exception"
                className={`w-full px-3 py-2 text-xs bg-[#FAF7F2]/80 dark:bg-[#1C1A18]/80 border rounded-xl focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#FAF7F2] ${
                  errors.name ? "border-red-500 bg-red-50/50" : "border-[#E5DDD0] dark:border-[#2D2A26]"
                }`}
              />
              {errors.name && (
                <div className="flex items-center gap-1 text-xs text-red-500 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            {/* Multi-Photos de bannières de la catégorie */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#1A1816] dark:text-[#FAF7F2]">
                  Photos de bannières ({images.length})
                </label>
                <span className="text-[10px] text-[#7A726A] dark:text-[#A39B91]">
                  Recommandé : 1920 × 600 px ou 1200 × 800 px
                </span>
              </div>

              {/* Galerie des vignettes existantes */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-2 border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl bg-[#FAF7F2]/50 dark:bg-[#1C1A18]/50">
                  {images.map((imgUrl, index) => (
                    <div
                      key={`${imgUrl}-${index}`}
                      className="group relative aspect-[16/10] rounded-lg overflow-hidden border border-[#E5DDD0] dark:border-[#2D2A26] bg-black/5"
                    >
                      <img
                        src={imgUrl}
                        alt={`Bannière ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Badge Ordre / Principale */}
                      <div className="absolute top-1.5 left-1.5">
                        {index === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#C9A96E] text-[#121110] shadow-xs">
                            <Star className="w-2.5 h-2.5 fill-current" /> Principale
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                            #{index + 1}
                          </span>
                        )}
                      </div>

                      {/* Boutons d'action au survol */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                        {index !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(index)}
                            className="p-1.5 bg-white/95 text-[#1A1816] rounded-md hover:bg-[#C9A96E] hover:text-[#121110] transition-colors cursor-pointer"
                            title="Définir comme bannière principale"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer"
                          title="Supprimer cette photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Zone d'importation multi-fichiers */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E5DDD0] dark:border-[#2D2A26] hover:border-[#C9A96E]/60 rounded-xl p-3.5 sm:p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#FAF7F2]/50 dark:hover:bg-[#1C1A18]/50 transition-all group"
              >
                <div className="w-9 h-9 rounded-full bg-[#C9A96E]/10 text-[#C9A96E] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </div>
                <p className="text-xs font-semibold text-[#1A1816] dark:text-[#FAF7F2]">
                  {uploading
                    ? `Téléversement (${uploadProgress})...`
                    : images.length === 0
                    ? "Cliquez pour importer une ou plusieurs photos de bannière"
                    : "Ajouter d'autres photos de bannière"}
                </p>
                <p className="text-[10px] text-[#7A726A] dark:text-[#A39B91] mt-0.5">
                  Sélection multiple autorisée (PNG, JPG, WebP max 8 Mo)
                </p>
              </div>

              {/* Champ d'ajout direct par URL */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  placeholder="Ou collez une URL d'image (ex: https://...)"
                  className="flex-1 px-3 py-1.5 text-xs bg-[#FAF7F2]/80 dark:bg-[#1C1A18]/80 border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#FAF7F2] placeholder-[#9E958C]"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={!urlInput.trim()}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl bg-[#1A1816] hover:bg-[#2B2724] dark:bg-[#C9A96E] dark:hover:bg-[#B8985F] text-[#FAF7F2] dark:text-[#121110] disabled:opacity-40 transition-all cursor-pointer"
                >
                  Ajouter
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={handleMultipleFilesChange}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1816] dark:text-[#FAF7F2] mb-1">
                Description de la collection
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez l'univers olfactif de cette catégorie..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2]/80 dark:bg-[#1C1A18]/80 border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#FAF7F2] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#E5DDD0] dark:border-[#2D2A26] cursor-pointer select-none">
                <div>
                  <div className="text-xs font-semibold text-[#1A1816] dark:text-[#FAF7F2]">Catégorie active</div>
                  <div className="text-[10px] text-[#7A726A] dark:text-[#A39B91]">Visible sur la boutique</div>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#C9A96E]/30 bg-[#C9A96E]/5 cursor-pointer select-none">
                <div>
                  <div className="text-xs font-semibold text-[#1A1816] dark:text-[#FAF7F2] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>À venir / Teaser</span>
                  </div>
                  <div className="text-[10px] text-[#7A726A] dark:text-[#A39B91]">Bientôt disponible</div>
                </div>
                <Switch checked={isComingSoon} onCheckedChange={setIsComingSoon} />
              </label>
            </div>

            <DialogFooter className="gap-2 pt-3 border-t border-[#EAE3D8] dark:border-[#24211E]">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-[#E5DDD0] dark:border-[#332E28] text-[#1A1816] dark:text-[#FAF7F2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
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

      {/* Modale de Confirmation de Suppression de Luxe */}
      <AlertDialog open={!!deletingCat} onOpenChange={(o) => !o && setDeletingCat(null)}>
        <AlertDialogContent className="bg-[#FFFFFF]/95 dark:bg-[#141312]/95 backdrop-blur-xl border border-[#EAE3D8] dark:border-[#24211E] rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md">
          <AlertDialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto sm:mx-0">
              <Trash2 className="w-5 h-5 stroke-[1.75]" />
            </div>
            <AlertDialogTitle className="font-serif text-xl font-medium text-[#1A1816] dark:text-[#FAF7F2]">
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#7A726A] dark:text-[#A39B91] leading-relaxed">
              Êtes-vous certain de vouloir supprimer la catégorie <strong className="text-[#1A1816] dark:text-[#FAF7F2] font-semibold">{deletingCat?.name}</strong> de la boutique Maison Kenzi ?
              <br />
              <span className="text-rose-600 dark:text-rose-400 mt-1 block">
                Cette action est irréversible.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2 sm:gap-3">
            <AlertDialogCancel className="rounded-xl border border-[#E5DDD0] dark:border-[#332E28] bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[#4A453E] dark:text-[#D1C9BF] text-xs font-medium px-4 py-2.5 cursor-pointer">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium px-5 py-2.5 shadow-sm cursor-pointer"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesAdmin;
