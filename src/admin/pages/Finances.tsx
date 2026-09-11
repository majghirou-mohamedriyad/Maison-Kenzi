import { useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  RotateCcw,
  Plus,
  Trash2,
  PiggyBank,
  ShoppingBag,
  Percent,
  Box,
  FileDown,
  Calendar,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useAdminFinances, EXPENSE_CATEGORIES, Expense } from "@/hooks/useAdminFinances";
import FlaconnageSection from "@/admin/components/FlaconnageSection";
import { exportMonthlyFinancialReportPdf } from "@/admin/lib/financialReportPdf";

const fmtMad = (n: number) =>
  `${Math.round(n).toLocaleString("fr-FR")} MAD`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const StatCard = ({
  title,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
}: {
  title: string;
  value: string;
  sub?: string;
  icon: typeof Wallet;
  tone?: "neutral" | "positive" | "negative" | "primary" | "gold";
}) => {
  const toneClasses: Record<string, string> = {
    neutral: "bg-secondary text-foreground",
    positive: "bg-emerald-500/10 text-emerald-500",
    negative: "bg-rose-500/10 text-rose-500",
    primary: "bg-primary/10 text-primary",
    gold: "bg-[#C9A96E]/15 text-[#C9A96E]",
  };
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${toneClasses[tone]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
};

const Finances = () => {
  const { kpis, monthly, byCategory, expenses, loading, error, addExpense, deleteExpense } =
    useAdminFinances();
  const { theme } = useThemeContext();
  const isDark = theme === "dark";
  const grid = isDark ? "#2A2A2A" : "#E5E7EB";
  const axis = isDark ? "#9CA3AF" : "#6B7280";
  const tooltipBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const tooltipBorder = isDark ? "#2A2A2A" : "#E5E7EB";
  const tooltipText = isDark ? "#F9FAFB" : "#111827";

  const [form, setForm] = useState({
    occurred_on: new Date().toISOString().slice(0, 10),
    category: EXPENSE_CATEGORIES[0] as string,
    label: "",
    amount: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Month selection for PDF report export
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.amount) {
      toast.error("Libellé et montant requis");
      return;
    }
    setSubmitting(true);
    const res = await addExpense({
      occurred_on: form.occurred_on,
      category: form.category,
      label: form.label.trim(),
      amount: Number(form.amount),
      notes: form.notes.trim() || null,
    });
    setSubmitting(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Dépense ajoutée avec succès !");
      setForm((f) => ({ ...f, label: "", amount: "", notes: "" }));
    }
  };

  const remove = async (id: string) => {
    const res = await deleteExpense(id);
    if (res.error) toast.error(res.error);
    else toast.success("Dépense supprimée");
  };

  // Generate Monthly PDF Financial Report
  const handleExportMonthlyPdf = async () => {
    setExportingPdf(true);
    try {
      // Find monthly stats
      const targetMonthData = monthly.find((m) => m.yearMonthKey === selectedMonth);
      const monthLabel = targetMonthData ? targetMonthData.month : selectedMonth;

      // Filter expenses for selected month
      const monthExpenses = expenses.filter((e) => e.occurred_on.startsWith(selectedMonth));

      const rev = targetMonthData ? targetMonthData.revenue : (kpis?.revenueThisMonth ?? 0);
      const exp = targetMonthData ? targetMonthData.expenses : (kpis?.expensesThisMonth ?? 0);
      const net = targetMonthData ? targetMonthData.net : (kpis?.netProfitThisMonth ?? 0);
      const margin = rev > 0 ? (net / rev) * 100 : 0;

      await exportMonthlyFinancialReportPdf({
        monthLabel,
        revenue: rev,
        expenses: exp,
        netProfit: net,
        marginPct: margin,
        byCategory,
        expensesList: monthExpenses,
      });

      toast.success(`Bilan financier PDF de ${monthLabel} téléchargé !`);
    } catch (err) {
      toast.error("Erreur lors de la génération du PDF: " + (err as Error).message);
    } finally {
      setExportingPdf(false);
    }
  };

  const marginThisMonth = kpis?.profitMarginThisMonthPct ?? 0;

  return (
    <div className="space-y-6">
      {/* Header Banner & Monthly Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border border-border rounded-xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Finances & Comptabilité Maison Kenzi
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gestion globale de la trésorerie, suivi des marges et bilans comptables téléchargeables.
          </p>
        </div>

        {/* PDF Monthly Export Selector */}
        <div className="flex items-center gap-2 bg-secondary/80 p-1.5 rounded-lg border border-border shrink-0">
          <Calendar className="w-4 h-4 text-muted-foreground ml-1" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-background border border-border text-xs rounded px-2 py-1 text-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={handleExportMonthlyPdf}
            disabled={exportingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            {exportingPdf ? "Génération..." : "Bilan PDF Mensuel"}
          </button>
        </div>
      </div>

      {/* Hero / net profit */}
      <div className="bg-gradient-to-br from-primary/15 via-card to-card border border-border rounded-xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                Trésorerie Nette Cumulée
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Marge Nette Global : {(kpis?.profitMarginPct ?? 0).toFixed(1)}%
              </span>
            </div>

            <p className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mt-2">
              {loading ? "…" : fmtMad(kpis?.netProfit ?? 0)}
            </p>

            <p className="text-xs text-muted-foreground mt-1.5">
              Net ce mois : <span className="font-semibold text-foreground">{fmtMad(kpis?.netProfitThisMonth ?? 0)}</span> ({marginThisMonth.toFixed(1)}% de marge)
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center bg-background/50 p-3 rounded-xl border border-border/50">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Recettes Totales</p>
              <p className="text-lg font-bold text-emerald-500 mt-0.5">{fmtMad(kpis?.revenueTotal ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Retours / Annulés</p>
              <p className="text-lg font-bold text-rose-500 mt-0.5">−{fmtMad(kpis?.refundsTotal ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Dépenses Totales</p>
              <p className="text-lg font-bold text-rose-500 mt-0.5">−{fmtMad(kpis?.expensesTotal ?? 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Recettes ce mois"
          value={fmtMad(kpis?.revenueThisMonth ?? 0)}
          sub={`Mois dernier : ${fmtMad(kpis?.revenueLastMonth ?? 0)}`}
          icon={TrendingUp}
          tone="positive"
        />
        <StatCard
          title="Dépenses ce mois"
          value={fmtMad(kpis?.expensesThisMonth ?? 0)}
          sub={`Total charges : ${fmtMad(kpis?.expensesTotal ?? 0)}`}
          icon={TrendingDown}
          tone="negative"
        />
        <StatCard
          title="Marge Nette (Ce Mois)"
          value={`${marginThisMonth.toFixed(1)}%`}
          sub={`Bénéfice : ${fmtMad(kpis?.netProfitThisMonth ?? 0)}`}
          icon={Percent}
          tone="gold"
        />
        <StatCard
          title="Valeur Estimée du Stock"
          value={fmtMad(kpis?.stockAssetValue ?? 0)}
          sub="Catalogue + Flaconnage disponible"
          icon={Box}
          tone="primary"
        />
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Recettes vs Dépenses · 6 mois</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
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
                  contentStyle={{
                    background: tooltipBg,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: 6,
                    fontSize: 12,
                    color: tooltipText,
                  }}
                  labelStyle={{ color: tooltipText }}
                  formatter={(v: number, name: string) => [fmtMad(v), name]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="revenue" name="Recettes" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="expenses" name="Dépenses" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="net" name="Bénéfice Net" stroke="#C9A96E" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Répartition des dépenses par catégorie</h3>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Aucune dépense enregistrée.
            </p>
          ) : (
            <div className="space-y-3">
              {byCategory.map((c) => (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground font-medium truncate max-w-[170px]">{c.category}</span>
                    <span className="text-muted-foreground">{fmtMad(c.amount)} ({c.pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add expense + list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form
          onSubmit={submit}
          className="bg-card border border-border rounded-lg p-5 space-y-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Ajouter une dépense</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">Date</span>
              <input
                type="date"
                value={form.occurred_on}
                onChange={(e) => setForm((f) => ({ ...f, occurred_on: e.target.value }))}
                className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-xs"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Catégorie</span>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-xs"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-muted-foreground">Libellé</span>
            <input
              type="text"
              placeholder="Ex: Achat 10 flacons d'origine Le Beau"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Montant (MAD)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-xs"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Notes (optionnel)</span>
            <textarea
              rows={2}
              placeholder="Détails du fournisseur ou livraison..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="mt-1 w-full bg-background border border-border rounded-md px-3 py-2 text-xs"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md px-3 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            {submitting ? "Enregistrement…" : "Enregistrer la dépense"}
          </button>
        </form>

        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Historique des Dépenses</h3>
            </div>
            <span className="text-xs text-muted-foreground">{expenses.length} entrée(s)</span>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-10">Chargement…</p>
          ) : expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              Aucune dépense enregistrée. Commencez à suivre vos achats de stock et d'emballages.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="uppercase tracking-wide text-muted-foreground bg-secondary/50">
                  <tr>
                    <th className="text-left p-2.5">Date</th>
                    <th className="text-left p-2.5">Catégorie</th>
                    <th className="text-left p-2.5">Libellé</th>
                    <th className="text-right p-2.5">Montant</th>
                    <th className="p-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.slice(0, 25).map((e) => (
                    <tr key={e.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="p-2.5 text-muted-foreground whitespace-nowrap">{fmtDate(e.occurred_on)}</td>
                      <td className="p-2.5">
                        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border">
                          {e.category}
                        </span>
                      </td>
                      <td className="p-2.5 text-foreground">
                        <div className="font-medium">{e.label}</div>
                        {e.notes && <div className="text-[10px] text-muted-foreground">{e.notes}</div>}
                      </td>
                      <td className="p-2.5 text-right whitespace-nowrap font-bold text-rose-500">−{fmtMad(e.amount)}</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => remove(e.id)}
                          className="text-muted-foreground hover:text-destructive p-1"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <FlaconnageSection />
    </div>
  );
};

export default Finances;
