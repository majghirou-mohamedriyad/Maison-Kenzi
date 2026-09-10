import { useState, useMemo } from "react";
import {
  FolderTree,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  ExternalLink,
  Layers,
  Sparkles,
  Check,
  AlertCircle,
  Package,
} from "lucide-react";
import {
  useCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  type AdminCategory,
} from "@/store/useCategoryStore";
import { useProducts } from "@/store/useProductStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

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

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [gender, setGender] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setGender("");
    setIsActive(true);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (cat: AdminCategory) => {
    setEditingCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setGender(cat.gender || "");
    setIsActive(cat.is_active);
    setErrors({});
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(slugify(val));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Veuillez renseigner le nom de la catégorie";

    const finalSlug = slug.trim() || slugify(name.trim());
    if (!finalSlug) errs.name = "Le nom doit comporter des caractères valides";

    // Check duplicate slug
    const duplicate = categories.find((c) => c.slug === finalSlug && c.id !== editingCat?.id);
    if (duplicate) {
      errs.name = "Une catégorie portant un nom similaire existe déjà";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (editingCat) {
      updateCategory(editingCat.id, {
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        gender: gender || undefined,
        is_active: isActive,
      });
      toast.success("Catégorie mise à jour");
    } else {
      addCategory({
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        gender: gender || undefined,
        is_active: isActive,
        order_index: categories.length + 1,
      });
      toast.success("Nouvelle catégorie créée");
    }

    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (deletingCat) {
      deleteCategory(deletingCat.id);
      toast.success(`Catégorie "${deletingCat.name}" supprimée`);
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-foreground">{categories.length}</div>
            <div className="text-xs text-muted-foreground font-medium">Catégories Actives</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-foreground">{products.length}</div>
            <div className="text-xs text-muted-foreground font-medium">Produits Répartis</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/15 text-[#C9A96E] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-foreground">100%</div>
            <div className="text-xs text-muted-foreground font-medium">Synchronisation Vitrine</div>
          </div>
        </div>
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
                <th className="text-left px-5 py-3.5">Slug URL</th>
                <th className="text-left px-5 py-3.5">Description</th>
                <th className="text-center px-4 py-3.5">Produits</th>
                <th className="text-center px-4 py-3.5">Statut</th>
                <th className="text-right px-5 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredCategories.map((cat) => {
                const count = categoryStats[cat.slug] ?? 0;
                return (
                  <tr
                    key={cat.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Name & Icon */}
                    <td className="px-5 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {cat.name.charAt(0)}
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

                    {/* Slug */}
                    <td className="px-5 py-4 font-mono text-muted-foreground">
                      <span className="bg-muted px-2 py-1 rounded-md border border-border/60">
                        /collection/{cat.slug}
                      </span>
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

            <label className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border cursor-pointer select-none">
              <div>
                <div className="text-xs font-semibold text-foreground">Catégorie active</div>
                <div className="text-[10px] text-muted-foreground">Visible sur la boutique en ligne</div>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </label>

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
                className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#C9A96E] to-[#b39155] text-[#111827] shadow-md shadow-[#C9A96E]/20 hover:brightness-110 transition-all cursor-pointer"
              >
                {editingCat ? "Mettre à jour" : "Créer la catégorie"}
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
          </DialogHeader>
          <p className="text-xs text-muted-foreground my-2">
            Êtes-vous sûr de vouloir supprimer la catégorie <strong className="text-foreground">{deletingCat?.name}</strong> ? Cette action est irréversible.
          </p>
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
