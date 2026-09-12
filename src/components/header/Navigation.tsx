/**
 * Barre de Navigation Principale & Spotlight Search — Maison Kenzi
 *
 * Fournit la barre de navigation flottante de prestige :
 * - « Nos Produits » redirigeant directement vers le catalogue complet (/collection/all)
 * - « Nos Collections » affichant au survol / clic la liste élégante des univers olfactifs disponibles
 * - Logo centré de prestige, Suivi de commande, À Propos, Theme, Recherche rapide et Panier.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  ShoppingBag as BagIcon,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Flame,
  Flower2,
  Shield,
  Crown,
  Info,
  MessageCircle,
  Truck,
  Headset,
  Tag,
  Grid,
} from "lucide-react";
import ShoppingBag from "./ShoppingBag";
import { useCart } from "@/store/cart";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useParfums } from "@/hooks/useParfums";
import { formatMAD } from "@/lib/sizes";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useCategories } from "@/store/useCategoryStore";

const Navigation = () => {
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollectionsHovered, setIsCollectionsHovered] = useState(false);
  const collectionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { totalItems, isOpen: isBagOpen, setIsOpen: setIsBagOpen } = useCart();
  const { data: allParfums } = useParfums();
  const { settings } = useAppSettings();
  const adminCategories = useCategories();
  const activeAdminCategories = useMemo(
    () => adminCategories.filter((c) => c.is_active),
    [adminCategories]
  );
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchCardRef = useRef<HTMLDivElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  // Gestion douce du survol du menu Nos Collections
  const handleCollectionsMouseEnter = () => {
    if (collectionsTimeoutRef.current) clearTimeout(collectionsTimeoutRef.current);
    setIsCollectionsHovered(true);
  };

  const handleCollectionsMouseLeave = () => {
    collectionsTimeoutRef.current = setTimeout(() => {
      setIsCollectionsHovered(false);
    }, 180);
  };

  // Fermeture des menus au changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsCollectionsHovered(false);
  }, [location.pathname]);

  // Suggestions rapides pour le panneau de recherche
  const searchCategorySuggestions = useMemo(() => {
    const baseSuggestions = [
      { slug: "all", name: "Tous les Parfums" },
    ];
    const adminSugg = activeAdminCategories
      .filter((c) => c.slug.toLowerCase() !== "all" && c.slug.toLowerCase() !== "toutes")
      .map((c) => ({ slug: c.slug, name: c.name }));
    return [...baseSuggestions, ...adminSugg].slice(0, 4);
  }, [activeAdminCategories]);

  const randomParfumSuggestions = useMemo(() => {
    if (!isSearchOpen || allParfums.length === 0) return [];
    const shuffled = [...allParfums].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  }, [isSearchOpen, allParfums]);

  // Fermeture automatique au clic en dehors de la boîte de recherche
  useEffect(() => {
    if (!isSearchOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        searchCardRef.current &&
        !searchCardRef.current.contains(target) &&
        searchButtonRef.current &&
        !searchButtonRef.current.contains(target)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSearchOpen]);

  // Raccourci clavier Ctrl+K / Cmd+K et touche Echap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsMobileMenuOpen(false);
        setIsCollectionsHovered(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  const filteredParfums = searchQuery.trim()
    ? allParfums
      .filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.maison.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5)
    : [];

  const handleSelectProduct = (id: string) => {
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    setSearchQuery("");
    navigate(`/parfum/${id}`);
  };

  const waRaw = settings.whatsapp_phone || "212652535301";
  const waNumber = waRaw.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Bonjour Maison Kenzi, j'aurais besoin d'un conseil.")}`;

  const isCollectionsActive = location.pathname.startsWith("/collection") && location.pathname !== "/collection/all";

  return (
    <div className="relative">
      {/* Barre Flottante Centrée en Pastille Arrondie (rounded-full) avec Verre Dépoli */}
      <nav className="bg-card/90 dark:bg-[#12100E]/90 backdrop-blur-2xl border border-border/80 dark:border-[#C9A96E]/30 rounded-full shadow-nude px-4 sm:px-6 md:px-7 py-2.5 sm:py-3 md:py-3.5 min-h-[58px] sm:min-h-[66px] md:min-h-[74px] flex items-center justify-between transition-all duration-300">

        {/* Left Side: Brand Logo, Mobile Hamburger & Desktop Navigation Links */}
        <div className="flex items-center gap-1.5 sm:gap-3 z-10">
          {/* Mobile Menu Button */}
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setIsMobileMenuOpen((v) => !v);
            }}
            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:text-primary hover:bg-muted/50 transition-colors cursor-pointer"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Brand Logo (Aligné à gauche) */}
          <Link
            to="/"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsSearchOpen(false);
              setIsCollectionsHovered(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center justify-center pr-1 sm:pr-2 py-0.5 transition-transform duration-200 hover:scale-105 select-none cursor-pointer shrink-0"
            aria-label="Maison Kenzi - Accueil"
          >
            <img
              src="/mk-logo-light-removebg.png"
              alt="Maison Kenzi"
              className="h-10 sm:h-11 md:h-12 lg:h-13 w-auto max-w-[130px] sm:max-w-[160px] md:max-w-[190px] object-contain drop-shadow-xs dark:hidden"
            />
            <img
              src="/mk-logo-dark.png"
              alt="Maison Kenzi"
              className="h-10 sm:h-11 md:h-12 lg:h-13 w-auto max-w-[130px] sm:max-w-[160px] md:max-w-[190px] object-contain drop-shadow-xs hidden dark:block"
            />
          </Link>

          {/* Desktop Nav Pills (Left side) */}
          <div className="hidden md:flex items-center gap-2">
            {/* 1. Bouton « Nos Produits » -> Catalogue */}
            <Link
              to="/collection/all"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${location.pathname === "/collection/all"
                ? "bg-foreground text-background shadow-xs"
                : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                }`}
            >
              <span>{t("nav.products", "Nos Produits")}</span>
            </Link>

            {/* 2. Bouton « Nos Collections » -> Menu déroulant au survol */}
            <div
              className="relative"
              onMouseEnter={handleCollectionsMouseEnter}
              onMouseLeave={handleCollectionsMouseLeave}
            >
              <button
                type="button"
                onClick={() => setIsCollectionsHovered((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${isCollectionsHovered || isCollectionsActive
                  ? "bg-foreground text-background shadow-xs"
                  : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                  }`}
                aria-expanded={isCollectionsHovered}
                aria-haspopup="true"
              >
                <span>{t("nav.collections", "Nos Collections")}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollectionsHovered ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* Panneau Flottant Déroulant Haute Parfumerie */}
              {isCollectionsHovered && (
                <div
                  onMouseEnter={handleCollectionsMouseEnter}
                  onMouseLeave={handleCollectionsMouseLeave}
                  className="absolute top-full left-0 mt-2.5 z-50 w-72 sm:w-80 rounded-2xl bg-background/95 dark:bg-[#151821]/95 backdrop-blur-2xl border border-border/80 dark:border-white/10 shadow-2xl p-2.5 space-y-1 animate-in fade-in-0 zoom-in-95 duration-150"
                >
                  <div className="px-3 py-1.5 border-b border-border/60 mb-1 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary">
                      {t("nav.collections", "Univers & Collections")}
                    </span>
                    <Link
                      to="/collection/all"
                      onClick={() => setIsCollectionsHovered(false)}
                      className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <span>{t("nav.catalog", "Catalogue")}</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Lien général Toutes les Collections */}
                  <Link
                    to="/collection/all"
                    onClick={() => setIsCollectionsHovered(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/10 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors block truncate">
                        {t("nav.allCollections", "Toutes les Collections")}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate block font-light">
                        {t("nav.catalogSubtitle", "Catalogue complet des parfums")}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  {/* Liste des Catégories / Univers dynamiques disponibles */}
                  {activeAdminCategories.length > 0 ? (
                    activeAdminCategories.map((cat) => {
                      const s = cat.slug.toLowerCase();
                      let Icon = Tag;
                      if (s === "homme") Icon = Flame;
                      else if (s === "femme") Icon = Flower2;
                      else if (s.includes("deodorant")) Icon = Shield;
                      else if (s.includes("pack")) Icon = Crown;

                      const isCurrent = location.pathname === `/collection/${cat.slug}`;

                      return (
                        <Link
                          key={cat.id}
                          to={`/collection/${cat.slug}`}
                          onClick={() => setIsCollectionsHovered(false)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors group ${isCurrent ? "bg-primary/15 border border-primary/30 text-primary" : "hover:bg-primary/10 text-foreground"
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                            }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold group-hover:text-primary transition-colors truncate">
                                {cat.name}
                              </span>
                              {cat.is_coming_soon && (
                                <span className="text-[9px] uppercase tracking-wider text-[#C9A96E] bg-[#C9A96E]/15 border border-[#C9A96E]/30 px-1.5 py-0.2 rounded-full font-medium">
                                  À venir
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground truncate block font-light">
                              {cat.description || "Collection exclusive"}
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </Link>
                      );
                    })
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Suivi Commande, Service Client, À Propos, Language, Theme, Search, Cart */}
        <div className="flex items-center gap-1 sm:gap-2 z-10">

          {/* Desktop Suivi Commande Link */}
          <Link
            to="/suivi-commande"
            className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${location.pathname === "/suivi-commande"
              ? "bg-foreground text-background shadow-xs"
              : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
              }`}
            title="Suivre ma commande en direct"
          >
            <Truck className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t("nav.tracking", "Suivi")}</span>
          </Link>

          {/* Desktop Service Client Link */}
          <Link
            to="/service-client"
            className={`hidden md:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${location.pathname === "/service-client" || location.pathname === "/about/service-client" || location.pathname === "/contact"
              ? "bg-foreground text-background shadow-xs"
              : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
              }`}
            title="Service Client & Conciergerie Privée"
          >
            <Headset className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t("nav.customerService", "Service Client")}</span>
          </Link>

          {/* Desktop À Propos Link */}
          <Link
            to="/about"
            className={`hidden xl:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${location.pathname === "/about"
              ? "bg-foreground text-background shadow-xs"
              : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
              }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>{t("nav.about", "À Propos")}</span>
          </Link>

          {/* Language Selector (FR / EN) */}
          <div className="flex items-center">
            <LanguageSelector variant="compact" />
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>

          {/* Search Button */}
          <button
            ref={searchButtonRef}
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsCollectionsHovered(false);
              setIsSearchOpen((v) => !v);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${isSearchOpen
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
              }`}
            aria-label={t("nav.search", "Rechercher")}
            title="Recherche (Ctrl + K)"
          >
            <Search size={18} strokeWidth={1.8} />
          </button>

          {/* Cart Button with Animated Badge */}
          <button
            onClick={() => setIsBagOpen(true)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-all duration-200 cursor-pointer active:scale-95"
            aria-label={t("nav.cart", "Panier")}
          >
            <BagIcon size={18} strokeWidth={1.8} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-xs animate-in zoom-in duration-150">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Backdrop sombre fermant la recherche au clic extérieur */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 dark:bg-black/50 backdrop-blur-[2px] animate-in fade-in-0 duration-150"
          onClick={() => setIsSearchOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Floating Spotlight Search Card */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div
            ref={searchCardRef}
            className="bg-background/95 dark:bg-[#151821]/95 backdrop-blur-2xl border border-border/80 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-xl max-w-xl mx-auto space-y-3"
          >
            <div className="flex items-center bg-card/80 border border-border/80 focus-within:border-primary rounded-xl px-3 py-2 transition-all">
              <Search size={16} className="text-primary mr-2 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un parfum, une maison..."
                className="w-full bg-transparent text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/60 transition-colors cursor-pointer"
                  aria-label="Effacer le champ"
                  title="Effacer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Suggestions Dynamiques (Univers et Parfums réels) */}
            {!searchQuery.trim() && (
              <div className="space-y-2.5 pt-1">
                {/* Catégories & Univers réels */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    <Tag className="w-3 h-3 text-primary" />
                    <span>Univers & Collections</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {searchCategorySuggestions.map((cat) => (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigate(`/collection/${cat.slug}`);
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary/80 text-foreground hover:bg-primary/15 hover:text-primary hover:border-primary/30 border border-border/70 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>{cat.name.replace(/^Parfums\s+/i, "")}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Parfums réels actifs */}
                {randomParfumSuggestions.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span>Créations à Découvrir</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {randomParfumSuggestions.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProduct(p.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">({p.maison})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Results List */}
            {searchQuery.trim() !== "" && (
              <div className="space-y-1 max-h-60 overflow-y-auto divide-y divide-border/40">
                {filteredParfums.length > 0 ? (
                  filteredParfums.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-primary/10 transition-colors text-left group cursor-pointer"
                    >
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded-lg border border-border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium truncate">
                          {product.maison} · {product.gender}
                        </p>
                        <h4 className="font-serif text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {product.name}
                        </h4>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-semibold tracking-tight text-primary">
                          {formatMAD(product.price_5ml)}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Aucun parfum trouvé pour « {searchQuery} »
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Mobile Dropdown Menu Card */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-2 z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="bg-background/95 dark:bg-[#151821]/95 backdrop-blur-2xl border border-border/80 dark:border-white/10 rounded-2xl p-4 shadow-xl space-y-3">
            {/* Langue & Thème rapide en haut du menu mobile */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                {t("nav.preferences", "Préférences")}
              </span>
              <div className="flex items-center gap-2">
                <LanguageSelector variant="pill" />
              </div>
            </div>

            {/* 1. Lien principal Nos Produits (Catalogue) */}
            <Link
              to="/collection/all"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${location.pathname === "/collection/all"
                ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                : "bg-card border-border/80 text-foreground hover:bg-muted/50"
                }`}
            >
              <span className="flex items-center gap-2.5 font-semibold text-xs">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>{t("nav.allProducts", "Nos Produits (Catalogue Complet)")}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-70" />
            </Link>

            {/* 2. Liste des Collections */}
            {activeAdminCategories.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-1">
                  {t("nav.collections", "Nos Collections")}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {activeAdminCategories.map((cat) => {
                    const s = cat.slug.toLowerCase();
                    let Icon = Tag;
                    if (s.includes("deodorant")) Icon = Shield;
                    else if (s.includes("pack")) Icon = Crown;

                    const isCurrent = location.pathname === `/collection/${cat.slug}`;

                    return (
                      <Link
                        key={cat.id}
                        to={`/collection/${cat.slug}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${isCurrent
                          ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                          : "bg-card border-border/80 hover:border-primary/40 text-foreground"
                          }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isCurrent
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-primary/10 text-primary"
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold block truncate">{cat.name}</span>
                          <span className={`text-[10px] truncate block ${isCurrent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                            {cat.description || "Collection"}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
              <Link
                to="/suivi-commande"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-colors ${location.pathname === "/suivi-commande"
                  ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                  : "bg-card/60 border-border/60 text-foreground hover:bg-muted/50"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <Truck className={`w-4 h-4 ${location.pathname === "/suivi-commande" ? "text-background" : "text-primary"}`} />
                  <span>{t("nav.tracking", "Suivre ma Commande")}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
              </Link>

              <Link
                to="/service-client"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-colors ${location.pathname === "/service-client" || location.pathname === "/about/service-client" || location.pathname === "/contact"
                  ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                  : "bg-card/60 border-border/60 text-foreground hover:bg-muted/50"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <Headset className={`w-4 h-4 ${location.pathname === "/service-client" || location.pathname === "/about/service-client" || location.pathname === "/contact" ? "text-background" : "text-primary"}`} />
                  <span>{t("nav.customerService", "Service Client & Conciergerie")}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
              </Link>

              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-colors ${location.pathname === "/about"
                  ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                  : "bg-card/60 border-border/60 text-foreground hover:bg-muted/50"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <Info className={`w-4 h-4 ${location.pathname === "/about" ? "text-background" : "text-primary"}`} />
                  <span>{t("nav.about", "À Propos de Maison Kenzi")}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
              </Link>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t("nav.whatsappHelp", "Conseil & Commande WhatsApp")}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Bag Drawer */}
      <ShoppingBag isOpen={isBagOpen} onClose={() => setIsBagOpen(false)} />
    </div>
  );
};

export default Navigation;
