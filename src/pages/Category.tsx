import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import ProductImage from "@/components/ui/ProductImage";
import Seo from "@/components/Seo";
import { useParfums } from "@/hooks/useParfums";
import { formatMAD, getParfumPricingSummary } from "@/lib/sizes";
import {
  Sparkles,
  Flame,
  Flower2,
  ShieldCheck,
  Package,
  Grid,
  ChevronDown,
  Check,
  ArrowUpDown,
  Search,
  Crown,
  SlidersHorizontal,
  Sun,
  Leaf,
  Wind,
  Snowflake,
  Clock,
  MessageCircle,
  Users,
  RotateCcw,
  X,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import { useCategories } from "@/store/useCategoryStore";
import { getParfumSeasons, getSeasonMeta } from "@/lib/seasonsStore";
import { isParfumInCategory } from "@/lib/productCategories";
import QuickAddToCartButton from "@/components/ui/QuickAddToCartButton";

type FilterKey = string;
type SortOption = "featured" | "price_asc" | "price_desc" | "newest" | "name_asc";
type GenderOption = "all" | "Homme" | "Femme" | "Mixte";

const sortOptionsList: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Recommandés" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "newest", label: "Nouveautés" },
  { value: "name_asc", label: "Nom (A–Z)" },
];

interface FilterOption {
  key: FilterKey;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  isGold?: boolean;
  isComingSoon?: boolean;
}

const slugToFilter = (slug: string | undefined): FilterKey => {
  if (!slug || slug === "all") return "Toutes";
  return slug.toLowerCase();
};

const filterToSlug = (key: FilterKey): string => {
  if (key === "Toutes") return "all";
  return key;
};

const collectionHeroInfo = (
  filter: FilterKey,
  categoryName?: string,
  categoryDesc?: string,
  isComingSoon?: boolean
) => {
  const f = filter.toLowerCase();
  if (f === "toutes" || f === "all") {
    return {
      title: "Toutes les Collections",
      subtitle: "Catalogue Officiel",
      description: "Explorez l'ensemble de notre sélection de haute parfumerie et flacons originaux.",
      badge: "",
    };
  }

  return {
    title: categoryName || filter,
    subtitle: "Univers Olfactif",
    description: (categoryDesc || "").trim(),
    badge: isComingSoon ? "À Venir" : "",
  };
};

const Collection = () => {
  const { collection } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>(slugToFilter(collection));
  const [isMobileSelectOpen, setIsMobileSelectOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [localSearch, setLocalSearch] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [genderFilter, setGenderFilter] = useState<GenderOption>("all");

  const adminCategories = useCategories();
  const activeAdminCategories = useMemo(
    () => adminCategories.filter((c) => c.is_active),
    [adminCategories]
  );

  const filterOptions = useMemo<FilterOption[]>(() => {
    const options: FilterOption[] = [
      { key: "Toutes", label: "Toutes les Collections", shortLabel: "Toutes", icon: Grid },
    ];

    activeAdminCategories.forEach((cat) => {
      const s = cat.slug.toLowerCase();
      if (s !== "homme" && s !== "femme" && s !== "all" && s !== "toutes") {
        let icon = Grid;
        if (s.includes("deodorant")) icon = ShieldCheck;
        else if (s.includes("pack")) icon = Crown;

        options.push({
          key: cat.slug,
          label: cat.name,
          shortLabel: cat.name,
          icon,
          isGold: s.includes("pack"),
          isComingSoon: Boolean(cat.is_coming_soon),
        });
      }
    });

    return options;
  }, [activeAdminCategories]);

  const { data: parfums, loading, error } = useParfums();

  useEffect(() => {
    setFilter(slugToFilter(collection));
  }, [collection]);

  const handleFilterClick = (key: FilterKey) => {
    setFilter(key);
    setIsMobileSelectOpen(false);
    navigate(`/collection/${filterToSlug(key)}`);
  };

  const currentCategoryObj = useMemo(
    () => activeAdminCategories.find((c) => c.slug.toLowerCase() === filter.toLowerCase()),
    [activeAdminCategories, filter]
  );

  const hero = collectionHeroInfo(
    filter,
    currentCategoryObj?.name,
    currentCategoryObj?.description,
    Boolean(currentCategoryObj?.is_coming_soon)
  );

  // Filter and sort products
  const filteredAndSorted = useMemo(() => {
    let list = parfums.filter((p) => {
      // Category filter
      if (filter !== "Toutes") {
        if (!isParfumInCategory(p, filter)) return false;
      }

      // Gender filter (Homme / Femme / Mixte / Unisexe)
      if (genderFilter !== "all") {
        const g = (p.gender || "").toLowerCase().trim();
        const targetG = genderFilter.toLowerCase();
        if (targetG === "mixte") {
          if (g !== "mixte" && g !== "unisexe") return false;
        } else {
          if (g !== targetG) return false;
        }
      }

      // In stock filter
      if (onlyInStock) {
        const isFull = p.sale_mode === "full_bottle";
        const fullStock = p.full_bottle_stock ?? 0;
        const outOfStock =
          p.is_active === false ||
          p.stock_status === "rupture" ||
          (isFull && typeof p.full_bottle_stock === "number" && fullStock <= 0);
        if (outOfStock) return false;
      }

      // Local search query
      if (localSearch.trim()) {
        const q = localSearch.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchMaison = p.maison.toLowerCase().includes(q);
        if (!matchName && !matchMaison) return false;
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      const priceA = a.sale_mode === "full_bottle" ? (a.full_bottle_price ?? 0) : a.price_5ml;
      const priceB = b.sale_mode === "full_bottle" ? (b.full_bottle_price ?? 0) : b.price_5ml;

      if (sortBy === "price_asc") return priceA - priceB;
      if (sortBy === "price_desc") return priceB - priceA;
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "newest") return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
      return (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0);
    });

    return list;
  }, [filter, parfums, activeAdminCategories, genderFilter, onlyInStock, localSearch, sortBy]);

  // Compute counts for each filter
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      Toutes: parfums.length,
    };
    activeAdminCategories.forEach((cat) => {
      map[cat.slug] = parfums.filter((p) => isParfumInCategory(p, cat.slug)).length;
    });
    return map;
  }, [parfums, activeAdminCategories]);

  const currentOption = filterOptions.find((o) => o.key.toLowerCase() === filter.toLowerCase()) || filterOptions[0];
  const CurrentIcon = currentOption.icon;

  const title = `${hero.title} — Maison Kenzi`;
  const description = hero.description
    ? `${hero.description} Produits 100% originaux, livraison 24-48h partout au Maroc.`
    : "Catalogue officiel Maison Kenzi - Parfums d'exception, décants et soins au Maroc.";
  const canonical = `/collection/${(collection ?? "all").toLowerCase()}`;

  const categoryBanner = currentCategoryObj?.image || currentCategoryObj?.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <Seo title={title} description={description} path={canonical} />
      <Header />

      <main className="flex-1 pb-16">
        {/* Luxury Category Hero Banner */}
        {categoryBanner ? (
          <section className="relative w-full overflow-hidden bg-[#0C0B0A] border-b border-[#C9A96E]/20">
            {/* Image de fond plein écran en bannière avec voile ultra-léger */}
            <div className="absolute inset-0 z-0">
              <img
                src={categoryBanner}
                alt={hero.title}
                className="w-full h-full object-cover object-center"
              />
              {/* Voile ultra-léger pour préserver l'éclat de la photo tout en assurant la lisibilité */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />
            </div>

            {/* Contenu de la Bannière de Catégorie */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-16 flex flex-col justify-end min-h-[280px] sm:min-h-[340px] md:min-h-[380px]">
              <div className="space-y-3.5 max-w-3xl">
                {/* Fil d'ariane en verre dépoli */}
                <Breadcrumb>
                  <BreadcrumbList className="text-[10px] sm:text-xs">
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/" className="text-white/70 hover:text-[#C9A96E] transition-colors">
                          Accueil
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-white/40" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-[#C9A96E] font-medium">
                        {hero.title}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>

                {/* Badges d'univers & sous-titre */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {hero.badge && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A96E]/20 border border-[#C9A96E]/40 text-[#C9A96E] text-[10px] sm:text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-xs">
                      <Sparkles className="w-3 h-3 text-[#C9A96E]" />
                      <span>{hero.badge}</span>
                    </div>
                  )}
                  {hero.subtitle && (
                    <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/75 font-medium px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
                      {hero.subtitle}
                    </span>
                  )}
                </div>

                {/* Titre éditorial de la Collection */}
                <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-white font-normal tracking-tight drop-shadow-md leading-[1.1]">
                  {hero.title}
                </h1>

                {/* Description de l'univers olfactif */}
                {hero.description && (
                  <p className="text-xs sm:text-sm md:text-base text-white/85 leading-relaxed font-light max-w-2xl pt-1 drop-shadow-xs">
                    {hero.description}
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : (
          /* En-tête épuré standard lorsque la catégorie n'a pas d'image */
          <section className="relative w-full border-b border-border/70 bg-gradient-to-b from-card/60 via-card/30 to-background pt-20 sm:pt-24 pb-8 sm:pb-12 px-4 sm:px-6 overflow-hidden">
            {/* Subtle Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-primary/5 blur-3xl rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 space-y-4">
              {/* Breadcrumb */}
              <Breadcrumb>
                <BreadcrumbList className="text-[10px] sm:text-xs">
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                        Accueil
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-foreground font-medium">
                      {hero.title}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              {/* Header Content */}
              <div className="max-w-3xl space-y-2">
                {hero.badge && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>{hero.badge}</span>
                  </div>
                )}
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground font-bold tracking-tight">
                  {hero.title}
                </h1>
                {hero.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light pt-1">
                    {hero.description}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Collection Selector & Filter Navigation */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 mb-4 sm:mb-6">
          {/* Mobile Collection Dropdown */}
          <div className="md:hidden relative mb-3">
            <button
              type="button"
              onClick={() => setIsMobileSelectOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-card border border-border shadow-xs text-foreground active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CurrentIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs uppercase tracking-wider font-semibold text-foreground truncate">
                  {currentOption.label}
                </span>
                <span className="text-xs font-semibold text-primary">
                  ({counts[filter] ?? 0})
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                <span>Changer</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isMobileSelectOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {isMobileSelectOpen && (
              <>
                <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setIsMobileSelectOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  {filterOptions.map((item) => {
                    const active = item.key.toLowerCase() === filter.toLowerCase();
                    const Icon = item.icon;
                    const count = counts[item.key] ?? 0;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleFilterClick(item.key)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider font-medium transition-colors cursor-pointer ${
                          active
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : item.isGold
                            ? "text-primary hover:bg-primary/10"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${active ? "text-primary-foreground" : "text-primary"}`} />
                          <span>{item.label}</span>
                          {item.isComingSoon && (
                            <span className="text-[9px] uppercase tracking-wider text-[#C9A96E] font-medium bg-[#C9A96E]/15 border border-[#C9A96E]/30 px-1.5 py-0.2 rounded-full">
                              À venir
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold opacity-90">({count})</span>
                          {active && <Check className="w-4 h-4 text-primary-foreground" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Desktop Collection Pills Bar */}
          <div className="hidden md:flex items-center justify-center flex-wrap gap-2 p-1.5 rounded-full bg-card/80 border border-border/80 backdrop-blur-md shadow-xs max-w-fit mx-auto mb-6">
            {filterOptions.map((item) => {
              const active = item.key.toLowerCase() === filter.toLowerCase();
              const Icon = item.icon;
              const count = counts[item.key] ?? 0;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleFilterClick(item.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider font-semibold transition-all duration-200 cursor-pointer ${
                    active
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                      : item.isGold
                      ? "text-primary hover:bg-primary/10"
                      : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-primary-foreground" : "text-primary"}`} />
                  <span>{item.label}</span>
                  {item.isComingSoon && (
                    <span
                      className={`text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.2 rounded-full ${
                        active
                          ? "bg-black/30 text-white"
                          : "bg-[#C9A96E]/15 text-[#C9A96E] border border-[#C9A96E]/30"
                      }`}
                    >
                      À venir
                    </span>
                  )}
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                        active
                          ? "bg-black/20 text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search, Filter Bar & Sort Controls Haute Parfumerie */}
          {parfums.length > 0 && (
            <div className="bg-card/70 dark:bg-[#131211]/80 border border-border/80 dark:border-[#C9A96E]/20 rounded-3xl p-3 sm:p-4 shadow-sm backdrop-blur-xl space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Search Input Haute Parfumerie */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary shrink-0" />
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder={`Rechercher dans ${hero.title}...`}
                    className="w-full pl-10 pr-9 py-2 text-xs bg-background/90 dark:bg-[#0C0B0A]/90 border border-border/80 focus:border-primary rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground transition-all shadow-2xs"
                  />
                  {localSearch && (
                    <button
                      type="button"
                      onClick={() => setLocalSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors cursor-pointer"
                      aria-label="Effacer la recherche"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Groupes de Filtres : Genre, Stock & Tri */}
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-2.5">
                  {/* Segmented Control pour le Genre (Homme, Femme, Mixte, Tous) */}
                  <div className="inline-flex items-center p-0.5 rounded-full bg-background/90 dark:bg-[#0C0B0A]/90 border border-border/80 shadow-2xs">
                    {(
                      [
                        { key: "all", label: "Tous", icon: Users },
                        { key: "Homme", label: "Homme", icon: Flame },
                        { key: "Femme", label: "Femme", icon: Flower2 },
                        { key: "Mixte", label: "Mixte", icon: Sparkles },
                      ] as const
                    ).map((item) => {
                      const isActive = genderFilter === item.key;
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setGenderFilter(item.key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <ItemIcon className={`w-3 h-3 ${isActive ? "text-primary-foreground" : "text-primary"}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bouton Toggle pour « En stock uniquement » */}
                  <button
                    type="button"
                    onClick={() => setOnlyInStock((v) => !v)}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-wider uppercase transition-all duration-200 cursor-pointer border shadow-2xs select-none ${
                      onlyInStock
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "bg-background/90 dark:bg-[#0C0B0A]/90 border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/40"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full transition-all ${
                        onlyInStock ? "bg-emerald-500 shadow-xs animate-pulse" : "bg-muted-foreground/30"
                      }`}
                    />
                    <span>En stock</span>
                  </button>

                  {/* Menu Déroulant Tri de Prestige */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-background/90 dark:bg-[#0C0B0A]/90 border border-border/80 hover:border-primary/50 text-foreground text-[11px] font-medium tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-2xs outline-none focus:ring-2 focus:ring-primary/20">
                      <ArrowUpDown className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="hidden sm:inline text-muted-foreground font-normal">Tri :</span>
                      <span className="font-semibold text-foreground">
                        {sortOptionsList.find((s) => s.value === sortBy)?.label || "Recommandés"}
                      </span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 p-1.5 rounded-2xl bg-card/95 dark:bg-[#151821]/95 backdrop-blur-xl border border-border/80 dark:border-white/10 shadow-xl space-y-0.5 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                    >
                      {sortOptionsList.map((opt) => {
                        const isSelected = sortBy === opt.value;
                        return (
                          <DropdownMenuItem
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "text-foreground hover:bg-muted/70"
                            }`}
                          >
                            <span>{opt.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground shrink-0" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Bouton de Réinitialisation Rapide si des filtres sont actifs */}
                  {(genderFilter !== "all" || onlyInStock || localSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocalSearch("");
                        setOnlyInStock(false);
                        setGenderFilter("all");
                      }}
                      title="Réinitialiser tous les filtres"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 text-[11px] font-medium tracking-wider uppercase transition-all cursor-pointer shadow-2xs"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden sm:inline">Effacer</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Products Grid Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-2">
          {error ? (
            <div className="text-center py-20 bg-card/40 border border-border rounded-3xl p-6">
              <p className="text-sm text-destructive">Une erreur est survenue lors du chargement des parfums.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 text-xs uppercase tracking-widest text-primary border border-primary/40 px-5 py-2.5 rounded-full hover:bg-primary/10 cursor-pointer"
              >
                Réessayer
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-3 bg-card/40 border border-border/60 rounded-2xl p-3">
                  <div className="aspect-[4/5] bg-muted/60 rounded-xl" />
                  <div className="h-3 w-20 bg-muted/80 rounded" />
                  <div className="h-4 w-32 bg-muted/80 rounded" />
                  <div className="h-4 w-16 bg-muted/80 rounded" />
                </div>
              ))}
            </div>
          ) : parfums.length === 0 ? (
            /* État sobre : Aucun produit dans la base */
            <div className="text-center py-24 px-4 max-w-md mx-auto">
              <p className="font-serif text-xl sm:text-2xl text-foreground font-normal mb-2">
                Aucun produit
              </p>
              <p className="text-xs font-light text-muted-foreground leading-relaxed">
                Aucun parfum n'est disponible pour le moment.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-3">
                <span>{filteredAndSorted.length} référence{filteredAndSorted.length > 1 ? "s" : ""} disponible{filteredAndSorted.length > 1 ? "s" : ""}</span>
                {localSearch && (
                  <button onClick={() => setLocalSearch("")} className="text-primary hover:underline text-[11px]">
                    Effacer la recherche
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {filteredAndSorted.map((p) => {
                  const isFull = p.sale_mode === "full_bottle";
                  const fullStock = p.full_bottle_stock ?? 0;
                  const outOfStock =
                    p.is_active === false ||
                    p.stock_status === "rupture" ||
                    (isFull && typeof p.full_bottle_stock === "number" && fullStock <= 0);

                  const pricing = getParfumPricingSummary(p);

                  return (
                    <Link
                      key={p.id}
                      to={`/parfum/${p.id}`}
                      className={`block group relative transition-all duration-500 hover:-translate-y-1 text-left ${
                        outOfStock ? "opacity-75" : ""
                      }`}
                    >
                      {/* Product Visual Container */}
                      <div className="relative mb-2.5 sm:mb-3 overflow-hidden rounded-xl bg-muted/40 aspect-[4/5] w-full">
                        <ProductImage
                          src={p.image_url}
                          images={p.images}
                          alt={p.name}
                          label={p.image_label}
                          aspect="aspect-[4/5]"
                          fitMode="cover"
                          className={`w-full h-full transition-all duration-700 ease-out ${
                            outOfStock ? "grayscale opacity-50 contrast-75" : "group-hover:scale-105"
                          }`}
                        />

                        {/* Status Badges - Rupture badge only */}
                        {outOfStock && (
                          <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest bg-zinc-900/90 dark:bg-zinc-800/90 text-zinc-200 backdrop-blur-md px-2.5 py-0.5 rounded-full font-bold border border-zinc-700/60 shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span>Rupture</span>
                          </span>
                        )}

                        {/* Light Sweep Shimmer Effect */}
                        {!outOfStock && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                        )}
                      </div>

                      {/* Maison & Name */}
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground truncate transition-colors duration-300 group-hover:text-primary">
                        {p.maison}
                      </p>

                      {/* Titre et Bouton Panier sur la même ligne */}
                      <div className="flex items-center justify-between gap-1.5 mt-0.5 min-h-[32px]">
                        <h3 className={`font-serif text-sm sm:text-base font-medium truncate transition-colors duration-300 flex-1 ${
                          outOfStock ? "text-muted-foreground" : "text-foreground group-hover:text-primary"
                        }`}>
                          {p.name}
                        </h3>
                        {!outOfStock && (
                          <QuickAddToCartButton
                            parfum={p}
                            size="sm"
                          />
                        )}
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
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
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

              {filteredAndSorted.length === 0 && (
                currentCategoryObj?.is_coming_soon ? (
                  <div className="relative overflow-hidden rounded-3xl border border-[#C9A96E]/30 bg-gradient-to-b from-card/90 via-card/50 to-card/90 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xl space-y-6 my-8">
                    {/* Halo d'ambiance */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#C9A96E]/10 blur-2xl rounded-full pointer-events-none" />

                    <div className="w-14 h-14 rounded-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-[#C9A96E] flex items-center justify-center mx-auto shadow-sm relative z-10">
                      <Clock className="w-7 h-7" strokeWidth={1.5} />
                    </div>

                    <div className="space-y-2 relative z-10">
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-[#C9A96E] text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>En Cours d'Élaboration</span>
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl text-foreground font-normal tracking-tight">
                        Cette collection arrive très prochainement
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto font-light">
                        Nos maîtres parfumeurs préparent actuellement la sélection des flacons originaux d'exception pour l'univers <strong className="text-foreground font-medium">{currentCategoryObj.name}</strong>.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-center relative z-10">
                      <button
                        type="button"
                        onClick={() => handleFilterClick("Toutes")}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Explorer les autres collections</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-card/40 border border-border rounded-3xl p-8 max-w-md mx-auto space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      Aucun parfum ne correspond à vos critères de recherche.
                    </p>
                    <button
                      onClick={() => {
                        setLocalSearch("");
                        setOnlyInStock(false);
                        setGenderFilter("all");
                      }}
                      className="text-xs uppercase tracking-wider font-semibold text-primary border border-primary/30 px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                )
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Collection;
