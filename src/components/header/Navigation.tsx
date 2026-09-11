import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  ShoppingBag as BagIcon,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Flame,
  Flower2,
  Shield,
  Crown,
  Info,
  MessageCircle,
  Truck,
  Tag,
  Compass,
} from "lucide-react";
import ShoppingBag from "./ShoppingBag";
import { useCart } from "@/store/cart";
import ThemeToggle from "@/components/ThemeToggle";
import { useParfums } from "@/hooks/useParfums";
import { formatMAD } from "@/lib/sizes";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useCategories } from "@/store/useCategoryStore";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Suggestions dynamiques et aléatoires basées sur les données réelles du site
  const randomCategorySuggestions = useMemo(() => {
    if (!isSearchOpen || activeAdminCategories.length === 0) return [];
    const shuffled = [...activeAdminCategories].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [isSearchOpen, activeAdminCategories]);

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

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

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

  const waRaw = settings.whatsapp_phone || "212752850156";
  const waNumber = waRaw.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Bonjour Maison Kenzi, j'aurais besoin d'un conseil.")}`;

  return (
    <div className="relative">
      {/* Barre Flottante Centrée en Pastille Arrondie (rounded-full) avec Verre Dépoli */}
      <nav className="bg-card/90 dark:bg-[#12100E]/90 backdrop-blur-2xl border border-border/80 dark:border-[#C9A96E]/30 rounded-full shadow-nude px-3.5 sm:px-5 py-2 flex items-center justify-between transition-all duration-300">
        
        {/* Left Side: Mobile Hamburger & Desktop Navigation Links */}
        <div className="flex items-center gap-1 sm:gap-2 z-10">
          {/* Mobile Menu Button */}
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setIsMobileMenuOpen((v) => !v);
            }}
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:text-primary hover:bg-muted/50 transition-colors cursor-pointer"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          {/* Desktop Nav Pills (Left side) */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/collection/all"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
                location.pathname === "/collection/all"
                  ? "bg-foreground text-background"
                  : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <span>Catalogue</span>
            </Link>

            {activeAdminCategories.map((cat) => {
              const path = `/collection/${cat.slug}`;
              const isActive = location.pathname === path;

              return (
                <Link
                  key={cat.id}
                  to={path}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <span>{cat.name.replace(/^Parfums\s+/i, "")}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Absolute Dead Center: Brand Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto z-20">
          <Link
            to="/"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsSearchOpen(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center justify-center px-2 py-0.5 transition-transform duration-200 hover:scale-105 select-none cursor-pointer"
            aria-label="Maison Kenzi - Accueil"
          >
            <img
              src="/logo.png"
              alt="Maison Kenzi"
              className="h-7 sm:h-8 md:h-9 w-auto object-contain dark:invert"
            />
          </Link>
        </div>

        {/* Right Side: Suivi Commande, À Propos, Theme, Search, Cart */}
        <div className="flex items-center gap-1 sm:gap-1.5 z-10">

          {/* Desktop Suivi Commande Link */}
          <Link
            to="/suivi-commande"
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              location.pathname === "/suivi-commande"
                ? "bg-foreground text-background"
                : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
            }`}
            title="Suivre ma commande en direct"
          >
            <Truck className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Suivi</span>
          </Link>

          {/* Desktop À Propos Link */}
          <Link
            to="/about"
            className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              location.pathname === "/about"
                ? "bg-foreground text-background"
                : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>À Propos</span>
          </Link>

          {/* Theme Toggle */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>

          {/* Search Button */}
          <button
            ref={searchButtonRef}
            onClick={() => {
              setIsMobileMenuOpen(false);
              setIsSearchOpen((v) => !v);
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
              isSearchOpen
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-foreground/80 hover:text-foreground hover:bg-muted/60"
            }`}
            aria-label="Rechercher"
            title="Recherche (Ctrl + K)"
          >
            <Search size={17} strokeWidth={1.8} />
          </button>

          {/* Cart Button with Animated Badge */}
          <button
            onClick={() => setIsBagOpen(true)}
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-all duration-200 cursor-pointer active:scale-95"
            aria-label="Panier"
          >
            <BagIcon size={17} strokeWidth={1.8} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-xs animate-in zoom-in duration-150">
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

            {/* Suggestions Dynamiques Aléatoires (Catégories & Parfums réels) */}
            {!searchQuery.trim() && (
              <div className="space-y-2.5 pt-1">
                {/* Catégories réelles actives */}
                {randomCategorySuggestions.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      <Tag className="w-3 h-3 text-primary" />
                      <span>Univers & Collections</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {randomCategorySuggestions.map((cat) => (
                        <button
                          key={cat.id}
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
                )}

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

                {randomCategorySuggestions.length === 0 && randomParfumSuggestions.length === 0 && (
                  <p className="text-xs text-muted-foreground font-light py-1">
                    Saisissez un nom de parfum ou une maison pour explorer la collection.
                  </p>
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
            <div className="grid grid-cols-2 gap-2">
              {activeAdminCategories.map((cat) => {
                const s = cat.slug.toLowerCase();
                let Icon = Flame;
                if (s === "femme") Icon = Flower2;
                else if (s.includes("deodorant")) Icon = Shield;
                else if (s.includes("pack")) Icon = Crown;

                const isPacks = s.includes("pack");

                return (
                  <Link
                    key={cat.id}
                    to={`/collection/${cat.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                      isPacks
                        ? "bg-primary/10 border-primary/30 text-primary shadow-xs"
                        : "bg-card border-border/80 hover:border-primary/40 text-foreground"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isPacks ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold block truncate">{cat.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {cat.description || "Collection"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border/60 flex flex-col gap-2">
              <Link
                to="/suivi-commande"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                  location.pathname === "/suivi-commande"
                    ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                    : "bg-card/60 border-border/60 text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Truck className={`w-4 h-4 ${location.pathname === "/suivi-commande" ? "text-background" : "text-primary"}`} />
                  <span>Suivre ma Commande</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
              </Link>

              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                  location.pathname === "/about"
                    ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                    : "bg-card/60 border-border/60 text-foreground hover:bg-muted/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Info className={`w-4 h-4 ${location.pathname === "/about" ? "text-background" : "text-primary"}`} />
                  <span>À Propos de Maison Kenzi</span>
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
                <span>Conseil & Commande WhatsApp</span>
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
