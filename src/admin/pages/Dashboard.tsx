/**
 * Tableau de Bord Principal — Maison Kenzi Admin
 *
 * Vue d'ensemble stratégique : Métriques de ventes, suivi des commandes,
 * inventaire de flaconnage, meilleures ventes et graphique des revenus.
 * Style Haute Parfumerie & Luxe Nude (zéro emoji).
 */

import {
  BarChart3,
  ShoppingBag,
  Box,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import KpiCard from "../components/KpiCard";
import { useProducts } from "@/store/useProductStore";
import { useDashboardKPIs, useRevenueChart, useTopProducts } from "@/hooks/useAdminDashboard";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useThemeContext } from "@/contexts/ThemeContext";
import { formatEUR } from "@/lib/sizes";

const fmtEur = (n: number) => formatEUR(n);
const fmtMad = fmtEur;
const trendPct = (cur: number, prev: number) =>
  prev > 0 ? Number((((cur - prev) / prev) * 100).toFixed(1)) : cur > 0 ? 100 : 0;

const RevenueChart = ({ data }: { data: { month: string; revenue: number }[] }) => {
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const grid = isDark ? "#24211E" : "#EAE3D8";
  const axis = isDark ? "#8E867E" : "#8C827A";
  const tooltipBg = isDark ? "#1C1A18" : "#FFFFFF";
  const tooltipBorder = isDark ? "#38332C" : "#E5DDD0";
  const tooltipText = isDark ? "#FAF7F2" : "#1A1816";

  return (
    <div className="bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96E] font-medium">Performance</span>
          <h3 className="text-base font-serif font-medium text-[#1A1816] dark:text-[#FAF7F2] mt-0.5">
            Revenus des 6 derniers mois
          </h3>
        </div>
        <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#E5DDD0] dark:border-[#332E28] flex items-center justify-center text-[#C9A96E]">
          <BarChart3 className="w-4 h-4 stroke-[1.75]" />
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="month" stroke={axis} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke={axis}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`)}
            />
            <Tooltip
              cursor={{ fill: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
              contentStyle={{
                background: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: 12,
                fontSize: 12,
                color: tooltipText,
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              }}
              labelStyle={{ color: tooltipText, fontWeight: 600, marginBottom: 4 }}
              formatter={(v: number) => [fmtMad(v), "Chiffre d'affaires"]}
            />
            <Bar dataKey="revenue" fill="#C9A96E" radius={[6, 6, 0, 0]} />
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

  const revenueTrend = kpis ? trendPct(kpis.revenueThisMonth, kpis.revenueLastMonth) : 0;

  return (
    <div className="space-y-8">
      {/* En-tête de bienvenue luxe */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[#EAE3D8] dark:border-[#24211E]">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] font-medium">
            Maison Kenzi · Haute Parfumerie
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight text-[#1A1816] dark:text-[#FAF7F2] mt-1">
            Supervision Générale
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/produits"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1816] hover:bg-[#2B2724] dark:bg-[#C9A96E] dark:hover:bg-[#B8985F] text-[#FAF7F2] dark:text-[#121110] text-xs uppercase tracking-[0.15em] font-medium transition-all shadow-sm group"
          >
            <span>Nouveau Parfum</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Cartes KPI Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <KpiCard
          title="Chiffre d'affaires"
          value={loading ? "…" : fmtMad(kpis?.revenueThisMonth ?? 0)}
          sub="Mois en cours"
          trend={revenueTrend}
          icon={BarChart3}
        />
        <KpiCard
          title="Commandes"
          value={loading ? "…" : String(kpis?.ordersThisMonth ?? 0)}
          sub={`En préparation : ${kpis?.ordersInProgress ?? 0}`}
          icon={ShoppingBag}
        />
        <KpiCard
          title="Parfums Actifs"
          value={String(active)}
          sub={`${rupture} en rupture de stock`}
          icon={Box}
        />
      </div>

      {/* Graphiques & Meilleures Ventes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData} />

        <div className="bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96E] font-medium">Classement</span>
              <h3 className="text-base font-serif font-medium text-[#1A1816] dark:text-[#FAF7F2] mt-0.5">
                Meilleures Ventes
              </h3>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#E5DDD0] dark:border-[#332E28] flex items-center justify-center text-[#C9A96E]">
              <Sparkles className="w-4 h-4 stroke-[1.75]" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead className="text-[10px] uppercase tracking-[0.2em] text-[#8C827A] dark:text-[#9E958C] border-b border-[#EAE3D8] dark:border-[#24211E]">
                <tr>
                  <th className="w-[45%] text-left py-3 font-medium">Création Olfactive</th>
                  <th className="w-[20%] text-left py-3 font-medium">Contenance</th>
                  <th className="w-[15%] text-right py-3 font-medium">Volume</th>
                  <th className="w-[20%] text-right py-3 font-medium">Revenus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D8]/60 dark:divide-[#24211E]/60">
                {top.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-[#8C827A] dark:text-[#9E958C]">
                      Aucune vente enregistrée pour le moment.
                    </td>
                  </tr>
                )}
                {top.map((s) => (
                  <tr key={`${s.parfum_name}-${s.size}`} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 font-medium text-[#1A1816] dark:text-[#FAF7F2] truncate max-w-[200px]" title={s.parfum_name}>
                      {s.parfum_name}
                    </td>
                    <td className="py-3.5 text-xs text-[#7A726A] dark:text-[#A39B91] whitespace-nowrap">{s.size}</td>
                    <td className="py-3.5 text-right font-medium text-[#1A1816] dark:text-[#FAF7F2] whitespace-nowrap">{s.qty}</td>
                    <td className="py-3.5 text-right font-bold tracking-tight text-[#C9A96E] whitespace-nowrap">{fmtMad(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Indicateurs Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#8C827A] dark:text-[#9E958C]">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[1.75]" />
            <span>Revenus mois précédent</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-[#1A1816] dark:text-[#FAF7F2] mt-2">{fmtMad(kpis?.revenueLastMonth ?? 0)}</p>
        </div>

        <div className="bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#8C827A] dark:text-[#9E958C]">
            <ShoppingBag className="w-4 h-4 text-[#C9A96E] stroke-[1.75]" />
            <span>Commandes en attente</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-[#1A1816] dark:text-[#FAF7F2] mt-2">{kpis?.ordersInProgress ?? 0}</p>
        </div>

        <div className="bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#8C827A] dark:text-[#9E958C]">
            <TrendingDown className="w-4 h-4 text-rose-500 stroke-[1.75]" />
            <span>Parfums en rupture</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-[#1A1816] dark:text-[#FAF7F2] mt-2">{rupture}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

