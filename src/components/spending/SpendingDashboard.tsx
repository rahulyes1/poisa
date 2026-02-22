"use client";

import { useMemo, useState } from "react";
import BottomSheet from "../forms/BottomSheet";
import CalculatorHub, { CalculatorHubItem } from "../calculators/CalculatorHub";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

interface SpendingDashboardProps {
  isBudgetOpen: boolean;
  onToggleBudget: () => void;
  onOpenBurnRateCalculator: () => void;
  onOpenCalculator: (item: CalculatorHubItem) => void;
}

const windowLabels: Record<number, string> = {
  1: "This Month",
  3: "Last 3 Months",
  6: "Last 6 Months",
  12: "Last 12 Months",
};

function getCategoryBarColor(category: string): string {
  const key = category.toLowerCase().trim();
  if (key.includes("rent")) return "#4F46E5";
  if (key.includes("electric") || key.includes("utilit")) return "#F43F5E";
  if (key.includes("subscription") || key.includes("ott") || key.includes("stream")) return "#F59E0B";
  if (key.includes("bill")) return "#FF8C42";
  if (key.includes("fuel")) return "#F59E0B";
  if (key.includes("grocer")) return "#00C9A7";
  return "#4F46E5";
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

const toPercent = (value: number, total: number) => {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.max((value / total) * 100, 0);
};

export default function SpendingDashboard({
  isBudgetOpen,
  onToggleBudget,
  onOpenBurnRateCalculator,
  onOpenCalculator,
}: SpendingDashboardProps) {
  const { formatCurrency } = useCurrency();
  const [editingLimitCategory, setEditingLimitCategory] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState("");
  const [selectedCalculatorId, setSelectedCalculatorId] = useState<string>("burn");
  const [isIncomeSheetOpen, setIsIncomeSheetOpen] = useState(false);
  const [incomeSalaryInput, setIncomeSalaryInput] = useState("");
  const [incomeOtherInput, setIncomeOtherInput] = useState("");

  const expenses = useFinanceStore((state) => state.expenses);
  const savingGoals = useFinanceStore((state) => state.savingGoals);
  const investments = useFinanceStore((state) => state.investments);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const dashboardWindow = useFinanceStore((state) => state.dashboardWindow);
  const getWindowMonths = useFinanceStore((state) => state.getWindowMonths);
  const getSpentForMonth = useFinanceStore((state) => state.getSpentForMonth);
  const getEffectiveSpendingBudget = useFinanceStore((state) => state.getEffectiveSpendingBudget);
  const getSpendingCarryOut = useFinanceStore((state) => state.getSpendingCarryOut);
  const categoryLimits = useFinanceStore((state) => state.categoryLimits);
  const setCategoryLimit = useFinanceStore((state) => state.setCategoryLimit);
  const getMonthlyIncome = useFinanceStore((state) => state.getMonthlyIncome);
  const setMonthlyIncome = useFinanceStore((state) => state.setMonthlyIncome);
  const totalMonthlyEmiDue = useFinanceStore((state) => state.totalMonthlyEmiDue);

  const monthIncome = getMonthlyIncome(selectedMonth);
  const monthlyIncomeTotal = (monthIncome?.salary ?? 0) + (monthIncome?.otherIncome ?? 0);

  const windowExpenses = useMemo(() => {
    const months = new Set(getWindowMonths(selectedMonth, dashboardWindow));
    return expenses.filter((expense) => months.has(expense.date.slice(0, 7)));
  }, [dashboardWindow, expenses, getWindowMonths, selectedMonth]);

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

  const investedThisMonth = useMemo(() => {
    const goalsMonthTotal = savingGoals
      .filter((goal) => goal.date.slice(0, 7) === selectedMonth)
      .reduce((sum, goal) => sum + goal.savedAmount, 0);
    const investmentsMonthTotal = investments
      .filter((item) => item.date.slice(0, 7) === selectedMonth)
      .reduce((sum, item) => sum + item.amount, 0);
    return goalsMonthTotal + investmentsMonthTotal;
  }, [investments, savingGoals, selectedMonth]);

  const emiThisMonth = totalMonthlyEmiDue();
  const remainingIncome = monthlyIncomeTotal - selectedMonthSpent - investedThisMonth - emiThisMonth;

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

  const openIncomeSheet = () => {
    setIncomeSalaryInput(String(monthIncome?.salary ?? ""));
    setIncomeOtherInput(String(monthIncome?.otherIncome ?? ""));
    setIsIncomeSheetOpen(true);
  };

  const saveIncome = () => {
    const salary = Number(incomeSalaryInput || 0);
    const other = Number(incomeOtherInput || 0);
    if (!Number.isFinite(salary) || salary < 0 || !Number.isFinite(other) || other < 0) {
      return;
    }
    setMonthlyIncome(selectedMonth, salary, other);
    setIsIncomeSheetOpen(false);
  };

  return (
    <section className="px-4 pt-3 space-y-3">
      <p className="text-base font-semibold text-white/70">{getGreeting()}</p>

      <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4">
        {!monthIncome ? (
          <>
            <p className="text-sm font-semibold text-[#E8EDF5]">Add your monthly salary to unlock full budgeting</p>
            <button
              type="button"
              onClick={openIncomeSheet}
              className="mt-3 h-10 w-full rounded-xl bg-[#00C896] text-[#06221A] text-sm font-semibold"
            >
              Add Income -&gt;
            </button>
          </>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#7A8599] font-semibold">
                {new Date(`${selectedMonth}-01`).toLocaleDateString("en-US", { month: "long" }).toUpperCase()} INCOME
              </p>
              <button
                type="button"
                onClick={openIncomeSheet}
                className="size-7 rounded-lg border border-[#2A3345] bg-[#0D1117] text-[#7A8599] inline-flex items-center justify-center"
                title="Edit income"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
              </button>
            </div>
            <p className="text-3xl font-black text-[#E8EDF5]">{formatCurrency(monthlyIncomeTotal)}</p>
            <div className="mt-3 space-y-2.5">
              {[
                { label: "Spent", amount: selectedMonthSpent, color: "#FF6B6B" },
                { label: "Invested", amount: investedThisMonth, color: "#00C896" },
                { label: "EMI", amount: emiThisMonth, color: "#F5A623" },
                { label: "Remaining", amount: remainingIncome, color: remainingIncome < 0 ? "#FF6B6B" : "#7C6FF7" },
              ].map((row) => {
                const pct = Math.min(toPercent(Math.abs(row.amount), monthlyIncomeTotal), 100);
                return (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#7A8599]">{row.label}</span>
                      <span className="font-semibold text-[#E8EDF5]">{formatCurrency(row.amount)}</span>
                      <span className="text-[#7A8599]">{monthlyIncomeTotal > 0 ? `${pct.toFixed(1)}%` : "--"}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-[#2A3345]">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: row.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {remainingIncome < 0 && (
              <p className="mt-2 text-xs font-semibold text-[#FF6B6B]">Over Income</p>
            )}
          </>
        )}
      </div>

      <div className="glass-card rounded-2xl p-4">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[1.2px] text-white/45">Total Spent</p>
        <p className="leading-none mb-1 text-[2.5rem] font-extrabold text-[#f0f0ff]">{formatCurrency(selectedMonthSpent)}</p>
        <p className="text-[13px] font-semibold inline-flex items-center gap-1" style={{ color: isOver ? "#F43F5E" : "#00C9A7" }}>
          {isOver && <span className="material-symbols-outlined text-[14px]">warning</span>}
          <span>{formatCurrency(displayAmount)} {isOver ? "over budget" : "remaining"}</span>
        </p>
      </div>

      {overLimitCategories.length > 0 && (
        <div className="rounded-xl border border-[rgba(255,107,53,0.35)] bg-[rgba(255,107,53,0.10)] px-3 py-2 text-[#F43F5E] text-xs font-semibold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">warning</span>
          {overLimitCategories.length} categories over limit
        </div>
      )}

      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/65">
            {windowLabels[dashboardWindow] ?? "This Month"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleBudget}
              className={`h-7 px-2.5 rounded-full border text-[10px] inline-flex items-center gap-1 active:scale-95 transition-transform ${
                isBudgetOpen
                  ? "border-[#00C896]/70 bg-[#00C896]/18 text-[#8bffea]"
                  : "border-[#2A3345] bg-[#0D1117] text-[#9deedf]"
              }`}
              title="Set Budget"
            >
              <span className="material-symbols-outlined text-[12px]">tune</span>
              <span>Set Budget</span>
            </button>
            <button
              type="button"
              onClick={onOpenBurnRateCalculator}
              className="h-7 w-7 rounded-full border border-[#00C896]/50 bg-[rgba(0,200,150,0.12)] text-[#7af6cd] inline-flex items-center justify-center active:scale-95 transition-transform"
              title="Budget burn calculator"
              aria-label="Open budget burn calculator"
            >
              <span className="material-symbols-outlined text-[13px]">calculate</span>
            </button>
          </div>
        </div>

        <p className="mt-1 text-[12px] text-white/70">
          {formatCurrency(selectedMonthSpent)} / {formatCurrency(effectiveBudget)}
        </p>

        <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-[#2A3345]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentUsed}%`,
              background: isOver
                ? "linear-gradient(90deg, #F43F5E, #FF8C42)"
                : "linear-gradient(90deg, #4F46E5, #00C9A7)",
            }}
          />
        </div>

        <div className="mt-2">
          <span className="inline-flex items-center rounded-full border border-[rgba(79,70,229,0.2)] bg-[rgba(79,70,229,0.12)] px-2 py-0.5 text-[11px] text-[#4F46E5]">
            Carry Forward: {formatCurrency(carryOut)}
          </span>
        </div>

        <h3 className="mt-3 text-xs font-bold text-[#f0f0ff]">Spending by category</h3>

        {categoryTotals.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-2xl mb-1">No Data</p>
            <p className="text-xs font-semibold text-white/60">No data yet</p>
            <p className="text-[10px] text-white/40 mt-0.5">Add expenses to see your breakdown</p>
          </div>
        ) : (
          <div className="mt-1 space-y-1">
            {categoryTotals.map(([category, amount]) => {
              const limit = categoryLimits[category];
              const isOverLimit = typeof limit === "number" && amount > limit;
              const barColor = isOverLimit ? "#F43F5E" : getCategoryBarColor(category);

              return (
                <div key={category} className="py-3">
                  <button
                    type="button"
                    onClick={() => onStartLimitEdit(category)}
                    className="w-full text-left active:scale-[0.99] transition-transform"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-[13px] text-[#7A8599] inline-flex items-center gap-1">
                        {category}
                        {isOverLimit && <span className="material-symbols-outlined text-[13px] text-[#F43F5E]">warning</span>}
                      </p>
                      <p className="text-[13px] text-[#E8EDF5] font-semibold">{formatCurrency(amount)}</p>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden bg-[#2A3345]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(totalSpentInWindow > 0 ? (amount / totalSpentInWindow) * 100 : 0, 4)}%`,
                          backgroundColor: barColor,
                        }}
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
                        className="h-7 px-2.5 rounded-lg bg-[#00C9A7] text-[#07241f] text-[11px] font-semibold active:scale-95 transition-transform"
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

      <CalculatorHub
        selectedId={selectedCalculatorId}
        onSelect={(item) => {
          setSelectedCalculatorId(item.id);
          onOpenCalculator(item);
        }}
      />

      <BottomSheet isOpen={isIncomeSheetOpen} title="My Income" onClose={() => setIsIncomeSheetOpen(false)}>
        <div className="space-y-3">
          <label className="block">
            <p className="text-xs poisa-muted mb-1">Monthly Salary (INR)</p>
            <input
              value={incomeSalaryInput}
              onChange={(event) => setIncomeSalaryInput(event.target.value)}
              inputMode="decimal"
              className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]"
            />
          </label>
          <label className="block">
            <p className="text-xs poisa-muted mb-1">Other Monthly Income (INR)</p>
            <input
              value={incomeOtherInput}
              onChange={(event) => setIncomeOtherInput(event.target.value)}
              inputMode="decimal"
              className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]"
            />
          </label>
          <button
            type="button"
            onClick={saveIncome}
            className="h-11 w-full rounded-xl bg-[#00C896] text-[#06221a] font-semibold"
          >
            Save
          </button>
        </div>
      </BottomSheet>
    </section>
  );
}

