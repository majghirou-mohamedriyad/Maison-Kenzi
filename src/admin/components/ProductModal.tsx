/**
 * Modal d'Ajout & Modification de Parfum — Maison Kenzi Admin
 *
 * Formulaire de haute parfumerie pour flacons complets :
 * - Structure ergonomique : En-tête fixe avec badge, corps défilant équilibré (6/6 colonnes), pied de page fixe
 * - Support bilingue FR / EN pour le nom, notes olfactives, descriptions et sous-titres
 * - Validation stricte des champs obligatoires (Nom, Maison, Genre, Saisons, Prix, Contenance, Stock, Notes, Catégorie)
 * - Gestion multi-photos avec glisser-déposer, réorganisation et indicateur de couverture
 * - Sélecteur de catégories réelles synchronisées avec Supabase
 * - Conformité Haute Parfumerie & Zéro Emoji (icônes vectorielles lucide-react).
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
  Flower2,
  Palette,
  Landmark,
  Package,
} from "lucide-react";

import { getParfumSeasons } from "@/lib/seasonsStore";
import { getParfumCategories } from "@/lib/productCategories";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: AdminParfum | null;
  defaultCategory?: string;
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
  weightValue: "",
  weightUnit: "g" as "g" | "kg",
  volumeValue: "",
  volumeUnit: "ml" as "ml" | "L",
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

const labelCls = "block text-[11px] font-semibold text-[#1A1816] dark:text-[#FAF7F2] mb-1";
const inputCls =
  "w-full px-3 py-2 text-xs bg-white dark:bg-[#141312] border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/40 focus:border-[#C9A96E] text-[#1A1816] dark:text-[#FAF7F2] placeholder:text-[#9CA3AF] transition-all";
const inputErrorCls =
  "w-full px-3 py-2 text-xs bg-red-50/40 dark:bg-red-950/20 border border-red-500 dark:border-red-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 text-[#1A1816] dark:text-[#FAF7F2] transition-all";

const ProductModal = ({ open, onOpenChange, initial, defaultCategory }: Props) => {
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

  // Détection si l'univers actif ou sélectionné est Cosmétiques
  const isCosmetic = useMemo(() => {
    const cat = (defaultCategory || f.category || "").toLowerCase();
    const cats = (f.categories || []).map((c) => c.toLowerCase());
    return cat.includes("cosmetique") || cats.some((c) => c.includes("cosmetique"));
  }, [defaultCategory, f.category, f.categories]);

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

        // Extraction intelligente des valeurs de poids et volume
        let initWeightVal = "";
        let initWeightUnit: "g" | "kg" = "g";
        let initVolumeVal = initialVolume;
        let initVolumeUnit: "ml" | "L" = "ml";

        const labelText = (initial.imageLabel || "").toLowerCase();
        const weightMatch = labelText.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/i);
        if (weightMatch) {
          initWeightVal = weightMatch[1];
          initWeightUnit = weightMatch[2].toLowerCase() === "kg" ? "kg" : "g";
        }

        const volMatch = labelText.match(/(\d+(?:\.\d+)?)\s*(l|ml)\b/i);
        if (volMatch) {
          initVolumeVal = volMatch[1];
          initVolumeUnit = volMatch[2].toLowerCase() === "l" ? "L" : "ml";
        }

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
          weightValue: initWeightVal,
          weightUnit: initWeightUnit,
          volumeValue: initVolumeVal,
          volumeUnit: initVolumeUnit,
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
        const initCategory = defaultCategory && defaultCategory !== "Tous" ? defaultCategory : "";
        const initCategories = initCategory ? [initCategory] : [];
        setF({
          ...emptyForm,
          category: initCategory,
          categories: initCategories,
        });
      }
      setErrors({});
      setContentLang("fr");
      setCategorySearch("");
    }
  }, [open, initial, defaultCategory]);

  const set = (key: string, val: any) => {
    setF((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const toggleSeason = (season: string) => {
    setF((prev) => {
      const list = Array.isArray(prev.seasons) ? [...prev.seasons] : [];
      const isSelected = isSeasonSelected(season, list);
      const nextList = isSelected
        ? list.filter((s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() !== (season || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim())
        : [...list, season];
      return { ...prev, seasons: nextList };
    });
    if (errors.seasons) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.seasons;
        return next;
      });
    }
  };

  const toggleCategory = (slug: string) => {
    setF((prev) => {
      const list = Array.isArray(prev.categories) ? [...prev.categories] : [];
      const isSelected = list.includes(slug);
      const nextList = isSelected ? list.filter((c) => c !== slug) : [...list, slug];
      return {
        ...prev,
        categories: nextList,
        category: nextList[0] || "",
      };
    });
    if (errors.category || errors.categories) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.category;
        delete next.categories;
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
    if (!f.name.trim()) {
      errs.name = isCosmetic ? "Veuillez renseigner le nom du produit cosmétique" : "Veuillez renseigner le nom du parfum";
    }
    if (!f.maison.trim()) {
      errs.maison = isCosmetic ? "Veuillez renseigner la marque ou laboratoire" : "Veuillez renseigner la maison ou marque";
    }

    if (!isCosmetic) {
      if (!f.gender) errs.gender = "Veuillez sélectionner un genre";
      const currentSeasons = Array.isArray(f.seasons) ? f.seasons : [];
      if (currentSeasons.length === 0) errs.seasons = "Veuillez sélectionner au moins une saison d'utilisation";
      if (!f.notes.trim()) {
        errs.notes = "Veuillez renseigner au moins une note olfactive (séparées par une virgule)";
      }
    }

    const numPrice = Number(f.price);
    if (!f.price || !numPrice || numPrice <= 0) errs.price = "Veuillez renseigner le prix de vente";

    if (f.stock === "" || isNaN(Number(f.stock)) || Number(f.stock) < 0) {
      errs.stock = "Veuillez renseigner le stock disponible";
    }

    const currentCategories = Array.isArray(f.categories) && f.categories.length > 0
      ? f.categories
      : (f.category ? [f.category] : (isCosmetic ? ["cosmetiques"] : []));

    if (currentCategories.length === 0) {
      errs.category = "Veuillez sélectionner au moins une catégorie pour le produit";
    }

    // Gestion du volume et poids pour les cosmétiques
    let calculatedVolumeMl = 0;
    if (isCosmetic) {
      const hasWeight = !!f.weightValue && Number(f.weightValue) > 0;
      const hasVol = !!f.volumeValue && Number(f.volumeValue) > 0;
      if (!hasWeight && !hasVol && (!f.volume || Number(f.volume) <= 0)) {
        errs.volume = "Veuillez renseigner le poids (g/kg) ou le volume (ml/L)";
      }
      if (hasVol) {
        calculatedVolumeMl = f.volumeUnit === "L" ? Number(f.volumeValue) * 1000 : Number(f.volumeValue);
      } else if (hasWeight) {
        calculatedVolumeMl = f.weightUnit === "kg" ? Number(f.weightValue) * 1000 : Number(f.weightValue);
      } else {
        calculatedVolumeMl = Number(f.volume) || 100;
      }
    } else {
      const numVolume = Number(f.volume);
      if (!f.volume || isNaN(numVolume) || numVolume <= 0) {
        errs.volume = "Veuillez renseigner la contenance du flacon (ex: 100)";
      }
      calculatedVolumeMl = numVolume || 100;
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

    const currentSeasonsList = Array.isArray(f.seasons) && f.seasons.length > 0
      ? f.seasons
      : (isCosmetic ? ["Toutes Saisons"] : ["Printemps", "Été"]);

    const cosmeticFormatLabel = [
      f.weightValue ? `${f.weightValue} ${f.weightUnit}` : "",
      f.volumeValue ? `${f.volumeValue} ${f.volumeUnit}` : "",
    ].filter(Boolean).join(" • ");

    const finalImageLabel = (f.imageLabel || "").trim() || (isCosmetic ? cosmeticFormatLabel : "") || slugify(f.name) || "produit";

    const payload: AdminParfum = {
      id,
      name: f.name.trim(),
      name_en: (f.nameEn || "").trim() || undefined,
      maison: f.maison.trim(),
      gender: f.gender || "Mixte",
      category: (currentCategories[0] || "") as any,
      categories: currentCategories,
      seasons: currentSeasonsList,
      description: (f.description || "").trim(),
      description_en: (f.descriptionEn || "").trim() || undefined,
      notes_en: (f.notesEn || "").trim() || undefined,
      notes: {
        tete: parsedNotes.length > 0 ? parsedNotes : (isCosmetic ? ["Soin Cosmétique"] : ["Essence"]),
        coeur: [],
        fond: [],
      },
      prices: {
        "5ml": numPrice,
        "10ml": numPrice,
        "100ml": numPrice,
      },
      imageLabel: finalImageLabel,
      image_label_en: (f.imageLabelEn || "").trim() || (isCosmetic ? cosmeticFormatLabel : undefined),
      image_url: primaryImageUrl,
      images: finalImages,
      isNew: f.isNew,
      isBestseller: f.isBestseller,
      active: f.active,
      stock: numStock,
      stock_5ml: numStock,
      stock_10ml: numStock,
      sale_mode: "full_bottle",
      full_bottle_volume_ml: calculatedVolumeMl > 0 ? calculatedVolumeMl : 100,
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
        toast.success(
          initial
            ? "Produit mis à jour et synchronisé avec succès"
            : isCosmetic
            ? "Nouveau produit cosmétique enregistré avec succès"
            : "Nouveau parfum enregistré dans la base de données"
        );
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

  const modalConfig = useMemo(() => {
    if (initial) {
      return {
        title: "Modifier le produit",
        subtitle: "Modifiez les caractéristiques, informations bilingues et visuels.",
        icon: Sparkles,
      };
    }
    const cat = (defaultCategory || f.category || "").toLowerCase();
    if (cat.includes("cosmetique")) {
      return {
        title: "Nouveau Produit Cosmétique",
        subtitle: "Renseignez les détails pour ajouter un nouveau soin ou cosmétique d'exception.",
        icon: Flower2,
      };
    }
    if (cat.includes("artisan") || cat.includes("artisanat") || cat.includes("artisanaux")) {
      return {
        title: "Nouveau Produit Artisanal",
        subtitle: "Renseignez les détails pour ajouter une création artisanale et savoir-faire d'art.",
        icon: Palette,
      };
    }
    if (cat.includes("antique") || cat.includes("antiquite") || cat.includes("antiquités")) {
      return {
        title: "Nouvelle Pièce Antique",
        subtitle: "Renseignez les détails pour ajouter une pièce antique ou objet d'époque rare.",
        icon: Landmark,
      };
    }
    if (cat.includes("parfum")) {
      return {
        title: "Nouveau Parfum",
        subtitle: "Renseignez les détails pour ajouter une nouvelle création de parfum de niche.",
        icon: Sparkles,
      };
    }
    return {
      title: "Ajouter un nouveau produit",
      subtitle: "Renseignez les détails pour ajouter une nouvelle référence au catalogue.",
      icon: Package,
    };
  }, [initial, defaultCategory, f.category]);

  const ModalIcon = modalConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-white dark:bg-[#141312] max-w-4xl lg:max-w-5xl xl:max-w-6xl w-[92vw] max-h-[86vh] h-auto flex flex-col p-0 overflow-hidden rounded-2xl shadow-2xl border border-[#EAE3D8] dark:border-[#24211E]"
      >
        {/* EN-TÊTE FIXE COMPACT AVEC BOUTONS D'ACTION IMMÉDIATS */}
        <div className="p-3 px-4 sm:px-5 border-b border-[#EAE3D8] dark:border-[#24211E] bg-[#FAF7F2] dark:bg-[#1C1A18] shrink-0">
          <div className="flex items-center justify-between gap-3 pr-8 sm:pr-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#C9A96E]/10 border border-[#C9A96E]/20 text-[#C9A96E] flex items-center justify-center shrink-0">
                <ModalIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xs sm:text-sm font-serif font-bold text-[#1A1816] dark:text-[#FAF7F2] truncate">
                  {modalConfig.title}
                </DialogTitle>
                <DialogDescription className="text-[10px] text-[#7A726A] dark:text-[#A39B91] truncate">
                  {modalConfig.subtitle}
                </DialogDescription>
              </div>
            </div>

            {/* BOUTONS D'ACTION RAPIDES EN HAUT */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[#E5DDD0] dark:border-[#2D2A26] text-[#1A1816] dark:text-[#FAF7F2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={saving || uploading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-[#C9A96E] to-[#b39155] text-[#111827] hover:brightness-110 shadow-xs shadow-[#C9A96E]/20 disabled:opacity-60 transition-all cursor-pointer"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{initial ? "Mettre à jour" : "Sauvegarder"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* CORPS DÉFILANT ADAPTATIF ULTRA-COMPACT */}
        <form id="product-form" onSubmit={submit} className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-3">
          {/* Grille principale équilibrée en 2 colonnes égales (6 / 6) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
            {/* COLONNE GAUCHE (6 colonnes) */}
            <div className="lg:col-span-6 space-y-3">
              {isCosmetic ? (
                /* ============================================================ */
                /* FORMULAIRE DÉDIÉ : PRODUIT COSMÉTIQUE                        */
                /* ============================================================ */
                <>
                  {/* Carte 1 : Informations Générales, Tarifs & Poids/Volume */}
                  <section className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-3 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2.5">
                    <div className="flex items-center gap-2 pb-1 border-b border-[#E5DDD0]/60 dark:border-[#2D2A26]/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E]">
                        Informations du Produit Cosmétique
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Nom du produit cosmétique */}
                      <div>
                        <label className={labelCls}>Nom du produit cosmétique *</label>
                        <input
                          className={errors.name ? inputErrorCls : inputCls}
                          value={f.name}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder="Ex: Sérum Éclat Niacinamide & Or"
                        />
                        {errors.name && (
                          <div className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5 font-medium">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Marque / Laboratoire */}
                      <div>
                        <label className={labelCls}>Marque / Laboratoire *</label>
                        <input
                          className={errors.maison ? inputErrorCls : inputCls}
                          value={f.maison}
                          onChange={(e) => set("maison", e.target.value)}
                          placeholder="Ex: Maison Kenzi Skincare"
                        />
                        {errors.maison && (
                          <div className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5 font-medium">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.maison}</span>
                          </div>
                        )}
                      </div>

                      {/* Tarification & Stock */}
                      <div className="sm:col-span-2 grid grid-cols-2 gap-2.5 pt-0.5">
                        {/* Prix */}
                        <div>
                          <label className={labelCls}>Prix de vente (€) *</label>
                          <div className="relative">
                            <input
                              type="number"
                              min={1}
                              className={(errors.price ? inputErrorCls : inputCls) + " pr-6 font-semibold"}
                              value={f.price}
                              onChange={(e) => set("price", e.target.value)}
                              placeholder="45"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#C9A96E] pointer-events-none">
                              €
                            </span>
                          </div>
                          {errors.price && (
                            <div className="text-[10px] text-red-500 mt-0.5">{errors.price}</div>
                          )}
                        </div>

                        {/* Stock */}
                        <div>
                          <label className={labelCls}>Stock disponible *</label>
                          <input
                            type="number"
                            min={0}
                            className={errors.stock ? inputErrorCls : inputCls}
                            value={f.stock}
                            onChange={(e) => set("stock", e.target.value)}
                            placeholder="25"
                          />
                          {errors.stock && (
                            <div className="text-[10px] text-red-500 mt-0.5">{errors.stock}</div>
                          )}
                        </div>
                      </div>

                      {/* 2 Champs de Poids & Contenance (Gramme/Kilogramme & Millilitre/Litre) */}
                      <div className="sm:col-span-2 p-2.5 rounded-lg bg-white/70 dark:bg-[#141312]/70 border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1816] dark:text-[#FAF7F2]">
                            Poids & Contenance du Soin
                          </span>
                          <span className="text-[9px] text-[#7A726A] dark:text-[#A39B91]">
                            Selon le type de produit
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Champ 1 : Poids en g ou kg */}
                          <div>
                            <label className="block text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-1">
                              Poids solide / pâte :
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                className={inputCls + " flex-1 font-semibold"}
                                value={f.weightValue}
                                onChange={(e) => set("weightValue", e.target.value)}
                                placeholder="Ex: 50"
                              />
                              <div className="inline-flex p-0.5 bg-[#FAF7F2] dark:bg-[#1C1A18] rounded-lg border border-[#E5DDD0] dark:border-[#2D2A26] shrink-0">
                                <button
                                  type="button"
                                  onClick={() => set("weightUnit", "g")}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                    f.weightUnit === "g"
                                      ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] shadow-xs"
                                      : "text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816]"
                                  }`}
                                >
                                  g
                                </button>
                                <button
                                  type="button"
                                  onClick={() => set("weightUnit", "kg")}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                    f.weightUnit === "kg"
                                      ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] shadow-xs"
                                      : "text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816]"
                                  }`}
                                >
                                  kg
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Champ 2 : Volume liquide en ml ou L */}
                          <div>
                            <label className="block text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-1">
                              Volume liquide :
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                step="any"
                                className={inputCls + " flex-1 font-semibold"}
                                value={f.volumeValue}
                                onChange={(e) => set("volumeValue", e.target.value)}
                                placeholder="Ex: 100"
                              />
                              <div className="inline-flex p-0.5 bg-[#FAF7F2] dark:bg-[#1C1A18] rounded-lg border border-[#E5DDD0] dark:border-[#2D2A26] shrink-0">
                                <button
                                  type="button"
                                  onClick={() => set("volumeUnit", "ml")}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                    f.volumeUnit === "ml"
                                      ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] shadow-xs"
                                      : "text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816]"
                                  }`}
                                >
                                  ml
                                </button>
                                <button
                                  type="button"
                                  onClick={() => set("volumeUnit", "L")}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                    f.volumeUnit === "L"
                                      ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] shadow-xs"
                                      : "text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816]"
                                  }`}
                                >
                                  L
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {errors.volume && (
                          <div className="text-[10px] text-red-500 font-medium">{errors.volume}</div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Carte 2 : Descriptions & Conseils d'Utilisation (Bilingue FR / EN) */}
                  <section className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-3 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-[#E5DDD0]/60 dark:border-[#2D2A26]/60">
                      <div className="flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E]">
                          Descriptions & Conseils d'Application
                        </h3>
                      </div>

                      {/* Onglets FR / EN */}
                      <div className="inline-flex p-0.5 bg-white dark:bg-[#141312] rounded-lg border border-[#E5DDD0] dark:border-[#2D2A26]">
                        <button
                          type="button"
                          onClick={() => setContentLang("fr")}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                            contentLang === "fr"
                              ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] font-semibold shadow-xs"
                              : "text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2]"
                          }`}
                        >
                          <span>Français (FR)</span>
                          {f.description && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setContentLang("en")}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                            contentLang === "en"
                              ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] font-semibold shadow-xs"
                              : "text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2]"
                          }`}
                        >
                          <span>English (EN)</span>
                          {f.descriptionEn ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          ) : (
                            <span className="text-[9px] text-[#A39B91] italic">Opt.</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CONTENU FR */}
                    {contentLang === "fr" ? (
                      <div className="space-y-2 animate-in fade-in duration-150">
                        <div>
                          <label className={labelCls}>Description du soin & bienfaits (FR)</label>
                          <textarea
                            className={inputCls + " min-h-[60px] resize-y"}
                            value={f.description}
                            onChange={(e) => set("description", e.target.value)}
                            placeholder="Formule enrichie en actifs précieux pour hydrater, nourrir et illuminer le teint en profondeur..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Sous-titre / Conseils d'application (FR)</label>
                          <input
                            className={inputCls}
                            value={f.imageLabel}
                            onChange={(e) => set("imageLabel", e.target.value)}
                            placeholder="Ex: Appliquer matin et soir sur peau propre et sèche"
                          />
                        </div>
                      </div>
                    ) : (
                      /* CONTENU EN */
                      <div className="space-y-2 animate-in fade-in duration-150">
                        <div>
                          <label className={labelCls}>Product Name (EN - Optionnel)</label>
                          <input
                            className={inputCls}
                            value={f.nameEn}
                            onChange={(e) => set("nameEn", e.target.value)}
                            placeholder={f.name ? `Laisser vide pour "${f.name}"` : "Ex: Radiance Glow Serum"}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Product Description & Benefits (EN)</label>
                          <textarea
                            className={inputCls + " min-h-[60px] resize-y"}
                            value={f.descriptionEn}
                            onChange={(e) => set("descriptionEn", e.target.value)}
                            placeholder="Luxurious skincare formula designed to nourish, hydrate, and reveal radiant skin..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Subtitle / Application Tips (EN)</label>
                          <input
                            className={inputCls}
                            value={f.imageLabelEn}
                            onChange={(e) => set("imageLabelEn", e.target.value)}
                            placeholder="Ex: Apply morning and evening to clean, dry skin"
                          />
                        </div>
                      </div>
                    )}
                  </section>
                </>
              ) : (
                /* ============================================================ */
                /* FORMULAIRE CLASSIQUE : PARFUMS, ARTISANAT, ANTIQUES          */
                /* ============================================================ */
                <>
                  {/* Carte 1 : Informations Générales & Tarifs */}
                  <section className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-3 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2.5">
                    <div className="flex items-center gap-2 pb-1 border-b border-[#E5DDD0]/60 dark:border-[#2D2A26]/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E]">
                        Informations générales & Tarifs
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Nom du produit */}
                      <div>
                        <label className={labelCls}>Nom du produit *</label>
                        <input
                          className={errors.name ? inputErrorCls : inputCls}
                          value={f.name}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder="Ex: Baccarat Rouge 540"
                        />
                        {errors.name && (
                          <div className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5 font-medium">
                            <AlertCircle className="w-3 h-3 shrink-0" />
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
                          <div className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5 font-medium">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.maison}</span>
                          </div>
                        )}
                      </div>

                      {/* Genre */}
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Genre *</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(["Homme", "Femme", "Mixte"] as Gender[]).map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => {
                                set("gender", g);
                                if (!f.category || f.category === "homme" || f.category === "femme" || f.category === "mixte") {
                                  set("category", g === "Homme" ? "homme" : g === "Femme" ? "femme" : "mixte");
                                }
                              }}
                              className={`py-1 text-[11px] font-medium rounded-lg border transition-all cursor-pointer ${
                                f.gender === g
                                  ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] border-[#111827] dark:border-[#C9A96E] font-semibold shadow-xs"
                                  : "bg-white dark:bg-[#141312] text-[#7A726A] dark:text-[#A39B91] border-[#E5DDD0] dark:border-[#2D2A26] hover:border-[#C9A96E]/50"
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                        {errors.gender && (
                          <div className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5 font-medium">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.gender}</span>
                          </div>
                        )}
                      </div>

                      {/* Saisons d'utilisation */}
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <label className={labelCls}>Saisons d'utilisation *</label>
                          <span className="text-[10px] text-[#7A726A] dark:text-[#A39B91]">
                            {currentSeasons.length === 0
                              ? "Aucune"
                              : `${currentSeasons.length} choisie${currentSeasons.length > 1 ? "s" : ""}`}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {SEASON_OPTIONS.map((season) => {
                            const isSelected = isSeasonSelected(season, currentSeasons);
                            return (
                              <button
                                key={season}
                                type="button"
                                onClick={() => toggleSeason(season)}
                                className={`py-1 px-1.5 text-[10px] font-medium rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                                  isSelected
                                    ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] border-[#111827] dark:border-[#C9A96E] font-semibold shadow-xs"
                                    : "bg-white dark:bg-[#141312] text-[#7A726A] dark:text-[#A39B91] border-[#E5DDD0] dark:border-[#2D2A26] hover:border-[#C9A96E]/50"
                                }`}
                              >
                                <span>{season}</span>
                              </button>
                            );
                          })}
                        </div>
                        {errors.seasons && (
                          <div className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5 font-medium">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.seasons}</span>
                          </div>
                        )}
                      </div>

                      {/* Tarification & Stock */}
                      <div className="sm:col-span-2 grid grid-cols-3 gap-2 pt-0.5">
                        {/* Prix */}
                        <div>
                          <label className={labelCls}>Prix (€) *</label>
                          <div className="relative">
                            <input
                              type="number"
                              min={1}
                              className={(errors.price ? inputErrorCls : inputCls) + " pr-5 font-semibold"}
                              value={f.price}
                              onChange={(e) => set("price", e.target.value)}
                              placeholder="85"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#C9A96E] pointer-events-none">
                              €
                            </span>
                          </div>
                          {errors.price && (
                            <div className="text-[10px] text-red-500 mt-0.5">{errors.price}</div>
                          )}
                        </div>

                        {/* Contenance */}
                        <div>
                          <label className={labelCls}>Contenance *</label>
                          <div className="relative">
                            <input
                              type="number"
                              min={1}
                              className={(errors.volume ? inputErrorCls : inputCls) + " pr-5 font-semibold"}
                              value={f.volume}
                              onChange={(e) => set("volume", e.target.value)}
                              placeholder="100"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#7A726A] dark:text-[#A39B91] pointer-events-none">
                              ml
                            </span>
                          </div>
                          {errors.volume && (
                            <div className="text-[10px] text-red-500 mt-0.5">{errors.volume}</div>
                          )}
                        </div>

                        {/* Stock */}
                        <div>
                          <label className={labelCls}>Stock *</label>
                          <input
                            type="number"
                            min={0}
                            className={errors.stock ? inputErrorCls : inputCls}
                            value={f.stock}
                            onChange={(e) => set("stock", e.target.value)}
                            placeholder="10"
                          />
                          {errors.stock && (
                            <div className="text-[10px] text-red-500 mt-0.5">{errors.stock}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Carte 2 : Pyramide Olfactive & Descriptions (Bilingue FR / EN) */}
                  <section className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-3 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-[#E5DDD0]/60 dark:border-[#2D2A26]/60">
                      <div className="flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E]">
                          Descriptions & Notes Olfactives
                        </h3>
                      </div>

                      {/* Onglets FR / EN */}
                      <div className="inline-flex p-0.5 bg-white dark:bg-[#141312] rounded-lg border border-[#E5DDD0] dark:border-[#2D2A26]">
                        <button
                          type="button"
                          onClick={() => setContentLang("fr")}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                            contentLang === "fr"
                              ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] font-semibold shadow-xs"
                              : "text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2]"
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
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                            contentLang === "en"
                              ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] font-semibold shadow-xs"
                              : "text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2]"
                          }`}
                        >
                          <span>English (EN)</span>
                          {f.notesEn ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          ) : (
                            <span className="text-[9px] text-[#A39B91] italic">Opt.</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* CONTENU FR */}
                    {contentLang === "fr" ? (
                      <div className="space-y-2 animate-in fade-in duration-150">
                        <div>
                          <label className={labelCls}>Notes olfactives (FR) *</label>
                          <input
                            className={errors.notes ? inputErrorCls : inputCls}
                            value={f.notes}
                            onChange={(e) => set("notes", e.target.value)}
                            placeholder="Ex: Jasmin, Safran, Bois d'ambre, Cèdre"
                          />
                          {errors.notes && (
                            <div className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5 font-medium">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{errors.notes}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className={labelCls}>Description olfactive (FR)</label>
                          <textarea
                            className={inputCls + " min-h-[50px] resize-y"}
                            value={f.description}
                            onChange={(e) => set("description", e.target.value)}
                            placeholder="Notes ambrées florales et boisées d'une élégance rare..."
                            rows={2}
                          />
                        </div>

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
                      /* CONTENU EN */
                      <div className="space-y-2 animate-in fade-in duration-150">
                        <div>
                          <label className={labelCls}>Nom du produit (EN - Optionnel)</label>
                          <input
                            className={inputCls}
                            value={f.nameEn}
                            onChange={(e) => set("nameEn", e.target.value)}
                            placeholder={f.name ? `Laisser vide pour utiliser "${f.name}"` : "Ex: Baccarat Rouge 540"}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Olfactory Notes (EN)</label>
                          <input
                            className={inputCls}
                            value={f.notesEn}
                            onChange={(e) => set("notesEn", e.target.value)}
                            placeholder="Ex: Jasmine, Saffron, Amberwood, Cedar"
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Olfactory Description (EN)</label>
                          <textarea
                            className={inputCls + " min-h-[50px] resize-y"}
                            value={f.descriptionEn}
                            onChange={(e) => set("descriptionEn", e.target.value)}
                            placeholder="Luminous and sophisticated amber floral breeze..."
                            rows={2}
                          />
                        </div>

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
                </>
              )}
            </div>

            {/* COLONNE DROITE (6 colonnes) : Visuels, Catégories & Visibilité */}
            <div className="lg:col-span-6 space-y-3">
              {/* Carte 3 : Visuels du Produit (Multi-photos) */}
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
                className={`relative bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-3 rounded-xl border transition-all duration-200 space-y-2 ${
                  isDraggingFiles
                    ? "border-[#C9A96E] ring-2 ring-[#C9A96E]/30 bg-[#C9A96E]/5"
                    : "border-[#E5DDD0] dark:border-[#2D2A26]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E]">
                      Visuels du produit
                    </h3>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/20">
                    {(f.images || []).length} photo{(f.images || []).length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Grille des photos */}
                {(f.images || []).length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5">
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
                          className={`group relative rounded-lg border overflow-hidden bg-[#0F0F0F] aspect-[4/5] flex flex-col justify-between transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
                            isDragged
                              ? "opacity-40 scale-95 ring-2 ring-[#C9A96E]/60 border-dashed border-[#C9A96E]"
                              : isOver
                              ? "ring-2 ring-[#C9A96E] scale-[1.02] border-[#C9A96E] shadow-md z-10 bg-[#C9A96E]/10"
                              : isCover
                              ? "border-[#C9A96E] ring-1 ring-[#C9A96E]/40"
                              : "border-[#E5DDD0] dark:border-[#2D2A26] hover:border-[#C9A96E]/50"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-full object-cover pointer-events-none"
                          />

                          {/* Badge de position */}
                          <div className="absolute top-1 left-1 right-1 flex items-center justify-between pointer-events-none">
                            {isCover ? (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-[#C9A96E] text-[#111827] flex items-center gap-0.5 shadow-xs">
                                <Star className="w-2 h-2 fill-[#111827]" /> 1 • Couv.
                              </span>
                            ) : isHover ? (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-[#111827]/85 text-white shadow-xs">
                                2 • Survol
                              </span>
                            ) : (
                              <span className="px-1 py-0.2 rounded text-[8px] font-medium bg-black/75 text-white">
                                #{idx + 1}
                              </span>
                            )}

                            <div className="w-3.5 h-3.5 rounded bg-black/60 flex items-center justify-center text-white/80">
                              <GripVertical className="w-2 h-2" />
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex items-center justify-between gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-0.5">
                              {!isCover && (
                                <button
                                  type="button"
                                  title="Photo principale"
                                  onClick={() => setPrimaryImage(idx)}
                                  className="p-1 rounded bg-black/60 hover:bg-[#C9A96E] text-white hover:text-[#111827] transition-colors cursor-pointer"
                                >
                                  <Star className="w-2.5 h-2.5" />
                                </button>
                              )}
                              {idx > 0 && (
                                <button
                                  type="button"
                                  title="Gauche"
                                  onClick={() => moveImage(idx, idx - 1)}
                                  className="p-1 rounded bg-black/60 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                >
                                  <ArrowLeft className="w-2.5 h-2.5" />
                                </button>
                              )}
                              {idx < (f.images || []).length - 1 && (
                                <button
                                  type="button"
                                  title="Droite"
                                  onClick={() => moveImage(idx, idx + 1)}
                                  className="p-1 rounded bg-black/60 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                >
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              title="Supprimer"
                              onClick={() => removeImage(idx)}
                              className="p-1 rounded bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bouton d'ajout */}
                <div>
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
                    className={`w-full flex items-center justify-center gap-1.5 p-1.5 text-xs font-medium rounded-xl border border-dashed transition-all cursor-pointer ${
                      isDraggingFiles
                        ? "border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]"
                        : "border-[#C9A96E]/40 hover:border-[#C9A96E] bg-white dark:bg-[#141312] hover:bg-[#C9A96E]/10 text-[#1A1816] dark:text-[#FAF7F2]"
                    } disabled:opacity-50`}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-[#C9A96E]" />
                        <span>Téléversement...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <span>
                          {(f.images || []).length === 0
                            ? "Ajouter des photos (ou glisser-déposer)"
                            : "Ajouter d'autres photos"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </section>

              {/* Carte 4 : Catégories du parfum */}
              <section className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-3 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E] flex items-center gap-1.5">
                    <FolderTree className="w-3 h-3 text-[#C9A96E]" />
                    <span>{isCosmetic ? "Catégories du cosmétique *" : "Catégories du produit *"}</span>
                  </h3>
                  <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-[#C9A96E]/10 text-[#C9A96E] border border-[#C9A96E]/20">
                    {selectedCategoriesCount === 0
                      ? "Sélectionner"
                      : selectedCategoriesCount === 1
                      ? availableCategories.find((c) => c.slug === f.categories[0])?.name || f.categories[0]
                      : `${selectedCategoriesCount} sélectionnées`}
                  </span>
                </div>

                {/* Recherche si plus de 4 catégories */}
                {availableCategories.length > 4 && (
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                      type="text"
                      className={inputCls + " pl-7 py-1 text-[11px]"}
                      placeholder="Filtrer les univers..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                    />
                    {categorySearch && (
                      <button
                        type="button"
                        onClick={() => setCategorySearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1A1816]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Grille des catégories */}
                {filteredCategories.length > 0 ? (
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[100px] overflow-y-auto pr-0.5 p-0.5 ${errors.category || errors.categories ? "ring-1 ring-red-500/50 rounded-lg" : ""}`}>
                    {filteredCategories.map((cat) => {
                      const isSelected = (f.categories || []).includes(cat.slug);
                      const isPrimary = (f.categories || [])[0] === cat.slug;
                      return (
                        <button
                          key={cat.id || cat.slug}
                          type="button"
                          onClick={() => toggleCategory(cat.slug)}
                          className={`p-1.5 text-left rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                            isSelected
                              ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] border-[#111827] dark:border-[#C9A96E] font-semibold shadow-xs"
                              : "bg-white dark:bg-[#141312] text-[#4B5563] dark:text-[#9CA3AF] border-[#E5DDD0] dark:border-[#2D2A26] hover:border-[#C9A96E]/50"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Layers className={`w-3 h-3 shrink-0 ${isSelected ? "text-[#C9A96E] dark:text-[#111827]" : "text-[#9CA3AF]"}`} />
                            <span className="text-[11px] truncate">{cat.name}</span>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-1 shrink-0">
                              {isPrimary && (
                                <span className="text-[8px] px-1 py-0.2 rounded bg-[#C9A96E] text-[#111827] dark:bg-black dark:text-[#C9A96E] font-bold">
                                  Principal
                                </span>
                              )}
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2 rounded-lg border border-dashed border-[#E5DDD0] dark:border-[#2D2A26] text-center">
                    <p className="text-[10px] text-[#7A726A] dark:text-[#A39B91]">
                      Aucune catégorie trouvée
                    </p>
                  </div>
                )}

                {(errors.category || errors.categories) && (
                  <div className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.category || errors.categories}</span>
                  </div>
                )}
              </section>

              {/* Carte 5 : Visibilité & Badges — Format Horizontal 3 Colonnes Compact */}
              <section className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-3 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-1.5">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E]">Visibilité & Badges</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <label className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px] p-2 rounded-lg bg-white dark:bg-[#141312] border border-[#E5DDD0] dark:border-[#2D2A26] cursor-pointer">
                    <span className="font-medium text-[#1A1816] dark:text-[#FAF7F2] truncate">Actif en boutique</span>
                    <Switch checked={f.active} onCheckedChange={(v) => set("active", v)} />
                  </label>
                  <label className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px] p-2 rounded-lg bg-white dark:bg-[#141312] border border-[#E5DDD0] dark:border-[#2D2A26] cursor-pointer">
                    <span className="font-medium text-[#1A1816] dark:text-[#FAF7F2] truncate">Nouveau</span>
                    <Switch checked={f.isNew} onCheckedChange={(v) => set("isNew", v)} />
                  </label>
                  <label className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px] p-2 rounded-lg bg-white dark:bg-[#141312] border border-[#E5DDD0] dark:border-[#2D2A26] cursor-pointer">
                    <span className="font-medium text-[#1A1816] dark:text-[#FAF7F2] truncate">Best Seller</span>
                    <Switch checked={f.isBestseller} onCheckedChange={(v) => set("isBestseller", v)} />
                  </label>
                </div>
              </section>
            </div>
          </div>
        </form>

        {/* PIED DE PAGE FIXE COMPACT */}
        <div className="p-2.5 sm:p-3 px-4 sm:px-6 bg-[#FAF7F2] dark:bg-[#1C1A18] border-t border-[#EAE3D8] dark:border-[#24211E] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 z-10 shadow-xs">
          <div className="text-[10px] sm:text-[11px] text-[#7A726A] dark:text-[#A39B91] flex items-center flex-wrap gap-1.5">
            {f.name && <span className="font-semibold text-[#1A1816] dark:text-[#FAF7F2]">{f.name}</span>}
            {f.price && <span>• {f.price} €</span>}
            {f.volume && <span>• {f.volume} ml</span>}
            {f.stock && <span>• {f.stock} en stock</span>}
            {(f.images || []).length > 0 && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#C9A96E]/10 text-[#C9A96E]">
                {(f.images || []).length} photo{(f.images || []).length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5DDD0] dark:border-[#2D2A26] text-[#1A1816] dark:text-[#FAF7F2] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={saving || uploading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-[#C9A96E] to-[#b39155] text-[#111827] hover:brightness-110 shadow-xs shadow-[#C9A96E]/20 disabled:opacity-60 transition-all cursor-pointer"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>{initial ? "Mettre à jour" : "Créer le produit"}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
