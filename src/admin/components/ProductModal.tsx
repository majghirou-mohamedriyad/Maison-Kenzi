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
import type { Gender, ProductCustomOption, ProductOptionValue } from "@/data/parfums";
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
  Sliders,
  Paintbrush,
  Ruler,
  Type,
  HelpCircle,
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
  weightUnit: "g" as "mg" | "g" | "kg",
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
  hasTiers: false,
  tiers: [] as Array<{ quantity: number | string; price: number | string; label: string; label_en?: string }>,
  hasCustomOptions: false,
  customOptions: [] as ProductCustomOption[],
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

  // Détection si l'univers actif ou sélectionné est Bazar Chic
  const isBazarChic = useMemo(() => {
    const cat = (defaultCategory || f.category || "").toLowerCase();
    const cats = (f.categories || []).map((c) => c.toLowerCase());
    return (
      cat.includes("bazar") ||
      cat.includes("chic") ||
      cat.includes("antique") ||
      cat.includes("antiquite") ||
      cats.some(
        (c) =>
          c.includes("bazar") ||
          c.includes("chic") ||
          c.includes("antique") ||
          c.includes("antiquite")
      )
    );
  }, [defaultCategory, f.category, f.categories]);

  // Détection si l'univers actif ou sélectionné est Produits Artisanaux
  const isArtisanal = useMemo(() => {
    if (isBazarChic) return false;
    const cat = (defaultCategory || f.category || "").toLowerCase();
    const cats = (f.categories || []).map((c) => c.toLowerCase());
    return (
      cat.includes("artisan") ||
      cats.some((c) => c.includes("artisan"))
    );
  }, [defaultCategory, f.category, f.categories, isBazarChic]);

  // Détection si l'univers actif ou sélectionné est Cosmétiques
  const isCosmetic = useMemo(() => {
    if (isArtisanal || isBazarChic) return false;
    const cat = (defaultCategory || f.category || "").toLowerCase();
    const cats = (f.categories || []).map((c) => c.toLowerCase());
    return cat.includes("cosmetique") || cats.some((c) => c.includes("cosmetique"));
  }, [defaultCategory, f.category, f.categories, isArtisanal, isBazarChic]);

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

        const isCosm =
          (defaultCategory || "").toLowerCase().includes("cosmetique") ||
          (initial.category || "").toLowerCase().includes("cosmetique") ||
          initialCategories.some((c) => c.toLowerCase().includes("cosmetique"));

        // Extraction précise des valeurs de poids et volume
        let initWeightVal = (initial as any).weight_value || "";
        let initWeightUnit: "mg" | "g" | "kg" = (initial as any).weight_unit || "g";
        let initVolumeVal = (initial as any).volume_value || "";
        let initVolumeUnit: "ml" | "L" = (initial as any).volume_unit || "ml";

        const labelText = ((initial.imageLabel || "") + " " + (initial.description || "")).toLowerCase();
        
        if (!initWeightVal) {
          const weightMatch = labelText.match(/(\d+(?:\.\d+)?)\s*(kg|g|mg)\b/i);
          if (weightMatch) {
            initWeightVal = weightMatch[1];
            const u = weightMatch[2].toLowerCase();
            initWeightUnit = u === "kg" ? "kg" : u === "mg" ? "mg" : "g";
          }
        }

        if (!initVolumeVal) {
          const volMatch = labelText.match(/(\d+(?:\.\d+)?)\s*(l|ml)\b/i);
          if (volMatch) {
            initVolumeVal = volMatch[1];
            initVolumeUnit = volMatch[2].toLowerCase() === "l" ? "L" : "ml";
          } else if (!isCosm) {
            // Pour les parfums classiques uniquement, le volume par défaut provient de full_bottle_volume_ml
            initVolumeVal = initialVolume;
          }
        }

        const rawImageLabel = initial.imageLabel || (initial as any).image_label || "";
        const cleanImageLabel = rawImageLabel.startsWith("[") ? "" : rawImageLabel;
        const rawImageLabelEn = (initial as any).image_label_en || (initial as any).imageLabelEn || "";
        const cleanImageLabelEn = rawImageLabelEn.startsWith("[") ? "" : rawImageLabelEn;

        let initTiers: any[] = [];
        const rawInitTiers = (initial as any).quantity_tiers ?? (initial as any).quantityTiers;
        if (Array.isArray(rawInitTiers)) {
          initTiers = rawInitTiers;
        } else if (typeof rawInitTiers === "string") {
          try {
            const parsed = JSON.parse(rawInitTiers);
            if (Array.isArray(parsed)) initTiers = parsed;
          } catch {}
        }

        const hasTiersInit = !!(initial.has_tiers || (initial as any).hasTiers || initTiers.length > 0);

        // Parsing des options de personnalisation client
        let initCustomOptions: ProductCustomOption[] = [];
        const rawCustomOpts = (initial as any).custom_options ?? (initial as any).customOptions;
        if (Array.isArray(rawCustomOpts)) {
          initCustomOptions = rawCustomOpts;
        } else if (typeof rawCustomOpts === "string") {
          try {
            const parsed = JSON.parse(rawCustomOpts);
            if (Array.isArray(parsed)) initCustomOptions = parsed;
          } catch {}
        }

        const normalizedCustomOptions: ProductCustomOption[] = initCustomOptions.map((opt, idx) => ({
          id: opt.id || `opt_${Date.now()}_${idx}`,
          title: opt.title || "",
          title_en: opt.title_en || (opt as any).titleEn || "",
          type: opt.type || "select",
          required: opt.required ?? true,
          values: (opt.values || []).map((val, vIdx) => ({
            id: val.id || `val_${Date.now()}_${vIdx}`,
            label: val.label || "",
            label_en: val.label_en || (val as any).labelEn || "",
            price_modifier: val.price_modifier ?? (val as any).priceModifier ?? 0,
            color_code: val.color_code || (val as any).colorCode || "",
          })),
        }));

        const hasCustomOptsInit = !!(
          initial.has_custom_options ||
          (initial as any).hasCustomOptions ||
          normalizedCustomOptions.length > 0
        );

        setF({
          name: initial.name || "",
          nameEn: (initial as any).name_en || (initial as any).nameEn || "",
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
          notesEn: (initial as any).notes_en || (initial as any).notesEn || "",
          description: initial.description || "",
          descriptionEn: (initial as any).description_en || (initial as any).descriptionEn || "",
          imageLabel: cleanImageLabel,
          imageLabelEn: cleanImageLabelEn,
          imageUrl: initialImages[0] || initial.image_url || "",
          images: initialImages,
          active: initial.active ?? true,
          isNew: !!initial.isNew,
          isBestseller: !!initial.isBestseller,
          hasTiers: hasTiersInit,
          tiers: initTiers.map((t) => ({
            quantity: Number(t.quantity) || 1,
            price: Number(t.price) || 0,
            label: t.label || "",
            label_en: t.label_en || t.labelEn || "",
          })),
          hasCustomOptions: hasCustomOptsInit,
          customOptions: normalizedCustomOptions,
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

  const addTier = () => {
    setF((prev) => ({
      ...prev,
      hasTiers: true,
      tiers: [
        ...(prev.tiers || []),
        {
          quantity: "" as any,
          price: "" as any,
          label: "",
          label_en: "",
        },
      ],
    }));
  };

  const updateTier = (index: number, field: "quantity" | "price" | "label" | "label_en", value: any) => {
    setF((prev) => {
      const nextTiers = [...(prev.tiers || [])];
      if (!nextTiers[index]) return prev;
      nextTiers[index] = { ...nextTiers[index], [field]: value };
      return { ...prev, tiers: nextTiers };
    });
  };

  const removeTier = (index: number) => {
    setF((prev) => {
      const nextTiers = (prev.tiers || []).filter((_, i) => i !== index);
      return { ...prev, tiers: nextTiers };
    });
  };

  const addCustomOption = (templateType: "color" | "size" | "finish" | "text" | "blank" = "blank") => {
    let newOption: ProductCustomOption;
    const now = Date.now();

    if (templateType === "color") {
      newOption = {
        id: `opt_${now}`,
        title: "Choix de la Couleur",
        title_en: "Color Selection",
        type: "color",
        required: true,
        values: [
          { id: `val_${now}_1`, label: "Noir Ébène", label_en: "Ebony Black", color_code: "#1A1816", price_modifier: 0 },
          { id: `val_${now}_2`, label: "Doré Champagne", label_en: "Champagne Gold", color_code: "#D4AF37", price_modifier: 0 },
          { id: `val_${now}_3`, label: "Albâtre Crème", label_en: "Cream Alabaster", color_code: "#F5F2EB", price_modifier: 0 },
          { id: `val_${now}_4`, label: "Nude Travertin", label_en: "Travertine Nude", color_code: "#D9C9B4", price_modifier: 0 },
        ],
      };
    } else if (templateType === "size") {
      newOption = {
        id: `opt_${now}`,
        title: "Taille / Dimensions",
        title_en: "Size / Dimensions",
        type: "size",
        required: true,
        values: [
          { id: `val_${now}_1`, label: "Petit Modèle (S)", label_en: "Small (S)", price_modifier: 0 },
          { id: `val_${now}_2`, label: "Moyen Modèle (M)", label_en: "Medium (M)", price_modifier: 10 },
          { id: `val_${now}_3`, label: "Grand Modèle (L)", label_en: "Large (L)", price_modifier: 20 },
        ],
      };
    } else if (templateType === "finish") {
      newOption = {
        id: `opt_${now}`,
        title: "Matière / Finition",
        title_en: "Material / Finish",
        type: "select",
        required: false,
        values: [
          { id: `val_${now}_1`, label: "Laiton Brossé", label_en: "Brushed Brass", price_modifier: 0 },
          { id: `val_${now}_2`, label: "Bois d'Olivier", label_en: "Olive Wood", price_modifier: 5 },
          { id: `val_${now}_3`, label: "Marbre Poli", label_en: "Polished Marble", price_modifier: 15 },
        ],
      };
    } else if (templateType === "text") {
      newOption = {
        id: `opt_${now}`,
        title: "Personnalisation / Gravure sur-mesure",
        title_en: "Custom Engraving / Name",
        type: "text",
        required: false,
        values: [],
      };
    } else {
      newOption = {
        id: `opt_${now}`,
        title: "",
        title_en: "",
        type: "select",
        required: true,
        values: [
          { id: `val_${now}_1`, label: "", label_en: "", price_modifier: 0 },
        ],
      };
    }

    setF((prev) => ({
      ...prev,
      hasCustomOptions: true,
      customOptions: [...(prev.customOptions || []), newOption],
    }));
  };

  const updateCustomOption = (optIndex: number, field: string, value: any) => {
    setF((prev) => {
      const next = [...(prev.customOptions || [])];
      if (!next[optIndex]) return prev;
      next[optIndex] = { ...next[optIndex], [field]: value };
      return { ...prev, customOptions: next };
    });
  };

  const removeCustomOption = (optIndex: number) => {
    setF((prev) => {
      const next = (prev.customOptions || []).filter((_, i) => i !== optIndex);
      return {
        ...prev,
        customOptions: next,
        hasCustomOptions: next.length > 0 ? prev.hasCustomOptions : false,
      };
    });
  };

  const addOptionValue = (optIndex: number) => {
    setF((prev) => {
      const next = [...(prev.customOptions || [])];
      if (!next[optIndex]) return prev;
      const target = next[optIndex];
      const now = Date.now();
      const nextValues = [
        ...(target.values || []),
        {
          id: `val_${now}_${(target.values || []).length + 1}`,
          label: "",
          label_en: "",
          price_modifier: 0,
          color_code: target.type === "color" ? "#1A1816" : undefined,
        },
      ];
      next[optIndex] = { ...target, values: nextValues };
      return { ...prev, customOptions: next };
    });
  };

  const updateOptionValue = (optIndex: number, valIndex: number, field: string, value: any) => {
    setF((prev) => {
      const next = [...(prev.customOptions || [])];
      if (!next[optIndex]) return prev;
      const target = next[optIndex];
      const nextValues = [...(target.values || [])];
      if (!nextValues[valIndex]) return prev;
      nextValues[valIndex] = { ...nextValues[valIndex], [field]: value };
      next[optIndex] = { ...target, values: nextValues };
      return { ...prev, customOptions: next };
    });
  };

  const removeOptionValue = (optIndex: number, valIndex: number) => {
    setF((prev) => {
      const next = [...(prev.customOptions || [])];
      if (!next[optIndex]) return prev;
      const target = next[optIndex];
      const nextValues = (target.values || []).filter((_, i) => i !== valIndex);
      next[optIndex] = { ...target, values: nextValues };
      return { ...prev, customOptions: next };
    });
  };

  const set = (key: string, val: any) => {
    setF((prev) => ({ ...prev, [key]: val }));
    if (errors[key] || ((key === "weightValue" || key === "volumeValue") && errors.volume)) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        if (key === "weightValue" || key === "volumeValue") {
          delete next.volume;
        }
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
      if (file.size > 15 * 1024 * 1024) {
        toast.error(`"${file.name}" dépasse 15 Mo.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      setUploading(true);
      const id = initial?.id && isUuid(initial.id) ? initial.id : crypto.randomUUID();
      const uploadedUrls: string[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const fileToUpload = validFiles[i];
        try {
          const url = await uploadProductImage(id, fileToUpload);
          uploadedUrls.push(url);
        } catch (err) {
          console.error("Erreur upload Supabase Storage, bascule en local data-URL:", err);
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(fileToUpload);
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
      errs.name = isBazarChic
        ? "Veuillez renseigner le nom du produit Bazar Chic"
        : isArtisanal
        ? "Veuillez renseigner le nom du produit artisanal"
        : isCosmetic
        ? "Veuillez renseigner le nom du produit cosmétique"
        : "Veuillez renseigner le nom du parfum";
    }

    if (!isArtisanal && !isBazarChic) {
      if (!f.maison.trim()) {
        errs.maison = isCosmetic
          ? "Veuillez renseigner la marque ou laboratoire"
          : "Veuillez renseigner la maison ou marque";
      }

      if (!isCosmetic) {
        if (!f.gender) errs.gender = "Veuillez sélectionner un genre";
        const currentSeasons = Array.isArray(f.seasons) ? f.seasons : [];
        if (currentSeasons.length === 0) errs.seasons = "Veuillez sélectionner au moins une saison d'utilisation";
        if (!f.notes.trim()) {
          errs.notes = "Veuillez renseigner au moins une note olfactive (séparées par une virgule)";
        }
      }
    }

    const numPrice = Number(f.price);
    if (f.price === "" || isNaN(numPrice) || numPrice < 0) {
      errs.price = "Veuillez renseigner un prix de vente valide (0 ou supérieur)";
    }

    if (f.stock === "" || isNaN(Number(f.stock)) || Number(f.stock) < 0) {
      errs.stock = "Veuillez renseigner le stock disponible";
    }

    const currentCategories = Array.isArray(f.categories) && f.categories.length > 0
      ? f.categories
      : (f.category ? [f.category] : (isBazarChic ? ["bazar-chic"] : isArtisanal ? ["artisanat"] : isCosmetic ? ["cosmetiques"] : []));

    if (currentCategories.length === 0) {
      errs.category = "Veuillez sélectionner au moins une catégorie pour le produit";
    }

    // Gestion du volume et poids
    let calculatedVolumeMl = 0;
    if (isBazarChic || isArtisanal) {
      calculatedVolumeMl = 100;
    } else if (isCosmetic) {
      const hasWeight = !!f.weightValue && Number(f.weightValue) > 0;
      const hasVol = !!f.volumeValue && Number(f.volumeValue) > 0;
      if (!hasWeight && !hasVol) {
        errs.volume = "Veuillez renseigner au moins un champ : Poids solide / pâte ou Volume liquide";
      }
      if (hasVol) {
        calculatedVolumeMl = f.volumeUnit === "L" ? Number(f.volumeValue) * 1000 : Number(f.volumeValue);
      } else if (hasWeight) {
        calculatedVolumeMl = f.weightUnit === "kg" ? Number(f.weightValue) * 1000 : f.weightUnit === "mg" ? Math.max(1, Math.round(Number(f.weightValue) / 1000)) : Number(f.weightValue);
      } else {
        calculatedVolumeMl = 100;
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

    const currentSeasonsList = (isBazarChic || isArtisanal || isCosmetic)
      ? []
      : (Array.isArray(f.seasons) && f.seasons.length > 0
        ? f.seasons
        : ["Printemps", "Été"]);

    const cosmeticFormatLabel = [
      f.weightValue ? `${f.weightValue} ${f.weightUnit}` : "",
      f.volumeValue ? `${f.volumeValue} ${f.volumeUnit}` : "",
    ].filter(Boolean).join(" • ");

    const finalImageLabel = (f.imageLabel && f.imageLabel.length > 0)
      ? f.imageLabel
      : (isCosmetic ? cosmeticFormatLabel : (slugify(f.name) || "produit"));

    const finalImageLabelEn = (f.imageLabelEn && f.imageLabelEn.length > 0)
      ? f.imageLabelEn
      : undefined;

    const payload: AdminParfum = {
      id,
      name: f.name.trim(),
      name_en: f.nameEn ? f.nameEn.trim() : undefined,
      maison: f.maison.trim() || (isBazarChic || isArtisanal ? "Maison Kenzi" : ""),
      gender: (isBazarChic || isArtisanal || isCosmetic) ? undefined : (f.gender || "Mixte"),
      category: (currentCategories[0] || "") as any,
      categories: currentCategories,
      seasons: currentSeasonsList,
      description: f.description || "",
      description_en: f.descriptionEn ? f.descriptionEn : undefined,
      notes_en: f.notesEn ? f.notesEn.trim() : undefined,
      notes: {
        tete: parsedNotes.length > 0 ? parsedNotes : (isBazarChic ? ["Bazar Chic"] : isArtisanal ? ["Artisanat d'Art"] : isCosmetic ? ["Soin Cosmétique"] : ["Essence"]),
        coeur: [],
        fond: [],
      },
      prices: {
        "5ml": numPrice,
        "10ml": numPrice,
        "100ml": numPrice,
      },
      imageLabel: finalImageLabel,
      image_label_en: finalImageLabelEn,
      image_url: primaryImageUrl,
      images: finalImages,
      isNew: f.isNew,
      isBestseller: f.isBestseller,
      active: f.active,
      stock: numStock,
      stock_5ml: numStock,
      stock_10ml: numStock,
      sale_mode: "full_bottle",
      full_bottle_volume_ml: (isBazarChic || isArtisanal) ? null : (calculatedVolumeMl > 0 ? calculatedVolumeMl : null),
      full_bottle_price: numPrice,
      full_bottle_stock: numStock,
      full_bottle_limited: false,
      has_tiers: f.hasTiers,
      quantity_tiers: f.hasTiers
        ? (f.tiers || [])
            .filter((t) => Number(t.quantity) > 0 && Number(t.price) > 0)
            .sort((a, b) => Number(a.quantity) - Number(b.quantity))
            .map((t) => ({
              quantity: Number(t.quantity),
              price: Number(t.price),
              label: t.label?.trim() || undefined,
              label_en: t.label_en?.trim() || undefined,
            }))
        : [],
      has_custom_options: f.hasCustomOptions,
      custom_options: f.hasCustomOptions
        ? (f.customOptions || [])
            .filter((opt) => opt.title.trim().length > 0)
            .map((opt) => ({
              ...opt,
              title: opt.title.trim(),
              title_en: opt.title_en?.trim() || undefined,
              values: (opt.values || [])
                .filter((v) => v.label.trim().length > 0)
                .map((v) => ({
                  ...v,
                  label: v.label.trim(),
                  label_en: v.label_en?.trim() || undefined,
                  price_modifier: Number(v.price_modifier) || 0,
                  color_code: v.color_code?.trim() || undefined,
                })),
            }))
        : [],
      weight_value: isCosmetic ? (f.weightValue || undefined) : undefined,
      weight_unit: isCosmetic ? f.weightUnit : undefined,
      volume_value: isCosmetic ? (f.volumeValue || undefined) : undefined,
      volume_unit: isCosmetic ? f.volumeUnit : undefined,
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
            : isArtisanal
            ? "Nouveau produit artisanal enregistré avec succès"
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
    if (cat.includes("bazar") || cat.includes("bazar-chic") || cat.includes("antique") || cat.includes("antiquite")) {
      return {
        title: "Nouveau Produit Bazar Chic",
        subtitle: "Renseignez les détails pour ajouter une création tendance ou objet d'exception.",
        icon: Sparkles,
      };
    }
    if (cat.includes("artisan") || cat.includes("artisanat") || cat.includes("artisanaux")) {
      return {
        title: "Nouveau Produit Artisanal",
        subtitle: "Renseignez les détails pour ajouter une création artisanale et savoir-faire d'art.",
        icon: Palette,
      };
    }
    if (cat.includes("cosmetique")) {
      return {
        title: "Nouveau Produit Cosmétique",
        subtitle: "Renseignez les détails pour ajouter un nouveau soin ou cosmétique d'exception.",
        icon: Flower2,
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
              {isBazarChic ? (
                /* ============================================================ */
                /* FORMULAIRE DÉDIÉ : BAZAR CHIC & OPTIONS CLIENT               */
                /* ============================================================ */
                <>
                  {/* Carte 1 : Informations Générales & Tarifs */}
                  <section className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-3 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2.5">
                    <div className="flex items-center gap-2 pb-1 border-b border-[#E5DDD0]/60 dark:border-[#2D2A26]/60">
                      <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]" />
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E]">
                        Informations générales & Tarifs
                      </h3>
                    </div>

                    <div className="space-y-2.5">
                      {/* Nom du produit */}
                      <div>
                        <label className={labelCls}>Nom du produit Bazar Chic *</label>
                        <input
                          className={errors.name ? inputErrorCls : inputCls}
                          value={f.name}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder="Ex: Miroir Soleil en Laiton ou Vase Céramique Vintage"
                        />
                        {errors.name && (
                          <div className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5 font-medium">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Tarification & Stock (2 colonnes) */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Prix */}
                        <div>
                          <label className={labelCls}>Prix de vente (€) *</label>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              className={(errors.price ? inputErrorCls : inputCls) + " pr-6 font-semibold"}
                              value={f.price}
                              onChange={(e) => set("price", e.target.value)}
                              placeholder="0"
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
                            placeholder="10"
                          />
                          {errors.stock && (
                            <div className="text-[10px] text-red-500 mt-0.5">{errors.stock}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Carte 2 : Descriptions & Présentation (Bilingue FR / EN) */}
                  <section className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-3 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-[#E5DDD0]/60 dark:border-[#2D2A26]/60">
                      <div className="flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E]">
                          Description & Présentation
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

                    {contentLang === "fr" ? (
                      <div className="space-y-2 animate-in fade-in duration-150">
                        <div>
                          <label className={labelCls}>Sous-titre / Accroche (FR)</label>
                          <input
                            className={inputCls}
                            value={f.imageLabel}
                            onChange={(e) => set("imageLabel", e.target.value)}
                            placeholder="Ex: Objet d'exception & pièce maîtresse de décoration"
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Description détaillée (FR)</label>
                          <textarea
                            rows={3}
                            className={inputCls + " resize-none"}
                            value={f.description}
                            onChange={(e) => set("description", e.target.value)}
                            placeholder="Décrivez l'histoire de la création, son style, ses matériaux nobles et ses finitions..."
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 animate-in fade-in duration-150">
                        <div>
                          <label className={labelCls}>Product Name (EN - Optional)</label>
                          <input
                            className={inputCls}
                            value={f.nameEn}
                            onChange={(e) => set("nameEn", e.target.value)}
                            placeholder="Ex: Handcrafted Brass Sun Mirror"
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Subtitle / Tagline (EN - Optional)</label>
                          <input
                            className={inputCls}
                            value={f.imageLabelEn}
                            onChange={(e) => set("imageLabelEn", e.target.value)}
                            placeholder="Ex: Timeless chic lifestyle piece"
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Detailed Description (EN - Optional)</label>
                          <textarea
                            rows={3}
                            className={inputCls + " resize-none"}
                            value={f.descriptionEn}
                            onChange={(e) => set("descriptionEn", e.target.value)}
                            placeholder="Describe the craft, premium materials, and unique aesthetics in English..."
                          />
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Carte 3 : Options de Personnalisation pour le Client */}
                  <section className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-3 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2.5">
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5DDD0]/60 dark:border-[#2D2A26]/60">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E]">
                            Options de Personnalisation Client
                          </h3>
                          <p className="text-[9px] text-[#7A726A] dark:text-[#A39B91]">
                            Couleurs, tailles/formats, finitions ou gravure au choix du client
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91]">
                          {f.hasCustomOptions ? "Actif" : "Désactivé"}
                        </span>
                        <Switch
                          checked={f.hasCustomOptions}
                          onCheckedChange={(val) => {
                            set("hasCustomOptions", val);
                            if (val && (!f.customOptions || f.customOptions.length === 0)) {
                              addCustomOption("color");
                            }
                          }}
                        />
                      </div>
                    </div>

                    {f.hasCustomOptions && (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        {/* Boutons d'ajout rapide de modèles d'options */}
                        <div className="p-2 bg-white/70 dark:bg-[#141312]/70 rounded-xl border border-[#E5DDD0]/80 dark:border-[#2D2A26]/80 space-y-1.5">
                          <span className="text-[9px] font-semibold text-[#7A726A] dark:text-[#A39B91] uppercase tracking-wider block">
                            Ajouter une option en 1 clic :
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => addCustomOption("color")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-[#FAF7F2] dark:bg-[#1F1C19] border border-[#E5DDD0] dark:border-[#2D2A26] text-[#1A1816] dark:text-[#FAF7F2] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all cursor-pointer"
                            >
                              <Paintbrush className="w-3 h-3 text-[#C9A96E]" />
                              <span>+ Couleurs</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => addCustomOption("size")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-[#FAF7F2] dark:bg-[#1F1C19] border border-[#E5DDD0] dark:border-[#2D2A26] text-[#1A1816] dark:text-[#FAF7F2] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all cursor-pointer"
                            >
                              <Ruler className="w-3 h-3 text-[#C9A96E]" />
                              <span>+ Tailles / Dimensions</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => addCustomOption("finish")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-[#FAF7F2] dark:bg-[#1F1C19] border border-[#E5DDD0] dark:border-[#2D2A26] text-[#1A1816] dark:text-[#FAF7F2] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all cursor-pointer"
                            >
                              <Sliders className="w-3 h-3 text-[#C9A96E]" />
                              <span>+ Finitions</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => addCustomOption("text")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-[#FAF7F2] dark:bg-[#1F1C19] border border-[#E5DDD0] dark:border-[#2D2A26] text-[#1A1816] dark:text-[#FAF7F2] hover:border-[#C9A96E] hover:text-[#C9A96E] transition-all cursor-pointer"
                            >
                              <Type className="w-3 h-3 text-[#C9A96E]" />
                              <span>+ Gravure / Prénom</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => addCustomOption("blank")}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-[#C9A96E] hover:bg-[#C9A96E]/20 transition-all cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Personnalisée</span>
                            </button>
                          </div>
                        </div>

                        {/* Liste des groupes d'options configurés */}
                        {(!f.customOptions || f.customOptions.length === 0) ? (
                          <div className="text-center py-4 px-2 rounded-xl border border-dashed border-[#E5DDD0] dark:border-[#2D2A26] bg-white/40 dark:bg-[#141312]/40">
                            <Sliders className="w-5 h-5 mx-auto text-[#C9A96E]/60 mb-1" />
                            <p className="text-[10px] text-[#7A726A] dark:text-[#A39B91]">
                              Aucune option configurée. Cliquez sur l'un des boutons ci-dessus pour ajouter vos choix de couleurs, tailles ou finitions.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {f.customOptions.map((opt, optIdx) => (
                              <div
                                key={opt.id || optIdx}
                                className="p-2.5 bg-white dark:bg-[#141312] rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2"
                              >
                                {/* En-tête du groupe d'option */}
                                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5DDD0]/50 dark:border-[#2D2A26]/50">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="w-4 h-4 rounded-full bg-[#C9A96E] text-[#111827] text-[9px] font-bold flex items-center justify-center shrink-0">
                                      {optIdx + 1}
                                    </span>
                                    <span className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2] truncate">
                                      {opt.title || `Option ${optIdx + 1}`}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {/* Type d'affichage */}
                                    <select
                                      value={opt.type || "select"}
                                      onChange={(e) => updateCustomOption(optIdx, "type", e.target.value)}
                                      className="px-2 py-0.5 text-[9px] font-semibold bg-[#FAF7F2] dark:bg-[#1F1C19] border border-[#E5DDD0] dark:border-[#2D2A26] rounded-md text-[#1A1816] dark:text-[#FAF7F2] focus:outline-none cursor-pointer"
                                    >
                                      <option value="color">Palette Couleurs (Pastilles)</option>
                                      <option value="size">Tailles & Formats</option>
                                      <option value="select">Liste déroulante</option>
                                      <option value="text">Texte libre / Gravure</option>
                                    </select>

                                    {/* Obligatoire */}
                                    <label className="flex items-center gap-1 text-[9px] font-medium text-[#7A726A] dark:text-[#A39B91] cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={opt.required ?? true}
                                        onChange={(e) => updateCustomOption(optIdx, "required", e.target.checked)}
                                        className="rounded text-[#C9A96E] focus:ring-[#C9A96E]"
                                      />
                                      <span>Requis</span>
                                    </label>

                                    {/* Bouton supprimer groupe */}
                                    <button
                                      type="button"
                                      onClick={() => removeCustomOption(optIdx)}
                                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                                      title="Supprimer cette option"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Titre de l'option (FR & EN) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[9px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-0.5">
                                      Titre de l'option (FR) *
                                    </label>
                                    <input
                                      type="text"
                                      className={inputCls}
                                      value={opt.title}
                                      onChange={(e) => updateCustomOption(optIdx, "title", e.target.value)}
                                      placeholder="Ex: Choix de la Couleur, Taille..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-0.5">
                                      Option Title (EN - Optionnel)
                                    </label>
                                    <input
                                      type="text"
                                      className={inputCls}
                                      value={opt.title_en || ""}
                                      onChange={(e) => updateCustomOption(optIdx, "title_en", e.target.value)}
                                      placeholder="Ex: Color Selection, Dimensions..."
                                    />
                                  </div>
                                </div>

                                {/* Valeurs / Choix disponibles si non textuel */}
                                {opt.type === "text" ? (
                                  <div className="p-2 bg-[#FAF7F2] dark:bg-[#1C1A18] rounded-lg border border-[#E5DDD0]/60 dark:border-[#2D2A26]/60 text-[10px] text-[#7A726A] dark:text-[#A39B91] flex items-center gap-1.5">
                                    <Type className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
                                    <span>
                                      Le client disposera d'un champ texte sur la fiche produit pour saisir son inscription, prénom ou gravure personnalisée.
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5 pt-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-bold text-[#C9A96E] uppercase tracking-wider">
                                        Choix & Variantes disponibles :
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => addOptionValue(optIdx)}
                                        className="text-[9px] font-bold text-[#C9A96E] hover:underline flex items-center gap-1 cursor-pointer"
                                      >
                                        <Plus className="w-3 h-3" />
                                        <span>Ajouter un choix</span>
                                      </button>
                                    </div>

                                    <div className="space-y-1.5">
                                      {(opt.values || []).map((val, valIdx) => (
                                        <div
                                          key={val.id || valIdx}
                                          className="flex items-center gap-1.5 p-1.5 bg-[#FAF7F2]/80 dark:bg-[#1C1A18]/80 rounded-lg border border-[#E5DDD0]/70 dark:border-[#2D2A26]/70"
                                        >
                                          {/* Pastille / Sélecteur de couleur si type couleur */}
                                          {opt.type === "color" && (
                                            <div className="relative shrink-0" title="Choisir la couleur visuelle">
                                              <input
                                                type="color"
                                                value={val.color_code || "#C9A96E"}
                                                onChange={(e) => updateOptionValue(optIdx, valIdx, "color_code", e.target.value)}
                                                className="w-6 h-6 rounded-md border border-[#E5DDD0] dark:border-[#2D2A26] p-0 cursor-pointer overflow-hidden bg-transparent"
                                              />
                                            </div>
                                          )}

                                          {/* Label FR */}
                                          <div className="flex-1 min-w-0">
                                            <input
                                              type="text"
                                              className="w-full px-2 py-1 text-[11px] bg-white dark:bg-[#141312] border border-[#E5DDD0] dark:border-[#2D2A26] rounded-md text-[#1A1816] dark:text-[#FAF7F2] placeholder:text-[#9CA3AF]"
                                              value={val.label}
                                              onChange={(e) => updateOptionValue(optIdx, valIdx, "label", e.target.value)}
                                              placeholder="Libellé FR (ex: Doré Champagne)"
                                            />
                                          </div>

                                          {/* Label EN */}
                                          <div className="flex-1 min-w-0">
                                            <input
                                              type="text"
                                              className="w-full px-2 py-1 text-[11px] bg-white dark:bg-[#141312] border border-[#E5DDD0] dark:border-[#2D2A26] rounded-md text-[#1A1816] dark:text-[#FAF7F2] placeholder:text-[#9CA3AF]"
                                              value={val.label_en || ""}
                                              onChange={(e) => updateOptionValue(optIdx, valIdx, "label_en", e.target.value)}
                                              placeholder="Label EN (ex: Champagne Gold)"
                                            />
                                          </div>

                                          {/* Supplément de prix éventuel */}
                                          <div className="w-20 shrink-0 relative">
                                            <input
                                              type="number"
                                              step="any"
                                              className="w-full px-2 py-1 pr-4 text-[11px] font-semibold bg-white dark:bg-[#141312] border border-[#E5DDD0] dark:border-[#2D2A26] rounded-md text-[#1A1816] dark:text-[#FAF7F2] placeholder:text-[#9CA3AF]"
                                              value={val.price_modifier === 0 ? "" : val.price_modifier ?? ""}
                                              onChange={(e) => updateOptionValue(optIdx, valIdx, "price_modifier", e.target.value === "" ? 0 : Number(e.target.value))}
                                              placeholder="+0"
                                              title="Supplément de prix pour cette variante (+€)"
                                            />
                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#C9A96E] pointer-events-none">
                                              €
                                            </span>
                                          </div>

                                          {/* Bouton supprimer valeur */}
                                          <button
                                            type="button"
                                            onClick={() => removeOptionValue(optIdx, valIdx)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shrink-0 cursor-pointer"
                                            title="Supprimer ce choix"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                </>
              ) : isArtisanal ? (
                /* ============================================================ */
                /* FORMULAIRE DÉDIÉ : PRODUITS ARTISANAUX                       */
                /* ============================================================ */
                <>
                  {/* Carte 1 : Informations générales & Tarifs */}
                  <section className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-3 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2.5">
                    <div className="flex items-center gap-2 pb-1 border-b border-[#E5DDD0]/60 dark:border-[#2D2A26]/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E]">
                        Informations générales & Tarifs
                      </h3>
                    </div>

                    <div className="space-y-2.5">
                      {/* Nom du produit */}
                      <div>
                        <label className={labelCls}>Nom du produit *</label>
                        <input
                          className={errors.name ? inputErrorCls : inputCls}
                          value={f.name}
                          onChange={(e) => set("name", e.target.value)}
                          placeholder="Ex: Plateau en Laiton Ciselé ou Bougie d'Artisan"
                        />
                        {errors.name && (
                          <div className="flex items-center gap-1 text-[10px] text-red-500 mt-0.5 font-medium">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Tarification & Stock (2 colonnes) */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Prix */}
                        <div>
                          <label className={labelCls}>Prix de vente (€) *</label>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              className={(errors.price ? inputErrorCls : inputCls) + " pr-6 font-semibold"}
                              value={f.price}
                              onChange={(e) => set("price", e.target.value)}
                              placeholder="0"
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
                            placeholder="15"
                          />
                          {errors.stock && (
                            <div className="text-[10px] text-red-500 mt-0.5">{errors.stock}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Carte 2 : Paliers Multiples & Offres par Lot (Multi-Pack) */}
                  <section className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-3 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2.5">
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5DDD0]/60 dark:border-[#2D2A26]/60">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E]">
                            Paliers Multiples & Offres par Lot (Multi-Pack)
                          </h3>
                          <p className="text-[9px] text-[#7A726A] dark:text-[#A39B91]">
                            Offres groupées pour 2, 3 pièces ou plus du même produit
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91]">
                          {f.hasTiers ? "Actif" : "Désactivé"}
                        </span>
                        <Switch
                          checked={f.hasTiers}
                          onCheckedChange={(val) => {
                            set("hasTiers", val);
                            if (val && (!f.tiers || f.tiers.length === 0)) {
                              set("tiers", [
                                { quantity: "" as any, price: "" as any, label: "" },
                              ]);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {f.hasTiers && (
                      <div className="space-y-2.5 animate-in fade-in duration-200">
                        {f.tiers.length === 0 ? (
                          <div className="text-center py-3 px-2 rounded-xl border border-dashed border-[#E5DDD0] dark:border-[#2D2A26] bg-white/50 dark:bg-[#141312]/50">
                            <p className="text-[10px] text-[#7A726A] dark:text-[#A39B91] mb-2">
                              Aucun palier configuré.
                            </p>
                            <button
                              type="button"
                              onClick={() => addTier()}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold rounded-lg bg-[#C9A96E] text-white hover:bg-[#B89658] transition-all cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Ajouter un palier</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {f.tiers.map((tier, idx) => {
                              const numQty = Number(tier.quantity) || 0;
                              const numPrice = Number(tier.price) || 0;
                              const baseUnitPrice = Number(f.price) || 0;
                              const unitInTier = numQty > 0 && numPrice > 0 ? (numPrice / numQty).toFixed(2).replace(/\.00$/, '') : 0;
                              const normalTotal = baseUnitPrice * numQty;
                              const savings = numQty > 0 && numPrice > 0 && normalTotal > numPrice ? Number((normalTotal - numPrice).toFixed(2)) : 0;

                              return (
                                <div
                                  key={idx}
                                  className="p-2.5 bg-white dark:bg-[#141312] rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-4 h-4 rounded-full bg-[#C9A96E]/15 text-[#C9A96E] text-[9px] font-bold flex items-center justify-center">
                                        {idx + 1}
                                      </span>
                                      <span className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                                        Palier {idx + 1}{numQty > 0 ? ` (${numQty} ${numQty > 1 ? "pièces reçues" : "pièce reçue"})` : ""}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {savings > 0 && (
                                        <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                          Économie client : {savings} €
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => removeTier(idx)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                                        title="Supprimer ce palier"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                                    <div>
                                      <label className="block text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-1">
                                        Quantité *
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        className={inputCls + " font-semibold"}
                                        value={tier.quantity}
                                        onChange={(e) => updateTier(idx, "quantity", e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                                        placeholder="Ex: 2"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-1">
                                        Prix total du lot *
                                      </label>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          min={0}
                                          step="any"
                                          className={inputCls + " pr-6 font-bold text-[#C9A96E]"}
                                          value={tier.price}
                                          onChange={(e) => updateTier(idx, "price", e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                                          placeholder="Ex: 80"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#C9A96E] pointer-events-none">
                                          €
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-1">
                                        Libellé (FR)
                                      </label>
                                      <input
                                        type="text"
                                        className={inputCls}
                                        value={tier.label}
                                        onChange={(e) => updateTier(idx, "label", e.target.value)}
                                        placeholder="Ex: Lot de 2"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-1">
                                        Libellé (EN - Optionnel)
                                      </label>
                                      <input
                                        type="text"
                                        className={inputCls}
                                        value={tier.label_en || ""}
                                        onChange={(e) => updateTier(idx, "label_en", e.target.value)}
                                        placeholder="Ex: Pack of 2"
                                      />
                                    </div>
                                  </div>

                                  {numQty > 0 && numPrice > 0 ? (
                                    <div className="text-[10px] text-[#7A726A] dark:text-[#A39B91] flex items-center justify-between pt-0.5">
                                      <span>
                                        Soit : <strong className="text-[#1A1816] dark:text-[#FAF7F2]">{unitInTier} € / pièce</strong>
                                      </span>
                                      <span className="text-[9px] italic">
                                        Le client recevra {numQty} fois le même article pour {numPrice} €
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}

                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => addTier()}
                                className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-[#C9A96E] text-[#C9A96E] hover:bg-[#C9A96E]/10 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Ajouter un palier</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* Carte 3 : Descriptions & Notes Olfactives (Bilingue FR / EN) */}
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
                          <label className={labelCls}>Notes olfactives & Matières (FR)</label>
                          <input
                            className={inputCls}
                            value={f.notes}
                            onChange={(e) => set("notes", e.target.value)}
                            placeholder="Ex: Cuir véritable, Bois de cèdre, Cuivre gravé, Jasmin"
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Description du produit artisanal (FR)</label>
                          <textarea
                            className={inputCls + " min-h-[64px] resize-y whitespace-pre-wrap font-sans"}
                            value={f.description}
                            onChange={(e) => set("description", e.target.value)}
                            placeholder="Pièce d'artisanat d'art façonnée à la main selon les techniques traditionnelles nobles..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Sous-titre / Accroche (FR)</label>
                          <textarea
                            className={inputCls + " min-h-[52px] resize-y whitespace-pre-wrap font-sans"}
                            value={f.imageLabel}
                            onChange={(e) => set("imageLabel", e.target.value)}
                            placeholder="Ex: Fait main • Matière noble • Savoir-faire ancestral..."
                            rows={2}
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
                            placeholder={f.name ? `Laisser vide pour "${f.name}"` : "Ex: Handcrafted Brass Tray"}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Olfactory Notes & Materials (EN)</label>
                          <input
                            className={inputCls}
                            value={f.notesEn}
                            onChange={(e) => set("notesEn", e.target.value)}
                            placeholder="Ex: Genuine Leather, Cedarwood, Hand-engraved Brass"
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Product Description (EN)</label>
                          <textarea
                            className={inputCls + " min-h-[64px] resize-y whitespace-pre-wrap font-sans"}
                            value={f.descriptionEn}
                            onChange={(e) => set("descriptionEn", e.target.value)}
                            placeholder="Handmade artisanal piece crafted with traditional noble materials..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Subtitle / Tagline (EN)</label>
                          <textarea
                            className={inputCls + " min-h-[52px] resize-y whitespace-pre-wrap font-sans"}
                            value={f.imageLabelEn}
                            onChange={(e) => set("imageLabelEn", e.target.value)}
                            placeholder="Ex: Handcrafted • Noble material • Ancestral craftsmanship..."
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </section>
                </>
              ) : isCosmetic ? (
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
                              min={0}
                              step="any"
                              className={(errors.price ? inputErrorCls : inputCls) + " pr-6 font-semibold"}
                              value={f.price}
                              onChange={(e) => set("price", e.target.value)}
                              placeholder="0"
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
                      <div className={`sm:col-span-2 p-2.5 rounded-lg border space-y-2 transition-all ${
                        errors.volume 
                          ? "bg-red-50/20 dark:bg-red-950/10 border-red-500/60 dark:border-red-500/60" 
                          : "bg-white/70 dark:bg-[#141312]/70 border-[#E5DDD0] dark:border-[#2D2A26]"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1816] dark:text-[#FAF7F2]">
                              Poids & Contenance du Soin
                            </span>
                            <span className="text-[10px] font-bold text-black-500">*</span>
                          </div>
                          <span className={`text-[9px] font-medium ${errors.volume ? "text-red-500 font-semibold" : "text-[#C9A96E]"}`}>
                            (Au moins un des deux requis)
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
                                className={(errors.volume && !f.weightValue && !f.volumeValue ? inputErrorCls : inputCls) + " flex-1 font-semibold"}
                                value={f.weightValue}
                                onChange={(e) => set("weightValue", e.target.value)}
                                placeholder="Ex: 50"
                              />
                              <div className="inline-flex p-0.5 bg-[#FAF7F2] dark:bg-[#1C1A18] rounded-lg border border-[#E5DDD0] dark:border-[#2D2A26] shrink-0">
                                <button
                                  type="button"
                                  onClick={() => set("weightUnit", "mg")}
                                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                    f.weightUnit === "mg"
                                      ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] shadow-xs"
                                      : "text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816]"
                                  }`}
                                >
                                  mg
                                </button>
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
                                className={(errors.volume && !f.weightValue && !f.volumeValue ? inputErrorCls : inputCls) + " flex-1 font-semibold"}
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
                          <div className="flex items-center gap-1 text-[10px] text-red-500 font-medium pt-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{errors.volume}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Carte Paliers Multiples & Offres par Lot (Cosmétiques) */}
                  <section className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-3 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2.5">
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5DDD0]/60 dark:border-[#2D2A26]/60">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E]">
                            Paliers Multiples & Offres par Lot (Multi-Pack)
                          </h3>
                          <p className="text-[9px] text-[#7A726A] dark:text-[#A39B91]">
                            Offres groupées pour 2, 3 exemplaires ou plus du même produit
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91]">
                          {f.hasTiers ? "Actif" : "Désactivé"}
                        </span>
                        <Switch
                          checked={f.hasTiers}
                          onCheckedChange={(val) => {
                            set("hasTiers", val);
                            if (val && (!f.tiers || f.tiers.length === 0)) {
                              set("tiers", [
                                { quantity: "" as any, price: "" as any, label: "" },
                              ]);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {f.hasTiers && (
                      <div className="space-y-2.5 animate-in fade-in duration-200">
                        {f.tiers.length === 0 ? (
                          <div className="text-center py-3 px-2 rounded-xl border border-dashed border-[#E5DDD0] dark:border-[#2D2A26] bg-white/50 dark:bg-[#141312]/50">
                            <p className="text-[10px] text-[#7A726A] dark:text-[#A39B91] mb-2">
                              Aucun palier configuré.
                            </p>
                            <button
                              type="button"
                              onClick={() => addTier()}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold rounded-lg bg-[#C9A96E] text-white hover:bg-[#B89658] transition-all cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Ajouter un palier</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {f.tiers.map((tier, idx) => {
                              const numQty = Number(tier.quantity) || 0;
                              const numPrice = Number(tier.price) || 0;
                              const baseUnitPrice = Number(f.price) || 0;
                              const unitInTier = numQty > 0 && numPrice > 0 ? Math.round(numPrice / numQty) : 0;
                              const normalTotal = baseUnitPrice * numQty;
                              const savings = numQty > 0 && numPrice > 0 && normalTotal > numPrice ? normalTotal - numPrice : 0;

                              return (
                                <div
                                  key={idx}
                                  className="p-2.5 bg-white dark:bg-[#141312] rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-4 h-4 rounded-full bg-[#C9A96E]/15 text-[#C9A96E] text-[9px] font-bold flex items-center justify-center">
                                        {idx + 1}
                                      </span>
                                      <span className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                                        Palier {idx + 1}{numQty > 0 ? ` (${numQty} ${numQty > 1 ? "unités reçues" : "unité reçue"})` : ""}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {savings > 0 && (
                                        <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                          Économie client : {savings} MAD
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => removeTier(idx)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                                        title="Supprimer ce palier"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                                    <div>
                                      <label className="block text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-1">
                                        Quantité *
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        className={inputCls + " font-semibold"}
                                        value={tier.quantity}
                                        onChange={(e) => updateTier(idx, "quantity", e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                                        placeholder="Ex: 2"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-1">
                                        Prix total du lot *
                                      </label>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          min={0}
                                          step="any"
                                          className={inputCls + " pr-7 font-bold text-[#C9A96E]"}
                                          value={tier.price}
                                          onChange={(e) => updateTier(idx, "price", e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                                          placeholder="Ex: 350"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#7A726A] dark:text-[#A39B91] pointer-events-none">
                                          MAD
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-1">
                                        Libellé (FR)
                                      </label>
                                      <input
                                        type="text"
                                        className={inputCls}
                                        value={tier.label}
                                        onChange={(e) => updateTier(idx, "label", e.target.value)}
                                        placeholder="Ex: Duo Soins"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-1">
                                        Libellé (EN - Optionnel)
                                      </label>
                                      <input
                                        type="text"
                                        className={inputCls}
                                        value={tier.label_en || ""}
                                        onChange={(e) => updateTier(idx, "label_en", e.target.value)}
                                        placeholder="Ex: Care Duo"
                                      />
                                    </div>
                                  </div>

                                  {numQty > 0 && numPrice > 0 ? (
                                    <div className="text-[10px] text-[#7A726A] dark:text-[#A39B91] flex items-center justify-between pt-0.5">
                                      <span>
                                        Soit : <strong className="text-[#1A1816] dark:text-[#FAF7F2]">{unitInTier} MAD / unité</strong>
                                      </span>
                                      <span className="text-[9px] italic">
                                        Le client recevra {numQty} fois le même article pour {numPrice} MAD
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}

                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => addTier()}
                                className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-[#C9A96E] text-[#C9A96E] hover:bg-[#C9A96E]/10 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Ajouter un palier</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
                            className={inputCls + " min-h-[72px] resize-y whitespace-pre-wrap font-sans"}
                            value={f.description}
                            onChange={(e) => set("description", e.target.value)}
                            placeholder="Formule enrichie en actifs précieux pour hydrater, nourrir et illuminer le teint en profondeur..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Sous-titre / Conseils d'application (FR)</label>
                          <textarea
                            className={inputCls + " min-h-[52px] resize-y whitespace-pre-wrap font-sans"}
                            value={f.imageLabel}
                            onChange={(e) => set("imageLabel", e.target.value)}
                            placeholder="Ex: Appliquer matin et soir sur peau propre et sèche..."
                            rows={2}
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
                            className={inputCls + " min-h-[72px] resize-y whitespace-pre-wrap font-sans"}
                            value={f.descriptionEn}
                            onChange={(e) => set("descriptionEn", e.target.value)}
                            placeholder="Luxurious skincare formula designed to nourish, hydrate, and reveal radiant skin..."
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Subtitle / Application Tips (EN)</label>
                          <textarea
                            className={inputCls + " min-h-[52px] resize-y whitespace-pre-wrap font-sans"}
                            value={f.imageLabelEn}
                            onChange={(e) => set("imageLabelEn", e.target.value)}
                            placeholder="Ex: Apply morning and evening to clean, dry skin..."
                            rows={2}
                          />
                        </div>
                      </div>
                    )}
                  </section>
                </>
              ) : (
                /* ============================================================ */
                /* FORMULAIRE CLASSIQUE : PARFUMS, ARTISANAT, BAZAR CHIC        */
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

                      {/* Genre & Saisons réservés exclusivement aux Parfums */}
                      {!isCosmetic && (
                        <>
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
                        </>
                      )}

                      {/* Tarification & Stock */}
                      <div className="sm:col-span-2 grid grid-cols-3 gap-2 pt-0.5">
                        {/* Prix */}
                        <div>
                          <label className={labelCls}>Prix (€) *</label>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              className={(errors.price ? inputErrorCls : inputCls) + " pr-5 font-semibold"}
                              value={f.price}
                              onChange={(e) => set("price", e.target.value)}
                              placeholder="0"
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

                  {/* Carte Paliers Multiples & Offres par Lot (Parfums) */}
                  <section className="bg-[#FAF7F2]/60 dark:bg-[#1C1A18]/60 p-3 rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2.5">
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5DDD0]/60 dark:border-[#2D2A26]/60">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-[#C9A96E]" />
                        <div>
                          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A96E]">
                            Paliers Multiples & Offres par Lot (Multi-Pack)
                          </h3>
                          <p className="text-[9px] text-[#7A726A] dark:text-[#A39B91]">
                            Permet au client de commander 2, 3 flacons ou plus du même parfum à un tarif global préférentiel
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91]">
                          {f.hasTiers ? "Actif" : "Désactivé"}
                        </span>
                        <Switch
                          checked={f.hasTiers}
                          onCheckedChange={(val) => {
                            set("hasTiers", val);
                            if (val && (!f.tiers || f.tiers.length === 0)) {
                              set("tiers", [
                                { quantity: "" as any, price: "" as any, label: "" },
                              ]);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {f.hasTiers && (
                      <div className="space-y-2.5 animate-in fade-in duration-200">
                        {f.tiers.length === 0 ? (
                          <div className="text-center py-3 px-2 rounded-xl border border-dashed border-[#E5DDD0] dark:border-[#2D2A26] bg-white/50 dark:bg-[#141312]/50">
                            <p className="text-[10px] text-[#7A726A] dark:text-[#A39B91] mb-2">
                              Aucun palier configuré.
                            </p>
                            <button
                              type="button"
                              onClick={() => addTier()}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold rounded-lg bg-[#C9A96E] text-white hover:bg-[#B89658] transition-all cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Ajouter un palier</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {f.tiers.map((tier, idx) => {
                              const numQty = Number(tier.quantity) || 0;
                              const numPrice = Number(tier.price) || 0;
                              const baseUnitPrice = Number(f.price) || 0;
                              const unitInTier = numQty > 0 && numPrice > 0 ? Math.round(numPrice / numQty) : 0;
                              const normalTotal = baseUnitPrice * numQty;
                              const savings = numQty > 0 && numPrice > 0 && normalTotal > numPrice ? normalTotal - numPrice : 0;

                              return (
                                <div
                                  key={idx}
                                  className="p-2.5 bg-white dark:bg-[#141312] rounded-xl border border-[#E5DDD0] dark:border-[#2D2A26] space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-4 h-4 rounded-full bg-[#C9A96E]/15 text-[#C9A96E] text-[9px] font-bold flex items-center justify-center">
                                        {idx + 1}
                                      </span>
                                      <span className="text-[11px] font-bold text-[#1A1816] dark:text-[#FAF7F2]">
                                        Palier {idx + 1}{numQty > 0 ? ` (${numQty} ${numQty > 1 ? "flacons reçus" : "flacon reçu"})` : ""}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {savings > 0 && (
                                        <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                          Économie client : {savings} MAD
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => removeTier(idx)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                                        title="Supprimer ce palier"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                                    <div>
                                      <label className="block text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-1">
                                        Quantité *
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        className={inputCls + " font-semibold"}
                                        value={tier.quantity}
                                        onChange={(e) => updateTier(idx, "quantity", e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                                        placeholder="Ex: 2"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-1">
                                        Prix total du lot *
                                      </label>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          min={0}
                                          step="any"
                                          className={inputCls + " pr-7 font-bold text-[#C9A96E]"}
                                          value={tier.price}
                                          onChange={(e) => updateTier(idx, "price", e.target.value === "" ? "" : Math.max(0, parseFloat(e.target.value) || 0))}
                                          placeholder="Ex: 350"
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#7A726A] dark:text-[#A39B91] pointer-events-none">
                                          MAD
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-1">
                                        Libellé (FR)
                                      </label>
                                      <input
                                        type="text"
                                        className={inputCls}
                                        value={tier.label}
                                        onChange={(e) => updateTier(idx, "label", e.target.value)}
                                        placeholder="Ex: Pack Duo"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-medium text-[#7A726A] dark:text-[#A39B91] mb-1">
                                        Libellé (EN - Optionnel)
                                      </label>
                                      <input
                                        type="text"
                                        className={inputCls}
                                        value={tier.label_en || ""}
                                        onChange={(e) => updateTier(idx, "label_en", e.target.value)}
                                        placeholder="Ex: Duo Pack"
                                      />
                                    </div>
                                  </div>

                                  {numQty > 0 && numPrice > 0 ? (
                                    <div className="text-[10px] text-[#7A726A] dark:text-[#A39B91] flex items-center justify-between pt-0.5">
                                      <span>
                                        Soit : <strong className="text-[#1A1816] dark:text-[#FAF7F2]">{unitInTier} MAD / flacon</strong>
                                      </span>
                                      <span className="text-[9px] italic">
                                        Le client recevra {numQty} fois le même parfum pour {numPrice} MAD
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}

                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => addTier()}
                                className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-[#C9A96E] text-[#C9A96E] hover:bg-[#C9A96E]/10 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Ajouter un palier</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
                        {!isCosmetic && (
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
                        )}

                        <div>
                          <label className={labelCls}>
                            {isCosmetic ? "Description & Conseils d'application (FR)" : "Description olfactive (FR)"}
                          </label>
                          <textarea
                            className={inputCls + " min-h-[60px] resize-y whitespace-pre-wrap font-sans"}
                            value={f.description}
                            onChange={(e) => set("description", e.target.value)}
                            placeholder={isCosmetic ? "Conseils d'application, bienfaits et texture..." : "Notes ambrées florales et boisées d'une élégance rare..."}
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Sous-titre / Accroche (FR)</label>
                          <textarea
                            className={inputCls + " min-h-[52px] resize-y whitespace-pre-wrap font-sans"}
                            value={f.imageLabel}
                            onChange={(e) => set("imageLabel", e.target.value)}
                            placeholder="Ex: Extrait de Parfum — Flacon de Prestige..."
                            rows={2}
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

                        {!isCosmetic && (
                          <div>
                            <label className={labelCls}>Olfactory Notes (EN)</label>
                            <input
                              className={inputCls}
                              value={f.notesEn}
                              onChange={(e) => set("notesEn", e.target.value)}
                              placeholder="Ex: Jasmine, Saffron, Amberwood, Cedar"
                            />
                          </div>
                        )}

                        <div>
                          <label className={labelCls}>
                            {isCosmetic ? "Description & Application Tips (EN)" : "Olfactory Description (EN)"}
                          </label>
                          <textarea
                            className={inputCls + " min-h-[60px] resize-y whitespace-pre-wrap font-sans"}
                            value={f.descriptionEn}
                            onChange={(e) => set("descriptionEn", e.target.value)}
                            placeholder={isCosmetic ? "Application tips, benefits and key ingredients..." : "Luminous and sophisticated amber floral breeze..."}
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Subtitle / Tagline (EN)</label>
                          <textarea
                            className={inputCls + " min-h-[52px] resize-y whitespace-pre-wrap font-sans"}
                            value={f.imageLabelEn}
                            onChange={(e) => set("imageLabelEn", e.target.value)}
                            placeholder="Ex: Extrait de Parfum — Prestige Bottle..."
                            rows={2}
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
            {!isArtisanal && f.volume && <span>• {f.volume} ml</span>}
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
