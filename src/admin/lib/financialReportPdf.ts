/**
 * Générateur de Rapport Financier & Bilan Comptable PDF Mensuel — Maison Kenzi
 *
 * Conçoit et télécharge un document comptable A4 de prestige sous jsPDF.
 * Présentation éditoriale haute parfumerie, synthèse des KPI (CA, charges, bénéfice net),
 * ventilation par catégorie et grand livre détaillé des écritures en Euro (€).
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Expense, CategoryBreakdown } from "@/hooks/useAdminFinances";

const BRAND = {
  paper:      [253, 251, 248] as [number, number, number],
  cardBg:     [246, 241, 234] as [number, number, number],
  ink:        [20,  14,  10  ] as [number, number, number],
  inkSoft:    [60,  45,  35  ] as [number, number, number],
  gold:       [216, 176, 67  ] as [number, number, number],
  goldDeep:   [170, 135, 45  ] as [number, number, number],
  muted:      [130, 115, 100 ] as [number, number, number],
  rule:       [220, 205, 185] as [number, number, number],
};

const money = (n: number) => {
  const formatted = Number(n || 0)
    .toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .replace(/[\u00A0\u202F\s]/g, " ");
  return `${formatted} €`;
};

async function loadImageAsBase64(url: string): Promise<string | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 200;
        canvas.height = img.naturalHeight || 200;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
          return;
        }
      } catch (e) {
        console.warn("Canvas warning:", e);
      }
      resolve(null);
    };
    img.onerror = () => resolve(null);
  });
}

export async function exportMonthlyFinancialReportPdf({
  monthLabel,
  revenue,
  expenses,
  netProfit,
  marginPct,
  byCategory,
  expensesList,
}: {
  monthLabel: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  marginPct: number;
  byCategory: CategoryBreakdown[];
  expensesList: Expense[];
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 45;

  const logoBase64 = await loadImageAsBase64("/logo.svg");

  /* Paper background */
  doc.setFillColor(...BRAND.paper);
  doc.rect(0, 0, pageW, pageH, "F");

  /* Gold top bar */
  doc.setFillColor(...BRAND.gold);
  doc.rect(0, 0, pageW, 6, "F");

  /* ---------------- HEADER ---------------- */
  const headerY = 40;
  if (logoBase64) {
    try {
      doc.setFillColor(...BRAND.ink);
      doc.roundedRect(M, headerY, 44, 44, 8, 8, "F");
      doc.addImage(logoBase64, "PNG", M + 6, headerY + 6, 32, 32);
    } catch {
      // Fallback
    }
  }

  const titleX = logoBase64 ? M + 56 : M;
  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BRAND.ink);
  doc.text("MAISON KENZI", titleX, headerY + 20);

  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text("Rapport Comptable & Bilan Financier Mensuel", titleX, headerY + 35);

  // Right Header: Month badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.gold);
  doc.text("BILAN MENSUEL", pageW - M, headerY + 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.ink);
  doc.text(`Période : ${monthLabel}`, pageW - M, headerY + 36, { align: "right" });

  /* Gold Divider Line */
  const lineY = headerY + 58;
  doc.setDrawColor(...BRAND.gold);
  doc.setLineWidth(0.8);
  doc.line(M, lineY, pageW - M, lineY);

  /* ---------------- KPI SYNTHESIS BOXES ---------------- */
  const kpiY = lineY + 20;
  const boxWidth = (pageW - 2 * M - 30) / 4;

  const kpiItems = [
    { label: "Chiffre d'Affaires", val: money(revenue), color: BRAND.ink },
    { label: "Total Dépenses", val: money(expenses), color: [225, 29, 72] as [number, number, number] },
    { label: "Bénéfice Net", val: money(netProfit), color: BRAND.goldDeep },
    { label: "Marge Nette", val: `${marginPct.toFixed(1)}%`, color: [16, 185, 129] as [number, number, number] },
  ];

  kpiItems.forEach((k, idx) => {
    const x = M + idx * (boxWidth + 10);
    doc.setFillColor(...BRAND.cardBg);
    doc.roundedRect(x, kpiY, boxWidth, 54, 6, 6, "F");
    doc.setDrawColor(...BRAND.rule);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, kpiY, boxWidth, 54, 6, 6, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.muted);
    doc.text(k.label, x + 10, kpiY + 18);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...k.color);
    doc.text(k.val, x + 10, kpiY + 38);
  });

  /* ---------------- CATEGORIES BREAKDOWN TABLE ---------------- */
  const catY = kpiY + 76;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.gold);
  doc.text("RÉPARTITION DES DÉPENSES PAR CATÉGORIE", M, catY);

  const catRows = byCategory.map((c) => [c.category, `${c.pct}%`, money(c.amount)]);

  autoTable(doc, {
    startY: catY + 10,
    head: [["Catégorie de Dépense", "Part (%)", "Montant Total"]],
    body: catRows.length > 0 ? catRows : [["Aucune dépense enregistrée pour ce mois", "0%", "0,00 €"]],
    theme: "plain",
    styles: { font: "helvetica", fontSize: 8.5, textColor: BRAND.inkSoft },
    headStyles: { fillColor: BRAND.ink, textColor: BRAND.gold, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: BRAND.cardBg },
    columnStyles: {
      0: { cellWidth: 280, fontStyle: "bold" },
      1: { halign: "center", cellWidth: 80 },
      2: { halign: "right", cellWidth: 140, fontStyle: "bold" },
    },
    margin: { left: M, right: M },
  });

  // @ts-expect-error lastAutoTable injected by jspdf-autotable
  let tableEndY: number = doc.lastAutoTable.finalY || catY + 80;

  /* ---------------- ITEMIZED EXPENSES TABLE ---------------- */
  tableEndY += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.gold);
  doc.text("DÉTAIL DES DÉPENSES DU MOIS", M, tableEndY);

  const expRows = expensesList.map((e) => [
    e.occurred_on,
    e.category,
    e.label,
    money(e.amount),
  ]);

  autoTable(doc, {
    startY: tableEndY + 10,
    head: [["Date", "Catégorie", "Libellé / Description", "Montant"]],
    body: expRows.length > 0 ? expRows : [["—", "—", "Aucune dépense détaillée", "0,00 €"]],
    theme: "plain",
    styles: { font: "helvetica", fontSize: 8.5, textColor: BRAND.inkSoft },
    headStyles: { fillColor: BRAND.ink, textColor: BRAND.gold, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: BRAND.cardBg },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 140 },
      2: { cellWidth: 170 },
      3: { halign: "right", cellWidth: 120, fontStyle: "bold", textColor: [225, 29, 72] },
    },
    margin: { left: M, right: M },
  });

  /* ---------------- FOOTER ---------------- */
  const fy = pageH - 45;
  doc.setDrawColor(...BRAND.gold);
  doc.setLineWidth(0.5);
  doc.line(M, fy, pageW - M, fy);

  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.ink);
  doc.text("Document Officiel Généré par le Système Administrateur Maison Kenzi.", pageW / 2, fy + 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.muted);
  doc.text("maisonkenzi.ma  ·  +212 7 52 85 01 56", pageW / 2, fy + 28, { align: "center" });

  doc.setFillColor(...BRAND.gold);
  doc.rect(0, pageH - 4, pageW, 4, "F");

  doc.save(`Maison-Kenzi-Bilan-Financier-${monthLabel.replace(/\s+/g, "_")}.pdf`);
}
