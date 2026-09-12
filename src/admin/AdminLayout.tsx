/**
 * Layout Principal d'Administration — Maison Kenzi
 *
 * Structure avec Sidebar rétractable (Collapsible), bouton toggle intégré
 * à côté du logo dans l'en-tête, palette adaptative Clair / Sombre,
 * navigation par univers et design Haute Parfumerie (zéro emoji).
 */

import { useState, useEffect } from "react";
import { NavLink, Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
  ExternalLink,
  ShieldCheck,
  Store,
  FolderTree,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_GROUPS = [
  {
    title: "Vue d'ensemble",
    items: [
      { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: "Catalogue & Niche",
    items: [
      { to: "/admin/produits", label: "Tous les Parfums", icon: Package },
      { to: "/admin/categories", label: "Catégories & Univers", icon: FolderTree },
    ],
  },
  {
    title: "Ventes & Relations",
    items: [
      { to: "/admin/commandes", label: "Commandes", icon: ShoppingBag, isOrderLink: true },
      { to: "/admin/finances", label: "Finances & Revenus", icon: Wallet },
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
  "/admin/produits": "Catalogue des Parfums de Niche",
  "/admin/categories": "Univers & Familles Olfactives",
  "/admin/commandes": "Gestion des Commandes Clients",
  "/admin/finances": "Statistiques Financières & Revenus",
  "/admin/parametres": "Paramètres & Statut de la Maison",
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

  const title = TITLES[location.pathname] || "Administration";

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

  const SidebarContent = (
    <div className="flex flex-col h-full w-full bg-[#FAF7F2] dark:bg-[#121110] text-[#1A1816] dark:text-[#F3EFEA] border-r border-[#EAE3D8] dark:border-[#26221E] shadow-sm select-none transition-colors duration-300">
      {/* Brand Header avec bouton Toggle juste à côté du Logo — Hauteur h-16 synchronisée avec la navbar */}
      <div className={`h-16 px-4 border-b border-[#EAE3D8] dark:border-[#26221E] flex items-center ${isCollapsed ? "justify-center flex-col gap-1" : "justify-between"}`}>
        <Link 
          to="/admin" 
          className="flex items-center gap-3 group overflow-hidden min-w-0"
          title="Maison Kenzi Admin"
        >
          {!isCollapsed && (
            <div className="flex flex-col items-start min-w-0">
              <span className="font-serif text-sm tracking-wider font-semibold text-[#1A1816] dark:text-[#FAF7F2] group-hover:text-[#C9A96E] transition-colors truncate">
                MAISON KENZI
              </span>
              <span className="text-[8px] uppercase tracking-[0.25em] text-[#C9A96E] font-medium truncate">
                Administration
              </span>
            </div>
          )}
        </Link>

        {/* Bouton de réduction / déploiement placé à côté du logo */}
        <button
          onClick={toggleSidebar}
          className={`hidden md:flex items-center justify-center rounded-lg text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2] hover:bg-black/5 dark:hover:bg-white/5 border border-[#EAE3D8] dark:border-[#26221E] transition-all cursor-pointer shrink-0 ${
            isCollapsed ? "w-8 h-8 mt-1" : "w-8 h-8"
          }`}
          title={isCollapsed ? "Déplier le menu latéral" : "Réduire le menu latéral"}
          aria-label="Réduire ou déplier le menu"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-[#C9A96E]" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-[#C9A96E]" />
          )}
        </button>
      </div>

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
                const navLinkElement = (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `relative flex items-center rounded-xl text-xs transition-all duration-200 group ${
                        isCollapsed 
                          ? "justify-center w-11 h-11 mx-auto" 
                          : "justify-between px-3.5 py-2.5"
                      } ${
                        isActive
                          ? "bg-[#1A1816] dark:bg-[#C9A96E] text-[#FAF7F2] dark:text-[#121110] font-semibold shadow-sm"
                          : "text-[#6B635B] dark:text-[#D6CEC4]/80 hover:bg-[#EFE7DC] dark:hover:bg-white/5 hover:text-[#1A1816] dark:hover:text-[#FAF7F2]"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : "min-w-0"}`}>
                          <item.icon
                            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                              isActive
                                ? "text-[#C9A96E] dark:text-[#121110]"
                                : "text-[#8C827A] dark:text-[#C9A96E] group-hover:scale-110 group-hover:text-[#C9A96E]"
                            }`}
                            strokeWidth={isActive ? 2.25 : 1.75}
                          />
                          {!isCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </div>

                        {/* Badges pour version dépliée */}
                        {!isCollapsed && item.isOrderLink && pendingOrdersCount > 0 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs ${
                              isActive
                                ? "bg-[#C9A96E] text-[#121110]"
                                : "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-pulse"
                            }`}
                          >
                            {pendingOrdersCount}
                          </span>
                        )}

                        {!isCollapsed && item.badge && !item.isOrderLink && (
                          <span
                            className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md ${
                              isActive
                                ? "bg-white/20 text-[#FAF7F2] dark:text-[#121110]"
                                : "bg-black/5 dark:bg-white/10 text-[#7A726A] dark:text-[#C9A96E] border border-black/5 dark:border-white/5"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Point badge pour version repliée */}
                        {isCollapsed && item.isOrderLink && pendingOrdersCount > 0 && (
                          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[#FAF7F2] dark:ring-[#121110] animate-pulse" />
                        )}
                      </>
                    )}
                  </NavLink>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.to} delayDuration={100}>
                      <TooltipTrigger asChild>
                        {navLinkElement}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-[#1A1816] text-[#FAF7F2] dark:bg-[#1C1A18] dark:text-[#FAF7F2] border-[#38332C] text-xs font-medium">
                        {item.label}
                        {item.isOrderLink && pendingOrdersCount > 0 && ` (${pendingOrdersCount})`}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return navLinkElement;
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
          className={`hidden md:flex fixed inset-y-0 left-0 z-30 transition-all duration-300 ${
            isCollapsed ? "w-20" : "w-72"
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
          className={`flex flex-col min-h-screen transition-all duration-300 ${
            isCollapsed ? "md:ml-20" : "md:ml-72"
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


