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
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertTriangle,
  Languages,
} from "lucide-react";
import {
  useCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  type AdminCategory,
} from "@/store/useCategoryStore";
import { normalizeImageUrl } from "@/lib/productImages";
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

  // Multi-sélection des catégories
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [bulkDeleteCatModalOpen, setBulkDeleteCatModalOpen] = useState(false);

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
  const [nameEn, setNameEn] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [categoryLangTab, setCategoryLangTab] = useState<"fr" | "en">("fr");
  const [images, setImages] = useState<string[]>([]);
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

  // Gestion de la sélection multiple des catégories
  const toggleSelectCat = (id: string) => {
    setSelectedCatIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllCats = () => {
    const allIds = filteredAndSorted.map((c) => c.id || c.slug);
    if (selectedCatIds.length === allIds.length) {
      setSelectedCatIds([]);
    } else {
      setSelectedCatIds(allIds);
    }
  };

  const deselectAllCats = () => setSelectedCatIds([]);

  const isAllSelectedCats =
    filteredAndSorted.length > 0 &&
    filteredAndSorted.every((c) => selectedCatIds.includes(c.id || c.slug));

  // Action groupée 1 : Activer / Masquer
  const handleBulkActiveToggle = async (active: boolean) => {
    if (selectedCatIds.length === 0) return;
    setIsSaving(true);
    try {
      let count = 0;
      for (const id of selectedCatIds) {
        await updateCategory(id, { is_active: active });
        count++;
      }
      toast.success(active ? "Catégories activées" : "Catégories masquées", {
        description: `${count} catégorie(s) mise(s) à jour.`,
      });
      setSelectedCatIds([]);
    } catch (err: any) {
      toast.error("Erreur lors de la mise à jour groupée", {
        description: err?.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Action groupée 2 : Basculer À Venir
  const handleBulkComingSoonToggle = async (comingSoon: boolean) => {
    if (selectedCatIds.length === 0) return;
    setIsSaving(true);
    try {
      let count = 0;
      for (const id of selectedCatIds) {
        await updateCategory(id, { is_coming_soon: comingSoon });
        count++;
      }
      toast.success(comingSoon ? "Catégories marquées 'À Venir'" : "Catégories marquées 'Disponibles'", {
        description: `${count} catégorie(s) mise(s) à jour.`,
      });
      setSelectedCatIds([]);
    } catch (err: any) {
      toast.error("Erreur lors de la mise à jour groupée", {
        description: err?.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Action groupée 3 : Suppression groupée
  const handleBulkDeleteCats = async () => {
    if (selectedCatIds.length === 0) return;
    setIsSaving(true);
    try {
      let count = 0;
      for (const id of selectedCatIds) {
        await deleteCategory(id);
        count++;
      }
      toast.success("Suppression groupée effectuée", {
        description: `${count} catégorie(s) supprimée(s).`,
      });
      setSelectedCatIds([]);
      setBulkDeleteCatModalOpen(false);
    } catch (err: any) {
      toast.error("Erreur de suppression groupée", {
        description: err?.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setEditingCat(null);
    setName("");
    setNameEn("");
    setSlug("");
    setDescription("");
    setDescriptionEn("");
    setCategoryLangTab("fr");
    setImages([]);
    setGender("");
    setIsActive(true);
    setIsComingSoon(false);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (cat: AdminCategory) => {
    setEditingCat(cat);
    setName(cat.name);
    setNameEn(cat.name_en || "");
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setDescriptionEn(cat.description_en || "");
    setCategoryLangTab("fr");
    const initialImages =
      cat.images && cat.images.length > 0
        ? cat.images
        : cat.image || cat.icon
        ? [cat.image || cat.icon!]
        : [];
    setImages(initialImages);
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

  const handleMoveImage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
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
          name_en: nameEn.trim() || undefined,
          slug: finalSlug,
          description: description.trim(),
          description_en: descriptionEn.trim() || undefined,
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
          name_en: nameEn.trim() || undefined,
          slug: finalSlug,
          description: description.trim(),
          description_en: descriptionEn.trim() || undefined,
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

      {/* Barre d'Actions Groupées Flottante pour Catégories */}
      {selectedCatIds.length > 0 && (
        <div className="sticky top-4 z-30 bg-[#1A1816] dark:bg-[#FAF7F2] text-[#FAF7F2] dark:text-[#1A1816] p-4 rounded-2xl shadow-2xl border border-[#C9A96E]/40 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C9A96E] animate-pulse" />
              <span className="font-semibold text-xs sm:text-sm tracking-wide">
                {selectedCatIds.length} catégorie{selectedCatIds.length > 1 ? "s" : ""} sélectionnée{selectedCatIds.length > 1 ? "s" : ""}
              </span>
            </div>
            <button
              type="button"
              onClick={deselectAllCats}
              className="text-xs text-[#C9A96E] hover:underline cursor-pointer flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Désélectionner</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Activer */}
            <Button
              type="button"
              onClick={() => handleBulkActiveToggle(true)}
              disabled={isSaving}
              variant="outline"
              size="sm"
              className="h-8 text-xs bg-emerald-500/20 border-emerald-500/40 text-emerald-300 dark:text-emerald-700 hover:bg-emerald-500/30 gap-1.5 cursor-pointer rounded-xl"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Activer</span>
            </Button>

            {/* Masquer */}
            <Button
              type="button"
              onClick={() => handleBulkActiveToggle(false)}
              disabled={isSaving}
              variant="outline"
              size="sm"
              className="h-8 text-xs bg-stone-500/20 border-stone-500/40 text-stone-300 dark:text-stone-700 hover:bg-stone-500/30 gap-1.5 cursor-pointer rounded-xl"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Masquer</span>
            </Button>

            {/* Basculer À Venir */}
            <Button
              type="button"
              onClick={() => handleBulkComingSoonToggle(true)}
              disabled={isSaving}
              variant="outline"
              size="sm"
              className="h-8 text-xs bg-[#C9A96E]/20 border-[#C9A96E]/40 text-[#C9A96E] hover:bg-[#C9A96E]/30 gap-1.5 cursor-pointer rounded-xl"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>À Venir</span>
            </Button>

            {/* Supprimer */}
            <Button
              type="button"
              onClick={() => setBulkDeleteCatModalOpen(true)}
              disabled={isSaving}
              size="sm"
              className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white gap-1.5 cursor-pointer rounded-xl"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer</span>
            </Button>
          </div>
        </div>
      )}

      {/* Vue 1: GRILLE DE CARTES */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSorted.map((cat) => {
            const count = categoryStats[cat.slug] ?? 0;
            const rawImg = cat.image || cat.icon || (cat.images && cat.images[0]);
            const catImg = rawImg ? normalizeImageUrl(rawImg) : null;
            const isSelected = selectedCatIds.includes(cat.id || cat.slug);

            return (
              <div
                key={cat.id || cat.slug}
                className={`group relative bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border rounded-2xl p-4 transition-all duration-300 hover:shadow-lg flex flex-col justify-between ${
                  isSelected
                    ? "border-[#C9A96E] ring-2 ring-[#C9A96E]/40 bg-[#C9A96E]/[0.02]"
                    : "border-[#EAE3D8] dark:border-[#24211E] hover:border-[#C9A96E]/50"
                }`}
              >
                <div>
                  {/* Visuel & Statut */}
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#E5DDD0] dark:border-[#2D2A26] mb-3">
                    {catImg ? (
                      <img
                        src={catImg}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
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

                    {/* Checkbox Multi-Sélection */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectCat(cat.id || cat.slug);
                      }}
                      className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-md ${
                        isSelected
                          ? "bg-[#C9A96E] text-[#121110] ring-2 ring-[#C9A96E]/40"
                          : "bg-white/90 dark:bg-[#1C1A18]/90 text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] backdrop-blur-md border border-[#E5DDD0] dark:border-[#2D2A26] hover:border-[#C9A96E]"
                      }`}
                      title={isSelected ? "Désélectionner cette catégorie" : "Sélectionner cette catégorie"}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
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
                  <th className="w-12 text-center px-3 py-3.5">
                    <button
                      type="button"
                      onClick={selectAllCats}
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer mx-auto ${
                        isAllSelectedCats
                          ? "bg-[#C9A96E] text-[#121110] ring-1 ring-[#C9A96E]/40"
                          : "bg-white dark:bg-[#1C1A18] border border-[#E5DDD0] dark:border-[#2D2A26] text-[#7A726A] hover:border-[#C9A96E]"
                      }`}
                      title={isAllSelectedCats ? "Tout désélectionner" : "Tout sélectionner"}
                    >
                      {isAllSelectedCats ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    </button>
                  </th>

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
                  const rawImg = cat.image || cat.icon || (cat.images && cat.images[0]);
                  const catImg = rawImg ? normalizeImageUrl(rawImg) : null;
                  const bannerCount = cat.images && cat.images.length > 0 ? cat.images.length : (cat.image || cat.icon ? 1 : 0);
                  const isSelected = selectedCatIds.includes(cat.id || cat.slug);

                  return (
                    <tr
                      key={cat.id || cat.slug || `cat-row-${idx}`}
                      className={`transition-colors group ${
                        isSelected
                          ? "bg-[#C9A96E]/[0.05] dark:bg-[#C9A96E]/[0.1]"
                          : "hover:bg-[#FAF7F2]/50 dark:hover:bg-[#1C1A17]/50"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="text-center px-3 py-4">
                        <button
                          type="button"
                          onClick={() => toggleSelectCat(cat.id || cat.slug)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer mx-auto ${
                            isSelected
                              ? "bg-[#C9A96E] text-[#121110] ring-1 ring-[#C9A96E]/40"
                              : "bg-white dark:bg-[#1C1A18] border border-[#E5DDD0] dark:border-[#2D2A26] text-[#7A726A] hover:border-[#C9A96E]"
                          }`}
                          title={isSelected ? "Désélectionner" : "Sélectionner cette catégorie"}
                        >
                          {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      {/* Name & Thumbnail */}
                      <td className="px-5 py-4 font-medium text-[#1A1816] dark:text-[#FAF7F2]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#E5DDD0] dark:border-[#2D2A26] bg-[#FAF7F2] dark:bg-[#1C1A18] text-[#C9A96E] flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {catImg ? (
                              <img
                                src={catImg}
                                alt={cat.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
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
        <DialogContent
          className="bg-white dark:bg-[#141312] max-w-4xl lg:max-w-5xl w-[92vw] max-h-[86vh] h-auto flex flex-col p-0 overflow-hidden rounded-2xl shadow-2xl border border-[#EAE3D8] dark:border-[#24211E]"
        >
          {/* En-tête Fixe avec Actions Rapides */}
          <div className="p-3 px-4 sm:px-5 border-b border-[#EAE3D8] dark:border-[#24211E] bg-[#FAF7F2] dark:bg-[#1C1A18] shrink-0">
            <div className="flex items-center justify-between gap-3 pr-8 sm:pr-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#C9A96E]/10 border border-[#C9A96E]/20 text-[#C9A96E] flex items-center justify-center shrink-0">
                  <FolderTree className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xs sm:text-sm font-serif font-bold text-[#1A1816] dark:text-[#FAF7F2] truncate">
                    {editingCat ? "Modifier la catégorie" : "Ajouter une nouvelle catégorie"}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] text-[#7A726A] dark:text-[#A39B91] truncate">
                    {editingCat
                      ? "Modifiez les informations, univers olfactif et bannières."
                      : "Configurez un nouvel univers olfactif pour vos créations."}
                  </DialogDescription>
                </div>
              </div>

              {/* Boutons d'action rapides */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[#E5DDD0] dark:border-[#2D2A26] text-[#1A1816] dark:text-[#FAF7F2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="category-form"
                  disabled={isSaving}
                  className="px-3.5 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-[#C9A96E] to-[#b39155] text-[#111827] shadow-xs shadow-[#C9A96E]/20 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSaving ? "Enregistrement..." : editingCat ? "Mettre à jour" : "Sauvegarder"}
                </button>
              </div>
            </div>
          </div>

          {/* Corps défilant du formulaire avec min-h-0 */}
          <form id="category-form" onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Grille principale en 2 colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
              {/* COLONNE GAUCHE (7 colonnes) : Informations Générales Bilingues & Statuts */}
              <div className="lg:col-span-7 space-y-3.5">
                <div className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-4 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-3">
                  {/* Sélecteur d'onglets de Langue FR / EN */}
                  <div className="flex items-center justify-between p-1.5 rounded-xl bg-white/80 dark:bg-black/40 border border-[#E5DDD0] dark:border-[#2D2A26]">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A1816] dark:text-[#FAF7F2]">
                      <Languages className="w-3.5 h-3.5 text-[#C9A96E]" />
                      <span>Langue des contenus</span>
                    </div>
                    <div className="inline-flex p-0.5 bg-[#FAF7F2] dark:bg-[#141312] rounded-lg border border-[#E5DDD0] dark:border-[#2D2A26]">
                      <button
                        type="button"
                        onClick={() => setCategoryLangTab("fr")}
                        className={`px-2.5 py-0.5 text-[11px] font-medium rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          categoryLangTab === "fr"
                            ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] font-semibold shadow-xs"
                            : "text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2]"
                        }`}
                      >
                        <span>Français (FR)</span>
                        {name && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryLangTab("en")}
                        className={`px-2.5 py-0.5 text-[11px] font-medium rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          categoryLangTab === "en"
                            ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] font-semibold shadow-xs"
                            : "text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2]"
                        }`}
                      >
                        <span>English (EN)</span>
                        {nameEn || descriptionEn ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        ) : (
                          <span className="text-[9px] text-[#A39B91] italic">Opt.</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* CONTENU FR */}
                  {categoryLangTab === "fr" ? (
                    <div className="space-y-2.5 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1A1816] dark:text-[#FAF7F2] mb-1">
                          Nom de la catégorie (FR) *
                        </label>
                        <input
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          placeholder="Ex: Parfums d'Exception"
                          className={`w-full px-3 py-2 text-xs bg-white dark:bg-[#141312] border rounded-xl focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#FAF7F2] ${
                            errors.name ? "border-red-500 bg-red-50/50" : "border-[#E5DDD0] dark:border-[#2D2A26]"
                          }`}
                        />
                        {errors.name && (
                          <div className="flex items-center gap-1 text-[11px] text-red-500 mt-1 font-medium">
                            <AlertCircle className="w-3 h-3" />
                            <span>{errors.name}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#1A1816] dark:text-[#FAF7F2] mb-1">
                          Description de la collection (FR)
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Décrivez l'univers olfactif de cette catégorie..."
                          rows={3}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141312] border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#FAF7F2] resize-y"
                        />
                      </div>
                    </div>
                  ) : (
                    /* CONTENU EN */
                    <div className="space-y-2.5 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#1A1816] dark:text-[#FAF7F2] mb-1">
                          Category Name (EN - Optionnel)
                        </label>
                        <input
                          value={nameEn}
                          onChange={(e) => setNameEn(e.target.value)}
                          placeholder={name ? `Laisser vide pour utiliser "${name}"` : "Ex: Exclusive Fragrances"}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141312] border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#FAF7F2]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#1A1816] dark:text-[#FAF7F2] mb-1">
                          Collection Description (EN)
                        </label>
                        <textarea
                          value={descriptionEn}
                          onChange={(e) => setDescriptionEn(e.target.value)}
                          placeholder="Describe this fragrance collection in English..."
                          rows={3}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-[#141312] border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#FAF7F2] resize-y"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Paramètres de statut */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#E5DDD0] dark:border-[#2D2A26] cursor-pointer select-none">
                    <div>
                      <div className="text-xs font-semibold text-[#1A1816] dark:text-[#FAF7F2]">Catégorie active</div>
                      <div className="text-[10px] text-[#7A726A] dark:text-[#A39B91]">Visible sur la boutique</div>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#C9A96E]/30 bg-[#C9A96E]/5 cursor-pointer select-none">
                    <div>
                      <div className="text-xs font-semibold text-[#1A1816] dark:text-[#FAF7F2] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#C9A96E]" />
                        <span>À venir / Teaser</span>
                      </div>
                      <div className="text-[10px] text-[#7A726A] dark:text-[#A39B91]">Bientôt disponible</div>
                    </div>
                    <Switch checked={isComingSoon} onCheckedChange={setIsComingSoon} />
                  </label>
                </div>
              </div>

              {/* COLONNE DROITE (5 colonnes) : Bannières & Visuels */}
              <div className="lg:col-span-5 space-y-3.5">
                <div className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-4 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-[#1A1816] dark:text-[#FAF7F2]">
                      Photos de bannières ({images.length})
                    </label>
                    <span className="text-[10px] text-[#7A726A] dark:text-[#A39B91]">
                      1920 × 600 px
                    </span>
                  </div>

                  {/* Galerie des vignettes */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl bg-white dark:bg-[#141312]">
                      {images.map((imgUrl, index) => (
                        <div
                          key={`${imgUrl}-${index}`}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", index.toString());
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const sourceIndexStr = e.dataTransfer.getData("text/plain");
                            if (!sourceIndexStr) return;
                            const sourceIndex = parseInt(sourceIndexStr, 10);
                            if (isNaN(sourceIndex) || sourceIndex === index) return;
                            setImages((prev) => {
                              const copy = [...prev];
                              const [movedItem] = copy.splice(sourceIndex, 1);
                              copy.splice(index, 0, movedItem);
                              return copy;
                            });
                            toast.success("Ordre des photos mis à jour");
                          }}
                          className="group relative aspect-[16/10] rounded-lg overflow-hidden border border-[#E5DDD0] dark:border-[#2D2A26] bg-black/5 flex flex-col justify-between cursor-grab active:cursor-grabbing hover:border-[#C9A96E]/60 transition-all shadow-xs"
                        >
                          <img
                            src={imgUrl}
                            alt={`Bannière ${index + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Badge */}
                          <div className="absolute top-1 left-1 z-10 pointer-events-none">
                            {index === 0 ? (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.2 rounded bg-[#C9A96E] text-[#121110]">
                                <Star className="w-2 h-2 fill-current" /> Principale
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[8px] font-bold px-1.5 py-0.2 rounded bg-black/70 text-white">
                                #{index + 1}
                              </span>
                            )}
                          </div>

                          {/* Actions au survol */}
                          <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1 z-20">
                            <div className="flex items-center justify-between w-full">
                              {index !== 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetPrimaryImage(index);
                                  }}
                                  className="px-1.5 py-0.5 bg-white/95 text-[#1A1816] rounded hover:bg-[#C9A96E] transition-colors cursor-pointer text-[8px] font-bold flex items-center gap-0.5"
                                >
                                  <Star className="w-2 h-2" />
                                  <span>Principale</span>
                                </button>
                              ) : (
                                <div />
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage(index);
                                }}
                                className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors cursor-pointer ml-auto"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between w-full mt-auto pt-1">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveImage(index, "left");
                                }}
                                className="p-0.5 rounded bg-white/90 text-[#1A1816] hover:bg-[#C9A96E] disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>

                              <span className="text-[9px] font-bold text-white">
                                {index + 1} / {images.length}
                              </span>

                              <button
                                type="button"
                                disabled={index === images.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveImage(index, "right");
                                }}
                                className="p-0.5 rounded bg-white/90 text-[#1A1816] hover:bg-[#C9A96E] disabled:opacity-30 cursor-pointer"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Zone d'importation */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#E5DDD0] dark:border-[#2D2A26] hover:border-[#C9A96E]/60 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white dark:hover:bg-[#141312] transition-all group"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#C9A96E]/10 text-[#C9A96E] flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                      {uploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#1A1816] dark:text-[#FAF7F2]">
                      {uploading
                        ? `Téléversement (${uploadProgress})...`
                        : images.length === 0
                        ? "Importer des bannières"
                        : "Ajouter d'autres bannières"}
                    </p>
                    <p className="text-[10px] text-[#7A726A] dark:text-[#A39B91]">
                      PNG, JPG, WebP max 8 Mo
                    </p>
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
              </div>
            </div>
          </form>

          {/* Pied de page fixe */}
          <div className="p-3.5 sm:p-4 px-5 sm:px-7 bg-[#FAF7F2] dark:bg-[#1C1A18] border-t border-[#EAE3D8] dark:border-[#24211E] flex items-center justify-end gap-2 shrink-0 z-10 shadow-md">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-[#E5DDD0] dark:border-[#332E28] text-[#1A1816] dark:text-[#FAF7F2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="category-form"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#C9A96E] to-[#b39155] text-[#111827] shadow-md shadow-[#C9A96E]/20 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSaving ? "Enregistrement..." : editingCat ? "Mettre à jour" : "Créer la catégorie"}
            </button>
          </div>
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

      {/* Modale de Confirmation de Suppression Groupée des Catégories */}
      <AlertDialog open={bulkDeleteCatModalOpen} onOpenChange={setBulkDeleteCatModalOpen}>
        <AlertDialogContent className="bg-[#FFFFFF]/95 dark:bg-[#141312]/95 backdrop-blur-xl border border-[#EAE3D8] dark:border-[#24211E] rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md">
          <AlertDialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto sm:mx-0">
              <Trash2 className="w-5 h-5 stroke-[1.75]" />
            </div>
            <AlertDialogTitle className="font-serif text-xl font-medium text-[#1A1816] dark:text-[#FAF7F2]">
              Supprimer {selectedCatIds.length} catégorie(s) ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#7A726A] dark:text-[#A39B91] leading-relaxed">
              Êtes-vous certain de vouloir supprimer définitivement les <strong className="text-[#1A1816] dark:text-[#FAF7F2] font-semibold">{selectedCatIds.length} catégories sélectionnées</strong> de la boutique Maison Kenzi ?
              <br />
              <span className="text-rose-600 dark:text-rose-400 mt-1 block font-semibold">
                Attention : Cette suppression retirera les univers olfactifs de la base de données de manière irréversible.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2 sm:gap-3">
            <AlertDialogCancel className="rounded-xl border border-[#E5DDD0] dark:border-[#332E28] bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-[#4A453E] dark:text-[#D1C9BF] text-xs font-medium px-4 py-2.5 cursor-pointer">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteCats}
              disabled={isSaving}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium px-5 py-2.5 shadow-sm cursor-pointer"
            >
              {isSaving ? "Suppression en cours..." : "Supprimer la sélection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesAdmin;
