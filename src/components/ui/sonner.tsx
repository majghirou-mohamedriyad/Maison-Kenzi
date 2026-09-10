/**
 * Composant Toaster (Sonner) — Notifications & Alertes Haute Parfumerie
 * Positionné en bas à droite avec design épuré, accents champagne et icônes Lucide professionnelles (zéro emoji).
 */

import { Toaster as Sonner, toast } from "sonner";
import { useThemeContext } from "@/contexts/ThemeContext";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useThemeContext();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      duration={3500}
      closeButton
      richColors={false}
      expand={false}
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2]" />,
        info: <Info className="w-4 h-4 text-[#C9A96E] shrink-0 stroke-[2]" />,
        warning: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 stroke-[2]" />,
        error: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 stroke-[2]" />,
        loading: <Loader2 className="w-4 h-4 text-[#C9A96E] shrink-0 animate-spin stroke-[2]" />,
      }}
      toastOptions={{
        duration: 3500,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#FAF8F5]/95 dark:group-[.toaster]:bg-[#141414]/95 group-[.toaster]:text-[#111827] dark:group-[.toaster]:text-[#F9FAFB] group-[.toaster]:border group-[.toaster]:border-[#C9A96E]/30 dark:group-[.toaster]:border-[#C9A96E]/20 group-[.toaster]:shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:group-[.toaster]:shadow-[0_20px_50px_rgba(0,0,0,0.45)] group-[.toaster]:rounded-2xl group-[.toaster]:backdrop-blur-2xl group-[.toaster]:p-4 group-[.toaster]:text-xs sm:group-[.toaster]:text-sm group-[.toaster]:font-sans group-[.toaster]:ring-1 group-[.toaster]:ring-[#C9A96E]/15",
          title: "group-[.toast]:font-semibold group-[.toast]:text-[#111827] dark:group-[.toast]:text-[#F9FAFB]",
          description: "group-[.toast]:text-[#6B7280] dark:group-[.toast]:text-[#9CA3AF] group-[.toast]:text-xs group-[.toast]:mt-0.5",
          actionButton:
            "group-[.toast]:bg-[#C9A96E] group-[.toast]:text-[#141414] group-[.toast]:font-semibold group-[.toast]:rounded-xl group-[.toast]:px-3.5 group-[.toast]:py-1.5 group-[.toast]:text-xs hover:group-[.toast]:bg-[#B8985D] transition-colors",
          cancelButton:
            "group-[.toast]:bg-[#EAE5DF] dark:group-[.toast]:bg-[#262626] group-[.toast]:text-[#374151] dark:group-[.toast]:text-[#D1D5DB] group-[.toast]:rounded-xl group-[.toast]:px-3.5 group-[.toast]:py-1.5 group-[.toast]:text-xs",
          closeButton:
            "group-[.toast]:bg-[#FAF8F5] dark:group-[.toast]:bg-[#1C1C1C] group-[.toast]:border group-[.toast]:border-[#E5E0D8] dark:group-[.toast]:border-[#2E2E2E] group-[.toast]:text-[#6B7280] dark:group-[.toast]:text-[#9CA3AF] group-[.toast]:hover:bg-[#EAE5DF] dark:group-[.toast]:hover:bg-[#2A2A2A] group-[.toast]:hover:text-[#C9A96E] transition-all",
          success:
            "group-[.toaster]:border-emerald-500/30 group-[.toaster]:ring-emerald-500/15 dark:group-[.toaster]:border-emerald-500/30",
          error:
            "group-[.toaster]:border-rose-500/30 group-[.toaster]:ring-rose-500/15 dark:group-[.toaster]:border-rose-500/30",
          info:
            "group-[.toaster]:border-[#C9A96E]/40 group-[.toaster]:ring-[#C9A96E]/20",
          warning:
            "group-[.toaster]:border-amber-500/30 group-[.toaster]:ring-amber-500/15",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
