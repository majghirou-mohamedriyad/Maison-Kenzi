import { useState, useEffect } from "react";
import { NavLink, Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bot,
  Wallet,
  Flame,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Store,
  FolderTree,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";


const NAV_GROUPS = [
  {
    title: "Vue d'ensemble",
    items: [
      { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: "Catalogue & Vitrine",
    items: [
      { to: "/admin/produits", label: "Tous les Produits", icon: Package },
      { to: "/admin/categories", label: "Catégories", icon: FolderTree },
      { to: "/admin/bestsellers", label: "Best Sellers", icon: Flame, badge: "Vedettes" },
      { to: "/admin/saison", label: "Parfums de Saison", icon: Sparkles },
    ],
  },
  {
    title: "Ventes & Clients",
    items: [
      { to: "/admin/commandes", label: "Commandes", icon: ShoppingBag, isOrderLink: true },
      { to: "/admin/finances", label: "Finances & Revenus", icon: Wallet },
      { to: "/admin/clients", label: "Fichier Clients", icon: Users },
    ],
  },
  {
    title: "Système & Outils",
    items: [
      { to: "/admin/bot", label: "Assistant IA", icon: Bot },
      { to: "/admin/parametres", label: "Paramètres du Site", icon: Settings },
    ],
  },
];

const TITLES: Record<string, string> = {
  "/admin": "Tableau de bord",
  "/admin/produits": "Gestion du Catalogue Produits",
  "/admin/categories": "Gestion des Catégories & Collections",
  "/admin/bestsellers": "Gestion des Best Sellers",
  "/admin/saison": "Gestion des Parfums de Saison",
  "/admin/commandes": "Gestion des Commandes",
  "/admin/finances": "Statistiques Financières & Revenus",
  "/admin/clients": "Base de Données Clients",
  "/admin/bot": "Configuration de l'Assistant Virtuel",
  "/admin/parametres": "Paramètres & Maintenance du Site",
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);

  const title = TITLES[location.pathname] || "Administration";

  // Fetch pending orders count for dynamic badge
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
        // silent fallback
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
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0e131f] via-[#111827] to-[#0a0e17] text-[#F9FAFB] border-r border-white/5 shadow-2xl overflow-y-auto no-scrollbar">
      {/* Brand Header: Logo Maison Kenzi + Admin Panel text underneath */}
      <div className="px-5 py-5 border-b border-white/10 flex flex-col items-center justify-center text-center">
        <Link to="/admin" className="flex flex-col items-center gap-1.5 group">
          <img
            src="/logo.png"
            alt="Maison Kenzi Admin"
            className="h-9 w-auto object-contain invert transition-transform group-hover:scale-105"
          />
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#C9A96E] group-hover:text-white transition-colors">
            Admin Panel
          </span>
        </Link>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1.5">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#C9A96E]/70 select-none">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-[#C9A96E] to-[#b39155] text-[#111827] font-semibold shadow-lg shadow-[#C9A96E]/20 translate-x-0.5"
                        : "text-[#F9FAFB]/75 hover:bg-white/7 hover:text-white hover:translate-x-0.5"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        <item.icon
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                            isActive
                              ? "text-[#111827]"
                              : "text-[#C9A96E] group-hover:scale-110 group-hover:text-white"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {/* Badges */}
                      {item.isOrderLink && pendingOrdersCount > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-xs ${
                            isActive
                              ? "bg-[#111827] text-[#C9A96E]"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                          }`}
                        >
                          {pendingOrdersCount}
                        </span>
                      )}

                      {item.badge && !item.isOrderLink && (
                        <span
                          className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded-md ${
                            isActive
                              ? "bg-[#111827]/30 text-[#111827]"
                              : "bg-white/10 text-[#C9A96E] border border-white/5"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer / Déconnexion */}
      <div className="p-3 border-t border-white/10 mt-auto">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer border border-red-500/20"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0F0F0F] font-sans text-[#111827] dark:text-[#F9FAFB]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 z-30">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 w-64 z-50 animate-in slide-in-from-left duration-300 shadow-2xl">
            {SidebarContent}
          </aside>
        </>
      )}

      <div className="md:ml-64 flex flex-col min-h-screen transition-all">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#1A1A1A]/90 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#2A2A2A] h-14 flex items-center justify-between px-4 md:px-6 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu de navigation"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C9A96E] hidden sm:inline" />
              <h1 className="text-base md:text-lg font-semibold tracking-tight text-foreground">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card/60 hover:border-primary text-xs font-medium text-foreground hover:text-primary transition-all"
            >
              <Store className="w-3.5 h-3.5 text-primary" />
              <span>Boutique</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </Link>

            <ThemeToggle className="text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white hover:bg-[#F8F9FA] dark:hover:bg-white/5 rounded-full" />

            <div className="w-8 h-8 rounded-full bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] font-bold flex items-center justify-center text-xs shadow-xs">
              A
            </div>

            {/* Added Déconnexion Button */}
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold transition-all cursor-pointer"
              title="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
