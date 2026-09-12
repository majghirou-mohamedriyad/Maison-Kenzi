/**
 * Composant Tableau & Grille Produits — Espace Administration Maison Kenzi
 *
 * Affichage haute parfumerie des créations avec badges de genre, saisons d'utilisation,
 * inventaire flacons et actions de gestion rapide.
 */

import {
  Pencil,
  Trash2,
  Eye,
  Gift,
  Sparkles,
  Wine,
  Droplet,
  Layers,
  Package,
  Tag,
  ArrowUpDown,
  Sun,
  Leaf,
  Wind,
  Snowflake,
  CheckSquare,
  Square,
} from "lucide-react";
import type { AdminParfum } from "@/store/useProductStore";
import { getPrimaryImage } from "@/lib/productImages";

type Props = {
  products: AdminParfum[];
  viewMode?: "table" | "grid";
  onEdit: (p: AdminParfum) => void;
  onDelete: (p: AdminParfum) => void;
  sortBy?: string;
  onSortChange?: (field: string) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
};

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} MAD`;

const ProductTable = ({
  products,
  viewMode = "table",
  onEdit,
  onDelete,
  sortBy,
  onSortChange,
  selectedIds = [],
  onToggleSelect,
  onSelectAll,
  isAllSelected = false,
}: Props) => {
  return (
    <>
      {/* 1. GRID / CARD VIEW */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => {
            const isPack = p.category === "packs" || p.id.startsWith("pack-") || p.name.toLowerCase().includes("pack");
            const isDeo = p.category === "deodorants-stick" || p.id.includes("deodorant") || p.id.includes("old-spice");
            const isFull = (p.sale_mode ?? "decant") === "full_bottle" || isPack || isDeo;
            const s5 = p.stock_5ml ?? 0;
            const s10 = p.stock_10ml ?? 0;
            const sFull = p.full_bottle_stock ?? 0;
            const stockTotal = isFull ? sFull : s5 + s10;
            const inStock = (p.active ?? true) && stockTotal > 0;
            const primaryImg = getPrimaryImage(p);
            const isSelected = selectedIds.includes(p.id);

            return (
              <div
                key={p.id}
                className={`group relative bg-card border rounded-2xl p-4 transition-all duration-300 hover:shadow-lg flex flex-col justify-between ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/40 bg-primary/[0.02]"
                    : "border-border/80 hover:border-primary/50"
                }`}
              >
                <div>
                  {/* Card Visual & Status Bar */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted/30 border border-border/50 mb-3">
                    {primaryImg ? (
                      <img
                        src={primaryImg}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif text-3xl font-bold bg-muted/20">
                        {p.name.charAt(0)}
                      </div>
                    )}

                    {/* Quick Status Tag */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md border ${
                          inStock
                            ? "bg-emerald-500/90 text-white border-emerald-400/40"
                            : "bg-red-500/90 text-white border-red-400/40"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${inStock ? "bg-white" : "bg-white animate-pulse"}`} />
                        {inStock ? "En Stock" : "Rupture"}
                      </span>
                    </div>

                    {/* Checkbox Multi-Sélection */}
                    {onToggleSelect && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelect(p.id);
                        }}
                        className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-md ${
                          isSelected
                            ? "bg-primary text-primary-foreground ring-2 ring-primary/40"
                            : "bg-background/90 text-muted-foreground hover:text-foreground backdrop-blur-md border border-border/80 hover:border-primary"
                        }`}
                        title={isSelected ? "Désélectionner ce parfum" : "Sélectionner ce parfum"}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Title & Brand */}
                  <p className="text-[10px] uppercase tracking-widest text-primary font-bold truncate">
                    {p.maison}
                  </p>
                  <h3 className="font-serif text-sm font-bold text-foreground truncate mt-0.5" title={p.name}>
                    {p.name}
                  </h3>

                  {/* Badges Genre & Saisons d'utilisation */}
                  <div className="flex items-center flex-wrap gap-1 mt-1.5 mb-2">
                    {p.gender && (
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground bg-secondary/90 border border-border/50 px-2 py-0.5 rounded-full font-medium">
                        {p.gender}
                      </span>
                    )}
                    {Array.isArray(p.seasons) && p.seasons.map((season) => {
                      const s = season.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                      const SeasonIconComp = s.includes("ete") ? Sun : s.includes("print") ? Leaf : s.includes("hiv") ? Snowflake : Wind;
                      return (
                        <span
                          key={season}
                          className="inline-flex items-center gap-1 text-[9px] text-foreground/85 bg-card/90 border border-border/60 px-2 py-0.5 rounded-full font-medium"
                        >
                          <SeasonIconComp className="w-2.5 h-2.5 text-primary" />
                          <span>{season}</span>
                        </span>
                      );
                    })}
                  </div>

                  {/* Format Category Tag */}
                  <div className="flex items-center gap-1.5 mt-1">
                    {isPack && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                        <Gift className="w-3 h-3" /> Pack & Coffret
                      </span>
                    )}
                    {isDeo && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                        <Sparkles className="w-3 h-3" /> Déodorant Stick
                      </span>
                    )}
                    {!isPack && !isDeo && isFull && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Wine className="w-3 h-3" /> Flacon Scellé
                      </span>
                    )}
                    {!isPack && !isDeo && !isFull && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <Droplet className="w-3 h-3" /> Décants 5ml / 10ml
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock & Prix */}
                <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">Prix Vente :</span>
                    <span className="font-serif font-bold text-foreground">
                      {isFull ? fmt(p.full_bottle_price ?? p.prices["5ml"] ?? 0) : fmt(p.prices["5ml"] ?? 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">Stock Global :</span>
                    <span className={`font-semibold text-xs ${stockTotal === 0 ? "text-red-500" : "text-foreground"}`}>
                      {stockTotal} {isFull ? "unités" : "flacons"}
                    </span>
                  </div>
                </div>

                {/* Actions Buttons */}
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <a
                    href={`/parfum/${p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    title="Voir la fiche produit"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(p)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground bg-card border border-border/80 rounded-2xl">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-40 text-primary" />
              <p className="text-sm font-medium">Aucun produit ne correspond aux filtres appliqués.</p>
            </div>
          )}
        </div>
      ) : (
        /* 2. TABLE VIEW */
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide border-b border-border/80">
                <tr>
                  <th className="w-12 text-center px-3 py-3.5">
                    {onSelectAll && (
                      <button
                        type="button"
                        onClick={onSelectAll}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer mx-auto ${
                          isAllSelected
                            ? "bg-primary text-primary-foreground ring-1 ring-primary/40"
                            : "bg-background border border-border/80 text-muted-foreground hover:text-foreground hover:border-primary"
                        }`}
                        title={isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
                      >
                        {isAllSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </th>
                  <th className="text-left px-3 py-3.5 font-bold">#</th>
                  <th className="text-left px-4 py-3.5 font-bold">
                    <button
                      type="button"
                      onClick={() => onSortChange && onSortChange("name")}
                      className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
                    >
                      <span>Produit</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3.5 font-bold">
                    <button
                      type="button"
                      onClick={() => onSortChange && onSortChange("maison")}
                      className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
                    >
                      <span>Maison</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3.5 font-bold">
                    <button
                      type="button"
                      onClick={() => onSortChange && onSortChange("category")}
                      className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
                    >
                      <span>Catégorie</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3.5 font-bold">
                    <button
                      type="button"
                      onClick={() => onSortChange && onSortChange("price")}
                      className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer ml-auto"
                    >
                      <span>Prix Vente</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3.5 font-bold">
                    <button
                      type="button"
                      onClick={() => onSortChange && onSortChange("stock")}
                      className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer ml-auto"
                    >
                      <span>Stock Total</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-center px-4 py-3.5 font-bold">
                    <button
                      type="button"
                      onClick={() => onSortChange && onSortChange("status")}
                      className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
                    >
                      <span>Statut</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3.5 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {products.map((p, i) => {
                  const isPack = p.category === "packs" || p.id.startsWith("pack-") || p.name.toLowerCase().includes("pack");
                  const isDeo = p.category === "deodorants-stick" || p.id.includes("deodorant") || p.id.includes("old-spice");
                  const isFull = (p.sale_mode ?? "decant") === "full_bottle" || isPack || isDeo;
                  const s5 = p.stock_5ml ?? 0;
                  const s10 = p.stock_10ml ?? 0;
                  const sFull = p.full_bottle_stock ?? 0;
                  const stockTotal = isFull ? sFull : s5 + s10;
                  const inStock = (p.active ?? true) && stockTotal > 0;
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isSelected ? "bg-primary/[0.04] dark:bg-primary/[0.08]" : "hover:bg-muted/30"
                      }`}
                    >
                      <td className="text-center px-3 py-3.5">
                        {onToggleSelect && (
                          <button
                            type="button"
                            onClick={() => onToggleSelect(p.id)}
                            className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer mx-auto ${
                              isSelected
                                ? "bg-primary text-primary-foreground ring-1 ring-primary/40"
                                : "bg-background border border-border/80 text-muted-foreground hover:text-foreground hover:border-primary"
                            }`}
                            title={isSelected ? "Désélectionner" : "Sélectionner ce parfum"}
                          >
                            {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-muted-foreground font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          {primaryImg ? (
                            <img
                              src={primaryImg}
                              alt={p.name}
                              className="w-9 h-9 rounded-lg object-cover bg-muted border border-border shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                              {p.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-serif font-bold text-sm leading-snug truncate">{p.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {isPack && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                  <Gift className="w-2.5 h-2.5" /> Pack
                                </span>
                              )}
                              {isDeo && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                                  <Sparkles className="w-2.5 h-2.5" /> Déodorant
                                </span>
                              )}
                              {isFull && !isPack && !isDeo && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#C9A96E]/15 text-[#C9A96E] border border-[#C9A96E]/30">
                                  <Wine className="w-2.5 h-2.5" /> Flacon {p.full_bottle_volume_ml ?? 100}ml
                                </span>
                              )}
                              {!isFull && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  <Droplet className="w-2.5 h-2.5" /> Décants
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground text-xs font-semibold">{p.maison}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-block text-xs px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/60 font-semibold">
                            {p.gender}
                          </span>
                          {Array.isArray(p.seasons) && p.seasons.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {p.seasons.map((season) => {
                                const s = season.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                const SeasonIconComp = s.includes("ete") ? Sun : s.includes("print") ? Leaf : s.includes("hiv") ? Snowflake : Wind;
                                return (
                                  <span
                                    key={season}
                                    className="inline-flex items-center gap-0.5 text-[8.5px] px-1.5 py-0.2 rounded-md bg-muted text-foreground/80 border border-border/50"
                                    title={`Saison : ${season}`}
                                  >
                                    <SeasonIconComp className="w-2 h-2 text-primary" />
                                    <span>{season}</span>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-foreground">
                        {isFull ? (
                          <span className="font-bold tracking-tight text-primary text-sm">{fmt(p.full_bottle_price ?? p.prices["5ml"] ?? 0)}</span>
                        ) : (
                          <div className="text-xs">
                            <div className="font-bold tracking-tight text-primary">{fmt(p.prices["5ml"])} <span className="text-[10px] text-muted-foreground font-normal">(5ml)</span></div>
                            <div className="text-muted-foreground text-[11px] font-medium tracking-tight">{fmt(p.prices["10ml"])} (10ml)</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`font-semibold text-xs ${stockTotal === 0 ? "text-red-500" : "text-foreground"}`}>
                          {stockTotal} {isFull ? "unités" : "flacons"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            inStock
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${inStock ? "bg-emerald-500" : "bg-red-500"}`} />
                          <span>{inStock ? "Actif" : "Rupture"}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/parfum/${p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            title="Voir la fiche produit"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={() => onEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(p)}
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
                {products.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-muted-foreground">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-40 text-primary" />
                      <p className="text-sm font-medium">Aucun produit ne correspond à cette sélection.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductTable;
