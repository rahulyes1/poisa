"use client";

import { useFinanceStore } from "./shared/store";
import { useCurrency } from "./shared/useCurrency";

const formatDate = () => new Date().toISOString().slice(0, 10);

export default function ExportButton() {
  const { currency } = useCurrency();
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const monthlyBudgets = useFinanceStore((state) => state.monthlyBudgets);
  const expenses = useFinanceStore((state) => state.expenses);
  const savingGoals = useFinanceStore((state) => state.savingGoals);
  const investments = useFinanceStore((state) => state.investments);
  const loans = useFinanceStore((state) => state.loans);
  const personalLoans = useFinanceStore((state) => state.personalLoans);
  const lifeInsurances = useFinanceStore((state) => state.lifeInsurances);
  const adjustments = useFinanceStore((state) => state.adjustments);
  const dashboardWindow = useFinanceStore((state) => state.dashboardWindow);
  const spendingCarryForwardEnabled = useFinanceStore((state) => state.spendingCarryForwardEnabled);
  const savingsCarryForwardEnabled = useFinanceStore((state) => state.savingsCarryForwardEnabled);
  const monthMode = useFinanceStore((state) => state.monthMode);
  const spendingBudget = useFinanceStore((state) => state.spendingBudget);
  const savingsBudget = useFinanceStore((state) => state.savingsBudget);

  const onExport = () => {
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalSaved = savingGoals.reduce((sum, goal) => sum + goal.savedAmount, 0);
    const totalTarget = savingGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalLent = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const outstanding = loans.reduce((sum, loan) => sum + Math.max(loan.amount - loan.repaidAmount, 0), 0);

    const payload = {
      exportedAt: new Date().toISOString(),
      totals: {
        currency,
        selectedMonth,
        monthMode,
        dashboardWindow,
        spendingCarryForwardEnabled,
        savingsCarryForwardEnabled,
        selectedMonthBudget: monthlyBudgets[selectedMonth] ?? spendingBudget,
        spendingBudget,
        savingsBudget,
        totalSpent,
        totalSaved,
        totalTarget,
        totalLent,
        outstanding,
      },
      expenses,
      savingGoals,
      investments,
      loans,
      personalLoans,
      lifeInsurances,
      adjustments,
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
      className="inline-flex items-center gap-2 px-3 h-9 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1a1a26] text-xs font-semibold text-[#f0f0ff] hover:border-[rgba(0,201,167,0.5)] transition-colors"
    >
      <span className="material-symbols-outlined text-base">download</span>
      Export
    </button>
  );
}

