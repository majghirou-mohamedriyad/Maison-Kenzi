import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useThemeContext } from "@/contexts/ThemeContext";

const data = [
  { mois: "Jan", revenus: 12400 },
  { mois: "Fév", revenus: 18900 },
  { mois: "Mar", revenus: 15200 },
  { mois: "Avr", revenus: 27800 },
  { mois: "Mai", revenus: 34500 },
  { mois: "Juin", revenus: 42100 },
];

const RevenueChart = () => {
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const grid = isDark ? "#2A2A2A" : "#E5E7EB";
  const axis = isDark ? "#9CA3AF" : "#6B7280";
  const tooltipBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const tooltipBorder = isDark ? "#2A2A2A" : "#E5E7EB";
  const tooltipText = isDark ? "#F9FAFB" : "#111827";

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-lg p-5">
      <h3 className="text-sm font-medium text-[#111827] dark:text-[#F9FAFB] mb-4">
        Revenus des 6 derniers mois
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis dataKey="mois" stroke={axis} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={axis} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
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
              formatter={(v: number) => [`${v.toLocaleString("fr-FR")} MAD`, "Revenus"]}
            />
            <Bar dataKey="revenus" fill="#C9A96E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
