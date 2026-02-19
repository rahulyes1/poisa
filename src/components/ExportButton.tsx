"use client";

import { useFinanceStore } from "./shared/store";

const formatDate = () => new Date().toISOString().slice(0, 10);

export default function ExportButton() {
  const expenses = useFinanceStore((state) => state.expenses);
  const savingGoals = useFinanceStore((state) => state.savingGoals);
  const loans = useFinanceStore((state) => state.loans);
  const spendingBudget = useFinanceStore((state) => state.spendingBudget);

  const onExport = () => {
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalSaved = savingGoals.reduce((sum, goal) => sum + goal.savedAmount, 0);
    const totalTarget = savingGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalLent = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const outstanding = loans.filter((loan) => !loan.repaid).reduce((sum, loan) => sum + loan.amount, 0);

    const payload = {
      exportedAt: new Date().toISOString(),
      totals: {
        spendingBudget,
        totalSpent,
        totalSaved,
        totalTarget,
        totalLent,
        outstanding,
      },
      expenses,
      savingGoals,
      loans,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-export-${formatDate()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={onExport}
      className="inline-flex items-center gap-2 px-3 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-[#15152a]/60 backdrop-blur-sm text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-[#15152a] transition-colors"
    >
      <span className="material-symbols-outlined text-base">download</span>
      Export
    </button>
  );
}
