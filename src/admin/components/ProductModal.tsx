/**
 * Modal d'Ajout & Modification de Parfum — Maison Kenzi Admin
 *
 * Formulaire épuré pour flacons complets :
 * - Boutons d'action (Annuler / Créer le produit) intégrés en haut à la même ligne que le titre
 * - Validation stricte des champs obligatoires : Nom *, Maison *, Genre *, Saisons *, Prix *, Stock *, Notes *, Catégorie *
 * - Sélecteur de Catégorie Haute Parfumerie : Cartes de catégories réelles et synchronisées
 * - Téléversement d'image haute définition
 * - Statut de visibilité & badges (Nouveau, Best-Seller)
 * Conformité Haute Parfumerie & Zéro Emoji.
 */

import { useEffect, useRef, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { addProduct, updateProduct, type AdminParfum } from "@/store/useProductStore";
import { useCategories } from "@/store/useCategoryStore";
import { uploadProductImage, upsertParfumToSupabase } from "@/admin/lib/syncParfum";
import { getParfumImages } from "@/lib/productImages";
import type { Gender } from "@/data/parfums";
import { toast } from "sonner";
import {
  Upload,
  X,
  Loader2,
  AlertCircle,
  FolderTree,
  Check,
  Search,
  Layers,
  Star,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Image as ImageIcon,
  Plus,
  GripVertical,
  Sparkles,
  Languages,
} from "lucide-react";

import { getParfumSeasons } from "@/lib/seasonsStore";
import { getParfumCategories } from "@/lib/productCategories";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: AdminParfum | null;
};

const SEASON_OPTIONS = ["Printemps", "Été", "Automne", "Hiver"] as const;

const isSeasonSelected = (seasonName: string, selectedList: string[] = []) => {
  const target = (seasonName || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return (selectedList || []).some(
    (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === target
  );
};

const slugify = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const emptyForm = {
  name: "",
  nameEn: "",
  maison: "",
  gender: "" as unknown as Gender,
  category: "",
  categories: [] as string[],
  seasons: [] as string[],
  price: "",
  volume: "",
  stock: "",
  notes: "",
  notesEn: "",
  description: "",
  descriptionEn: "",
  imageLabel: "",
  imageLabelEn: "",
  imageUrl: "" as string,
  images: [] as string[],
  active: true,
  isNew: false,
  isBestseller: false,
};

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const labelCls = "block text-xs font-semibold text-[#111827] dark:text-[#F9FAFB] mb-1";
const inputCls =
  "w-full px-3 py-2 text-xs bg-[#FFFFFF] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A96E] text-[#111827] dark:text-[#F9FAFB] transition-colors";
const inputErrorCls =
  "w-full px-3 py-2 text-xs bg-red-50/50 dark:bg-red-950/20 border border-red-500 dark:border-red-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 text-[#111827] dark:text-[#F9FAFB] transition-colors";

const ProductModal = ({ open, onOpenChange, initial }: Props) => {
  const availableCategories = useCategories();
  const [f, setF] = useState(emptyForm);
  const [contentLang, setContentLang] = useState<"fr" | "en">("fr");
  const [categorySearch, setCategorySearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Filtrage réactif des catégories dynamiques issues de Supabase
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return availableCategories;
    const q = categorySearch.toLowerCase().trim();
    return availableCategories.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [availableCategories, categorySearch]);

  const selectedCategoriesCount = (f.categories || []).length;

  useEffect(() => {
    if (open) {
      if (initial) {
        const initialPrice =
          initial.full_bottle_price != null
            ? String(initial.full_bottle_price)
            : initial.price_5ml != null
            ? String(initial.price_5ml)
            : initial.prices?.["5ml"] != null
            ? String(initial.prices["5ml"])
            : "";

        const initialVolume =
          initial.full_bottle_volume_ml != null
            ? String(initial.full_bottle_volume_ml)
            : "";
        const initialStock =
          initial.full_bottle_stock != null
            ? String(initial.full_bottle_stock)
            : initial.stock != null
            ? String(initial.stock)
            : "";

        const initialNotes = [
          ...(initial.notes?.tete ?? []),
          ...(initial.notes?.coeur ?? []),
          ...(initial.notes?.fond ?? []),
        ]
          .filter(Boolean)
          .join(", ");

        const initialSeasons = getParfumSeasons(initial);
        const initialImages = getParfumImages(initial);
        const initialCategories = getParfumCategories(initial);

        setF({
          name: initial.name || "",
          nameEn: (initial as any).name_en || "",
          maison: initial.maison || "",
          gender: initial.gender || ("" as unknown as Gender),
          category: initialCategories[0] || (initial.category as string) || "",
          categories: initialCategories,
          seasons: initialSeasons,
          price: initialPrice,
          volume: initialVolume,
          stock: initialStock,
          notes: initialNotes,
          notesEn: (initial as any).notes_en || "",
          description: initial.description || "",
          descriptionEn: (initial as any).description_en || "",
          imageLabel: initial.imageLabel || "",
          imageLabelEn: (initial as any).image_label_en || "",
          imageUrl: initialImages[0] || initial.image_url || "",
          images: initialImages,
          active: initial.active ?? true,
          isNew: !!initial.isNew,
          isBestseller: !!initial.isBestseller,
        });
      } else {
        setF(emptyForm);
      }
      setContentLang("fr");
      setCategorySearch("");
      setErrors({});
    }
  }, [open, initial]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    // Effacer l'erreur à la saisie
    if (errors[k]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[k];
        return next;
      });
    }
  };

  const toggleSeason = (season: string) => {
    setF((prev) => {
      const current = Array.isArray(prev.seasons) ? prev.seasons : [];
      const norm = season.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const exists = current.some((s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === norm);
      const next = exists
        ? current.filter((s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() !== norm)
        : [...current, season];
      return { ...prev, seasons: next };
    });
    if (errors.seasons) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.seasons;
        return next;
      });
    }
  };

  const toggleCategory = (catSlug: string) => {
    setF((prev) => {
      const current = Array.isArray(prev.categories) && prev.categories.length > 0
        ? prev.categories
        : (prev.category ? [prev.category] : []);
      const exists = current.includes(catSlug);
      const next = exists
        ? current.filter((s) => s !== catSlug)
        : [...current, catSlug];
      return {
        ...prev,
        categories: next,
        category: next[0] || "",
      };
    });
    if (errors.categories || errors.category) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.categories;
        delete next.category;
        return next;
      });
    }
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" n'est pas une image valide.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" dépasse 10 Mo.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      setUploading(true);
      const id = initial?.id && isUuid(initial.id) ? initial.id : crypto.randomUUID();
      const uploadedUrls: string[] = [];

      for (const file of validFiles) {
        try {
          const url = await uploadProductImage(id, file);
          uploadedUrls.push(url);
        } catch (err) {
          console.error("Erreur upload Supabase Storage, bascule en local data-URL:", err);
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          uploadedUrls.push(dataUrl);
        }
      }

      setF((prev) => {
        const nextImages = [...(prev.images || []), ...uploadedUrls];
        return {
          ...prev,
          images: nextImages,
          imageUrl: nextImages[0] || prev.imageUrl || "",
        };
      });

      toast.success(
        uploadedUrls.length === 1
          ? "Photo ajoutée avec succès"
          : `${uploadedUrls.length} photos ajoutées avec succès`
      );
    } catch (err) {
      console.error("Erreur lors de l'upload des images:", err);
      toast.error("Impossible de charger les images sélectionnées.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const setPrimaryImage = (index: number) => {
    setF((prev) => {
      const list = [...(prev.images || [])];
      if (index <= 0 || index >= list.length) return prev;
      const [target] = list.splice(index, 1);
      list.unshift(target);
      return {
        ...prev,
        images: list,
        imageUrl: list[0] || "",
      };
    });
    toast.success("Image définie comme photo de couverture principale");
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setF((prev) => {
      const list = [...(prev.images || [])];
      if (toIndex < 0 || toIndex >= list.length || fromIndex === toIndex) return prev;
      const [target] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, target);
      return {
        ...prev,
        images: list,
        imageUrl: list[0] || "",
      };
    });
  };

  const removeImage = (index: number) => {
    setF((prev) => {
      const list = [...(prev.images || [])].filter((_, i) => i !== index);
      return {
        ...prev,
        images: list,
        imageUrl: list[0] || "",
      };
    });
    toast.success("Photo retirée de la galerie");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs.name = "Veuillez renseigner le nom du parfum";
    if (!f.maison.trim()) errs.maison = "Veuillez renseigner la maison ou marque";
    if (!f.gender) errs.gender = "Veuillez sélectionner un genre";

    const currentSeasons = Array.isArray(f.seasons) ? f.seasons : [];
    if (currentSeasons.length === 0) errs.seasons = "Veuillez sélectionner au moins une saison d'utilisation";

    const numPrice = Number(f.price);
    if (!f.price || !numPrice || numPrice <= 0) errs.price = "Veuillez renseigner le prix de vente du parfum";

    if (f.stock === "" || isNaN(Number(f.stock)) || Number(f.stock) < 0) {
      errs.stock = "Veuillez renseigner le stock disponible";
    }

    if (!f.notes.trim()) {
      errs.notes = "Veuillez renseigner au moins une note olfactive (séparées par une virgule)";
    }

    const currentCategories = Array.isArray(f.categories) && f.categories.length > 0
      ? f.categories
      : (f.category ? [f.category] : []);

    if (currentCategories.length === 0) {
      errs.category = "Veuillez sélectionner au moins une catégorie pour le parfum";
    }

    const numVolume = Number(f.volume);
    if (!f.volume || isNaN(numVolume) || numVolume <= 0) {
      errs.volume = "Veuillez renseigner la contenance du flacon (ex: 100)";
    }

    const numStock = Math.max(0, Number(f.stock) || 0);

    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error("Formulaire incomplet", {
        description: "Veuillez renseigner tous les champs obligatoires surlignés en rouge.",
      });
      return;
    }

    const parseNotes = (s: string) =>
      (s || "").split(",").map((x) => x.trim()).filter(Boolean);

    const parsedNotes = parseNotes(f.notes);

    const id =
      initial?.id && isUuid(initial.id)
        ? initial.id
        : initial?.id ?? crypto.randomUUID();

    const finalImages = (f.images && f.images.length > 0)
      ? f.images
      : (f.imageUrl ? [f.imageUrl] : []);

    const primaryImageUrl = finalImages[0] || null;

    const payload: AdminParfum = {
      id,
      name: f.name.trim(),
      name_en: (f.nameEn || "").trim() || undefined,
      maison: f.maison.trim(),
      gender: f.gender,
      category: (currentCategories[0] || "") as any,
      categories: currentCategories,
      seasons: currentSeasons,
      description: (f.description || "").trim(),
      description_en: (f.descriptionEn || "").trim() || undefined,
      notes_en: (f.notesEn || "").trim() || undefined,
      notes: {
        tete: parsedNotes,
        coeur: [],
        fond: [],
      },
      prices: {
        "5ml": numPrice,
        "10ml": numPrice,
        "100ml": numPrice,
      },
      imageLabel: (f.imageLabel || "").trim() || slugify(f.name) || "produit",
      image_label_en: (f.imageLabelEn || "").trim() || undefined,
      image_url: primaryImageUrl,
      images: finalImages,
      isNew: f.isNew,
      isBestseller: f.isBestseller,
      active: f.active,
      stock: numStock,
      stock_5ml: numStock,
      stock_10ml: numStock,
      sale_mode: "full_bottle",
      full_bottle_volume_ml: numVolume,
      full_bottle_price: numPrice,
      full_bottle_stock: numStock,
      full_bottle_limited: false,
    };

    try {
      setSaving(true);

      // 1. Mise à jour instantanée du store local
      if (initial) {
        updateProduct(initial.id, payload);
      } else {
        addProduct(payload);
      }

      // 2. Synchronisation avec la base de données Supabase
      try {
        await upsertParfumToSupabase(payload, primaryImageUrl, finalImages);
        toast.success(initial ? "Produit mis à jour et synchronisé avec la base de données" : "Nouveau parfum enregistré dans la base de données");
      } catch (dbErr: any) {
        console.error("Erreur synchronisation Supabase:", dbErr);
        toast.warning("Produit enregistré localement", {
          description: "La synchronisation avec la base de données distante a échoué. Vérifiez vos permissions ou le script SQL.",
        });
      }

      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement du produit");
    } finally {
      setSaving(false);
    }
  };

  const currentSeasons = Array.isArray(f.seasons) ? f.seasons : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FFFFFF] dark:bg-[#1A1A1A] max-w-6xl xl:max-w-7xl w-[96vw] max-h-[94vh] overflow-y-auto p-6 sm:p-8 lg:p-9 rounded-2xl shadow-2xl border border-[#E5E7EB] dark:border-[#2A2A2A]">
        <form onSubmit={submit} className="space-y-6">
          {/* En-tête avec Titre à gauche et Boutons d'Action à droite */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] dark:border-[#2A2A2A] pr-8 sm:pr-10">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <DialogTitle className="text-lg sm:text-xl font-serif font-bold text-[#111827] dark:text-[#F9FAFB]">
                  {initial ? "Modifier le parfum" : "Ajouter un nouveau parfum"}
                </DialogTitle>
                {initial && (
                  <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-[#C9A96E]/15 text-[#C9A96E] border border-[#C9A96E]/30">
                    {initial.name}
                  </span>
                )}
              </div>
              <DialogDescription className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                {initial
                  ? "Modifiez les caractéristiques, pyramide olfactive et visuels de cette création."
                  : "Renseignez les détails pour ajouter une nouvelle création de haute parfumerie."}
              </DialogDescription>
            </div>

            {/* Boutons d'action dans l'en-tête */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] text-[#111827] dark:text-[#F9FAFB] hover:bg-[#F8F9FA] dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#C9A96E] to-[#b39155] text-[#111827] hover:brightness-110 shadow-lg shadow-[#C9A96E]/20 disabled:opacity-60 transition-all cursor-pointer"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{initial ? "Mettre à jour le produit" : "Créer le produit"}</span>
              </button>
            </div>
          </div>

          {/* Grille principale en 2 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLONNE GAUCHE : Informations Générales, Prix, Genre, Saisons & Notes (7 colonnes) */}
            <div className="lg:col-span-7 space-y-6">
              <section className="bg-[#FFFFFF] dark:bg-[#141414] p-5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E]">Informations générales & Prix</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Nom du parfum */}
                  <div>
                    <label className={labelCls}>Nom du parfum *</label>
                    <input
                      className={errors.name ? inputErrorCls : inputCls}
                      value={f.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Ex: Baccarat Rouge 540"
                    />
                    {errors.name && (
                      <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Maison / Marque */}
                  <div>
                    <label className={labelCls}>Maison / Marque *</label>
                    <input
                      className={errors.maison ? inputErrorCls : inputCls}
                      value={f.maison}
                      onChange={(e) => set("maison", e.target.value)}
                      placeholder="Ex: Maison Francis Kurkdjian"
                    />
                    {errors.maison && (
                      <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.maison}</span>
                      </div>
                    )}
                  </div>

                  {/* Genre */}
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Genre *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Homme", "Femme", "Mixte"] as Gender[]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            set("gender", g);
                            // Mettre à jour la catégorie par défaut si non modifiée manuellement
                            if (!f.category || f.category === "homme" || f.category === "femme" || f.category === "mixte") {
                              set("category", g === "Homme" ? "homme" : g === "Femme" ? "femme" : "mixte");
                            }
                          }}
                          className={`py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                            f.gender === g
                              ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] border-[#111827] dark:border-[#C9A96E] font-semibold shadow-xs"
                              : "bg-[#FFFFFF] dark:bg-[#1A1A1A] text-[#6B7280] dark:text-[#9CA3AF] border-[#E5E7EB] dark:border-[#2A2A2A] hover:border-[#C9A96E]/50"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    {errors.gender && (
                      <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.gender}</span>
                      </div>
                    )}
                  </div>

                  {/* Saisons d'utilisation (Choix multiples) */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelCls}>Saisons d'utilisation *</label>
                      <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                        {currentSeasons.length === 0
                          ? "Aucune sélectionnée"
                          : `${currentSeasons.length} sélectionnée${currentSeasons.length > 1 ? "s" : ""}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SEASON_OPTIONS.map((season) => {
                        const isSelected = isSeasonSelected(season, currentSeasons);
                        return (
                          <button
                            key={season}
                            type="button"
                            onClick={() => toggleSeason(season)}
                            className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] border-[#111827] dark:border-[#C9A96E] font-semibold shadow-xs"
                                : "bg-[#FFFFFF] dark:bg-[#1A1A1A] text-[#6B7280] dark:text-[#9CA3AF] border-[#E5E7EB] dark:border-[#2A2A2A] hover:border-[#C9A96E]/50"
                            }`}
                          >
                            <span>{season}</span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.seasons && (
                      <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.seasons}</span>
                      </div>
                    )}
                  </div>

                  {/* Prix de vente */}
                  <div>
                    <label className={labelCls}>Prix de vente (€) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        className={(errors.price ? inputErrorCls : inputCls) + " pr-12 font-medium"}
                        value={f.price}
                        onChange={(e) => set("price", e.target.value)}
                        placeholder="Ex: 85"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#C9A96E] pointer-events-none">
                        €
                      </span>
                    </div>
                    {errors.price && (
                      <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.price}</span>
                      </div>
                    )}
                  </div>

                  {/* Volume du flacon */}
                  <div>
                    <label className={labelCls}>Volume / Contenance (ml) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        className={(errors.volume ? inputErrorCls : inputCls) + " pr-10 font-medium"}
                        value={f.volume}
                        onChange={(e) => set("volume", e.target.value)}
                        placeholder="Ex: 100"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none">
                        ml
                      </span>
                    </div>
                    {errors.volume && (
                      <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.volume}</span>
                      </div>
                    )}
                  </div>

                  {/* Stock disponible */}
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Stock disponible (flacons) *</label>
                    <input
                      type="number"
                      min={0}
                      className={errors.stock ? inputErrorCls : inputCls}
                      value={f.stock}
                      onChange={(e) => set("stock", e.target.value)}
                      placeholder="Ex: 10"
                    />
                    {errors.stock && (
                      <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.stock}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* SECTION BILINGUE : Descriptions & Pyramide Olfactive (FR / EN) */}
              <section className="bg-[#FFFFFF] dark:bg-[#141414] p-5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#E5E7EB] dark:border-[#2A2A2A]">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-[#C9A96E]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E]">
                      Descriptions & Pyramide Olfactive
                    </h3>
                  </div>

                  {/* Onglets de sélection de langue (FR / EN) */}
                  <div className="inline-flex p-1 bg-[#F3F4F6] dark:bg-[#1A1A1A] rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A]">
                    <button
                      type="button"
                      onClick={() => setContentLang("fr")}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        contentLang === "fr"
                          ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] font-semibold shadow-xs"
                          : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F9FAFB]"
                      }`}
                    >
                      <span>Français (FR)</span>
                      {f.notes && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentLang("en")}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        contentLang === "en"
                          ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] font-semibold shadow-xs"
                          : "text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F9FAFB]"
                      }`}
                    >
                      <span>English (EN)</span>
                      {f.notesEn ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      ) : (
                        <span className="text-[10px] text-[#9CA3AF] italic">Optionnel</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* CONTENU EN FRANÇAIS */}
                {contentLang === "fr" ? (
                  <div className="space-y-3.5 animate-in fade-in duration-200">
                    {/* Notes olfactives FR */}
                    <div>
                      <label className={labelCls}>Notes olfactives (FR) *</label>
                      <input
                        className={errors.notes ? inputErrorCls : inputCls}
                        value={f.notes}
                        onChange={(e) => set("notes", e.target.value)}
                        placeholder="Ex: Jasmin, Safran, Bois d'ambre, Ambre gris, Cèdre"
                      />
                      <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] mt-1 block">
                        Indiquez les accords et notes olfactives séparés par une virgule.
                      </span>
                      {errors.notes && (
                        <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium animate-in fade-in">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Description olfactive FR */}
                    <div>
                      <label className={labelCls}>Description olfactive (FR)</label>
                      <textarea
                        className={inputCls + " min-h-[90px] resize-y"}
                        value={f.description}
                        onChange={(e) => set("description", e.target.value)}
                        placeholder="Notes ambrées florales et boisées d'une élégance rare..."
                      />
                    </div>

                    {/* Sous-titre / Accroche FR */}
                    <div>
                      <label className={labelCls}>Sous-titre / Accroche (FR)</label>
                      <input
                        className={inputCls}
                        value={f.imageLabel}
                        onChange={(e) => set("imageLabel", e.target.value)}
                        placeholder="Ex: Extrait de Parfum — Flacon de Prestige"
                      />
                    </div>
                  </div>
                ) : (
                  /* CONTENU EN ANGLAIS */
                  <div className="space-y-3.5 animate-in fade-in duration-200">
                    <div className="p-2.5 rounded-xl bg-[#C9A96E]/5 border border-[#C9A96E]/20 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                      Ce contenu sera automatiquement affiché pour les clients anglophones lorsque la langue du site est sur English (EN).
                    </div>

                    {/* Nom en anglais (optionnel si différent) */}
                    <div>
                      <label className={labelCls}>Nom du parfum (EN - Optionnel)</label>
                      <input
                        className={inputCls}
                        value={f.nameEn}
                        onChange={(e) => set("nameEn", e.target.value)}
                        placeholder={f.name ? `Laisser vide pour utiliser "${f.name}"` : "Ex: Baccarat Rouge 540"}
                      />
                    </div>

                    {/* Notes olfactives EN */}
                    <div>
                      <label className={labelCls}>Olfactory Notes (EN)</label>
                      <input
                        className={inputCls}
                        value={f.notesEn}
                        onChange={(e) => set("notesEn", e.target.value)}
                        placeholder="Ex: Jasmine, Saffron, Amberwood, Ambergris, Cedar"
                      />
                      <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] mt-1 block">
                        Comma-separated notes in English.
                      </span>
                    </div>

                    {/* Description olfactive EN */}
                    <div>
                      <label className={labelCls}>Olfactory Description (EN)</label>
                      <textarea
                        className={inputCls + " min-h-[90px] resize-y"}
                        value={f.descriptionEn}
                        onChange={(e) => set("descriptionEn", e.target.value)}
                        placeholder="Luminous and sophisticated amber floral breeze..."
                      />
                    </div>

                    {/* Sous-titre / Accroche EN */}
                    <div>
                      <label className={labelCls}>Subtitle / Tagline (EN)</label>
                      <input
                        className={inputCls}
                        value={f.imageLabelEn}
                        onChange={(e) => set("imageLabelEn", e.target.value)}
                        placeholder="Ex: Extrait de Parfum — Prestige Bottle"
                      />
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* COLONNE DROITE : Image, Catégorie & Visibilité (5 colonnes) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Visuels du Produit (Multi-photos) */}
              {/* Visuels du Produit (Multi-photos avec Drag & Drop de réorganisation) */}
              <section
                onDragOver={(e) => {
                  if (e.dataTransfer.types.includes("Files")) {
                    e.preventDefault();
                    setIsDraggingFiles(true);
                  }
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setIsDraggingFiles(false);
                }}
                onDrop={(e) => {
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    e.preventDefault();
                    setIsDraggingFiles(false);
                    handleFiles(e.dataTransfer.files);
                  }
                }}
                className={`relative bg-[#FFFFFF] dark:bg-[#141414] p-5 rounded-xl border transition-all duration-200 space-y-3.5 ${
                  isDraggingFiles
                    ? "border-[#C9A96E] ring-2 ring-[#C9A96E]/30 bg-[#C9A96E]/5"
                    : "border-[#E5E7EB] dark:border-[#2A2A2A]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#C9A96E]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E]">
                      Visuels du produit
                    </h3>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/20">
                    {(f.images || []).length} photo{(f.images || []).length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Consignes de dimensions & fonctionnement du survol et drag & drop */}
                <div className="p-2.5 rounded-xl bg-[#F8F9FA] dark:bg-white/[0.03] border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-1">
                  <p className="text-[11px] font-semibold text-[#111827] dark:text-[#F9FAFB]">
                    Dimensions recommandées : 800 × 1000 px (Portrait 4:5) ou 1000 × 1000 px (Carré 1:1)
                  </p>
                  <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                    • <strong>1ère photo</strong> : Couverture principale affichée sur la boutique.<br />
                    • <strong>2ème photo</strong> : Image interactive révélée au survol du produit.<br />
                    • <strong>Glisser-déposer (Drag & Drop)</strong> : Saisissez n'importe quelle photo pour réorganiser l'ordre d'affichage.
                  </p>
                </div>

                {/* Grille des photos avec support du Drag & Drop */}
                {(f.images || []).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {(f.images || []).map((imgUrl, idx) => {
                      const isCover = idx === 0;
                      const isHover = idx === 1;
                      const isDragged = draggedImageIndex === idx;
                      const isOver = dragOverImageIndex === idx && draggedImageIndex !== idx;

                      return (
                        <div
                          key={`${imgUrl}-${idx}`}
                          draggable
                          onDragStart={(e) => {
                            setDraggedImageIndex(idx);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", String(idx));
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverImageIndex !== idx) {
                              setDragOverImageIndex(idx);
                            }
                          }}
                          onDragLeave={() => {
                            if (dragOverImageIndex === idx) {
                              setDragOverImageIndex(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedImageIndex !== null && draggedImageIndex !== idx) {
                              moveImage(draggedImageIndex, idx);
                              toast.success("Ordre des photos mis à jour");
                            }
                            setDraggedImageIndex(null);
                            setDragOverImageIndex(null);
                          }}
                          onDragEnd={() => {
                            setDraggedImageIndex(null);
                            setDragOverImageIndex(null);
                          }}
                          className={`group relative rounded-xl border overflow-hidden bg-[#0F0F0F] aspect-[4/5] flex flex-col justify-between transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                            isDragged
                              ? "opacity-40 scale-95 ring-2 ring-[#C9A96E]/60 border-dashed border-[#C9A96E]"
                              : isOver
                              ? "ring-2 ring-[#C9A96E] scale-[1.03] border-[#C9A96E] shadow-lg z-10 bg-[#C9A96E]/10"
                              : isCover
                              ? "border-[#C9A96E] ring-2 ring-[#C9A96E]/30"
                              : "border-[#E5E7EB] dark:border-[#2A2A2A] hover:border-[#C9A96E]/50"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-full object-cover pointer-events-none"
                          />

                          {/* Badge de position et poignée de Drag en haut */}
                          <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                            {isCover ? (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#C9A96E] text-[#111827] flex items-center gap-1 shadow-md">
                                <Star className="w-2.5 h-2.5 fill-[#111827]" /> 1 • Couverture
                              </span>
                            ) : isHover ? (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#111827]/85 dark:bg-black/85 text-white backdrop-blur-xs shadow-md">
                                2 • Survol boutique
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-black/75 text-white backdrop-blur-xs">
                                Photo {idx + 1}
                              </span>
                            )}

                            {/* Poignée de Drag visuelle */}
                            <div className="w-5 h-5 rounded-md bg-black/60 backdrop-blur-xs flex items-center justify-center text-white/80 opacity-70 group-hover:opacity-100 transition-opacity shadow-xs" title="Glisser pour réorganiser">
                              <GripVertical className="w-3 h-3" />
                            </div>
                          </div>

                          {/* Barre d'actions en bas de chaque photo */}
                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex items-center justify-between gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              {/* Bouton Définir comme photo principale */}
                              {!isCover && (
                                <button
                                  type="button"
                                  title="Définir comme photo de couverture"
                                  onClick={() => setPrimaryImage(idx)}
                                  className="p-1 rounded-lg bg-black/60 hover:bg-[#C9A96E] text-white hover:text-[#111827] transition-colors cursor-pointer"
                                >
                                  <Star className="w-3 h-3" />
                                </button>
                              )}

                              {/* Bouton Déplacer vers la gauche */}
                              {idx > 0 && (
                                <button
                                  type="button"
                                  title="Déplacer vers la gauche"
                                  onClick={() => moveImage(idx, idx - 1)}
                                  className="p-1 rounded-lg bg-black/60 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                              )}

                              {/* Bouton Déplacer vers la droite */}
                              {idx < (f.images || []).length - 1 && (
                                <button
                                  type="button"
                                  title="Déplacer vers la droite"
                                  onClick={() => moveImage(idx, idx + 1)}
                                  className="p-1 rounded-lg bg-black/60 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Bouton Supprimer la photo */}
                            <button
                              type="button"
                              title="Supprimer cette photo"
                              onClick={() => removeImage(idx)}
                              className="p-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Zone d'ajout de photos (multi-fichiers + drag & drop direct) */}
                <div className="pt-1">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className={`w-full flex items-center justify-center gap-2 p-3 text-xs font-medium rounded-xl border border-dashed transition-all cursor-pointer ${
                      isDraggingFiles
                        ? "border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E] scale-[1.01]"
                        : "border-[#C9A96E]/40 hover:border-[#C9A96E] bg-[#C9A96E]/5 hover:bg-[#C9A96E]/10 text-[#111827] dark:text-[#F9FAFB]"
                    } disabled:opacity-50`}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#C9A96E]" />
                        <span>Téléversement en cours...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-[#C9A96E]" />
                        <span>
                          {(f.images || []).length === 0
                            ? "Ajouter des photos du produit (ou glissez-déposez vos fichiers ici)"
                            : "Ajouter d'autres photos (ou glissez-déposez vos fichiers ici)"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </section>

              {/* Section Sélecteur Multi-Catégories Haute Parfumerie (Positionnée au-dessus de Visibilité & Badges) */}
              <section className="bg-[#FFFFFF] dark:bg-[#141414] p-5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E] flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>Catégories du parfum *</span>
                  </h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/20">
                    {selectedCategoriesCount === 0
                      ? "Sélectionner"
                      : selectedCategoriesCount === 1
                      ? availableCategories.find((c) => c.slug === f.categories[0])?.name || f.categories[0]
                      : `${selectedCategoriesCount} sélectionnées`}
                  </span>
                </div>

                {/* Champ de recherche rapide de catégorie si plus de 4 catégories */}
                {availableCategories.length > 4 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                      type="text"
                      className={inputCls + " pl-8 py-1.5 text-[11px]"}
                      placeholder="Filtrer les catégories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                    />
                    {categorySearch && (
                      <button
                        type="button"
                        onClick={() => setCategorySearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Grille des catégories dynamiques issues de Supabase */}
                {filteredCategories.length > 0 ? (
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-0.5 p-1 rounded-xl ${errors.category || errors.categories ? "ring-1 ring-red-500/50" : ""}`}>
                    {filteredCategories.map((cat) => {
                      const isSelected = (f.categories || []).includes(cat.slug);
                      const isPrimary = (f.categories || [])[0] === cat.slug;
                      return (
                        <button
                          key={cat.id || cat.slug}
                          type="button"
                          onClick={() => toggleCategory(cat.slug)}
                          className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] border-[#111827] dark:border-[#C9A96E] font-semibold shadow-xs"
                              : "bg-[#FFFFFF] dark:bg-[#1A1A1A] text-[#4B5563] dark:text-[#9CA3AF] border-[#E5E7EB] dark:border-[#2A2A2A] hover:border-[#C9A96E]/50 hover:bg-[#F8F9FA] dark:hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Layers className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-[#C9A96E] dark:text-[#111827]" : "text-[#9CA3AF]"}`} />
                            <span className="text-xs truncate font-medium">{cat.name}</span>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-1 shrink-0">
                              {isPrimary && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-[#C9A96E] text-[#111827] dark:bg-black dark:text-[#C9A96E] font-bold">
                                  Principal
                                </span>
                              )}
                              <div className="w-4 h-4 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-dashed border-[#E5E7EB] dark:border-[#2A2A2A] text-center space-y-1">
                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                      Aucune catégorie trouvée
                    </p>
                    <p className="text-[10px] text-[#9CA3AF]">
                      Créez vos univers dans l'onglet Catégories du panneau d'administration.
                    </p>
                  </div>
                )}

                <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                  Sélection multiple autorisée. La première catégorie cochée sert de référence principale.
                </p>

                {(errors.category || errors.categories) && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.category || errors.categories}</span>
                  </div>
                )}
              </section>

              {/* Visibilité & Badges */}
              <section className="bg-[#FFFFFF] dark:bg-[#141414] p-5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E]">Visibilité & Badges</h3>
                <div className="space-y-2.5">
                  <label className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <span className="font-medium">Produit actif (visible en boutique)</span>
                    <Switch checked={f.active} onCheckedChange={(v) => set("active", v)} />
                  </label>
                  <label className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <span className="font-medium">Nouveau produit (badge "Nouveau")</span>
                    <Switch checked={f.isNew} onCheckedChange={(v) => set("isNew", v)} />
                  </label>
                  <label className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <span className="font-medium">Best Seller (mis en vedette)</span>
                    <Switch checked={f.isBestseller} onCheckedChange={(v) => set("isBestseller", v)} />
                  </label>
                </div>
              </section>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
