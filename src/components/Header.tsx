"use client";

import { useMemo, useState } from "react";
import { useFinanceStore } from "./shared/store";
import { CurrencyCode, TabKey } from "./shared/types";
import { getCurrencySymbol, useCurrency } from "./shared/useCurrency";

const titleMap: Record<TabKey, string> = {
  spending: "Expenses",
  savings: "Savings",
  lending: "Lending",
  analytics: "Analytics",
  settings: "Settings",
};

const currencyOptions: CurrencyCode[] = ["USD", "INR", "EUR", "GBP", "JPY", "AED"];

interface HeaderProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  isDark: boolean;
  toggleDark: () => void;
}

export default function Header({ activeTab, setActiveTab, isDark, toggleDark }: HeaderProps) {
  const { formatCurrency, currency, currencySymbol } = useCurrency();
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const setCurrency = useFinanceStore((state) => state.setCurrency);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const spendingBudget = useFinanceStore((state) => state.spendingBudget);
  const monthlyBudgets = useFinanceStore((state) => state.monthlyBudgets);
  const expenses = useFinanceStore((state) => state.expenses);
  const savingGoals = useFinanceStore((state) => state.savingGoals);
  const loans = useFinanceStore((state) => state.loans);

  const filteredExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.slice(0, 7) === selectedMonth),
    [expenses, selectedMonth],
  );

  const spendingSummary = useMemo(() => {
    const totalSpent = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthBudget = monthlyBudgets[selectedMonth] ?? spendingBudget;
    const budgetLeft = Math.max(monthBudget - totalSpent, 0);
    const usedPercent = monthBudget > 0 ? Math.min((totalSpent / monthBudget) * 100, 100) : 0;
    return { totalSpent, budgetLeft, monthBudget, usedPercent };
  }, [filteredExpenses, monthlyBudgets, selectedMonth, spendingBudget]);

  const savingsSummary = useMemo(() => {
    const totalSaved = savingGoals.reduce((sum, goal) => sum + goal.savedAmount, 0);
    const totalTarget = savingGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const reachedPercent = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
    return { totalSaved, totalTarget, reachedPercent };
  }, [savingGoals]);

  const lendingSummary = useMemo(() => {
    const totalLent = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const outstanding = loans.filter((loan) => !loan.repaid).reduce((sum, loan) => sum + (loan.amount - loan.repaidAmount), 0);
    const pendingCount = loans.filter((loan) => !loan.repaid).length;
    return { totalLent, outstanding, pendingCount };
  }, [loans]);

  return (
    <header className="flex-none bg-[#0a0a0f] px-5 pt-12 pb-4 border-b border-[rgba(255,255,255,0.06)] z-20">
      <div className="flex items-center justify-between mb-4">
        <button className="p-2 -ml-2 rounded-full hover:bg-[#1a1a26] text-[#f0f0ff] transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-[#f0f0ff]">{titleMap[activeTab]}</h1>
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => setShowCurrencyMenu((value) => !value)}
            className="h-8 min-w-12 px-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] text-xs font-semibold text-[#f0f0ff]"
          >
            {currencySymbol}
          </button>

          {showCurrencyMenu && (
            <div className="absolute right-0 top-10 w-32 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111118] shadow-[0_12px_40px_rgba(0,0,0,0.45)] overflow-hidden">
              {currencyOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setCurrency(option);
                    setShowCurrencyMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-semibold transition-colors ${
                    currency === option ? "bg-[#1313ec] text-white" : "text-[#f0f0ff] hover:bg-[#1a1a26]"
                  }`}
                >
                  {getCurrencySymbol(option)} {option}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={toggleDark}
            className="p-2 -mr-2 rounded-full hover:bg-[#1a1a26] text-[#f0f0ff] transition-colors"
            suppressHydrationWarning
          >
            <span className="material-symbols-outlined" suppressHydrationWarning>
              {isDark ? "light_mode" : "dark_mode"}
            </span>
          </button>
        </div>
      </div>

      {activeTab === "spending" && (
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4a6a] mb-1">Monthly Budget</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#f0f0ff]">{formatCurrency(spendingSummary.budgetLeft)}</span>
                <span className="text-sm font-medium text-[#6b7280]">left of {formatCurrency(spendingSummary.monthBudget)}</span>
              </div>
            </div>
            <span className="text-sm font-bold text-[#1313ec]">{Math.round(spendingSummary.usedPercent)}% used</span>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 -bottom-2 h-10 bg-[radial-gradient(ellipse_at_50%_100%,rgba(19,19,236,0.15),transparent_70%)]" />
            <div className="relative h-3 w-full bg-[#1a1a26] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1313ec] rounded-full drop-shadow-[0_0_4px_currentColor]"
                style={{ width: `${spendingSummary.usedPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "savings" && (
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4a6a] mb-1">All-Time Savings</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-[#f0f0ff]">{formatCurrency(savingsSummary.totalSaved)}</span>
                <span className="text-sm font-medium text-[#6b7280]">saved of {formatCurrency(savingsSummary.totalTarget)}</span>
              </div>
            </div>
            <span className="text-sm font-bold text-vibrant-teal">{Math.round(savingsSummary.reachedPercent)}% reached</span>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 -bottom-2 h-10 bg-[radial-gradient(ellipse_at_50%_100%,rgba(19,19,236,0.15),transparent_70%)]" />
            <div className="relative h-3 w-full bg-[#1a1a26] rounded-full overflow-hidden">
              <div
                className="h-full bg-vibrant-teal rounded-full drop-shadow-[0_0_4px_currentColor]"
                style={{ width: `${savingsSummary.reachedPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "lending" && (
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4a4a6a] mb-1">Outstanding</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#f0f0ff]">{formatCurrency(lendingSummary.outstanding)}</span>
              <span className="text-sm font-medium text-[#6b7280]">of {formatCurrency(lendingSummary.totalLent)} lent</span>
            </div>
          </div>
          <span className="text-sm font-bold text-vibrant-orange">{lendingSummary.pendingCount} pending</span>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {(["spending", "savings", "lending", "analytics"] as TabKey[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors ${
              activeTab === tab
                ? "bg-[#1313ec] text-white shadow-[0_0_16px_rgba(19,19,236,0.3)]"
                : "bg-[#1a1a26] border border-[rgba(255,255,255,0.06)] text-[#6b7280] hover:text-[#f0f0ff]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </header>
  );
}

