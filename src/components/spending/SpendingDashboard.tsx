"use client";

import { useMemo, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

interface SpendingDashboardProps {
  isBudgetOpen: boolean;
  onToggleBudget: () => void;
}

const windowLabels: Record<number, string> = {
  1: "This Month",
  3: "Last 3 Months",
  6: "Last 6 Months",
  12: "Last 12 Months",
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning 👋";
  if (hour >= 12 && hour < 17) return "Good Afternoon 👋";
  if (hour >= 17 && hour < 21) return "Good Evening 👋";
  return "Good Night 👋";
}

export default function SpendingDashboard({ isBudgetOpen, onToggleBudget }: SpendingDashboardProps) {
  const { formatCurrency } = useCurrency();
  const [editingLimitCategory, setEditingLimitCategory] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState("");

  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const dashboardWindow = useFinanceStore((state) => state.dashboardWindow);
  const getExpensesForWindow = useFinanceStore((state) => state.getExpensesForWindow);
  const getSpentForMonth = useFinanceStore((state) => state.getSpentForMonth);
  const getEffectiveSpendingBudget = useFinanceStore((state) => state.getEffectiveSpendingBudget);
  const getSpendingCarryOut = useFinanceStore((state) => state.getSpendingCarryOut);
  const categoryLimits = useFinanceStore((state) => state.categoryLimits);
  const setCategoryLimit = useFinanceStore((state) => state.setCategoryLimit);

  const windowExpenses = useMemo(
    () => getExpensesForWindow(selectedMonth, dashboardWindow),
    [dashboardWindow, getExpensesForWindow, selectedMonth],
  );

  const totalSpentInWindow = useMemo(
    () => windowExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [windowExpenses],
  );

  const selectedMonthSpent = getSpentForMonth(selectedMonth);
  const effectiveBudget = getEffectiveSpendingBudget(selectedMonth);
  const carryOut = getSpendingCarryOut(selectedMonth);

  const remaining = effectiveBudget - selectedMonthSpent;
  const isOver = remaining < 0;
  const displayAmount = Math.abs(remaining);
  const percentUsed = effectiveBudget > 0 ? Math.min((selectedMonthSpent / effectiveBudget) * 100, 100) : 0;

  const categoryTotals = useMemo(() => {
    const byCategory = windowExpenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    return Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  }, [windowExpenses]);

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
    <section className="px-4 pt-3 space-y-3">
      {/* Greeting */}
      <p className="text-base font-semibold text-white/70">{getGreeting()}</p>

      {/* Hero: Total Spent for selected month */}
      <div className="glass-card rounded-2xl p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/45 mb-1">Total Spent</p>
        <p
          className="font-extrabold leading-none mb-1"
          style={{ fontSize: "2.5rem", color: isOver ? "#F43F5E" : "#f0f0ff" }}
        >
          {formatCurrency(selectedMonthSpent)}
        </p>
        <p className={`text-sm font-semibold ${isOver ? "text-[#F43F5E]" : "text-[#10B981]"}`}>
          {formatCurrency(displayAmount)} {isOver ? "over budget" : "remaining"}
        </p>
      </div>

      {overLimitCategories.length > 0 && (
        <div className="rounded-xl border border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.10)] px-3 py-2 text-[#F43F5E] text-xs font-semibold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">warning</span>
          {overLimitCategories.length} categories over limit
        </div>
      )}

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/65">
            {windowLabels[dashboardWindow] ?? "This Month"}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-white/70">
              {formatCurrency(selectedMonthSpent)} / {formatCurrency(effectiveBudget)}
            </p>
            <button
              type="button"
              onClick={onToggleBudget}
              className={`size-6 rounded-full border text-[11px] inline-flex items-center justify-center active:scale-95 transition-transform ${
                isBudgetOpen
                  ? "border-[#4F46E5]/60 bg-[#4F46E5]/18 text-[#c7d2fe]"
                  : "border-white/20 bg-white/[0.08] text-white/70"
              }`}
              title="Budget"
            >
              <span className="material-symbols-outlined text-[14px]">tune</span>
            </button>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentUsed}%`,
              background: isOver
                ? "linear-gradient(90deg, #F43F5E, #FB7185)"
                : "linear-gradient(90deg, #4F46E5, #818CF8)",
            }}
          />
        </div>
        <div className="mb-2 flex items-center gap-1.5 text-[10px]">
          <span className="px-2 py-1 rounded-full border border-[rgba(79,70,229,0.2)] bg-[rgba(79,70,229,0.08)] text-[#a5b4fc]">
            Carry Forward: {formatCurrency(carryOut)}
          </span>
        </div>

        <h3 className="text-xs font-bold text-[#f0f0ff] mb-2.5">Spending by category</h3>

        {categoryTotals.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-2xl mb-1">📊</p>
            <p className="text-xs font-semibold text-white/60">No data yet</p>
            <p className="text-[10px] text-white/40 mt-0.5">Add expenses to see your breakdown</p>
          </div>
        ) : (
          <div className="space-y-2">
            {categoryTotals.map(([category, amount]) => {
              const limit = categoryLimits[category];
              const isOverLimit = typeof limit === "number" && amount > limit;
              const barColor = isOverLimit
                ? "bg-[#F43F5E]"
                : "bg-[#4F46E5]";

              return (
                <div key={category}>
                  <button
                    type="button"
                    onClick={() => onStartLimitEdit(category)}
                    className="w-full text-left active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[11px] font-semibold text-[#7a8f8b] inline-flex items-center gap-1">
                        {category}
                        {isOverLimit && <span className="material-symbols-outlined text-[13px] text-[#F43F5E]">warning</span>}
                      </p>
                      <p className="text-[11px] font-medium text-white/70">{formatCurrency(amount)}</p>
                    </div>
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${Math.max(totalSpentInWindow > 0 ? (amount / totalSpentInWindow) * 100 : 0, 4)}%` }}
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
                        className="h-7 px-2.5 rounded-lg bg-[#4F46E5] text-white text-[11px] font-semibold active:scale-95 transition-transform"
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
