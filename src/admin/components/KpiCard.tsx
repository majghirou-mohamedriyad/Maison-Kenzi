import { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  value: string;
  sub?: string;
  trend?: number; // % change; positive = green
  icon: LucideIcon;
};

const KpiCard = ({ title, value, sub, trend, icon: Icon }: Props) => (
  <div className="bg-[#FFFFFF] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-lg p-5 flex flex-col gap-3">
    <div className="flex items-start justify-between">
      <span className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">{title}</span>
      <div className="w-9 h-9 rounded-md bg-[#F8F9FA] dark:bg-[#0F0F0F] flex items-center justify-center text-[#111827] dark:text-[#F9FAFB]">
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="text-2xl font-semibold text-[#111827] dark:text-[#F9FAFB]">{value}</div>
    {(sub || trend !== undefined) && (
      <div className="flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
        {trend !== undefined && (
          <span
            className={`px-1.5 py-0.5 rounded ${
              trend >= 0 ? "bg-[#10B981]/10 text-[#10B981]" : "bg-[#EF4444]/10 text-[#EF4444]"
            }`}
          >
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
        )}
        {sub && <span>{sub}</span>}
      </div>
    )}
  </div>
);

export default KpiCard;
