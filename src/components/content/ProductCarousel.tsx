/**
 * Section Carrousel des Meilleures Ventes — Maison Kenzi
 *
 * Affiche la sélection de parfums de niche best-sellers issus de Supabase
 * et indique sobrement "Aucun produit" si la base est vide.
 */

import { Link } from "react-router-dom";
import ProductImage from "@/components/ui/ProductImage";
import { useParfums } from "@/hooks/useParfums";
import { formatMAD, getParfumPricingSummary } from "@/lib/sizes";
import { Sparkles, Sun, Leaf, Wind, Snowflake } from "lucide-react";
import { getParfumSeasons, getSeasonMeta } from "@/lib/seasonsStore";
import QuickAddToCartButton from "@/components/ui/QuickAddToCartButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { isParfumProduct } from "@/lib/productCategories";
import {
  getProductName,
  getProductDescription,
  getProductSubtitle,
  getProductGender,
} from "@/lib/productLocalization";
import { getParfumUrl } from "@/lib/productUrl";

const ProductCarousel = () => {
  const { language, t } = useLanguage();
  const { data: allParfums, loading } = useParfums();
  const featured = allParfums.filter((p) => p.is_bestseller).slice(0, 4);
  const displayItems = featured.length > 0 ? featured : allParfums.slice(0, 4);

  return (
    <section className="w-full mb-20 sm:mb-32 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* En-tête de section */}
      <div className="flex items-end justify-between mb-8 sm:mb-12">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 border border-border text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>{t.bestsellers.badge}</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-foreground font-normal">
            {t.bestsellers.title}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-light mt-1 max-w-xl">
            {t.bestsellers.subtitle}
          </p>
        </div>
        <Link
          to="/collection/all"
          className="hidden sm:inline-flex items-center text-xs uppercase tracking-[0.2em] font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-foreground/30 hover:border-primary"
        >
          {t.bestsellers.viewAll}
        </Link>
      </div>

      {/* Grille de Produits */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="aspect-[4/5] rounded-2xl bg-muted" />
              <div className="h-3 w-1/3 bg-muted rounded" />
              <div className="h-4 w-2/3 bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : displayItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {displayItems.map((p, idx) => {
            const isFull = p.sale_mode === "full_bottle";
            const fullStock = p.full_bottle_stock ?? 0;
            const outOfStock =
              p.is_active === false ||
              p.stock_status === "rupture" ||
              (isFull && typeof p.full_bottle_stock === "number" && fullStock <= 0);

            const pricing = getParfumPricingSummary(p);
            const pName = getProductName(p, language);
            const pDesc = getProductDescription(p, language);
            const pSubtitle = getProductSubtitle(p, language);

            return (
              <Link
                key={p.id}
                to={getParfumUrl(p)}
                className={`block group relative transition-all duration-500 hover:-translate-y-1 ${outOfStock ? "opacity-75" : ""
                  }`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {/* Conteneur Image Produit */}
                <div className="relative mb-3 overflow-hidden rounded-2xl bg-card border border-border/70 aspect-[4/5] shadow-nude">
                  <ProductImage
                    src={p.image_url}
                    images={p.images}
                    alt={pName}
                    label={pSubtitle || p.image_label}
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
                </div>

                {/* Détails Typographiques */}
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate transition-colors duration-300 group-hover:text-primary">
                  {p.maison}
                </p>

                {/* Titre et Bouton Panier sur la même ligne */}
                <div className="flex items-center justify-between gap-1.5 mt-0.5 min-h-[32px]">
                  <h3 className={`font-serif text-sm sm:text-base truncate font-medium transition-colors duration-300 flex-1 ${outOfStock ? "text-muted-foreground" : "text-foreground group-hover:text-primary"
                    }`}>
                    {pName}
                  </h3>
                  {!outOfStock && (
                    <QuickAddToCartButton
                      parfum={p}
                      size="sm"
                    />
                  )}
                </div>

                {/* Extrait de Description */}
                {pDesc && (
                  <p className="text-[11px] sm:text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed mt-1 font-light">
                    {pDesc}
                  </p>
                )}

                {/* Étiquettes Genre & Saisons d'utilisation — Réservées exclusivement aux parfums */}
                {isParfumProduct(p) ? (
                  <div className="flex items-center flex-wrap gap-1 mt-1.5 mb-1">
                    {p.gender && (
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground bg-secondary/90 border border-border/50 px-2 py-0.5 rounded-full font-medium">
                        {getProductGender(p.gender, language)}
                      </span>
                    )}
                    {getParfumSeasons(p).map((season) => {
                      const meta = getSeasonMeta(season, language);
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
                ) : (p.weight_value || p.volume_value) ? (
                  <div className="flex items-center flex-wrap gap-1 mt-1.5 mb-1">
                    {p.weight_value && (
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground bg-secondary/90 border border-border/50 px-2 py-0.5 rounded-full font-medium">
                        {p.weight_value} {p.weight_unit || "g"}
                      </span>
                    )}
                    {p.volume_value && (
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground bg-secondary/90 border border-border/50 px-2 py-0.5 rounded-full font-medium">
                        {p.volume_value} {p.volume_unit || "ml"}
                      </span>
                    )}
                  </div>
                ) : null}

                {/* Prix et Contenance en ML */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                  <span className={`text-xs sm:text-sm font-semibold tracking-tight ${
                    outOfStock ? "text-muted-foreground line-through opacity-70" : "text-foreground"
                  }`}>
                    {outOfStock ? "Rupture de stock" : pricing.priceText}
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-primary font-semibold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                    {pricing.volumeText}
                  </span>
                </div>
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
