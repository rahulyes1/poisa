"use client";

import { useMemo, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

interface SpendingDashboardProps {
  isBudgetOpen: boolean;
  onToggleBudget: () => void;
}

export default function SpendingDashboard({ isBudgetOpen, onToggleBudget }: SpendingDashboardProps) {
  const { formatCurrency } = useCurrency();
  const [editingLimitCategory, setEditingLimitCategory] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState("");

  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const expenses = useFinanceStore((state) => state.expenses);
  const spendingBudget = useFinanceStore((state) => state.spendingBudget);
  const categoryLimits = useFinanceStore((state) => state.categoryLimits);
  const setCategoryLimit = useFinanceStore((state) => state.setCategoryLimit);

  const monthlyExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.slice(0, 7) === selectedMonth),
    [expenses, selectedMonth],
  );

  const totalSpent = useMemo(
    () => monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [monthlyExpenses],
  );

  const budgetLeft = Math.max(spendingBudget - totalSpent, 0);
  const percentUsed = spendingBudget > 0 ? Math.min((totalSpent / spendingBudget) * 100, 100) : 0;

  const categoryTotals = useMemo(() => {
    const byCategory = monthlyExpenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    return Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  }, [monthlyExpenses]);

  const overLimitCategories = useMemo(
    () =>
      categoryTotals.filter(([category, amount]) => {
        const limit = categoryLimits[category];
        return typeof limit === "number" && amount > limit;
      }),
    [categoryLimits, categoryTotals],
  );

  const onStartLimitEdit = (category: string) => {
    setEditingLimitCategory(category);
    const currentLimit = categoryLimits[category];
    setLimitInput(typeof currentLimit === "number" ? String(currentLimit) : "");
  };

  const onSaveLimit = (category: string) => {
    const parsed = Number(limitInput);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    setCategoryLimit(category, parsed);
    setEditingLimitCategory(null);
    setLimitInput("");
  };

  return (
    <section className="px-4 pt-2 space-y-3">
      {overLimitCategories.length > 0 && (
        <div className="rounded-xl border border-[rgba(255,140,66,0.35)] bg-[rgba(255,140,66,0.12)] px-3 py-2 text-[#FF8C42] text-xs font-semibold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">warning</span>
          {overLimitCategories.length} categories over limit
        </div>
      )}

      <div className="glass-card rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/65">This Month</p>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-white/70">
              {formatCurrency(totalSpent)} / {formatCurrency(spendingBudget)}
            </p>
            <button
              type="button"
              onClick={onToggleBudget}
              className={`size-6 rounded-full border text-[11px] inline-flex items-center justify-center ${
                isBudgetOpen
                  ? "border-[#00C9A7]/60 bg-[#00C9A7]/18 text-[#bdfdee]"
                  : "border-white/20 bg-white/[0.08] text-white/70"
              }`}
              title="Budget"
            >
              <span className="material-symbols-outlined text-[14px]">tune</span>
            </button>
          </div>
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-1.5">
          <div className="h-full rounded-full bg-[#00C9A7] drop-shadow-[0_0_4px_currentColor]" style={{ width: `${percentUsed}%` }} />
        </div>
        <p className="text-[10px] text-white/65 mb-2">{formatCurrency(budgetLeft)} left</p>
        <h3 className="text-xs font-bold text-[#f0f0ff] mb-2.5">Spending by category</h3>

        {categoryTotals.length === 0 ? (
          <p className="text-xs text-white/70">No expenses yet for this month.</p>
        ) : (
          <div className="space-y-2">
            {categoryTotals.map(([category, amount]) => {
              const limit = categoryLimits[category];
              const isOverLimit = typeof limit === "number" && amount > limit;
              const barColor = isOverLimit ? "bg-vibrant-orange" : "bg-[#00D1FF]";

              return (
                <div key={category}>
                  <button
                    type="button"
                    onClick={() => onStartLimitEdit(category)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[11px] font-semibold text-[#7a8f8b] inline-flex items-center gap-1">
                        {category}
                        {isOverLimit && <span className="material-symbols-outlined text-[13px] text-vibrant-orange">warning</span>}
                      </p>
                      <p className="text-[11px] font-medium text-white/70">{formatCurrency(amount)}</p>
                    </div>
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full drop-shadow-[0_0_4px_currentColor] ${barColor}`}
                        style={{ width: `${Math.max((amount / totalSpent) * 100, 4)}%` }}
                      />
                    </div>
                  </button>

                  {typeof limit === "number" && (
                    <p className="text-[10px] text-white/60 mt-1">Limit: {formatCurrency(limit)}</p>
                  )}

                  {editingLimitCategory === category && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-[10px] text-white/65">Set:</span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={limitInput}
                        onChange={(event) => setLimitInput(event.target.value)}
                        className="glass-input h-7 flex-1 px-2 text-[11px] text-[#f0f0ff]"
                      />
                      <button
                        type="button"
                        onClick={() => onSaveLimit(category)}
                        className="h-7 px-2.5 rounded-lg bg-[#00C9A7] text-white text-[11px] font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

