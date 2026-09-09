/**
 * Carte d'Indicateur Clé (KPI) — Maison Kenzi Admin
 *
 * Affiche une métrique avec typographie Serif, icône dorée champagne,
 * indicateur de tendance fluide et finitions verre dépoli.
 */

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  title: string;
  value: string;
  sub?: string;
  trend?: number; // Variation en % ; positif = vert sauge, négatif = lie-de-vin
  icon: LucideIcon;
};

const KpiCard = ({ title, value, sub, trend, icon: Icon }: Props) => (
  <div className="bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] rounded-2xl p-6 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:border-[#C9A96E]/40 transition-all duration-300 group">
    <div className="flex items-start justify-between mb-3">
      <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-[#7A726A] dark:text-[#A39B91]">
        {title}
      </span>
      <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] dark:bg-[#1C1A18] border border-[#E5DDD0] dark:border-[#332E28] flex items-center justify-center text-[#C9A96E] group-hover:scale-105 group-hover:border-[#C9A96E]/50 transition-all duration-300 shadow-xs">
        <Icon className="w-4 h-4 stroke-[1.75]" />
      </div>
    </div>

    <div>
      <div className="text-3xl font-serif font-medium tracking-tight text-[#1A1816] dark:text-[#FAF7F2] mb-2">
        {value}
      </div>

      {(sub || trend !== undefined) && (
        <div className="flex items-center gap-2 text-xs text-[#8C827A] dark:text-[#8E867E]">
          {trend !== undefined && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide ${
                trend >= 0 
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" 
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
              }`}
            >
              {trend >= 0 ? (
                <TrendingUp className="w-3 h-3 stroke-[2]" />
              ) : (
                <TrendingDown className="w-3 h-3 stroke-[2]" />
              )}
              <span>{trend >= 0 ? "+" : ""}{trend}%</span>
            </span>
          )}
          {sub && <span className="truncate">{sub}</span>}
        </div>
      )}
    </div>
  </div>
);

export default KpiCard;

