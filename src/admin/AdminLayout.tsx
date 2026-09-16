/**
 * Layout Principal d'Administration — Maison Kenzi
 *
 * Structure avec Sidebar rétractable (Collapsible), bouton toggle intégré
 * à côté du logo dans l'en-tête, palette adaptative Clair / Sombre,
 * navigation par univers et design Haute Parfumerie (zéro emoji).
 */

import { useState, useEffect, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Store,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Flower2,
  Palette,
  Landmark,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SubNavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  categoryKey?: string;
};

export type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  end?: boolean;
  isOrderLink?: boolean;
  badge?: string;
  subItems?: SubNavItem[];
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Vue d'ensemble",
    items: [
      { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: "Catalogue & Niche",
    items: [
      {
        to: "/admin/produits",
        label: "Produits",
        icon: Package,
        subItems: [
          { to: "/admin/produits?category=parfums", label: "Parfums", icon: Sparkles, categoryKey: "parfums" },
          { to: "/admin/produits?category=cosmetiques", label: "Produits Cosmétiques", icon: Flower2, categoryKey: "cosmetiques" },
          { to: "/admin/produits?category=artisanat", label: "Produits Artisanaux", icon: Palette, categoryKey: "artisanat" },
          { to: "/admin/produits?category=antiques", label: "Antiques", icon: Landmark, categoryKey: "antiques" },
        ],
      },
      { to: "/admin/categories", label: "Catégories", icon: FolderTree },
    ],
  },
  {
    title: "Ventes & Relations",
    items: [
      { to: "/admin/commandes", label: "Commandes", icon: ShoppingBag, isOrderLink: true },
    ],
  },
  {
    title: "Maison & Outils",
    items: [
      { to: "/admin/parametres", label: "Paramètres de la Boutique", icon: Settings },
    ],
  },
];

const TITLES: Record<string, string> = {
  "/admin": "Tableau de Bord Privé",
  "/admin/produits": "Catalogue des Produits",
  "/admin/categories": "Univers & Familles Olfactives",
  "/admin/commandes": "Gestion des Commandes Clients",
  "/admin/parametres": "Paramètres & Statut de la Maison",
};

const getPageTitle = (pathname: string, search: string) => {
  if (pathname === "/admin/produits") {
    const params = new URLSearchParams(search);
    const cat = params.get("category")?.toLowerCase();
    if (cat === "parfums" || cat === "parfum") return "Catalogue — Parfums de Niche";
    if (cat === "cosmetiques" || cat === "produits-cosmetiques") return "Catalogue — Produits Cosmétiques";
    if (cat === "artisanat" || cat === "produits-artisanaux" || cat === "artisanal") return "Catalogue — Produits Artisanaux";
    if (cat === "antiques" || cat === "antiquites") return "Catalogue — Antiques & Pièces Rares";
    return "Catalogue des Produits";
  }
  return TITLES[pathname] || "Administration";
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);

  // État de la sidebar collapsible mémorisé
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("mk_admin_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  // État d'ouverture des sous-menus (ex: Produits)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const isProducts = location.pathname.startsWith("/admin/produits");
    return {
      "/admin/produits": isProducts,
    };
  });

  // Maintenir le menu ouvert si l'utilisateur navigue vers /admin/produits
  useEffect(() => {
    if (location.pathname.startsWith("/admin/produits")) {
      setOpenMenus((prev) => ({ ...prev, "/admin/produits": true }));
    }
  }, [location.pathname]);

  const toggleSubmenu = (menuKey: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setOpenMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("mk_admin_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const title = getPageTitle(location.pathname, location.search);

  // Récupération des commandes en attente pour le badge
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const { count, error } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("status", "en_attente");
        if (!error && typeof count === "number") {
          setPendingOrdersCount(count);
        }
      } catch {
        // fallback silencieux
      }
    };

    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    navigate("/admin/login", { replace: true });
  };

  const currentCategoryParam = useMemo(() => {
    return new URLSearchParams(location.search).get("category")?.toLowerCase() || null;
  }, [location.search]);

  const SidebarContent = (
    <div className="flex flex-col h-full w-full bg-[#FAF7F2] dark:bg-[#121110] text-[#1A1816] dark:text-[#F3EFEA] border-r border-[#EAE3D8] dark:border-[#26221E] shadow-sm select-none transition-colors duration-300">
      {/* Brand Header avec bouton Toggle — Hauteur h-16 synchronisée avec la navbar */}
      <div className={`h-16 border-b border-[#EAE3D8] dark:border-[#26221E] flex items-center transition-all ${isCollapsed ? "justify-center px-2" : "justify-between px-4"
        }`}>
        {isCollapsed ? (
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Link
                to="/admin"
                className="flex items-center justify-center w-full h-full p-1 group transition-transform hover:scale-105"
                title="Maison Kenzi Admin"
              >
                <img
                  src="/mk-logo.png"
                  alt="Maison Kenzi"
                  className="h-9 w-auto max-w-[50px] object-contain dark:hidden"
                />
                <img
                  src="/mk-logo.png"
                  alt="Maison Kenzi"
                  className="h-9 w-auto max-w-[50px] object-contain hidden dark:block"
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1C1A18] text-[#FAF7F2] border-[#38332C] text-xs">
              Maison Kenzi Admin
            </TooltipContent>
          </Tooltip>
        ) : (
          <>
            <Link
              to="/admin"
              className="flex items-center gap-2.5 group overflow-hidden min-w-0 transition-transform hover:scale-[1.02]"
              title="Maison Kenzi Admin"
            >
              <div className="shrink-0 flex items-center justify-center">
                <img
                  src="/mk-logo.png"
                  alt="Maison Kenzi"
                  className="h-9 sm:h-10 w-auto object-contain dark:hidden"
                />
                <img
                  src="/mk-logo.png"
                  alt="Maison Kenzi"
                  className="h-9 sm:h-10 w-auto object-contain hidden dark:block"
                />
              </div>

              <div className="flex flex-col items-start min-w-0">
                <span className="font-serif text-sm tracking-wider font-semibold text-[#1A1816] dark:text-[#FAF7F2] group-hover:text-[#C9A96E] transition-colors truncate">
                  MAISON KENZI
                </span>
                <span className="text-[8px] uppercase tracking-[0.25em] text-[#C9A96E] font-medium truncate">
                  Administration
                </span>
              </div>
            </Link>

            <button
              onClick={toggleSidebar}
              className="hidden md:flex items-center justify-center rounded-lg text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2] hover:bg-black/5 dark:hover:bg-white/5 border border-[#EAE3D8] dark:border-[#26221E] transition-all cursor-pointer shrink-0 w-8 h-8"
              title="Réduire le menu latéral"
              aria-label="Réduire le menu"
            >
              <ChevronLeft className="w-4 h-4 text-[#C9A96E]" />
            </button>
          </>
        )}
      </div>

      {/* Bouton pour déplier la sidebar quand elle est réduite */}
      {isCollapsed && (
        <div className="pt-3 pb-1 px-3 flex justify-center border-b border-[#EAE3D8]/60 dark:border-[#26221E]/60">
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <button
                onClick={toggleSidebar}
                className="w-11 h-8 flex items-center justify-center rounded-lg text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2] hover:bg-black/5 dark:hover:bg-white/5 border border-[#EAE3D8] dark:border-[#26221E] transition-all cursor-pointer shadow-xs"
                title="Déplier le menu latéral"
                aria-label="Déplier le menu"
              >
                <ChevronRight className="w-4 h-4 text-[#C9A96E]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1C1A18] text-[#FAF7F2] border-[#38332C] text-xs">
              Déplier le menu latéral
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto no-scrollbar">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            {!isCollapsed ? (
              <h3 className="px-3 text-[10px] font-medium uppercase tracking-[0.25em] text-[#8C827A] dark:text-[#7A726A] select-none">
                {group.title}
              </h3>
            ) : (
              <div className="w-6 h-[1px] bg-[#EAE3D8] dark:bg-[#26221E] mx-auto my-2" />
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
                const isMenuOpen = hasSubItems && !!openMenus[item.to];

                const isCurrent = item.end
                  ? location.pathname === item.to
                  : (location.pathname === item.to || location.pathname.startsWith(item.to + "/"));

                // Si la sidebar est repliée et que l'item a des sous-menus -> Menu déroulant compact
                if (isCollapsed && hasSubItems) {
                  return (
                    <DropdownMenu key={item.to}>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`relative flex items-center justify-center w-11 h-11 mx-auto rounded-xl text-xs transition-all duration-200 group cursor-pointer ${isCurrent
                            ? "bg-[#1A1816] text-[#FAF7F2] dark:bg-[#C9A96E] dark:text-[#121110] font-semibold shadow-sm"
                            : "bg-transparent text-[#6B635B] dark:text-[#E8E2D9]/85 hover:bg-[#EFE7DC] dark:hover:bg-white/10 hover:text-[#1A1816] dark:hover:text-[#FAF7F2]"
                            }`}
                          title={item.label}
                        >
                          <item.icon
                            className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isCurrent
                              ? "text-[#C9A96E] dark:text-[#121110]"
                              : "text-[#7A726A] dark:text-[#E8E2D9] group-hover:scale-110 group-hover:text-[#C9A96E] dark:group-hover:text-[#C9A96E]"
                              }`}
                            strokeWidth={isCurrent ? 2.25 : 1.85}
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="right"
                        align="start"
                        className="w-56 bg-[#FAF7F2] dark:bg-[#1A1816] border-[#EAE3D8] dark:border-[#2D2924] shadow-xl p-1.5 rounded-xl z-50 text-xs"
                      >
                        <DropdownMenuLabel className="font-serif font-semibold text-[#1A1816] dark:text-[#FAF7F2] px-2.5 py-1.5 flex items-center justify-between">
                          <span>{item.label}</span>
                          <span className="text-[9px] uppercase tracking-wider text-[#C9A96E] font-medium">Catalogue</span>
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link
                            to={item.to}
                            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${isCurrent && !currentCategoryParam
                              ? "bg-[#1A1816] text-[#FAF7F2] dark:bg-[#C9A96E] dark:text-[#121110] font-medium"
                              : "hover:bg-black/5 dark:hover:bg-white/5 text-[#4A453E] dark:text-[#D1C9BF]"
                              }`}
                          >
                            <Package className="w-4 h-4 text-[#C9A96E] shrink-0" />
                            <span>Tous les Produits</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#EAE3D8] dark:bg-[#2D2924] my-1" />
                        {item.subItems?.map((sub) => {
                          const isSubActive = isCurrent && currentCategoryParam === sub.categoryKey;
                          return (
                            <DropdownMenuItem key={sub.to} asChild>
                              <Link
                                to={sub.to}
                                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${isSubActive
                                  ? "bg-[#C9A96E]/20 text-[#C9A96E] font-semibold"
                                  : "hover:bg-black/5 dark:hover:bg-white/5 text-[#4A453E] dark:text-[#D1C9BF] hover:text-[#C9A96E]"
                                  }`}
                              >
                                <sub.icon className={`w-4 h-4 shrink-0 ${isSubActive ? "text-[#C9A96E]" : "text-[#7A726A] dark:text-[#A39B91]"}`} />
                                <span>{sub.label}</span>
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                // Si la sidebar est repliée et sans sous-menu -> Tooltip standard
                if (isCollapsed) {
                  return (
                    <Tooltip key={item.to} delayDuration={100}>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={`relative flex items-center justify-center w-11 h-11 mx-auto rounded-xl text-xs transition-all duration-200 group ${isCurrent
                            ? "bg-[#1A1816] text-[#FAF7F2] dark:bg-[#C9A96E] dark:text-[#121110] font-semibold shadow-sm"
                            : "bg-transparent text-[#6B635B] dark:text-[#E8E2D9]/85 hover:bg-[#EFE7DC] dark:hover:bg-white/10 hover:text-[#1A1816] dark:hover:text-[#FAF7F2]"
                            }`}
                        >
                          <item.icon
                            className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isCurrent
                              ? "text-[#C9A96E] dark:text-[#121110]"
                              : "text-[#7A726A] dark:text-[#E8E2D9] group-hover:scale-110 group-hover:text-[#C9A96E] dark:group-hover:text-[#C9A96E]"
                              }`}
                            strokeWidth={isCurrent ? 2.25 : 1.85}
                          />
                          {item.isOrderLink && pendingOrdersCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[#FAF7F2] dark:ring-[#121110] animate-pulse" />
                          )}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-[#1A1816] text-[#FAF7F2] dark:bg-[#1C1A18] dark:text-[#FAF7F2] border-[#38332C] text-xs font-medium">
                        {item.label}
                        {item.isOrderLink && pendingOrdersCount > 0 && ` (${pendingOrdersCount})`}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                // Version dépliée (Expanded)
                return (
                  <div key={item.to} className="space-y-1">
                    <div
                      className={`relative flex items-center justify-between rounded-xl text-xs transition-all duration-200 group ${isCurrent
                        ? "bg-[#1A1816] text-[#FAF7F2] dark:bg-[#C9A96E] dark:text-[#121110] font-semibold shadow-sm"
                        : "bg-transparent text-[#6B635B] dark:text-[#E8E2D9]/85 hover:bg-[#EFE7DC] dark:hover:bg-white/10 hover:text-[#1A1816] dark:hover:text-[#FAF7F2]"
                        }`}
                    >
                      <Link
                        to={item.to}
                        onClick={() => {
                          if (hasSubItems && !isMenuOpen) {
                            setOpenMenus((prev) => ({ ...prev, [item.to]: true }));
                          }
                          setMobileOpen(false);
                        }}
                        className="flex-1 flex items-center gap-3 px-3.5 py-2.5 min-w-0"
                      >
                        <item.icon
                          className={`w-5 h-5 shrink-0 transition-transform duration-200 ${isCurrent
                            ? "text-[#C9A96E] dark:text-[#121110]"
                            : "text-[#7A726A] dark:text-[#E8E2D9] group-hover:scale-110 group-hover:text-[#C9A96E] dark:group-hover:text-[#C9A96E]"
                            }`}
                          strokeWidth={isCurrent ? 2.25 : 1.85}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>

                      <div className="flex items-center gap-1.5 pr-2.5 shrink-0">
                        {/* Badges pour version dépliée */}
                        {item.isOrderLink && pendingOrdersCount > 0 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs ${isCurrent
                              ? "bg-[#C9A96E] text-[#121110]"
                              : "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse"
                              }`}
                          >
                            {pendingOrdersCount}
                          </span>
                        )}

                        {item.badge && !item.isOrderLink && (
                          <span
                            className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md ${isCurrent
                              ? "bg-white/20 text-[#FAF7F2] dark:text-[#121110]"
                              : "bg-black/5 dark:bg-white/10 text-[#7A726A] dark:text-[#C9A96E] border border-black/5 dark:border-white/5"
                              }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Bouton Chevron pour ouvrir/fermer le sous-menu */}
                        {hasSubItems && (
                          <button
                            type="button"
                            onClick={(e) => toggleSubmenu(item.to, e)}
                            className={`p-1 rounded-lg transition-transform duration-200 cursor-pointer ${isCurrent
                              ? "text-[#FAF7F2] hover:bg-white/10 dark:text-[#121110] dark:hover:bg-black/10"
                              : "text-[#8C827A] hover:text-[#1A1816] dark:hover:text-[#FAF7F2] hover:bg-black/5 dark:hover:bg-white/5"
                              }`}
                            title={isMenuOpen ? "Replier le sous-menu" : "Ouvrir le sous-menu"}
                            aria-label={isMenuOpen ? "Replier le sous-menu" : "Ouvrir le sous-menu"}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : "rotate-0"
                                }`}
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sous-Menu Dépliable (Accordeon) */}
                    {hasSubItems && isMenuOpen && (
                      <div className="pl-4 ml-4.5 border-l-2 border-[#EAE3D8] dark:border-[#26221E] space-y-1 my-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        {item.subItems?.map((sub) => {
                          const isSubActive =
                            location.pathname === "/admin/produits" &&
                            currentCategoryParam === sub.categoryKey;

                          return (
                            <Link
                              key={sub.to}
                              to={sub.to}
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-150 group ${isSubActive
                                ? "bg-[#C9A96E]/15 text-[#C9A96E] font-semibold border-l-2 border-[#C9A96E]"
                                : "text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2] hover:bg-black/5 dark:hover:bg-white/5"
                                }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <sub.icon
                                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${isSubActive
                                    ? "text-[#C9A96E] scale-110"
                                    : "text-[#8C827A] dark:text-[#7A726A] group-hover:text-[#C9A96E] group-hover:scale-105"
                                    }`}
                                  strokeWidth={isSubActive ? 2.2 : 1.75}
                                />
                                <span className="truncate">{sub.label}</span>
                              </div>

                              {isSubActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] shrink-0" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Déconnexion en bas */}
      <div className="p-3 border-t border-[#EAE3D8] dark:border-[#26221E] mt-auto">
        {isCollapsed ? (
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <button
                onClick={logout}
                className="w-11 h-11 mx-auto flex items-center justify-center rounded-xl text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer border border-red-200 dark:border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1C1A18] text-red-300 border-red-900/40 text-xs">
              Déconnexion
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer border border-red-200 dark:border-red-500/20"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Déconnexion</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#F5EFEB] dark:bg-[#0C0B0A] font-sans text-[#1A1816] dark:text-[#F3EFEA] transition-colors duration-300">
        {/* Sidebar Bureau */}
        <aside
          className={`hidden md:flex fixed inset-y-0 left-0 z-30 transition-all duration-300 ${isCollapsed ? "w-20" : "w-72"
            }`}
        >
          {SidebarContent}
        </aside>

        {/* Tiroir Mobile */}
        {mobileOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="md:hidden fixed inset-y-0 left-0 w-72 z-50 animate-in slide-in-from-left duration-300 shadow-2xl">
              {SidebarContent}
            </aside>
          </>
        )}

        {/* Zone de contenu principal */}
        <div
          className={`flex flex-col min-h-screen transition-all duration-300 ${isCollapsed ? "md:ml-20" : "md:ml-72"
            }`}
        >
          {/* Topbar Intégrée — Continuité parfaite avec la Sidebar */}
          <header className="sticky top-0 z-20 bg-[#FAF7F2]/95 dark:bg-[#121110]/95 backdrop-blur-md border-b border-[#EAE3D8] dark:border-[#26221E] h-16 flex items-center justify-between px-4 sm:px-6 md:px-8">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 -ml-2 rounded-xl text-[#7A726A] hover:text-[#1A1816] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Menu de navigation"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#E5DDD0] dark:border-[#332E28] hidden sm:flex items-center justify-center text-[#C9A96E]">
                  <ShieldCheck className="w-4 h-4 stroke-[1.75]" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-base font-serif font-medium tracking-tight text-[#1A1816] dark:text-[#F3EFEA]">
                    {title}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Raccourci vers la vitrine */}
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E2D8CC] dark:border-[#2D2924] bg-[#FFFFFF]/60 dark:bg-[#1C1A18]/60 hover:border-[#C9A96E] text-xs font-medium text-[#4A453E] dark:text-[#D1C9BF] hover:text-[#C9A96E] transition-all duration-200 group"
              >
                <Store className="w-3.5 h-3.5 text-[#C9A96E]" />
                <span className="hidden sm:inline">Voir la Boutique</span>
                <ExternalLink className="w-3 h-3 text-[#9E958C] group-hover:text-[#C9A96E] transition-colors" />
              </Link>

              {/* Sélecteur de thème */}
              <ThemeToggle className="text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2] hover:bg-[#F2ECE4] dark:hover:bg-[#1F1D1A] rounded-full p-2 transition-colors" />

              {/* Avatar Admin */}
              <div className="w-8 h-8 rounded-full bg-[#1A1816] dark:bg-[#C9A96E] text-[#FAF7F2] dark:text-[#121110] font-serif font-semibold flex items-center justify-center text-xs shadow-sm">
                MK
              </div>
            </div>
          </header>

          {/* Contenu de la page */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AdminLayout;


