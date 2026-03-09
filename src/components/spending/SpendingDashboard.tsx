"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalculatorHubItem } from "../calculators/CalculatorHub";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";
import { Expense } from "../shared/types";

interface SpendingDashboardProps {
  isBudgetOpen: boolean;
  onToggleBudget: () => void;
  onOpenBurnRateCalculator: () => void;
  onOpenCalculator: (item: CalculatorHubItem) => void;
}

interface CategorySummary {
  name: string;
  total: number;
  items: Expense[];
}

interface DateGroup {
  date: string;
  label: string;
  total: number;
  items: Expense[];
}

const CATEGORY_TAB_COLORS = ["#00C896", "#38BDF8", "#8B5CF6", "#F5A623", "#FF6B6B"];

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

const parseMoneyInput = (value: string) => {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const toDisplayDate = (date: string) => {
  const current = new Date();
  const value = new Date(`${date}T00:00:00`);
  const today = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const target = new Date(value.getFullYear(), value.getMonth(), value.getDate());

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function SpendingDashboard({
  isBudgetOpen,
  onToggleBudget,
  onOpenBurnRateCalculator,
  onOpenCalculator,
}: SpendingDashboardProps) {
  const { formatCurrency } = useCurrency();
  const [isIncomeSheetOpen, setIsIncomeSheetOpen] = useState(false);
  const [incomeSalaryInput, setIncomeSalaryInput] = useState("");
  const [incomeOtherInput, setIncomeOtherInput] = useState("");
  const [activeCalc, setActiveCalc] = useState("burn");
  const [animatedSpent, setAnimatedSpent] = useState(0);
  const [animatedPct, setAnimatedPct] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const [heroScrollDepth, setHeroScrollDepth] = useState(0);
  const [incomeFlash, setIncomeFlash] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedDateKey, setExpandedDateKey] = useState<string | null>(null);

  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const expenses = useFinanceStore((state) => state.expenses);
  const getSpentForMonth = useFinanceStore((state) => state.getSpentForMonth);
  const getEffectiveSpendingBudget = useFinanceStore((state) => state.getEffectiveSpendingBudget);
  const getMonthlyIncome = useFinanceStore((state) => state.getMonthlyIncome);
  const setMonthlyIncome = useFinanceStore((state) => state.setMonthlyIncome);

  const monthIncome = getMonthlyIncome(selectedMonth);
  const monthlyIncomeTotal = (monthIncome?.salary ?? 0) + (monthIncome?.otherIncome ?? 0);

  const monthlyExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.slice(0, 7) === selectedMonth),
    [expenses, selectedMonth],
  );

  const selectedMonthSpent = getSpentForMonth(selectedMonth);
  const effectiveBudget = getEffectiveSpendingBudget(selectedMonth);

  const budgetPercentRaw = useMemo(
    () => (effectiveBudget > 0 ? (selectedMonthSpent / effectiveBudget) * 100 : 0),
    [effectiveBudget, selectedMonthSpent],
  );

  const overBudgetAmount = Math.max(selectedMonthSpent - effectiveBudget, 0);
  const budgetLeftAmount = Math.max(effectiveBudget - selectedMonthSpent, 0);
  const isOverBudget = overBudgetAmount > 0;

  const categorySummaries = useMemo(() => {
    const grouped = monthlyExpenses.reduce<Record<string, Expense[]>>((acc, expense) => {
      const key = expense.category?.trim() || "Other";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(expense);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, items]) => ({
        name,
        items: [...items].sort((a, b) => b.date.localeCompare(a.date)),
        total: items.reduce((sum, row) => sum + row.amount, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [monthlyExpenses]);

  const categoryColorByName = useMemo(() => {
    const colorMap: Record<string, string> = {};
    categorySummaries.forEach((row, index) => {
      colorMap[row.name] = CATEGORY_TAB_COLORS[index % CATEGORY_TAB_COLORS.length];
    });
    return colorMap;
  }, [categorySummaries]);

  const resolvedActiveCategory = useMemo(() => {
    if (categorySummaries.length === 0) {
      return null;
    }
    if (activeCategory && categorySummaries.some((row) => row.name === activeCategory)) {
      return activeCategory;
    }
    return categorySummaries[0].name;
  }, [activeCategory, categorySummaries]);

  const activeCategorySummary: CategorySummary | null = useMemo(() => {
    if (!resolvedActiveCategory) return null;
    return categorySummaries.find((row) => row.name === resolvedActiveCategory) ?? null;
  }, [categorySummaries, resolvedActiveCategory]);

  const activeCategoryDateGroups: DateGroup[] = useMemo(() => {
    if (!activeCategorySummary) {
      return [];
    }

    const grouped = activeCategorySummary.items.reduce<Record<string, DateGroup>>((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = {
          date: item.date,
          label: toDisplayDate(item.date),
          total: 0,
          items: [],
        };
      }

      acc[item.date].items.push(item);
      acc[item.date].total += item.amount;
      return acc;
    }, {});

    return Object.values(grouped)
      .map((row) => ({
        ...row,
        items: [...row.items].sort((a, b) => b.date.localeCompare(a.date)),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [activeCategorySummary]);

  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const targetSpent = selectedMonthSpent;
    const targetPct = Math.max(budgetPercentRaw, 0);
    const start = performance.now();
    const duration = 1000;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutExpo(progress);
      setAnimatedSpent(targetSpent * eased);
      setAnimatedPct(targetPct * eased);
      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(step);
      }
    };

    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = window.requestAnimationFrame(step);

    const widthTimer = window.setTimeout(() => {
      setProgressWidth(Math.min(Math.max(targetPct, 0), 140));
    }, 300);

    return () => {
      window.clearTimeout(widthTimer);
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [budgetPercentRaw, selectedMonthSpent]);

  useEffect(() => {
    const onScroll = () => {
      const depth = Math.max(0, Math.min(window.scrollY / 140, 1));
      setHeroScrollDepth(depth);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openIncomeSheet = () => {
    setIncomeFlash(true);
    window.setTimeout(() => setIncomeFlash(false), 220);
    setIncomeSalaryInput(String(monthIncome?.salary ?? ""));
    setIncomeOtherInput(String(monthIncome?.otherIncome ?? ""));
    setIsIncomeSheetOpen(true);
  };

  const saveIncome = () => {
    const salary = parseMoneyInput(incomeSalaryInput);
    const other = parseMoneyInput(incomeOtherInput);
    if (!Number.isFinite(salary) || salary < 0 || !Number.isFinite(other) || other < 0) {
      return;
    }
    setMonthlyIncome(selectedMonth, salary, other);
    setIsIncomeSheetOpen(false);
  };

  const calcChips = [
    {
      id: "burn",
      icon: "\uD83D\uDD25",
      name: "Burn Rate",
      desc: "Days left",
      tone: "rgba(0,229,160,0.22)",
      run: () => onOpenBurnRateCalculator(),
    },
    {
      id: "emi",
      icon: "\uD83D\uDCCA",
      name: "EMI",
      desc: "Loan monthly",
      tone: "rgba(56,189,248,0.22)",
      run: () =>
        onOpenCalculator({
          id: "emi",
          icon: "bar_chart",
          title: "EMI",
          description: "Monthly loan payment",
          calculatorType: "lending",
        }),
    },
    {
      id: "sip",
      icon: "\uD83D\uDCC8",
      name: "SIP",
      desc: "Fund growth",
      tone: "rgba(245,166,35,0.22)",
      run: () =>
        onOpenCalculator({
          id: "sip",
          icon: "trending_up",
          title: "SIP",
          description: "Mutual fund returns",
          calculatorType: "sip",
        }),
    },
    {
      id: "goal",
      icon: "\uD83C\uDFAF",
      name: "Goal",
      desc: "Monthly save",
      tone: "rgba(0,200,150,0.2)",
      run: () =>
        onOpenCalculator({
          id: "goal",
          icon: "my_location",
          title: "Goal",
          description: "Monthly savings needed",
          calculatorType: "goal",
        }),
    },
    {
      id: "affordability",
      icon: "\uD83C\uDFE0",
      name: "Affordability",
      desc: "Max loan",
      tone: "rgba(56,189,248,0.2)",
      run: () =>
        onOpenCalculator({
          id: "affordability",
          icon: "home",
          title: "Affordability",
          description: "Max loan you can take",
          calculatorType: "lending",
        }),
    },
    {
      id: "tax",
      icon: "\uD83D\uDCB0",
      name: "Tax",
      desc: "FY 2025-26",
      tone: "rgba(245,166,35,0.2)",
      run: () =>
        onOpenCalculator({
          id: "tax",
          icon: "account_balance",
          title: "Tax",
          description: "FY 2025-26 tax estimate",
          calculatorType: "tax",
        }),
    },
    {
      id: "freedom",
      icon: "\uD83D\uDD4A\uFE0F",
      name: "Freedom",
      desc: "Target corpus",
      tone: "rgba(139,92,246,0.2)",
      run: () =>
        onOpenCalculator({
          id: "freedom",
          icon: "flutter_dash",
          title: "Freedom",
          description: "Financial freedom number",
          calculatorType: "freedom",
        }),
    },
  ];

  return (
    <section className="px-4 pt-3 space-y-3 font-poisa-body text-[#e5e7eb]">
      <div className="poisa-fade-up" style={{ animationDelay: "100ms" }}>
        <article
          className="relative overflow-hidden rounded-[20px] border border-[#2A3345] bg-[#161B22] p-4"
          style={{
            transform: `scale(${1 - heroScrollDepth * 0.03})`,
            opacity: 1 - heroScrollDepth * 0.15,
            transition: "transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div className="pointer-events-none absolute -top-12 -right-10 size-48 rounded-full bg-[#00C896]/16 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 top-16 size-36 rounded-full bg-[#38BDF8]/14 blur-2xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[1.2px] text-[#8e93ad]">Total Spent</p>
              <p className="mt-1 text-[40px] leading-none font-poisa-heading font-extrabold text-[#f4f6ff]">
                {formatCurrency(animatedSpent)}
              </p>
              <span
                className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  isOverBudget
                    ? "poisa-danger-pulse border-[#ff5b5b]/45 bg-[#ff5b5b]/14 text-[#ff8f8f]"
                    : "border-[#00C896]/45 bg-[#00C896]/14 text-[#7af6cd]"
                }`}
              >
                {isOverBudget ? `${formatCurrency(overBudgetAmount)} over budget` : `${formatCurrency(budgetLeftAmount)} left`}
              </span>
            </div>

            <div className="shrink-0 text-center">
              <button
                type="button"
                onClick={openIncomeSheet}
                className={`poisa-income-orb poisa-pressable ${incomeFlash ? "poisa-income-orb-flash" : ""}`}
              >
                <span className="material-symbols-outlined relative z-10 text-[26px]">add</span>
              </button>
              <p className="mt-1 text-[11px] leading-tight text-[#aab1c9]">
                Add
                <br />
                Income
              </p>
              {monthlyIncomeTotal > 0 && (
                <p className="mt-1 text-[10px] text-[#00e5a0]">{formatCurrency(monthlyIncomeTotal)}</p>
              )}
            </div>
          </div>

          <div className="relative mt-4">
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-[#8e93ad]">
              <span className="truncate">Budget {formatCurrency(effectiveBudget)}</span>
              <div className="inline-flex items-center gap-2">
                <span>{animatedPct.toFixed(0)}%</span>
                <button
                  type="button"
                  onClick={onToggleBudget}
                  className="poisa-pressable h-6 rounded-full border border-[#2A3345] bg-[#1C2230] px-2.5 text-[10px] font-semibold text-[#c5cbe0]"
                >
                  Set Budget
                </button>
              </div>
            </div>
            <div className="h-2 rounded-full bg-[#22273b] overflow-visible">
              <div
                className="poisa-progress-shimmer h-2 rounded-full"
                style={{
                  width: `${progressWidth}%`,
                  background: budgetPercentRaw > 100
                    ? "linear-gradient(90deg, #ff5b5b, #ffb347)"
                    : "linear-gradient(90deg, #00C896, #38BDF8)",
                  transition: "width 900ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
          </div>
        </article>
      </div>

      <div className="poisa-fade-up" style={{ animationDelay: "160ms" }}>
        <article className="rounded-[20px] border border-[#2A3345] bg-[#161B22] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-poisa-heading text-base font-bold text-[#f3f5ff]">Spending by Category</h3>
            <span className="text-[11px] text-[#8e93ad]">Tap a category</span>
          </div>

          {categorySummaries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#2A3345] bg-[#0D1117] px-3 py-6 text-center text-sm text-[#7A8599]">
              No category spending this month.
            </div>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {categorySummaries.map((row) => {
                  const isActive = row.name === resolvedActiveCategory;
                  const color = categoryColorByName[row.name] ?? "#00C896";
                  return (
                    <button
                      key={row.name}
                      type="button"
                      onClick={() => {
                        setActiveCategory(row.name);
                        setExpandedDateKey(null);
                      }}
                      className="poisa-pressable shrink-0 rounded-xl border px-3 py-2 text-left"
                      style={{
                        borderColor: isActive ? color : "#2A3345",
                        backgroundColor: isActive ? `${color}1f` : "#1C2230",
                      }}
                    >
                      <p className="text-[11px] font-semibold" style={{ color: isActive ? color : "#cfd5e5" }}>
                        {row.name}
                      </p>
                      <p className="text-[10px] text-[#8e93ad]">{formatCurrency(row.total)}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 rounded-xl border border-[#2A3345] bg-[#1C2230] p-2.5">
                {!activeCategorySummary ? (
                  <p className="text-sm text-[#7A8599]">No entries for this category.</p>
                ) : activeCategoryDateGroups.length === 0 ? (
                  <p className="text-sm text-[#7A8599]">No entries for this category.</p>
                ) : (
                  <div className="space-y-2">
                    {activeCategoryDateGroups.map((group) => {
                      const isExpanded = expandedDateKey === group.date;
                      return (
                        <div key={group.date} className="rounded-lg border border-[#2A3345] bg-[#0D1117]">
                          <button
                            type="button"
                            onClick={() => setExpandedDateKey((current) => (current === group.date ? null : group.date))}
                            className="poisa-pressable flex w-full items-center justify-between gap-2 px-3 py-2"
                          >
                            <div className="text-left">
                              <p className="text-xs font-semibold text-[#e7ebf5]">{group.label}</p>
                              <p className="text-[10px] text-[#7A8599]">{group.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-[#00C896]">{formatCurrency(group.total)}</p>
                              <p className="text-[10px] text-[#7A8599]">{group.items.length} tx</p>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-[#2A3345] px-3 py-2 space-y-1.5">
                              {group.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-xs">
                                  <span className="truncate text-[#cfd5e5]">{item.name}</span>
                                  <span className="shrink-0 font-semibold text-[#FF6B6B]">-{formatCurrency(item.amount)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </article>
      </div>

      <div className="poisa-fade-up" style={{ animationDelay: "220ms" }}>
        <article className="rounded-[20px] border border-[#2A3345] bg-[#161B22] p-4">
          <h3 className="font-poisa-heading text-base font-bold text-[#f3f5ff]">Calculators</h3>
          <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {calcChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setActiveCalc(chip.id);
                  chip.run();
                }}
                className={`poisa-pressable shrink-0 w-[132px] rounded-2xl border bg-[#1C2230] p-2.5 text-left ${
                  activeCalc === chip.id ? "border-[#00C896]" : "border-[#2A3345]"
                }`}
              >
                <span
                  className="mb-2 inline-flex size-8 items-center justify-center rounded-lg text-base"
                  style={{ background: chip.tone }}
                >
                  {chip.icon}
                </span>
                <p className="font-poisa-heading text-sm font-bold text-[#f5f7ff]">{chip.name}</p>
                <p className="text-[11px] text-[#8e93ad]">{chip.desc}</p>
              </button>
            ))}
          </div>
        </article>
      </div>

      {isBudgetOpen && <div className="sr-only">Budget popup open</div>}

      {isIncomeSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setIsIncomeSheetOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#2A3345] bg-[#161B22] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#f3f5ff]">My Income</h3>
              <button
                type="button"
                onClick={() => setIsIncomeSheetOpen(false)}
                className="size-7 rounded-full border border-white/15 bg-white/[0.06] text-white/80 inline-flex items-center justify-center"
                aria-label="Close income popup"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <label className="block">
                <p className="text-xs poisa-muted mb-1">Monthly Salary (INR)</p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={incomeSalaryInput}
                  onChange={(event) => setIncomeSalaryInput(event.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 50000"
                  className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]"
                />
              </label>
              <label className="block">
                <p className="text-xs poisa-muted mb-1">Other Monthly Income (INR)</p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={incomeOtherInput}
                  onChange={(event) => setIncomeOtherInput(event.target.value)}
                  inputMode="decimal"
                  placeholder="optional"
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
          </div>
        </div>
      )}
    </section>
  );
}
