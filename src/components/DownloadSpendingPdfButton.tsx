"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useFinanceStore } from "./shared/store";
import { useCurrency } from "./shared/useCurrency";

const toMonthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) {
    return month;
  }
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

export default function DownloadSpendingPdfButton() {
  const { currency, formatCurrency } = useCurrency();
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const expenses = useFinanceStore((state) => state.expenses);

  const onDownload = () => {
    const monthExpenses = expenses
      .filter((expense) => expense.date.slice(0, 7) === selectedMonth)
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalSpent = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryRows = Object.entries(
      monthExpenses.reduce<Record<string, number>>((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => [category, formatCurrency(amount)]);

    const transactionRows = monthExpenses.map((expense) => [
      expense.date,
      expense.name,
      expense.category,
      formatCurrency(expense.amount),
      expense.note || "-",
    ]);

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Poisa Spending Report", 40, 44);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Month: ${toMonthLabel(selectedMonth)}`, 40, 66);
    doc.text(`Currency: ${currency}`, 40, 82);

    autoTable(doc, {
      startY: 98,
      head: [["Metric", "Value"]],
      body: [
        ["Total Transactions", String(monthExpenses.length)],
        ["Total Spent", formatCurrency(totalSpent)],
      ],
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [79, 70, 229] },
      columnStyles: {
        1: { halign: "right" },
      },
      margin: { left: 40, right: 40 },
    });

    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
        ? (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 14
        : 190,
      head: [["Category", "Amount"]],
      body: categoryRows.length > 0 ? categoryRows : [["No category data", formatCurrency(0)]],
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [0, 154, 132] },
      columnStyles: {
        1: { halign: "right" },
      },
      margin: { left: 40, right: 40 },
    });

    autoTable(doc, {
      startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
        ? (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 14
        : 280,
      head: [["Date", "Name", "Category", "Amount", "Note"]],
      body: transactionRows.length > 0 ? transactionRows : [["-", "No transactions", "-", formatCurrency(0), "-"]],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 5, overflow: "linebreak" },
      headStyles: { fillColor: [15, 23, 42] },
      columnStyles: {
        3: { halign: "right", cellWidth: 72 },
        4: { cellWidth: 150 },
      },
      margin: { left: 40, right: 40 },
    });

    doc.save(`spending-report-${selectedMonth}.pdf`);
  };

  return (
    <button
      type="button"
      onClick={onDownload}
      className="inline-flex items-center gap-2 px-3 h-9 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] text-xs font-semibold text-[#f0f0ff] hover:border-[rgba(79,70,229,0.7)] transition-colors"
    >
      <span className="material-symbols-outlined text-base">picture_as_pdf</span>
      Download Spending PDF
    </button>
  );
}
