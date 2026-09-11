/**
 * Section Carrousel des Meilleures Ventes — Maison Kenzi
 *
 * Affiche la sélection de parfums de niche best-sellers issus de Supabase
 * et indique sobrement "Aucun produit" si la base est vide.
 */

import { Link } from "react-router-dom";
import ProductImage from "@/components/ui/ProductImage";
import { useParfums } from "@/hooks/useParfums";
import { formatMAD } from "@/lib/sizes";
import { Sparkles, Sun, Leaf, Wind, Snowflake } from "lucide-react";
import { getParfumSeasons, getSeasonMeta } from "@/lib/seasonsStore";
import QuickAddToCartButton from "@/components/ui/QuickAddToCartButton";

const ProductCarousel = () => {
  const { data: allParfums, loading } = useParfums();
  const featured = allParfums.filter((p) => p.is_bestseller).slice(0, 4);
  const displayItems = featured.length > 0 ? featured : allParfums.slice(0, 4);

  return (
    <section className="w-full mb-20 sm:mb-32 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* En-tête de section */}
      <div className="flex items-end justify-between mb-8 sm:mb-12">
        <div>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-primary mb-1.5 flex items-center gap-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
            <span>Sélection Privilège</span>
          </p>
          <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-light tracking-tight">
            Nos Meilleures Ventes
          </h2>
        </div>
        {displayItems.length > 0 && (
          <Link
            to="/collection/all"
            className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-primary hover:text-primary-hover border-b border-primary/30 pb-0.5 transition-all font-medium inline-flex items-center"
          >
            Voir tout
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-muted/60 mb-3 rounded-2xl" />
              <div className="h-3 w-20 bg-muted/60 mb-2 rounded" />
              <div className="h-4 w-32 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      ) : displayItems.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayItems.map((p, idx) => {
            const isFull = p.sale_mode === "full_bottle";
            const fullStock = p.full_bottle_stock ?? 0;
            const outOfStock =
              p.is_active === false ||
              p.stock_status === "rupture" ||
              (isFull && typeof p.full_bottle_stock === "number" && fullStock <= 0);

            return (
              <Link
                key={p.id}
                to={`/parfum/${p.id}`}
                className={`block group relative transition-all duration-500 hover:-translate-y-1 ${outOfStock ? "opacity-75" : ""
                  }`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {/* Conteneur Image Produit */}
                <div className="relative mb-3 overflow-hidden rounded-2xl bg-card border border-border/70 aspect-[4/5] shadow-nude">
                  <ProductImage
                    src={p.image_url}
                    images={p.images}
                    alt={p.name}
                    label={p.image_label}
                    aspect="aspect-[4/5]"
                    fitMode="cover"
                    className={`h-full w-full object-cover object-center transition-all duration-700 ease-out ${outOfStock ? "grayscale opacity-50" : "group-hover:scale-[1.04]"
                      }`}
                  />

                  {/* Badge Rupture */}
                  {outOfStock && (
                    <span className="absolute top-3 left-3 z-10 inline-flex items-center text-[9px] uppercase tracking-[0.2em] bg-background/90 text-muted-foreground backdrop-blur-md px-2.5 py-1 rounded-full font-medium border border-border">
                      Rupture
                    </span>
                  )}

                  {/* Bouton d'Ajout Rapide au Panier */}
                  {!outOfStock && (
                    <QuickAddToCartButton
                      parfum={p}
                      className="absolute bottom-2.5 right-2.5 z-20"
                    />
                  )}
                </div>

                {/* Détails Typographiques */}
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate transition-colors duration-300 group-hover:text-primary">
                  {p.maison}
                </p>
                <h3 className={`font-serif text-sm sm:text-base mt-0.5 truncate font-normal transition-colors duration-300 ${outOfStock ? "text-muted-foreground" : "text-foreground group-hover:text-primary"
                  }`}>
                  {p.name}
                </h3>

                {/* Étiquettes Genre & Saisons d'utilisation */}
                <div className="flex items-center flex-wrap gap-1 mt-1.5 mb-1">
                  {p.gender && (
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground bg-secondary/90 border border-border/50 px-2 py-0.5 rounded-full font-medium">
                      {p.gender}
                    </span>
                  )}
                  {getParfumSeasons(p).map((season) => {
                    const meta = getSeasonMeta(season);
                    const SeasonIconComp = meta.icon;
                    return (
                      <span
                        key={season}
                        className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground bg-secondary/90 border border-border/50 px-2 py-0.5 rounded-full font-medium"
                      >
                        <SeasonIconComp className="w-2.5 h-2.5 text-primary" strokeWidth={1.75} />
                        <span>{meta.label}</span>
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border/40">
                  <span className="text-xs font-light text-foreground/90 font-serif">
                    {isFull
                      ? formatMAD(p.full_bottle_price ?? 0)
                      : `Dès ${formatMAD(p.price_5ml || p.price_10ml || 0)}`}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-primary font-medium">
                    {isFull ? (p.full_bottle_volume_ml ? `${p.full_bottle_volume_ml} ml` : "Flacon") : "Décant"}
                  </span>
                </div>

                {/* Bouton d'Action Directe Ajouter au Panier */}
                {!outOfStock && (
                  <div className="mt-2.5">
                    <QuickAddToCartButton
                      parfum={p}
                      variant="button"
                    />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        /* État sobre : Aucun produit */
        <div className="rounded-2xl border border-dashed border-border/70 py-12 px-6 text-center bg-card/30">
          <p className="font-serif text-lg sm:text-xl text-foreground font-normal mb-1">
            Aucun produit
          </p>
          <p className="text-xs font-light text-muted-foreground">
            Aucun parfum n'est disponible pour le moment.
          </p>
        </div>
      )}
    </section>
  );
};

export default ProductCarousel;
