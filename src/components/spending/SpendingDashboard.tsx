"use client";

import { useMemo } from "react";
import { useFinanceStore } from "../shared/store";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export default function SpendingDashboard() {
  const expenses = useFinanceStore((state) => state.expenses);
  const spendingBudget = useFinanceStore((state) => state.spendingBudget);

  const totalSpent = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );
  const budgetLeft = Math.max(spendingBudget - totalSpent, 0);
  const percentUsed = spendingBudget > 0 ? Math.min((totalSpent / spendingBudget) * 100, 100) : 0;

  const categoryTotals = useMemo(() => {
    const byCategory = expenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    return Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [expenses]);

  return (
    <section className="px-5 pt-4 space-y-4">
      <div className="bg-white dark:bg-[#15152a] rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Monthly Spending
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalSpent)}</p>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {formatCurrency(budgetLeft)} left
          </p>
        </div>

        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percentUsed}%` }} />
        </div>
      </div>

      <div className="bg-white dark:bg-[#15152a] rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Spending by category</h3>

        {categoryTotals.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No expenses yet.</p>
        ) : (
          <div className="space-y-3">
            {categoryTotals.map(([category, amount]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{category}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {formatCurrency(amount)}
                  </p>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-vibrant-orange"
                    style={{ width: `${Math.max((amount / totalSpent) * 100, 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
