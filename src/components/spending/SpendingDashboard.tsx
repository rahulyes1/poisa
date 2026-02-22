"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BottomSheet from "../forms/BottomSheet";
import { CalculatorHubItem } from "../calculators/CalculatorHub";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

type BucketId = "Other" | "Food" | "Bills" | "Fuel";

interface CategoryBucket {
  id: BucketId;
  name: string;
  color: string;
  amount: number;
  emoji: string;
}

interface SpendingDashboardProps {
  isBudgetOpen: boolean;
  onToggleBudget: () => void;
  onOpenBurnRateCalculator: () => void;
  onOpenCalculator: (item: CalculatorHubItem) => void;
}

const BASE_BUCKETS: CategoryBucket[] = [
  { id: "Other", name: "Other", color: "#6c63ff", amount: 0, emoji: "\uD83E\uDDE9" },
  { id: "Food", name: "Food", color: "#00e5a0", amount: 0, emoji: "\uD83C\uDF5C" },
  { id: "Bills", name: "Bills", color: "#ffb347", amount: 0, emoji: "\uD83E\uDDFE" },
  { id: "Fuel", name: "Fuel", color: "#ff5b5b", amount: 0, emoji: "\u26FD" },
];

const DONUT_R = 50;
const DONUT_C = 2 * Math.PI * DONUT_R;

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

const parseMoneyInput = (value: string) => {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const categorizeExpense = (category: string): BucketId => {
  const key = category.toLowerCase();
  if (key.includes("fuel") || key.includes("petrol") || key.includes("diesel")) return "Fuel";
  if (
    key.includes("bill") ||
    key.includes("rent") ||
    key.includes("electric") ||
    key.includes("utilit") ||
    key.includes("recharge")
  ) {
    return "Bills";
  }
  if (
    key.includes("food") ||
    key.includes("eat") ||
    key.includes("dining") ||
    key.includes("restaurant") ||
    key.includes("grocer")
  ) {
    return "Food";
  }
  return "Other";
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeSegment, setActiveSegment] = useState<BucketId | null>(null);
  const [activeCalc, setActiveCalc] = useState("burn");
  const [animatedSpent, setAnimatedSpent] = useState(0);
  const [animatedPct, setAnimatedPct] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const [donutReady, setDonutReady] = useState(false);
  const [heroScrollDepth, setHeroScrollDepth] = useState(0);
  const [incomeFlash, setIncomeFlash] = useState(false);

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
  const overBudgetPercent = Math.max(budgetPercentRaw - 100, 0);

  const categoryBuckets = useMemo(() => {
    const map = new Map<BucketId, CategoryBucket>();
    for (const base of BASE_BUCKETS) {
      map.set(base.id, { ...base, amount: 0 });
    }

    for (const expense of monthlyExpenses) {
      const bucketId = categorizeExpense(expense.category);
      const existing = map.get(bucketId);
      if (existing) {
        existing.amount += expense.amount;
      }
    }

    return BASE_BUCKETS.map((base) => map.get(base.id) ?? base);
  }, [monthlyExpenses]);

  const totalCategorySpend = useMemo(
    () => categoryBuckets.reduce((sum, row) => sum + row.amount, 0),
    [categoryBuckets],
  );

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

    const donutTimer = window.setTimeout(() => setDonutReady(true), 60);

    return () => {
      window.clearTimeout(widthTimer);
      window.clearTimeout(donutTimer);
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

  const donutSegments = useMemo(
    () =>
      categoryBuckets.map((segment, index) => {
        const length = totalCategorySpend > 0 ? (segment.amount / totalCategorySpend) * DONUT_C : 0;
        const offset = categoryBuckets
          .slice(0, index)
          .reduce(
            (sum, row) =>
              sum + (totalCategorySpend > 0 ? (row.amount / totalCategorySpend) * DONUT_C : 0),
            0,
          );
        return { ...segment, length, offset };
      }),
    [categoryBuckets, totalCategorySpend],
  );

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
      tone: "rgba(108,99,255,0.22)",
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
      tone: "rgba(255,179,71,0.22)",
      run: () =>
        onOpenCalculator({
          id: "sip",
          icon: "trending_up",
          title: "SIP",
          description: "Mutual fund returns",
          calculatorType: "sip",
        }),
    },
  ];

  return (
    <section className="px-4 pt-3 space-y-3 font-poisa-body text-[#e5e7eb]">
      <div className="poisa-fade-up" style={{ animationDelay: "100ms" }}>
        <article
          className="relative overflow-hidden rounded-[20px] border border-[#2b2f46] bg-[#161826] p-4"
          style={{
            transform: `scale(${1 - heroScrollDepth * 0.03})`,
            opacity: 1 - heroScrollDepth * 0.15,
            transition: "transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div className="pointer-events-none absolute -top-12 -right-10 size-48 rounded-full bg-[#6c63ff]/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 top-16 size-36 rounded-full bg-[#6c63ff]/14 blur-2xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[1.2px] text-[#8e93ad]">Total Spent</p>
              <p className="mt-1 text-[40px] leading-none font-poisa-heading font-extrabold text-[#f4f6ff]">
                {formatCurrency(animatedSpent)}
              </p>
              <span className="poisa-danger-pulse mt-2 inline-flex rounded-full border border-[#ff5b5b]/45 bg-[#ff5b5b]/14 px-2.5 py-1 text-[11px] font-semibold text-[#ff8f8f]">
                {overBudgetAmount > 0 ? `${formatCurrency(overBudgetAmount)} over budget` : "On budget"}
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
                  className="poisa-pressable h-6 rounded-full border border-[#2b2f46] bg-[#1e2133] px-2.5 text-[10px] font-semibold text-[#c5cbe0]"
                >
                  Set Budget
                </button>
              </div>
            </div>
            <div className="h-2 rounded-full bg-[#22273b] overflow-visible">
              <div
                className={`poisa-progress-shimmer h-2 rounded-full ${budgetPercentRaw > 100 ? "" : ""}`}
                style={{
                  width: `${progressWidth}%`,
                  background: budgetPercentRaw > 100
                    ? "linear-gradient(90deg, #ff5b5b, #ffb347)"
                    : "linear-gradient(90deg, #6c63ff, #00e5a0)",
                  transition: "width 900ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
          </div>
        </article>
      </div>

      <div className="poisa-fade-up" style={{ animationDelay: "160ms" }}>
        <article className="rounded-[20px] border border-[#2b2f46] bg-[#161826] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-poisa-heading text-base font-bold text-[#f3f5ff]">Spending by Category</h3>
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              className="poisa-pressable inline-flex items-center gap-1 text-xs text-[#a7acc3]"
            >
              <span>Details</span>
              <span
                className="material-symbols-outlined text-[16px]"
                style={{
                  transform: `rotate(${detailsOpen ? 180 : 0}deg)`,
                  transition: "transform 320ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                expand_more
              </span>
            </button>
          </div>

          <div className="grid grid-cols-[148px,1fr] gap-3 items-center">
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              className="poisa-pressable inline-flex justify-center"
            >
              <svg width="132" height="132" viewBox="0 0 132 132">
                <g transform="translate(6 6)">
                  <circle cx="60" cy="60" r={DONUT_R} fill="none" stroke="#252a40" strokeWidth="18" />
                  <g transform="rotate(-90 60 60)">
                    {donutSegments.map((segment, index) => {
                      const isActive = activeSegment === null || activeSegment === segment.id;
                      return (
                        <circle
                          key={segment.id}
                          cx="60"
                          cy="60"
                          r={DONUT_R}
                          fill="none"
                          stroke={segment.color}
                          strokeWidth="18"
                          strokeLinecap="round"
                          strokeDasharray={`${segment.length} ${DONUT_C}`}
                          strokeDashoffset={donutReady ? -segment.offset : DONUT_C - segment.offset}
                          onPointerEnter={() => setActiveSegment(segment.id)}
                          onPointerLeave={() => setActiveSegment(null)}
                          onPointerDown={() => setActiveSegment(segment.id)}
                          style={{
                            opacity: isActive ? 1 : 0.5,
                            transform: isActive ? "scale(1.04)" : "scale(1)",
                            transformOrigin: "60px 60px",
                            transition:
                              `stroke-dashoffset 800ms cubic-bezier(0.4, 0, 0.2, 1) ${index * 80}ms, ` +
                              "opacity 180ms cubic-bezier(0.4, 0, 0.2, 1), transform 180ms cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                      );
                    })}
                  </g>
                  <text
                    x="60"
                    y="58"
                    textAnchor="middle"
                    fill="#f4f6ff"
                    className="font-poisa-heading"
                    style={{ fontSize: "18px", fontWeight: 800 }}
                  >
                    {Math.round(overBudgetPercent)}%
                  </text>
                  <text x="60" y="74" textAnchor="middle" fill="#8e93ad" style={{ fontSize: "10px" }}>
                    over budget
                  </text>
                </g>
              </svg>
            </button>

            <div className="space-y-2">
              {categoryBuckets.map((row) => (
                <div key={row.id} className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 text-[#aab1c9]">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                    {row.name}
                  </span>
                  <span className="font-poisa-heading text-sm font-bold text-[#f4f6ff]">{formatCurrency(row.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="overflow-hidden"
            style={{
              maxHeight: detailsOpen ? `${categoryBuckets.length * 74}px` : "0px",
              opacity: detailsOpen ? 1 : 0,
              transitionProperty: "max-height, opacity",
              transitionDuration: detailsOpen ? "420ms" : "280ms",
              transitionTimingFunction: detailsOpen
                ? "cubic-bezier(0.34, 1.56, 0.64, 1)"
                : "cubic-bezier(0.4, 0, 1, 1)",
            }}
          >
            <div className="pt-3 space-y-2">
              {categoryBuckets.map((row, index) => {
                const pct = totalCategorySpend > 0 ? (row.amount / totalCategorySpend) * 100 : 0;
                return (
                  <div
                    key={`${row.id}-detail`}
                    className="rounded-xl border border-[#2b2f46] bg-[#1e2133] px-3 py-2"
                    style={{
                      transform: detailsOpen ? "translateX(0)" : "translateX(-10px)",
                      opacity: detailsOpen ? 1 : 0,
                      transition:
                        `transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 40}ms, ` +
                        `opacity 260ms cubic-bezier(0.4, 0, 0.2, 1) ${index * 40}ms`,
                    }}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-sm text-[#d9def0]">
                        <span>{row.emoji}</span>
                        <span>{row.name}</span>
                      </span>
                      <span className="font-poisa-heading text-sm font-bold text-[#f3f5ff]">{formatCurrency(row.amount)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#2a2f46]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(pct, 3)}%`,
                          backgroundColor: row.color,
                          transition: "width 420ms cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
      </div>

      <div className="poisa-fade-up" style={{ animationDelay: "220ms" }}>
        <article className="rounded-[20px] border border-[#2b2f46] bg-[#161826] p-4">
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
                className={`poisa-pressable shrink-0 w-[132px] rounded-2xl border bg-[#1e2133] p-2.5 text-left ${
                  activeCalc === chip.id ? "border-[#00e5a0]" : "border-[#2b2f46]"
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

      <BottomSheet isOpen={isIncomeSheetOpen} title="My Income" onClose={() => setIsIncomeSheetOpen(false)}>
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
      </BottomSheet>
    </section>
  );
}
