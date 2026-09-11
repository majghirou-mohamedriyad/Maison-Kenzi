/**
 * Section Produits Similaires — Maison Kenzi
 *
 * Suggère des fragrances de la même maison ou du même univers olfactif
 * avec étiquettes de genre et saisons d'utilisation.
 */

import { Link } from "react-router-dom";
import ProductImage from "@/components/ui/ProductImage";
import { useParfums } from "@/hooks/useParfums";
import { formatMAD, getParfumPricingSummary } from "@/lib/sizes";
import { Sun, Leaf, Wind, Snowflake } from "lucide-react";
import { getParfumSeasons, getSeasonMeta } from "@/lib/seasonsStore";
import QuickAddToCartButton from "@/components/ui/QuickAddToCartButton";

interface RelatedProductsProps {
  currentParfumId?: string;
  maison?: string;
  gender?: string;
}

const RelatedProducts = ({ currentParfumId, maison, gender }: RelatedProductsProps) => {
  const { data: allParfums, loading } = useParfums();

  // Filter out current product AND out of stock / inactive products
  const availableParfums = allParfums.filter((p) => {
    if (p.id === currentParfumId) return false;
    const isFull = p.sale_mode === "full_bottle";
    const decantStock = (p.stock_5ml ?? 0) + (p.stock_10ml ?? 0);
    const outOfStock =
      !p.is_active ||
      p.stock_status === "rupture" ||
      (isFull ? (p.full_bottle_stock ?? 0) <= 0 : decantStock <= 0);
    return !outOfStock;
  });

  // 1. Filter products from the SAME maison/provider
  const sameMaison = availableParfums.filter(
    (p) =>
      maison &&
      p.maison &&
      p.maison.toLowerCase().trim() === maison.toLowerCase().trim()
  );

  // 2. Filter products with the same gender (excluding same maison)
  const sameGender = availableParfums.filter(
    (p) =>
      p.gender === gender &&
      (!maison || p.maison.toLowerCase().trim() !== maison.toLowerCase().trim())
  );

  // 3. Other remaining products
  const others = availableParfums.filter(
    (p) =>
      p.gender !== gender &&
      (!maison || p.maison.toLowerCase().trim() !== maison.toLowerCase().trim())
  );

  // Combine to get a smart recommendation list: Maison first, then same gender, then others
  const related = [...sameMaison, ...sameGender, ...others].slice(0, 4);

  if (loading || related.length === 0) return null;

  return (
    <section className="mt-16 sm:mt-24 pt-12 border-t border-border max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary mb-1">
            Recommandations
          </p>
          <h2 className="font-serif text-xl sm:text-2xl text-foreground font-light">
            Vous Aimerez Aussi
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/5] bg-muted/60 mb-2 rounded-xl" />
              <div className="h-3 w-16 bg-muted/60 mb-1 rounded" />
              <div className="h-4 w-24 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {related.map((p) => {
            const pricing = getParfumPricingSummary(p);

            return (
              <Link
                key={p.id}
                to={`/parfum/${p.id}`}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="group block rounded-2xl p-2 sm:p-3 transition-all hover:bg-card/40 relative text-left"
              >
                <div className="relative mb-2 overflow-hidden rounded-xl bg-muted/40 aspect-[4/5]">
                  <ProductImage
                    src={p.image_url}
                    images={p.images}
                    alt={p.name}
                    label={p.image_label}
                    aspect="aspect-[4/5]"
                    fitMode="cover"
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                  {p.maison}
                </p>

                {/* Titre et Bouton Panier sur la même ligne */}
                <div className="flex items-center justify-between gap-1.5 mt-0.5 min-h-[30px]">
                  <h3 className="font-serif text-xs sm:text-sm font-medium truncate text-foreground flex-1">
                    {p.name}
                  </h3>
                  <QuickAddToCartButton
                    parfum={p}
                    size="sm"
                  />
                </div>

                {/* Extrait de Description */}
                {p.description && (
                  <p className="text-[11px] sm:text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed mt-1 font-light">
                    {p.description}
                  </p>
                )}

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

                {/* Prix et Contenance en ML */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                  <span className="text-xs sm:text-sm font-serif font-medium text-foreground">
                    {pricing.priceText}
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-primary font-medium bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                    {pricing.volumeText}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RelatedProducts;
