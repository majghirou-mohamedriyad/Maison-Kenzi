import { BarChart3, ShoppingBag, Box, Users, Droplet, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import KpiCard from "../components/KpiCard";
import { useProducts } from "@/store/useProductStore";
import { useDashboardKPIs, useRevenueChart, useTopProducts } from "@/hooks/useAdminDashboard";
import { useFlaconnage } from "@/hooks/useFlaconnage";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useThemeContext } from "@/contexts/ThemeContext";

const fmtMad = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} MAD`;
const trendPct = (cur: number, prev: number) =>
  prev > 0 ? Number((((cur - prev) / prev) * 100).toFixed(1)) : cur > 0 ? 100 : 0;

const BottleCard = ({
  label,
  available,
  used,
  initialStock,
  isLow,
}: {
  label: string;
  available: number;
  used: number;
  initialStock: number;
  isLow?: boolean;
}) => {
  const total = initialStock > 0 ? initialStock : available + used;
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center ${
              isLow ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"
            }`}
          >
            <Droplet className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-foreground">{label}</h3>
        </div>
        {isLow ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" />
            Stock bas
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{pct}% utilisé</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Disponibles</p>
          <p className={`text-2xl font-serif mt-1 ${isLow ? "text-rose-500" : "text-foreground"}`}>
            {available}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Utilisées</p>
          <p className="text-2xl font-serif text-accent mt-1">{used}</p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full transition-all ${isLow ? "bg-rose-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};


const RevenueChart = ({ data }: { data: { month: string; revenue: number }[] }) => {
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const grid = isDark ? "#2A2A2A" : "#E5E7EB";
  const axis = isDark ? "#9CA3AF" : "#6B7280";
  const tooltipBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const tooltipBorder = isDark ? "#2A2A2A" : "#E5E7EB";
  const tooltipText = isDark ? "#F9FAFB" : "#111827";
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h3 className="text-sm font-medium text-foreground mb-4">Revenus des 6 derniers mois</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="month" stroke={axis} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke={axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
            />
            <Tooltip
              cursor={{ fill: isDark ? "rgba(255,255,255,0.05)" : "#F8F9FA" }}
              contentStyle={{
                background: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: 6,
                fontSize: 12,
                color: tooltipText,
              }}
              labelStyle={{ color: tooltipText }}
              formatter={(v: number) => [fmtMad(v), "Revenus"]}
            />
            <Bar dataKey="revenue" fill="#C9A96E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const products = useProducts();
  const { kpis, loading } = useDashboardKPIs();
  const { data: revenueData } = useRevenueChart();
  const { data: top } = useTopProducts();

  const active = products.filter((p) => p.active ?? true).length;
  const rupture = products.filter(
    (p) =>
      p.sale_mode === "full_bottle"
        ? (p.full_bottle_stock ?? 0) === 0
        : (p.stock_5ml ?? 0) + (p.stock_10ml ?? 0) === 0,
  ).length;

  const { stats: flacons } = useFlaconnage();
  const flacon = (size: "5ml" | "10ml" | "full") => flacons.find((f) => f.size === size);

  const revenueTrend = kpis ? trendPct(kpis.revenueThisMonth, kpis.revenueLastMonth) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Chiffre d'affaires"
          value={loading ? "…" : fmtMad(kpis?.revenueThisMonth ?? 0)}
          sub="Ce mois-ci"
          trend={revenueTrend}
          icon={BarChart3}
        />
        <KpiCard
          title="Commandes"
          value={loading ? "…" : String(kpis?.ordersThisMonth ?? 0)}
          sub={`En cours : ${kpis?.ordersInProgress ?? 0}`}
          icon={ShoppingBag}
        />
        <KpiCard
          title="Produits actifs"
          value={String(active)}
          sub={`${rupture} en rupture de stock`}
          icon={Box}
        />
        <KpiCard
          title="Clients"
          value={loading ? "…" : String(kpis?.customers ?? 0)}
          sub={`+${kpis?.customersThisMonth ?? 0} ce mois`}
          icon={Users}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-foreground">Inventaire par format</h2>
          <Link to="/admin/finances" className="text-xs text-primary hover:underline">
            Gérer le flaconnage →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["5ml", "10ml", "full"] as const).map((s) => {
            const f = flacon(s);
            const label = s === "full" ? "Bouteilles complètes" : `Flacons ${s}`;
            return (
              <BottleCard
                key={s}
                label={label}
                available={f?.stock ?? 0}
                used={f?.used ?? 0}
                initialStock={f?.initialStock ?? 0}
                isLow={f?.isLow}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={revenueData} />

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Meilleures ventes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left py-2">Produit</th>
                  <th className="text-left py-2">Taille</th>
                  <th className="text-right py-2">Qté</th>
                  <th className="text-right py-2">Revenus</th>
                </tr>
              </thead>
              <tbody>
                {top.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      Aucune vente pour le moment.
                    </td>
                  </tr>
                )}
                {top.map((s) => (
                  <tr key={`${s.parfum_name}-${s.size}`} className="border-t border-border">
                    <td className="py-2.5 font-medium text-foreground">{s.parfum_name}</td>
                    <td className="py-2.5 text-muted-foreground">{s.size}</td>
                    <td className="py-2.5 text-right">{s.qty}</td>
                    <td className="py-2.5 text-right">{fmtMad(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Revenus mois précédent
          </div>
          <p className="text-2xl font-serif text-foreground mt-2">{fmtMad(kpis?.revenueLastMonth ?? 0)}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingBag className="w-4 h-4 text-primary" /> Commandes en attente
          </div>
          <p className="text-2xl font-serif text-foreground mt-2">{kpis?.ordersInProgress ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="w-4 h-4 text-rose-500" /> Produits en rupture
          </div>
          <p className="text-2xl font-serif text-foreground mt-2">{rupture}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
