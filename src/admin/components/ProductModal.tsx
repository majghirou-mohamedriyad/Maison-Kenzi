/**
 * Modal d'Ajout & Modification de Parfum — Maison Kenzi Admin
 *
 * Formulaire épuré pour flacons complets :
 * - Boutons d'action (Annuler / Créer le produit) intégrés en haut à la même ligne que le titre
 * - Informations générales avec Prix de vente (MAD), Volume (ml), Stock, Genre, Saisons d'utilisation (choix multiples) et Notes olfactives
 * - Assignation de la Catégorie / Univers de destination (synchronisée avec le store de catégories)
 * - Téléversement d'image haute définition
 * - Statut de visibilité & badges (Nouveau, Best-Seller)
 * Conformité Haute Parfumerie & Zéro Emoji.
 */

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { addProduct, updateProduct, type AdminParfum } from "@/store/useProductStore";
import { useCategories } from "@/store/useCategoryStore";
import { uploadProductImage, upsertParfumToSupabase } from "@/admin/lib/syncParfum";
import type { Gender } from "@/data/parfums";
import { toast } from "sonner";
import { Upload, X, Loader2, AlertCircle, FolderTree } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: AdminParfum | null;
};

const SEASON_OPTIONS = ["Printemps", "Été", "Automne", "Hiver"] as const;

const DEFAULT_CATEGORIES = [
  { id: "homme", slug: "homme", name: "Parfums Homme" },
  { id: "femme", slug: "femme", name: "Parfums Femme" },
  { id: "mixte", slug: "mixte", name: "Parfums Mixtes / Unisexes" },
  { id: "deodorants-stick", slug: "deodorants-stick", name: "Déodorants Stick" },
  { id: "packs", slug: "packs", name: "Coffrets & Packs" },
];

const slugify = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const emptyForm = {
  name: "",
  maison: "",
  gender: "Homme" as Gender,
  category: "",
  seasons: [] as string[],
  price: "",
  volume: "100",
  stock: "10",
  notes: "",
  description: "",
  imageLabel: "",
  imageUrl: "" as string,
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const categoriesList = availableCategories.length > 0 ? availableCategories : DEFAULT_CATEGORIES;

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

        const initialVolume = String(initial.full_bottle_volume_ml ?? 100);
        const initialStock = String(initial.full_bottle_stock ?? initial.stock ?? 10);

        const initialNotes = [
          ...(initial.notes?.tete ?? []),
          ...(initial.notes?.coeur ?? []),
          ...(initial.notes?.fond ?? []),
        ]
          .filter(Boolean)
          .join(", ");

        const initialSeasons = Array.isArray(initial.seasons) ? initial.seasons : [];

        setF({
          name: initial.name || "",
          maison: initial.maison || "",
          gender: initial.gender || "Homme",
          category: (initial.category as string) || "",
          seasons: initialSeasons,
          price: initialPrice,
          volume: initialVolume,
          stock: initialStock,
          notes: initialNotes,
          description: initial.description || "",
          imageLabel: initial.imageLabel || "",
          imageUrl: initial.image_url || "",
          active: initial.active ?? true,
          isNew: !!initial.isNew,
          isBestseller: !!initial.isBestseller,
        });
      } else {
        setF(emptyForm);
      }
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
      const next = current.includes(season)
        ? current.filter((s) => s !== season)
        : [...current, season];
      return { ...prev, seasons: next };
    });
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Format de fichier non supporté. Veuillez choisir une image (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image trop volumineuse (max 10MB).");
      return;
    }
    try {
      setUploading(true);
      const id = initial?.id && isUuid(initial.id) ? initial.id : crypto.randomUUID();
      const url = await uploadProductImage(id, file);
      set("imageUrl", url);
      toast.success("Photo du produit mise à jour avec succès");
    } catch (err) {
      console.error("Erreur upload:", err);
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            set("imageUrl", e.target.result as string);
            toast.success("Image chargée avec succès");
          }
        };
        reader.readAsDataURL(file);
      } catch {
        toast.error("Impossible de lire ce fichier image.");
      }
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs.name = "Veuillez renseigner le nom du parfum";
    if (!f.maison.trim()) errs.maison = "Veuillez renseigner la maison ou marque";

    const numPrice = Number(f.price);
    if (!numPrice || numPrice <= 0) errs.price = "Veuillez renseigner le prix de vente du parfum";

    const numVolume = Number(f.volume) || 100;
    const numStock = Math.max(0, Number(f.stock) || 0);

    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error("Formulaire incomplet", {
        description: "Veuillez renseigner les champs obligatoires surlignés en rouge.",
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

    const payload: AdminParfum = {
      id,
      name: f.name.trim(),
      maison: f.maison.trim(),
      gender: f.gender,
      category: (f.category || (f.gender === "Homme" ? "homme" : f.gender === "Femme" ? "femme" : "mixte")) as any,
      seasons: Array.isArray(f.seasons) ? f.seasons : [],
      description: (f.description || "").trim(),
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
      image_url: f.imageUrl || null,
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
        toast.success("Produit mis à jour avec succès");
      } else {
        addProduct(payload);
        toast.success("Nouveau produit ajouté avec succès");
      }

      // 2. Synchronisation Supabase en arrière-plan
      try {
        await upsertParfumToSupabase(payload, f.imageUrl || null);
      } catch (dbErr) {
        console.warn("Supabase upsert note:", dbErr);
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
  const descriptionLength = (f.description || "").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FFFFFF] dark:bg-[#1A1A1A] max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-2xl shadow-2xl border border-[#E5E7EB] dark:border-[#2A2A2A]">
        <form onSubmit={submit} className="space-y-6">
          {/* En-tête avec Titre à gauche et Boutons d'Action à droite */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB] dark:border-[#2A2A2A] pr-8 sm:pr-10">
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

          {/* Bannière d'erreurs de validation */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Veuillez renseigner les informations obligatoires :</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] opacity-90">
                  {Object.values(errors).slice(0, 3).map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

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
                    <label className={labelCls}>Genre</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Homme", "Femme", "Mixte"] as Gender[]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => set("gender", g)}
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
                  </div>

                  {/* Saisons d'utilisation (Choix multiples) */}
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelCls}>Saisons d'utilisation</label>
                      <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                        {currentSeasons.length === 0
                          ? "Toutes saisons"
                          : `${currentSeasons.length} sélectionnée${currentSeasons.length > 1 ? "s" : ""}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SEASON_OPTIONS.map((season) => {
                        const isSelected = currentSeasons.includes(season);
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
                  </div>

                  {/* Prix de vente */}
                  <div>
                    <label className={labelCls}>Prix de vente (MAD) *</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        className={(errors.price ? inputErrorCls : inputCls) + " pr-12 font-medium"}
                        value={f.price}
                        onChange={(e) => set("price", e.target.value)}
                        placeholder="Ex: 850"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#C9A96E] pointer-events-none">
                        MAD
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
                    <label className={labelCls}>Volume / Contenance (ml)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        className={inputCls + " pr-10 font-medium"}
                        value={f.volume}
                        onChange={(e) => set("volume", e.target.value)}
                        placeholder="100"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none">
                        ml
                      </span>
                    </div>
                  </div>

                  {/* Stock disponible */}
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Stock disponible (flacons)</label>
                    <input
                      type="number"
                      min={0}
                      className={inputCls}
                      value={f.stock}
                      onChange={(e) => set("stock", e.target.value)}
                      placeholder="10"
                    />
                  </div>

                  {/* Notes olfactives */}
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Notes olfactives (séparées par des virgules)</label>
                    <input
                      className={inputCls}
                      value={f.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      placeholder="Ex: Jasmin, Safran, Bois d'ambre, Ambre gris, Cèdre"
                    />
                    <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF] mt-1 block">
                      Indiquez les accords et notes olfactives séparés par une virgule.
                    </span>
                  </div>

                  {/* Description olfactive */}
                  <div className="sm:col-span-2">
                    <label className={labelCls}>
                      Description olfactive
                      <span className="float-right text-[#6B7280] dark:text-[#9CA3AF]">{descriptionLength}/200</span>
                    </label>
                    <textarea
                      className={inputCls + " min-h-[85px] resize-none"}
                      maxLength={200}
                      value={f.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Notes ambrées florales et boisées d'une élégance rare..."
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* COLONNE DROITE : Image, Catégorie & Visibilité (5 colonnes) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Visuel du Produit */}
              <section className="bg-[#FFFFFF] dark:bg-[#141414] p-5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E]">Visuel du produit</h3>

                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 shrink-0 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#F8F9FA] dark:bg-[#0F0F0F] overflow-hidden flex items-center justify-center shadow-inner relative">
                    {f.imageUrl ? (
                      <img src={f.imageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF]">Aucune</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => fileRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] hover:bg-[#F8F9FA] dark:hover:bg-white/5 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-[#C9A96E]" />}
                        {uploading ? "Chargement..." : f.imageUrl ? "Changer l'image" : "Uploader (.png, .jpg, .webp)"}
                      </button>

                      {f.imageUrl && (
                        <button
                          type="button"
                          onClick={() => set("imageUrl", "")}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-xl border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Retirer
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">PNG / JPG / WEBP — Synchronisation immédiate.</p>
                  </div>
                </div>
              </section>

              {/* Section Catégorie / Univers (Positionnée en haut de Visibilité & Badges) */}
              <section className="bg-[#FFFFFF] dark:bg-[#141414] p-5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E] flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5 text-[#C9A96E]" />
                    <span>Catégorie du parfum</span>
                  </h3>
                  <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                    {f.category ? "Classé" : "Auto"}
                  </span>
                </div>

                <div>
                  <label className={labelCls}>Choisir la catégorie de destination</label>
                  <select
                    className={inputCls + " cursor-pointer font-medium"}
                    value={f.category}
                    onChange={(e) => set("category", e.target.value)}
                  >
                    <option value="">Sélectionner une catégorie spécifique</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.id || cat.slug} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Badges de sélection rapide */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {categoriesList.map((cat) => {
                    const isSelected = f.category === cat.slug;
                    return (
                      <button
                        key={cat.id || cat.slug}
                        type="button"
                        onClick={() => set("category", isSelected ? "" : cat.slug)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] border-[#111827] dark:border-[#C9A96E] font-semibold shadow-xs"
                            : "bg-[#FFFFFF] dark:bg-[#1A1A1A] text-[#6B7280] dark:text-[#9CA3AF] border-[#E5E7EB] dark:border-[#2A2A2A] hover:border-[#C9A96E]/50"
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
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
