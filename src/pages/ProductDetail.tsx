/**
 * Page Fiche Détail Produit — Maison Kenzi
 *
 * Présentation immersive haute parfumerie et soins cosmétiques avec fil d'Ariane dynamique
 * contextuel, pyramide olfactive, contenances et formulaire de commande express.
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import ProductImage from "@/components/ui/ProductImage";
import RelatedProducts from "@/components/content/RelatedProducts";
import ExpressOrderForm from "@/components/content/ExpressOrderForm";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import {
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Check,
  Sparkles,
  Droplets,
  Sun,
  Leaf,
  Wind,
  Snowflake,
  Calendar,
  Sparkle,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useParfum } from "@/hooks/useParfums";
import { useCart } from "@/store/cart";
import { toast } from "sonner";
import { SIZES, SIZE_META, formatMAD, priceFor } from "@/lib/sizes";
import { getParfumImages } from "@/lib/productImages";
import type { Size } from "@/types/database";
import type { OrderSelectionItem } from "@/components/content/ExpressOrderForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { getParfumSeasons, getSeasonMeta } from "@/lib/seasonsStore";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";
import {
  getProductName,
  getProductDescription,
  getProductSubtitle,
  getProductNotes,
  getProductGender,
} from "@/lib/productLocalization";
import { isParfumProduct, isParfumInCategory } from "@/lib/productCategories";
import { useCategories } from "@/store/useCategoryStore";
import { getParfumSlug, getParfumUrl } from "@/lib/productUrl";

const ParfumDetail = () => {
  const { language, t } = useLanguage();
  const { parfumId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const categories = useCategories();
  const { data: parfum, loading, error } = useParfum(parfumId);
  const { addItem, openCart } = useCart();

  // Mise à jour élégante de l'adresse URL dans le navigateur vers le slug SEO canonique
  useEffect(() => {
    if (!parfum) return;
    const canonicalSlug = getParfumSlug(parfum);
    // Si l'utilisateur est arrivé via un UUID ou une ancienne variante, on remplace l'URL sans recharger la page
    if (parfumId && parfumId !== canonicalSlug && (parfumId === parfum.id || parfumId.length > 20)) {
      window.history.replaceState(null, "", getParfumUrl(parfum));
    }
  }, [parfum, parfumId]);

  // Détermination intelligente de la catégorie parente pour le fil d'Ariane
  const parentCategory = useMemo(() => {
    if (!parfum) return null;

    // 1. Si l'utilisateur arrive depuis une collection spécifique (state react-router)
    const fromSlug = (location.state as { fromCategory?: string } | null)?.fromCategory;
    if (fromSlug && fromSlug !== "all" && fromSlug !== "toutes") {
      const foundFromState = categories.find(
        (c) => c.slug.toLowerCase() === fromSlug.toLowerCase()
      );
      if (foundFromState && isParfumInCategory(parfum, foundFromState.slug)) {
        return foundFromState;
      }
    }

    // 2. Recherche parmi les catégories actives associées à ce produit
    const activeCats = categories.filter(
      (c) => c.is_active && c.slug.toLowerCase() !== "all" && c.slug.toLowerCase() !== "toutes"
    );

    // Priorité aux catégories spécifiques (ex: cosmétiques, artisanat, orientaux...)
    const matched = activeCats.find((c) => isParfumInCategory(parfum, c.slug));
    if (matched) return matched;

    // Si le produit a une catégorie définie directement dans son enregistrement
    const rawCategories = (parfum.categories || (parfum.category ? [parfum.category] : [])).map((s) =>
      s.toLowerCase().trim()
    );
    const directMatch = activeCats.find((c) => rawCategories.includes(c.slug.toLowerCase()));
    if (directMatch) return directMatch;

    return null;
  }, [parfum, categories, location.state]);

  const breadcrumbCategoryName = useMemo(() => {
    if (parentCategory) {
      return (language === "en" && parentCategory.name_en) ? parentCategory.name_en : parentCategory.name;
    }
    return t.nav?.catalog || (language === "en" ? "Catalog" : "Catalogue");
  }, [parentCategory, language, t]);

  const breadcrumbCategoryLink = useMemo(() => {
    if (parentCategory) {
      return `/collection/${parentCategory.slug}`;
    }
    return "/collection/all";
  }, [parentCategory]);

  const displayName = useMemo(() => getProductName(parfum, language), [parfum, language]);
  const displayDescription = useMemo(() => getProductDescription(parfum, language), [parfum, language]);
  const displaySubtitle = useMemo(() => getProductSubtitle(parfum, language), [parfum, language]);
  const displayNotes = useMemo(() => getProductNotes(parfum, language), [parfum, language]);
  const isParfum = useMemo(() => isParfumProduct(parfum), [parfum]);

  const translatedDescription = useAutoTranslate(displayDescription);
  const translatedNotes = useAutoTranslate(displayNotes);

  // State des quantités initialisé pour chaque format
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [parfumId]);

  useEffect(() => {
    if (!parfum) return;
    const isFull = parfum.sale_mode === "full_bottle";
    const fullStock = parfum.full_bottle_stock ?? 0;
    const decantStock = (parfum.stock_5ml ?? 0) + (parfum.stock_10ml ?? 0);
    const isOutOfStock =
      !parfum.is_active ||
      parfum.stock_status === "rupture" ||
      (isFull && fullStock <= 0) ||
      (!isFull && decantStock <= 0);

    const sizes: Size[] = isFull
      ? ["full"]
      : (["5ml", "10ml"] as Size[]).filter((s) => {
          const p = priceFor(parfum, s);
          return typeof p === "number" && !isNaN(p) && p > 0;
        });

    const initial: Record<string, number> = {};
    sizes.forEach((s, idx) => {
      initial[s] = idx === 0 && !isOutOfStock ? 1 : 0;
    });
    setQuantities(initial);
  }, [
    parfum?.id,
    parfum?.sale_mode,
    parfum?.is_active,
    parfum?.stock_status,
    parfum?.full_bottle_stock,
    parfum?.stock_5ml,
    parfum?.stock_10ml,
    parfum?.price_5ml,
    parfum?.price_10ml,
    parfum?.price_20ml,
  ]);

  const updateSizeQty = (s: Size, delta: number) => {
    setQuantities((prev) => {
      const current = prev[s] ?? 0;
      const next = Math.max(0, current + delta);
      if (delta > 0) {
        // Switch active format exclusively when adding quantity
        return { [s]: next };
      }
      return { ...prev, [s]: next };
    });
  };

  const setDirectSizeQty = (s: Size, qty: number) => {
    // Switch selection exclusively to selected format
    setQuantities({ [s]: Math.max(0, qty) });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-28 sm:pt-36 px-4 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-pulse">
            <div className="md:col-span-5 h-72 bg-muted rounded-2xl max-w-xs mx-auto w-full" />
            <div className="md:col-span-7 space-y-4">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-8 w-3/4 bg-muted rounded" />
              <div className="h-24 bg-muted rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !parfum) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-28 sm:pt-36 pb-16">
          <h1 className="font-serif text-xl sm:text-2xl mb-3">Parfum introuvable</h1>
          {error && <p className="text-xs text-destructive mb-6">{error}</p>}
          <Button
            onClick={() => navigate("/collection/all")}
            className="rounded-full bg-primary text-primary-foreground text-xs uppercase tracking-wider px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voir la collection
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isFullBottle = parfum.sale_mode === "full_bottle";

  // STRICTEMENT n'afficher que les formats ayant un prix > 0 configuré en base de données
  const availableSizes: Size[] = isFullBottle
    ? ["full"]
    : (["5ml", "10ml"] as Size[]).filter((s) => {
        const p = priceFor(parfum, s);
        return typeof p === "number" && !isNaN(p) && p > 0;
      });

  const fullStock = parfum.full_bottle_stock ?? 0;
  const outOfStock =
    !parfum.is_active ||
    parfum.stock_status === "rupture" ||
    (isFullBottle && fullStock <= 0);

  const getProductFormatInfo = (s: Size) => {
    if (s === "full") {
      if (!isParfum) {
        const parts: string[] = [];
        if (parfum?.weight_value) {
          parts.push(`${parfum.weight_value} ${parfum.weight_unit || "g"}`);
        }
        if (parfum?.volume_value) {
          parts.push(`${parfum.volume_value} ${parfum.volume_unit || "ml"}`);
        }
        const label = parts.length > 0
          ? parts.join(" • ")
          : (parfum?.full_bottle_volume_ml ? `${parfum.full_bottle_volume_ml} ml` : (language === "en" ? "Standard Format" : "Format Standard"));
        const sub = parfum?.category === "deodorants-stick" ? "Stick Corporel" : "";
        return { label, sub };
      }
      return {
        label: parfum?.full_bottle_volume_ml ? `${parfum.full_bottle_volume_ml} ml` : "Flacon Complet",
        sub: parfum?.category === "deodorants-stick" ? "Stick Corporel" : "Flacon Scellé Original",
      };
    }
    return {
      label: SIZE_META[s]?.label ?? s,
      sub: SIZE_META[s]?.sub ?? "Décantation",
    };
  };

  // Selected items with quantity > 0
  const selectedItems: OrderSelectionItem[] = availableSizes
    .filter((s) => (quantities[s] ?? 0) > 0)
    .map((s) => {
      const qty = quantities[s] ?? 0;
      const unitPrice = priceFor(parfum, s);
      const fmt = getProductFormatInfo(s);
      return {
        size: s,
        sizeLabel: fmt.label,
        quantity: qty,
        unitPrice,
        subtotal: unitPrice * qty,
      };
    });

  const totalQuantity = selectedItems.reduce((acc, it) => acc + it.quantity, 0);
  const totalPrice = selectedItems.reduce((acc, it) => acc + it.subtotal, 0);

  const handleAddToCart = () => {
    if (outOfStock) {
      toast.error("Ce produit est actuellement en rupture de stock.");
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("Veuillez choisir une quantité pour au moins un format");
      return;
    }

    selectedItems.forEach((item) => {
      addItem({
        id: parfum.id,
        name: displayName || parfum.name,
        name_en: parfum.name_en,
        maison: parfum.maison,
        size: item.size as Size,
        sizeLabel: item.sizeLabel,
        quantity: item.quantity,
        price: item.unitPrice,
        imageLabel: displaySubtitle || parfum.image_label,
        imageLabel_en: parfum.image_label_en,
        imageUrl: parfum.image_url,
      });
    });

    const summary = selectedItems.map((i) => `${i.sizeLabel} × ${i.quantity}`).join(", ");
    toast.success("Ajouté au panier", {
      description: `${displayName || parfum.name} (${summary})`,
    });
    openCart();
  };

  const seoTitle = `${displayName || parfum.name} — ${parfum.maison || "Maison Kenzi"} | Haute Parfumerie`.slice(0, 70);
  const seoDescription = (
    displayDescription?.trim() ||
    `Produit authentique ${parfum.maison || "Maison Kenzi"} ${displayName || parfum.name}, disponible chez Maison Kenzi au Maroc.`
  ).slice(0, 160);
  const canonical = getParfumUrl(parfum);
  const primaryImg = images[0] || parfum.image_url;
  const primaryImageUrl = primaryImg
    ? (primaryImg.startsWith("http") ? primaryImg : `https://maison-kenzi.com${primaryImg.startsWith("/") ? primaryImg : `/${primaryImg}`}`)
    : "https://maison-kenzi.com/mk-logo.png";

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `https://maison-kenzi.com${canonical}#product`,
    name: displayName || parfum.name,
    brand: {
      "@type": "Brand",
      name: parfum.maison || "Maison Kenzi",
    },
    description: displayDescription || seoDescription,
    image: primaryImageUrl,
    sku: `MK-${parfum.id.slice(0, 8)}`,
    category: "Haute Parfumerie",
    offers: {
      "@type": "Offer",
      "@id": `https://maison-kenzi.com${canonical}#offer`,
      url: `https://maison-kenzi.com${canonical}`,
      priceCurrency: "MAD",
      price: priceFor(parfum, isFullBottle ? "full" : "10ml"),
      priceValidUntil: "2026-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: parfum.is_active
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Maison Kenzi",
      },
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        "position": 1,
        "name": language === "en" ? "Home" : "Accueil",
        "item": "https://maison-kenzi.com/",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categoryLabel || (language === "en" ? "Catalog" : "Catalogue"),
        "item": `https://maison-kenzi.com/collection/${parfum.category || "all"}`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": displayName || parfum.name,
        "item": `https://maison-kenzi.com${canonical}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={canonical}
        image={primaryImageUrl}
        ogType="product"
        jsonLd={[productLd, breadcrumbLd]}
      />
      <Header />

      <main className="flex-1 pt-28 sm:pt-32 md:pt-36 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Breadcrumb Navigation */}
          <Breadcrumb>
            <BreadcrumbList className="text-[10px] sm:text-xs">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                    {t.nav?.home || (language === "en" ? "Home" : "Accueil")}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to={breadcrumbCategoryLink}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {breadcrumbCategoryName}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-medium truncate max-w-[150px] sm:max-w-xs">
                  {displayName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* MAIN PRODUCT CLEAN & AIRY GRID */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 lg:gap-10 items-start">
            {/* LEFT COLUMN: Crystal Clear Product Image + Multi-photo Gallery Preview */}
            <div className="md:col-span-5 w-full space-y-3 md:sticky md:top-24">
              {(() => {
                const galleryImages = getParfumImages(parfum);
                const currentDisplayImage =
                  galleryImages[activeImageIndex] || parfum.image_url;

                const prevImg = () => {
                  if (galleryImages.length <= 1) return;
                  setActiveImageIndex(
                    (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
                  );
                };

                const nextImg = () => {
                  if (galleryImages.length <= 1) return;
                  setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
                };

                return (
                  <div className="space-y-2.5">
                    {/* Conteneur de l'image principale */}
                    <div className="relative group overflow-hidden rounded-2xl bg-card/30 border border-border/60">
                      <ProductImage
                        src={currentDisplayImage}
                        alt={parfum.name}
                        label={parfum.image_label}
                        aspect="aspect-[4/5]"
                        fitMode="contain"
                        className={`max-h-[300px] sm:max-h-[400px] md:max-h-[460px] w-full mx-auto transition-all duration-500 ${
                          outOfStock ? "grayscale opacity-60 contrast-75" : ""
                        }`}
                      />

                      {/* Flèches de navigation si plusieurs images */}
                      {galleryImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={prevImg}
                            aria-label="Image précédente"
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background/85 dark:bg-black/80 backdrop-blur-md border border-border/80 text-foreground flex items-center justify-center shadow-lg hover:scale-110 hover:bg-background transition-all cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                          </button>
                          <button
                            type="button"
                            onClick={nextImg}
                            aria-label="Image suivante"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background/85 dark:bg-black/80 backdrop-blur-md border border-border/80 text-foreground flex items-center justify-center shadow-lg hover:scale-110 hover:bg-background transition-all cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                          </button>

                          {/* Indicateur de position (ex: 1 / 3) */}
                          <div className="absolute bottom-2.5 left-2.5 z-20 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-md border border-white/10 shadow-sm pointer-events-none">
                            {activeImageIndex + 1} / {galleryImages.length}
                          </div>
                        </>
                      )}

                      {outOfStock && (
                        <span className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-widest bg-zinc-900/90 dark:bg-zinc-800/90 text-zinc-200 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full font-bold border border-zinc-700/60 shadow-lg">
                          <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-red-500 animate-pulse" />
                          <span>Rupture de Stock</span>
                        </span>
                      )}

                      {/* Glass Spray Bottle Badge Preview */}
                      {!isFullBottle && !outOfStock && (
                        <div className="absolute top-2.5 right-2.5 z-20 bg-background/95 dark:bg-black/90 backdrop-blur-md border border-primary/50 rounded-2xl p-2 sm:p-2.5 shadow-xl animate-in zoom-in-95 fade-in duration-300 flex flex-col items-center gap-1 min-w-[60px] sm:min-w-[68px]">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold">
                              {quantities["10ml"] > 0
                                ? "10ml"
                                : quantities["5ml"] > 0
                                ? "5ml"
                                : "Decant"}
                            </span>
                            <Sparkles className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-primary animate-pulse" />
                          </div>

                          <div className="flex flex-col items-center py-0.5">
                            <div
                              className="rounded-t-[3px] shadow-sm relative"
                              style={{
                                width: "12px",
                                height: quantities["10ml"] > 0 ? "16px" : "12px",
                                background:
                                  "linear-gradient(180deg, #111111 0%, #333333 40%, #0a0a0a 100%)",
                              }}
                            />
                            <div
                              className="border-x-2 border-b-2 border-primary/80 bg-gradient-to-b from-primary/10 via-primary/30 to-primary/15 rounded-b-[4px] relative shadow-inner"
                              style={{
                                width: "10px",
                                height: quantities["10ml"] > 0 ? "55px" : "36px",
                              }}
                            >
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-[90%] bg-foreground/50" />
                            </div>
                          </div>

                          <p className="text-[7px] sm:text-[7.5px] text-primary font-bold text-center">
                            {totalQuantity > 0
                              ? `${totalQuantity} flacon${totalQuantity > 1 ? "s" : ""}`
                              : "Flacons Verre"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Rangée des miniatures (Vignettes cliquables) */}
                    {galleryImages.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 scrollbar-none">
                        {galleryImages.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImageIndex(idx)}
                            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border transition-all shrink-0 cursor-pointer ${
                              idx === activeImageIndex
                                ? "border-primary ring-2 ring-primary/30 scale-[1.03] shadow-sm"
                                : "border-border/70 opacity-70 hover:opacity-100 hover:border-border"
                            }`}
                          >
                            <img
                              src={img}
                              alt={`${parfum.name} — vue ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground text-center">
                <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-card/40 border border-border/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{t.product.authenticity}</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-card/40 border border-border/60">
                  <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{t.common.freeShipping}</span>
                </div>
              </div>

              {/* Product Olfactory & Seasonal Profile Card / Conseils d'application */}
              {(isParfum || translatedDescription || parfum.weight_value || parfum.volume_value) && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-card/40 border border-border/70 space-y-3 text-xs">
                  {/* Saisons d'utilisation réservées aux Parfums */}
                  {isParfum && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-primary flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {language === "en" ? "Seasons" : "Saisons"}
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {getParfumSeasons(parfum).map((season) => {
                          const meta = getSeasonMeta(season, language);
                          const IconComp = meta.icon;
                          return (
                            <span
                              key={season}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-background/80 border border-border text-[11px] font-medium text-foreground"
                            >
                              <IconComp className="w-3 h-3 text-primary" strokeWidth={1.75} />
                              <span>{meta.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Notes olfactives réservées aux Parfums */}
                  {isParfum && translatedNotes && (
                    <div className="space-y-1.5 pt-1 border-t border-border/50">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-primary flex items-center gap-1.5">
                        <Sparkle className="w-3.5 h-3.5" /> {t.product.notes}
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px]">
                        {translatedNotes}
                      </p>
                    </div>
                  )}

                  {/* Caractéristiques de Soin / Cosmétique */}
                  {!isParfum && (parfum.weight_value || parfum.volume_value) && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-primary flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Contenance & Poids
                      </span>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {parfum.weight_value && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-background/80 border border-border text-[11px] font-medium text-foreground">
                            Poids : {parfum.weight_value} {parfum.weight_unit || "g"}
                          </span>
                        )}
                        {parfum.volume_value && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-background/80 border border-border text-[11px] font-medium text-foreground">
                            Volume : {parfum.volume_value} {parfum.volume_unit || "ml"}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description / Conseils d'application */}
                  {translatedDescription && (
                    <div className={`space-y-1 ${isParfum || parfum.weight_value || parfum.volume_value ? "pt-1 border-t border-border/50" : ""}`}>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                        {isParfum ? t.product.description : "Description & Conseils d'application"}
                      </span>
                      <p className="text-muted-foreground leading-relaxed text-[11px] whitespace-pre-wrap">
                        {translatedDescription}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Product Information & Order Actions */}
            <div className="md:col-span-7 space-y-4">
              {/* Header Info Block */}
              <div className="space-y-1">
                <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-primary font-bold block">
                  {parfum.maison}
                </span>

                <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-foreground font-semibold leading-tight">
                  {displayName}
                </h1>

                {displaySubtitle && (
                  <p className="text-xs sm:text-sm text-primary/90 font-serif italic whitespace-pre-wrap pt-0.5">
                    {displaySubtitle}
                  </p>
                )}

                <div className="flex items-center flex-wrap gap-1.5 pt-1">
                  {/* Genre réservé exclusivement aux parfums */}
                  {isParfum && parfum.gender && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full border border-border/60 font-medium">
                      {getProductGender(parfum.gender, language)}
                    </span>
                  )}

                  {parfum.is_new && (
                    <span className="text-[10px] uppercase tracking-wider text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full font-medium shadow-xs animate-badge-glow">
                      {language === "en" ? "New" : "Nouveau"}
                    </span>
                  )}

                  {/* Volume Flacon pour Parfums */}
                  {isParfum && parfum.full_bottle_volume_ml && (
                    <span className="text-[10px] tracking-wider text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full border border-border/60 font-medium">
                      {parfum.full_bottle_volume_ml} ml
                    </span>
                  )}

                  {/* Poids & Volume pour Soins / Cosmétiques */}
                  {!isParfum && parfum.weight_value && (
                    <span className="text-[10px] tracking-wider text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full border border-border/60 font-medium">
                      {parfum.weight_value} {parfum.weight_unit || "g"}
                    </span>
                  )}
                  {!isParfum && parfum.volume_value && (
                    <span className="text-[10px] tracking-wider text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full border border-border/60 font-medium">
                      {parfum.volume_value} {parfum.volume_unit || "ml"}
                    </span>
                  )}

                  {/* Tags Saisons d'utilisation réservés exclusivement aux Parfums */}
                  {isParfum && getParfumSeasons(parfum).map((season) => {
                    const meta = getSeasonMeta(season, language);
                    const IconComp = meta.icon;
                    return (
                      <span
                        key={season}
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full border border-border/60 font-medium"
                      >
                        <IconComp className="w-3 h-3 text-primary" strokeWidth={1.75} />
                        <span>{meta.label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Format / Size Selection Cards with Independent Quantities */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-foreground flex items-center gap-1.5">
                    {isParfum ? (
                      <Droplets className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                    <span>{t.product.sizeSelect}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {availableSizes.map((s) => {
                    const { label: formatLabel, sub: formatSub } = getProductFormatInfo(s);

                    const formatStock =
                      s === "full"
                        ? (parfum.full_bottle_stock ?? 0)
                        : s === "5ml"
                        ? (parfum.stock_5ml ?? 0)
                        : s === "10ml"
                        ? (parfum.stock_10ml ?? 0)
                        : 0;

                    const isFormatOutOfStock = outOfStock || (typeof formatStock === "number" && formatStock <= 0);

                    const qty = quantities[s] ?? 0;
                    const isSelected = qty > 0;
                    const unitPrice = priceFor(parfum, s);

                    return (
                      <div
                        key={s}
                        className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2 sm:gap-3 ${
                          isFormatOutOfStock
                            ? "opacity-50 border-border/50 bg-muted/20 cursor-not-allowed"
                            : isSelected
                            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                            : "border-border/80 bg-card/40 hover:border-primary/40"
                        }`}
                      >
                        {/* Format Info */}
                        <div
                          className={`flex-1 min-w-0 select-none ${isFormatOutOfStock ? "cursor-not-allowed" : "cursor-pointer"}`}
                          onClick={() => {
                            if (!isFormatOutOfStock) setDirectSizeQty(s, 1);
                          }}
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-sm sm:text-base font-semibold ${isFormatOutOfStock ? "text-muted-foreground line-through" : "text-foreground"}`}>
                              {formatLabel}
                            </span>
                            {formatSub ? (
                              <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full border border-border/50 truncate">
                                {formatSub}
                              </span>
                            ) : null}
                            {isFormatOutOfStock && (
                              <span className="text-[9px] font-bold text-destructive uppercase tracking-wider bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20 shrink-0">
                                Épuisé
                              </span>
                            )}
                          </div>
                          <div className={`text-xs sm:text-sm font-semibold tracking-tight mt-0.5 ${isFormatOutOfStock ? "text-muted-foreground" : "text-primary"}`}>
                            {isFormatOutOfStock ? "Indisponible" : `${formatMAD(unitPrice)} `}
                            {!isFormatOutOfStock && <span className="text-[10px] font-normal text-muted-foreground">/ unité</span>}
                          </div>
                        </div>

                        {/* Individual Quantity Stepper */}
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                          <div className={`flex items-center border rounded-full px-1 sm:px-1.5 py-0.5 shadow-xs ${
                            isFormatOutOfStock ? "border-border/40 bg-muted/40 opacity-40" : "border-border bg-background"
                          }`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isFormatOutOfStock) updateSizeQty(s, -1);
                              }}
                              className="h-7 w-7 flex items-center justify-center rounded-full text-foreground hover:text-primary hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              disabled={qty === 0 || isFormatOutOfStock}
                              aria-label={`Diminuer ${formatLabel}`}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-semibold text-foreground select-none">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isFormatOutOfStock) updateSizeQty(s, 1);
                              }}
                              className="h-7 w-7 flex items-center justify-center rounded-full text-foreground hover:text-primary hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              disabled={isFormatOutOfStock || (typeof formatStock === "number" && qty >= formatStock)}
                              aria-label={`Augmenter ${formatLabel}`}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STATIC ORDER FORM (ALWAYS VISIBLE DIRECTLY UNDER FORMATS & QUANTITIES) */}
              <ExpressOrderForm
                parfumName={parfum.name}
                maison={parfum.maison}
                items={selectedItems}
                totalPrice={totalPrice}
                onAddToCart={handleAddToCart}
                outOfStock={outOfStock}
              />
            </div>
          </div>

          {/* Related Products Section */}
          <RelatedProducts currentParfumId={parfum.id} maison={parfum.maison} gender={parfum.gender} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ParfumDetail;
