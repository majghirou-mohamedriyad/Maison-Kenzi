import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { addProduct, updateProduct, type AdminParfum, type SaleMode } from "@/store/useProductStore";
import { uploadProductImage, upsertParfumToSupabase } from "@/admin/lib/syncParfum";
import type { Gender } from "@/data/parfums";
import { toast } from "sonner";
import { Upload, X, Loader2, Droplet, Wine, Plus, Trash2, Sparkles, AlertCircle } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: AdminParfum | null;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export type FormatItem = {
  id: string;
  ml: number;
  label?: string;
  price: string;
  stock: string;
  isDefault?: boolean;
};

const emptyForm = {
  name: "",
  maison: "",
  gender: "Homme" as Gender,
  description: "",
  tete: "",
  coeur: "",
  fond: "",
  saleMode: "decant" as SaleMode,
  fbVolume: "100",
  fbPrice: "",
  fbStock: "5",
  fbLimited: false,
  imageLabel: "",
  imageUrl: "" as string,
  active: true,
  isNew: false,
  isBestseller: false,
};

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const labelCls = "block text-xs font-medium text-[#111827] dark:text-[#F9FAFB] mb-1";
const inputCls =
  "w-full px-3 py-2 text-sm bg-[#FFFFFF] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9A96E] text-[#111827] dark:text-[#F9FAFB] transition-colors";
const inputErrorCls =
  "w-full px-3 py-2 text-sm bg-red-50/50 dark:bg-red-950/20 border border-red-500 dark:border-red-500 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/30 text-[#111827] dark:text-[#F9FAFB] transition-colors";

const ProductModal = ({ open, onOpenChange, initial }: Props) => {
  const [f, setF] = useState(emptyForm);
  const [formats, setFormats] = useState<FormatItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (initial) {
        setF({
          name: initial.name,
          maison: initial.maison,
          gender: initial.gender,
          description: initial.description,
          tete: initial.notes.tete.join(", "),
          coeur: initial.notes.coeur.join(", "),
          fond: initial.notes.fond.join(", "),
          saleMode: (initial.sale_mode ?? "decant") as SaleMode,
          fbVolume: String(initial.full_bottle_volume_ml ?? 100),
          fbPrice: initial.full_bottle_price != null ? String(initial.full_bottle_price) : "",
          fbStock: String(initial.full_bottle_stock ?? 5),
          fbLimited: !!initial.full_bottle_limited,
          imageLabel: initial.imageLabel,
          imageUrl: initial.image_url ?? "",
          active: initial.active ?? true,
          isNew: !!initial.isNew,
          isBestseller: !!initial.isBestseller,
        });

        // Initialize formats from initial product data
        const initialFormats: FormatItem[] = [
          {
            id: "5ml",
            ml: 5,
            label: "Format Découverte",
            price: initial.prices?.["5ml"] ? String(initial.prices["5ml"]) : "",
            stock: String(initial.stock_5ml ?? 20),
            isDefault: true,
          },
          {
            id: "10ml",
            ml: 10,
            label: "Format Voyage (Best-Seller)",
            price: initial.prices?.["10ml"] ? String(initial.prices["10ml"]) : "",
            stock: String(initial.stock_10ml ?? 20),
            isDefault: true,
          },
        ];

        setFormats(initialFormats);
      } else {
        setF(emptyForm);
        setFormats([
          { id: "5ml", ml: 5, label: "Format Découverte", price: "", stock: "20", isDefault: true },
          { id: "10ml", ml: 10, label: "Format Voyage (Best-Seller)", price: "", stock: "20", isDefault: true },
        ]);
      }
      setErrors({});
    }
  }, [open, initial]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    // Clear error on edit
    if (errors[k]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[k];
        return next;
      });
    }
  };

  const updateFormat = (id: string, patch: Partial<FormatItem>) => {
    setFormats((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    // Clear field error on format edit
    if (errors[`format_${id}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`format_${id}`];
        return next;
      });
    }
  };

  const addFormat = (ml: number = 20) => {
    const nextMl = ml || 20;
    const base10Price = Number(formats.find((item) => item.ml === 10)?.price || 0);
    const suggestedPrice = base10Price > 0 ? String(Math.round(base10Price * (nextMl / 10) * 0.9)) : "";

    setFormats((prev) => [
      ...prev,
      {
        id: `custom_${nextMl}ml_${Date.now()}`,
        ml: nextMl,
        label: nextMl === 20 ? "Format Signature" : `Format ${nextMl} ml`,
        price: suggestedPrice,
        stock: "10",
        isDefault: false,
      },
    ]);
  };

  const removeFormat = (id: string) => {
    setFormats((prev) => prev.filter((item) => item.id !== id));
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
      toast.success("Photo du produit mise à jour avec succès !");
    } catch (err) {
      console.error("Upload error note:", err);
      // Even if upload failed, fallback to FileReader
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            set("imageUrl", e.target.result as string);
            toast.success("Image chargée avec succès !");
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

    const isFull = f.saleMode === "full_bottle";
    const fbPrice = Number(f.fbPrice);
    const fbVolume = Number(f.fbVolume);

    if (isFull) {
      if (!fbVolume || fbVolume <= 0) errs.fbVolume = "Veuillez indiquer le volume du flacon (ex: 100 ml)";
      if (!fbPrice || fbPrice <= 0) errs.fbPrice = "Veuillez indiquer le prix de vente du flacon";
    } else {
      if (formats.length === 0) {
        errs.formats = "Veuillez configurer au moins un format de vente (ex: 5 ml, 10 ml)";
      } else {
        formats.forEach((item) => {
          const p = Number(item.price);
          if (!p || p <= 0) {
            errs[`format_${item.id}`] = `Veuillez renseigner le prix pour le format ${item.ml} ml`;
          }
        });
      }
    }

    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error("Formulaire incomplet", {
        description: "Veuillez renseigner les champs obligatoires surlignés en rouge.",
      });
      return;
    }

    const parseNotes = (s: string) =>
      s.split(",").map((x) => x.trim()).filter(Boolean);

    const fbStock = Math.max(0, Number(f.fbStock) || 0);

    const id =
      initial?.id && isUuid(initial.id)
        ? initial.id
        : initial?.id ?? crypto.randomUUID();

    // Map formats to prices and stocks
    const f5 = formats.find((item) => item.ml === 5);
    const f10 = formats.find((item) => item.ml === 10);

    const safeP5 = isFull ? fbPrice : Number(f5?.price || 0);
    const safeP10 = isFull ? fbPrice : Number(f10?.price || 0);

    const stock5 = isFull ? 0 : Math.max(0, Number(f5?.stock) || 0);
    const stock10 = isFull ? 0 : Math.max(0, Number(f10?.stock) || 0);
    const totalDecantStock = formats.reduce((acc, it) => acc + Math.max(0, Number(it.stock) || 0), 0);

    const payload: AdminParfum = {
      id,
      name: f.name.trim(),
      maison: f.maison.trim(),
      gender: f.gender,
      description: f.description.trim(),
      notes: { tete: parseNotes(f.tete), coeur: parseNotes(f.coeur), fond: parseNotes(f.fond) },
      prices: {
        "5ml": safeP5,
        "10ml": safeP10,
      },
      imageLabel: f.imageLabel.trim() || slugify(f.name) || "produit",
      image_url: f.imageUrl || null,
      isNew: f.isNew,
      isBestseller: f.isBestseller,
      active: f.active,
      stock: isFull ? fbStock : totalDecantStock,
      stock_5ml: stock5,
      stock_10ml: stock10,
      sale_mode: f.saleMode,
      full_bottle_volume_ml: isFull ? fbVolume : null,
      full_bottle_price: isFull ? fbPrice : null,
      full_bottle_stock: fbStock,
      full_bottle_limited: isFull ? f.fbLimited : false,
    };

    try {
      setSaving(true);

      // 1. Update local product store first (instant propagation to all pages and UI)
      if (initial) {
        updateProduct(initial.id, payload);
        toast.success("Produit mis à jour avec succès !");
      } else {
        addProduct(payload);
        toast.success("Nouveau produit ajouté avec succès !");
      }

      // 2. Sync to Supabase in background
      try {
        await upsertParfumToSupabase(payload, f.imageUrl || null);
      } catch (dbErr) {
        console.warn("Supabase upsert sync note:", dbErr);
      }

      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement du produit");
    } finally {
      setSaving(false);
    }
  };

  const isFull = f.saleMode === "full_bottle";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FFFFFF] dark:bg-[#1A1A1A] max-w-4xl lg:max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-2xl shadow-2xl border border-[#E5E7EB] dark:border-[#2A2A2A]">
        <DialogHeader className="pb-3 border-b border-[#E5E7EB] dark:border-[#2A2A2A]">
          <DialogTitle className="text-lg sm:text-xl font-serif font-bold text-[#111827] dark:text-[#F9FAFB] flex items-center gap-2">
            <span>{initial ? "Modifier le produit" : "Ajouter un nouveau produit"}</span>
            {initial && (
              <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-[#C9A96E]/15 text-[#C9A96E] border border-[#C9A96E]/30">
                {initial.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-6 mt-4">
          {/* Global Validation Alert Banner */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Des informations obligatoires sont manquantes ou incorrectes :</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] opacity-90">
                  {Object.values(errors).slice(0, 3).map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                  {Object.keys(errors).length > 3 && (
                    <li>Et {Object.keys(errors).length - 3} autre(s) champ(s)...</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Sale mode selector */}
          <section className="bg-[#F8F9FA] dark:bg-[#0F0F0F] p-4 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E] mb-3">Mode de vente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => set("saleMode", "decant")}
                className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  !isFull
                    ? "border-[#C9A96E] bg-[#C9A96E]/10 shadow-sm"
                    : "border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#FFFFFF] dark:bg-[#1A1A1A] hover:border-[#C9A96E]/40"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Droplet className="w-4 h-4 text-[#C9A96E]" />
                  <span className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Décants / Échantillons</span>
                </div>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Vente au format fractionné : 5 ml, 10 ml.</p>
              </button>

              <button
                type="button"
                onClick={() => set("saleMode", "full_bottle")}
                className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isFull
                    ? "border-[#C9A96E] bg-[#C9A96E]/10 shadow-sm"
                    : "border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#FFFFFF] dark:bg-[#1A1A1A] hover:border-[#C9A96E]/40"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Wine className="w-4 h-4 text-[#C9A96E]" />
                  <span className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Bouteille complète / Flacon scellé</span>
                </div>
                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Flacon original sous blister scellé ou stick déodorant.</p>
              </button>
            </div>
          </section>

          {/* 2-Column Main Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: General Information (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <section className="bg-[#FFFFFF] dark:bg-[#141414] p-5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E]">Informations générales</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  <div className="sm:col-span-2">
                    <label className={labelCls}>Genre</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Homme", "Femme", "Mixte"] as Gender[]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => set("gender", g)}
                          className={`py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                            f.gender === g
                              ? "bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] border-[#111827] dark:border-[#C9A96E] font-semibold"
                              : "bg-[#FFFFFF] dark:bg-[#1A1A1A] text-[#6B7280] dark:text-[#9CA3AF] border-[#E5E7EB] dark:border-[#2A2A2A] hover:border-[#C9A96E]/50"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelCls}>
                      Description courte
                      <span className="float-right text-[#6B7280] dark:text-[#9CA3AF]">{f.description.length}/200</span>
                    </label>
                    <textarea
                      className={inputCls + " min-h-[90px] resize-none"}
                      maxLength={200}
                      value={f.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Notes ambrées florales et boisées..."
                    />
                  </div>
                </div>
              </section>

              {/* Pricing & Stock Section */}
              {!isFull ? (
                <section className="bg-[#FFFFFF] dark:bg-[#141414] p-5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E] flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5" /> Tarification & Stocks par Format
                    </h3>
                    <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                      {formats.length} format{formats.length > 1 ? "s" : ""} configuré{formats.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {formats.map((item) => {
                      const sprays = item.ml * 13;
                      const isLowStock = Number(item.stock) <= 0;
                      const fieldError = errors[`format_${item.id}`];

                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-[#0F0F0F] border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3 relative"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 bg-[#FFFFFF] dark:bg-[#1A1A1A] px-2.5 py-1 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] shadow-xs">
                                <span className="font-serif text-sm font-bold text-[#111827] dark:text-[#F9FAFB]">
                                  {item.ml} ml
                                </span>
                              </div>

                              <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                {item.label || `Format ${item.ml} ml`} (≈ {sprays} sprays)
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  !isLowStock
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-red-500/10 text-red-500"
                                }`}
                              >
                                {!isLowStock ? `En stock (${item.stock})` : "Rupture"}
                              </span>

                              {/* Remove Format Button */}
                              {formats.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeFormat(item.id)}
                                  className="p-1 rounded-md text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                                  title="Supprimer ce format"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Volume in ml */}
                            <div>
                              <label className={labelCls}>Volume (ml) *</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min={1}
                                  className={inputCls + " pr-10"}
                                  value={item.ml}
                                  onChange={(e) =>
                                    updateFormat(item.id, {
                                      ml: Math.max(1, Number(e.target.value) || 1),
                                      label: `Format ${e.target.value} ml`,
                                    })
                                  }
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] pointer-events-none">
                                  ml
                                </span>
                              </div>
                            </div>

                            {/* Price in MAD */}
                            <div>
                              <label className={labelCls}>Prix de vente (MAD) *</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min={1}
                                  className={(fieldError ? inputErrorCls : inputCls) + " pr-12 font-medium"}
                                  value={item.price}
                                  onChange={(e) => updateFormat(item.id, { price: e.target.value })}
                                  placeholder="Ex: 120"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#C9A96E] pointer-events-none">
                                  MAD
                                </span>
                              </div>
                              {fieldError && (
                                <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium animate-in fade-in">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{fieldError}</span>
                                </div>
                              )}
                            </div>

                            {/* Stock in bottles */}
                            <div>
                              <label className={labelCls}>Stock disponible (flacons)</label>
                              <input
                                type="number"
                                min={0}
                                className={inputCls}
                                value={item.stock}
                                onChange={(e) => updateFormat(item.id, { stock: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add Custom Format Controls */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] dark:border-[#2A2A2A]">
                      <span className="text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                        Ajouter un format :
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[15, 20, 30, 50].map((quickMl) => {
                          const exists = formats.some((it) => it.ml === quickMl);
                          return (
                            <button
                              key={quickMl}
                              type="button"
                              onClick={() => addFormat(quickMl)}
                              className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                                exists
                                  ? "bg-black/5 dark:bg-white/5 border-transparent text-[#6B7280] dark:text-[#9CA3AF] opacity-60"
                                  : "bg-[#FFFFFF] dark:bg-[#1A1A1A] border-[#E5E7EB] dark:border-[#2A2A2A] hover:border-[#C9A96E] text-[#111827] dark:text-[#F9FAFB] hover:text-[#C9A96E]"
                              }`}
                            >
                              + {quickMl} ml
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => addFormat(25)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-[#C9A96E]/15 hover:bg-[#C9A96E]/25 border border-[#C9A96E]/40 text-[#C9A96E] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Autre format
                        </button>
                      </div>
                    </div>

                    {errors.formats && (
                      <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1 font-medium animate-in fade-in p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errors.formats}</span>
                      </div>
                    )}
                  </div>
                </section>
              ) : (
                <section className="bg-[#FFFFFF] dark:bg-[#141414] p-5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E]">Bouteille complète / Flacon scellé</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Volume (ml) *</label>
                      <input
                        type="number"
                        min={1}
                        className={errors.fbVolume ? inputErrorCls : inputCls}
                        value={f.fbVolume}
                        onChange={(e) => set("fbVolume", e.target.value)}
                        placeholder="100"
                      />
                      {errors.fbVolume && (
                        <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium animate-in fade-in">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.fbVolume}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelCls}>Prix (MAD) *</label>
                      <input
                        type="number"
                        min={0}
                        className={errors.fbPrice ? inputErrorCls : inputCls}
                        value={f.fbPrice}
                        onChange={(e) => set("fbPrice", e.target.value)}
                        placeholder="1800"
                      />
                      {errors.fbPrice && (
                        <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1.5 font-medium animate-in fade-in">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.fbPrice}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={labelCls}>Stock disponible</label>
                      <input type="number" min={0} className={inputCls} value={f.fbStock} onChange={(e) => set("fbStock", e.target.value)} />
                    </div>
                  </div>

                  <label className="flex items-center justify-between text-xs p-3 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#F8F9FA] dark:bg-[#0F0F0F] cursor-pointer">
                    <span className="font-medium text-[#111827] dark:text-[#F9FAFB]">Édition limitée (afficher le badge doré)</span>
                    <Switch checked={f.fbLimited} onCheckedChange={(v) => set("fbLimited", v)} />
                  </label>
                </section>
              )}
            </div>

            {/* RIGHT COLUMN: Notes & Image & Status (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Olfactory Notes */}
              <section className="bg-[#FFFFFF] dark:bg-[#141414] p-5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E]">Pyramide Olfactive</h3>
                <div>
                  <label className={labelCls}>Notes de tête</label>
                  <input className={inputCls} value={f.tete} onChange={(e) => set("tete", e.target.value)} placeholder="Jasmin, Safran" />
                </div>
                <div>
                  <label className={labelCls}>Notes de cœur</label>
                  <input className={inputCls} value={f.coeur} onChange={(e) => set("coeur", e.target.value)} placeholder="Bois d'ambre, Ambre gris" />
                </div>
                <div>
                  <label className={labelCls}>Notes de fond</label>
                  <input className={inputCls} value={f.fond} onChange={(e) => set("fond", e.target.value)} placeholder="Résine de sapin, Cèdre" />
                </div>
              </section>

              {/* Product Image */}
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
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] hover:bg-[#F8F9FA] dark:hover:bg-white/5 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-[#C9A96E]" />}
                        {uploading ? "Chargement..." : f.imageUrl ? "Changer l'image" : "Uploader (.png, .jpg, .webp)"}
                      </button>

                      {f.imageUrl && (
                        <button
                          type="button"
                          onClick={() => set("imageUrl", "")}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Retirer
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">PNG / JPG / WEBP / AVIF — Téléversement instantané.</p>
                  </div>
                </div>
              </section>

              {/* Status Toggles */}
              <section className="bg-[#FFFFFF] dark:bg-[#141414] p-5 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#C9A96E]">Visibilité & Badges</h3>
                <div className="space-y-2.5">
                  <label className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <span className="font-medium">Produit actif (visible en boutique)</span>
                    <Switch checked={f.active} onCheckedChange={(v) => set("active", v)} />
                  </label>
                  <label className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <span className="font-medium">Nouveau produit (badge "Nouveau")</span>
                    <Switch checked={f.isNew} onCheckedChange={(v) => set("isNew", v)} />
                  </label>
                  <label className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <span className="font-medium">Best Seller (mis en vedette)</span>
                    <Switch checked={f.isBestseller} onCheckedChange={(v) => set("isBestseller", v)} />
                  </label>
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4 border-t border-[#E5E7EB] dark:border-[#2A2A2A]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 text-xs font-medium rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] text-[#111827] dark:text-[#F9FAFB] hover:bg-[#F8F9FA] dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-[#C9A96E] to-[#b39155] text-[#111827] hover:brightness-110 shadow-lg shadow-[#C9A96E]/20 disabled:opacity-60 transition-all cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{initial ? "Mettre à jour le produit" : "Créer le produit"}</span>
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
