"use client";

import { useMemo } from "react";
import { useFinanceStore } from "./shared/store";
import { TabKey } from "./shared/types";

const titleMap: Record<TabKey, string> = {
  spending: "Expenses",
  savings: "Savings",
  lending: "Lending",
};

interface HeaderProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  isDark: boolean;
  toggleDark: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default function Header({ activeTab, setActiveTab, isDark, toggleDark }: HeaderProps) {
  const spendingBudget = useFinanceStore((state) => state.spendingBudget);
  const expenses = useFinanceStore((state) => state.expenses);
  const savingGoals = useFinanceStore((state) => state.savingGoals);
  const loans = useFinanceStore((state) => state.loans);

  const spendingSummary = useMemo(() => {
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const budgetLeft = Math.max(spendingBudget - totalSpent, 0);
    const usedPercent = spendingBudget > 0 ? Math.min((totalSpent / spendingBudget) * 100, 100) : 0;
    return { totalSpent, budgetLeft, usedPercent };
  }, [expenses, spendingBudget]);

  const savingsSummary = useMemo(() => {
    const totalSaved = savingGoals.reduce((sum, goal) => sum + goal.savedAmount, 0);
    const totalTarget = savingGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const reachedPercent = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
    return { totalSaved, totalTarget, reachedPercent };
  }, [savingGoals]);

  const lendingSummary = useMemo(() => {
    const totalLent = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const outstanding = loans.filter((loan) => !loan.repaid).reduce((sum, loan) => sum + loan.amount, 0);
    const pendingCount = loans.filter((loan) => !loan.repaid).length;
    return { totalLent, outstanding, pendingCount };
  }, [loans]);

  return (
    <header className="flex-none bg-white dark:bg-[#15152a] px-5 pt-12 pb-4 shadow-sm z-20">
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <button className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold">{titleMap[activeTab]}</h1>
        <button
          onClick={toggleDark}
          className="p-2 -mr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white transition-colors"
          suppressHydrationWarning
        >
          <span className="material-symbols-outlined" suppressHydrationWarning>
            {isDark ? "light_mode" : "dark_mode"}
          </span>
        </button>
      </div>

      {/* Tab-specific summary */}
      {activeTab === "spending" && (
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                October Budget
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(spendingSummary.budgetLeft)}
                </span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  left of {formatCurrency(spendingBudget)}
                </span>
              </div>
            </div>
            <span className="text-sm font-bold text-primary dark:text-indigo-400">
              {Math.round(spendingSummary.usedPercent)}% used
            </span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${spendingSummary.usedPercent}%` }}
            />
          </div>
        </div>
      )}

      {activeTab === "savings" && (
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                October Goal
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(savingsSummary.totalSaved)}
                </span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  saved of {formatCurrency(savingsSummary.totalTarget)}
                </span>
              </div>
            </div>
            <span className="text-sm font-bold text-vibrant-teal">
              {Math.round(savingsSummary.reachedPercent)}% reached
            </span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-vibrant-teal rounded-full"
              style={{ width: `${savingsSummary.reachedPercent}%` }}
            />
          </div>
        </div>
      )}

      {activeTab === "lending" && (
        <div className="flex items-center justify-between py-1">
          <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Outstanding
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(lendingSummary.outstanding)}
                </span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  of {formatCurrency(lendingSummary.totalLent)} lent
                </span>
              </div>
            </div>
            <span className="text-sm font-bold text-vibrant-orange">{lendingSummary.pendingCount} pending</span>
          </div>
      )}

      {/* Tab pills */}
      <div className="flex gap-2 mt-4">
        {(["spending", "savings", "lending"] as TabKey[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors ${
              activeTab === tab
                ? "bg-primary text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {tab === "spending" ? "Spending" : tab === "savings" ? "Savings" : "Lending"}
          </button>
        ))}
      </div>
    </header>
  );
}
