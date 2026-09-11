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

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [categories, search]);

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

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une catégorie ou un slug..."
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground shadow-xs"
        />
      </div>

      {/* Categories Grid Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase tracking-wider border-b border-border font-bold">
              <tr>
                <th className="text-left px-5 py-3.5">Catégorie</th>
                <th className="text-left px-5 py-3.5">Description</th>
                <th className="text-center px-4 py-3.5">Produits</th>
                <th className="text-center px-4 py-3.5">Statut</th>
                <th className="text-right px-5 py-3.5">Actions</th>
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
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Aucune catégorie trouvée.
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
