"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

const PIE_COLORS = ["#00C9A7", "#00D1FF", "#FF8C42", "#FF2E93", "#845EC2", "#F9F871"];

type AnalyticsSegment = "overview" | "spending" | "investing";

const toMonthShort = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-US", { month: "short" });
};

const toMonthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

const toPrettyDate = (date: string) => {
  const value = new Date(`${date}T00:00:00`);
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const shiftMonth = (month: string, offset: number) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year || 1970, (monthNumber || 1) - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getMonthRange = (fromMonth: string, toMonth: string) => {
  if (fromMonth.localeCompare(toMonth) > 0) {
    return [];
  }

  const months: string[] = [];
  let cursor = fromMonth;
  while (cursor.localeCompare(toMonth) <= 0) {
    months.push(cursor);
    cursor = shiftMonth(cursor, 1);
  }
  return months;
};

const getPersonalOutstanding = (loan: {
  closed: boolean;
  outstandingAmount?: number;
  totalLoanAmount?: number;
  payments: Array<{ amount: number }>;
}) => {
  if (loan.closed) {
    return 0;
  }

  const baseAmount =
    typeof loan.outstandingAmount === "number" && loan.outstandingAmount > 0
      ? loan.outstandingAmount
      : loan.totalLoanAmount ?? 0;

  const paid = loan.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return Math.max(baseAmount - paid, 0);
};

const containsEmergency = (value: string) => value.toLowerCase().includes("emergency");

export default function AnalyticsDashboard() {
  const { formatCurrency } = useCurrency();

  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const dashboardWindow = useFinanceStore((state) => state.dashboardWindow);
  const savingsCarryForwardEnabled = useFinanceStore((state) => state.savingsCarryForwardEnabled);
  const getWindowMonths = useFinanceStore((state) => state.getWindowMonths);
  const getExpensesForWindow = useFinanceStore((state) => state.getExpensesForWindow);
  const getSpentForMonth = useFinanceStore((state) => state.getSpentForMonth);
  const totalMonthlyEmiDue = useFinanceStore((state) => state.totalMonthlyEmiDue);

  const expenses = useFinanceStore((state) => state.expenses);
  const goals = useFinanceStore((state) => state.savingGoals);
  const investments = useFinanceStore((state) => state.investments);
  const loans = useFinanceStore((state) => state.loans);
  const personalLoans = useFinanceStore((state) => state.personalLoans);
  const lifeInsurances = useFinanceStore((state) => state.lifeInsurances);

  const adjustments = useFinanceStore((state) => state.adjustments);
  const setManualAssets = useFinanceStore((state) => state.setManualAssets);
  const setManualLiabilities = useFinanceStore((state) => state.setManualLiabilities);
  const setEssentialMonthlyExpense = useFinanceStore((state) => state.setEssentialMonthlyExpense);
  const setEmergencyTargetMonths = useFinanceStore((state) => state.setEmergencyTargetMonths);

  const [activeAnalyticsSegment, setActiveAnalyticsSegment] = useState<AnalyticsSegment>("overview");
  const [showManualValues, setShowManualValues] = useState(false);

  const tooltipStyles = {
    contentStyle: {
      backgroundColor: "#1a1a26",
      border: "1px solid rgba(255,255,255,0.06)",
      color: "#f0f0ff",
    },
  };

  const windowMonths = useMemo(
    () => getWindowMonths(selectedMonth, dashboardWindow),
    [dashboardWindow, getWindowMonths, selectedMonth],
  );
  const windowMonthSet = useMemo(() => new Set(windowMonths), [windowMonths]);

  const scopedGoals = useMemo(
    () => (savingsCarryForwardEnabled ? goals : goals.filter((goal) => windowMonthSet.has(goal.date.slice(0, 7)))),
    [goals, savingsCarryForwardEnabled, windowMonthSet],
  );
  const scopedInvestments = useMemo(
    () =>
      savingsCarryForwardEnabled
        ? investments
        : investments.filter((item) => windowMonthSet.has(item.date.slice(0, 7))),
    [investments, savingsCarryForwardEnabled, windowMonthSet],
  );

  const goalSavingsTotal = useMemo(() => scopedGoals.reduce((sum, goal) => sum + goal.savedAmount, 0), [scopedGoals]);
  const investmentsTotal = useMemo(
    () => scopedInvestments.reduce((sum, item) => sum + item.amount, 0),
    [scopedInvestments],
  );
  const investingAssets = goalSavingsTotal + investmentsTotal;
  const lifeInsuranceMonthlyCommitment = useMemo(
    () => lifeInsurances.reduce((sum, item) => sum + item.monthlyAmount, 0),
    [lifeInsurances],
  );

  const moneyLentReceivable = useMemo(
    () => loans.reduce((sum, loan) => sum + Math.max(loan.amount - loan.repaidAmount, 0), 0),
    [loans],
  );
  const personalLoanLiabilities = useMemo(
    () => personalLoans.reduce((sum, loan) => sum + getPersonalOutstanding(loan), 0),
    [personalLoans],
  );
  const emiLiabilityMonthly = totalMonthlyEmiDue();

  const totalAssets = investingAssets + moneyLentReceivable + adjustments.manualAssets;
  const totalLiabilities = personalLoanLiabilities + adjustments.manualLiabilities;
  const netPosition = totalAssets - totalLiabilities;

  const thisMonthSpend = useMemo(
    () =>
      expenses
        .filter((expense) => expense.date.slice(0, 7) === selectedMonth)
        .reduce((sum, expense) => sum + expense.amount, 0),
    [expenses, selectedMonth],
  );

  const monthlySpending = useMemo(() => {
    const totals = getExpensesForWindow(selectedMonth, dashboardWindow).reduce<Record<string, number>>((acc, expense) => {
      const month = expense.date.slice(0, 7);
      acc[month] = (acc[month] || 0) + expense.amount;
      return acc;
    }, {});

    return windowMonths.map((month) => ({
      month,
      label: toMonthShort(month),
      amount: totals[month] || 0,
    }));
  }, [dashboardWindow, getExpensesForWindow, selectedMonth, windowMonths]);

  const selectedMonthExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.slice(0, 7) === selectedMonth),
    [expenses, selectedMonth],
  );

  const categoryBreakdown = useMemo(() => {
    const totals = selectedMonthExpenses.reduce<Record<string, number>>((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
    const rows = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount], index) => ({
        category,
        amount,
        color: PIE_COLORS[index % PIE_COLORS.length],
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }));

    return { rows, total };
  }, [selectedMonthExpenses]);

  const netWorthTrend = useMemo(() => {
    const months = [
      ...goals.map((goal) => goal.date.slice(0, 7)),
      ...investments.map((item) => item.date.slice(0, 7)),
      ...loans.map((loan) => loan.date.slice(0, 7)),
      ...personalLoans.map((loan) => loan.startDate.slice(0, 7)),
      selectedMonth,
    ].filter(Boolean);

    const sorted = months.sort((a, b) => a.localeCompare(b));
    const startMonth = sorted[0] ?? selectedMonth;
    const endMonth = selectedMonth;

    return getMonthRange(startMonth, endMonth).map((month) => {
      const cumulativeInvesting =
        goals
          .filter((goal) => goal.date.slice(0, 7).localeCompare(month) <= 0)
          .reduce((sum, goal) => sum + goal.savedAmount, 0) +
        investments
          .filter((item) => item.date.slice(0, 7).localeCompare(month) <= 0)
          .reduce((sum, item) => sum + item.amount, 0);

      const receivable = loans
        .filter((loan) => loan.date.slice(0, 7).localeCompare(month) <= 0)
        .reduce((sum, loan) => sum + Math.max(loan.amount - loan.repaidAmount, 0), 0);

      const liabilities = personalLoans
        .filter((loan) => loan.startDate.slice(0, 7).localeCompare(month) <= 0)
        .reduce((sum, loan) => sum + getPersonalOutstanding(loan), 0);

      const assets = cumulativeInvesting + receivable + adjustments.manualAssets;
      const debt = liabilities + adjustments.manualLiabilities;

      return {
        month,
        label: toMonthLabel(month),
        value: assets - debt,
      };
    });
  }, [adjustments.manualAssets, adjustments.manualLiabilities, goals, investments, loans, personalLoans, selectedMonth]);

  const emergencyMeta = useMemo(() => {
    const emergencyGoal =
      goals.find((goal) => goal.isEmergencyFund) ??
      goals.find((goal) => containsEmergency(goal.name) || containsEmergency(goal.category));

    const rollingThreeMonths = getWindowMonths(selectedMonth, 3);
    const averageExpense =
      rollingThreeMonths.reduce((sum, month) => sum + getSpentForMonth(month), 0) /
      Math.max(rollingThreeMonths.length, 1);

    const baseline = adjustments.essentialMonthlyExpense > 0 ? adjustments.essentialMonthlyExpense : averageExpense;
    const targetMonths = Math.max(adjustments.emergencyTargetMonths || 6, 1);
    const savedAmount = emergencyGoal?.savedAmount ?? 0;
    const monthsCovered = baseline > 0 ? savedAmount / baseline : 0;
    const progress = baseline > 0 ? Math.min((monthsCovered / targetMonths) * 100, 100) : 0;

    return { emergencyGoal, baseline, targetMonths, monthsCovered, progress };
  }, [adjustments.emergencyTargetMonths, adjustments.essentialMonthlyExpense, getSpentForMonth, getWindowMonths, goals, selectedMonth]);

  const savingsGrowth = useMemo(() => {
    const sortedGoals = [...scopedGoals].sort((a, b) => a.date.localeCompare(b.date));
    return sortedGoals.reduce<Array<{ date: string; label: string; value: number }>>((acc, goal) => {
      const previous = acc[acc.length - 1]?.value ?? 0;
      const next = previous + goal.savedAmount;
      return [...acc, { date: goal.date, label: toPrettyDate(goal.date), value: next }];
    }, []);
  }, [scopedGoals]);

  const monthlyInvestmentContributions = useMemo(() => {
    const map = windowMonths.reduce<Record<string, { investments: number; goals: number }>>((acc, month) => {
      acc[month] = { investments: 0, goals: 0 };
      return acc;
    }, {});

    for (const item of scopedInvestments) {
      const month = item.date.slice(0, 7);
      if (map[month]) {
        map[month].investments += item.amount;
      }
    }

    for (const goal of scopedGoals) {
      const month = goal.date.slice(0, 7);
      if (map[month]) {
        map[month].goals += goal.savedAmount;
      }
    }

    return windowMonths.map((month) => ({
      month,
      label: toMonthShort(month),
      investments: map[month]?.investments ?? 0,
      goals: map[month]?.goals ?? 0,
      total: (map[month]?.investments ?? 0) + (map[month]?.goals ?? 0),
    }));
  }, [scopedGoals, scopedInvestments, windowMonths]);

  const goalProgressDistribution = useMemo(() => {
    const bands = [
      { key: "<25%", label: "<25%", min: 0, max: 25, color: "#FF8C42" },
      { key: "25-50%", label: "25-50%", min: 25, max: 50, color: "#00D1FF" },
      { key: "50-75%", label: "50-75%", min: 50, max: 75, color: "#845EC2" },
      { key: "75-100%", label: "75-100%", min: 75, max: 100, color: "#00C9A7" },
      { key: "100%", label: "100%", min: 100, max: 101, color: "#F9F871" },
    ];

    const rows = bands.map((band) => {
      const count = scopedGoals.filter((goal) => {
        const progress = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
        if (band.key === "100%") {
          return progress >= 100;
        }
        return progress >= band.min && progress < band.max;
      }).length;
      return { label: band.label, count, color: band.color };
    });

    return rows.filter((row) => row.count > 0);
  }, [scopedGoals]);

  const totalGoalsCount = scopedGoals.length;

  return (
    <section className="px-5 pt-4 pb-6 space-y-4">
      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-2">
        <div className="grid grid-cols-3 gap-1.5">
          {(["overview", "spending", "investing"] as AnalyticsSegment[]).map((segment) => (
            <button
              key={segment}
              type="button"
              onClick={() => setActiveAnalyticsSegment(segment)}
              className={`h-8 rounded-lg text-[11px] font-semibold uppercase tracking-wide ${
                activeAnalyticsSegment === segment
                  ? "bg-[rgba(0,201,167,0.2)] border border-[rgba(0,201,167,0.55)] text-[#c9fff3]"
                  : "bg-white/[0.04] border border-[rgba(255,255,255,0.08)] text-white/70"
              }`}
            >
              {segment}
            </button>
          ))}
        </div>
      </div>

      {activeAnalyticsSegment === "overview" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-2.5">
              <p className="text-[#6b7280] uppercase tracking-wide">Total Invested</p>
              <p className="text-sm font-semibold text-[#00C9A7] mt-0.5">{formatCurrency(investingAssets)}</p>
            </div>
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-2.5">
              <p className="text-[#6b7280] uppercase tracking-wide">EMI Liability</p>
              <p className="text-sm font-semibold text-[#FF8C42] mt-0.5">{formatCurrency(emiLiabilityMonthly)}</p>
            </div>
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-2.5">
              <p className="text-[#6b7280] uppercase tracking-wide">This Month Spend</p>
              <p className="text-sm font-semibold text-[#f0f0ff] mt-0.5">{formatCurrency(thisMonthSpend)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-4">
            <h3 className="text-sm font-bold text-[#f0f0ff] mb-3">Net Worth Snapshot</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-[#6b7280]">
                <span>Investing Assets</span>
                <span className="font-semibold text-[#00C9A7]">{formatCurrency(investingAssets)}</span>
              </div>
              <div className="flex items-center justify-between text-[#6b7280]">
                <span>Money Lent (Receivable)</span>
                <span className="font-semibold text-[#00C9A7]">{formatCurrency(moneyLentReceivable)}</span>
              </div>
              <div className="flex items-center justify-between text-[#6b7280]">
                <span>Loan Liabilities</span>
                <span className="font-semibold text-[#FF8C42]">-{formatCurrency(personalLoanLiabilities)}</span>
              </div>
              <div className="flex items-center justify-between text-[#6b7280]">
                <span>Manual Adjustments</span>
                <span className="font-semibold text-[#f0f0ff]">
                  +{formatCurrency(adjustments.manualAssets)} / -{formatCurrency(adjustments.manualLiabilities)}
                </span>
              </div>
              <div className="h-px bg-[rgba(255,255,255,0.06)]" />
              <div className="flex items-center justify-between">
                <span className="text-[#6b7280]">Net Position</span>
                <span className={`text-xl font-bold ${netPosition >= 0 ? "text-[#00C9A7]" : "text-[#FF8C42]"}`}>
                  {formatCurrency(netPosition)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-4">
            <h3 className="text-sm font-bold text-[#f0f0ff] mb-3">Net Worth Over Time</h3>
            {netWorthTrend.length < 2 ? (
              <p className="text-sm text-[#6b7280]">Add more financial data to see your net worth trend.</p>
            ) : (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netWorthTrend}>
                    <defs>
                      <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00C9A7" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#00C9A7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="#6b7280" tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(Number(v))} />
                    <Tooltip {...tooltipStyles} formatter={(v: number | string | undefined) => formatCurrency(Number(v ?? 0))} />
                    <Area type="monotone" dataKey="value" stroke="#00C9A7" fill="url(#netWorthGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-4">
            <h3 className="text-sm font-bold text-[#f0f0ff] mb-3">Emergency Readiness</h3>
            {emergencyMeta.emergencyGoal ? (
              <>
                <p className="text-xs text-[#6b7280] mb-1">Goal: {emergencyMeta.emergencyGoal.name}</p>
                <p className="text-sm font-semibold text-[#f0f0ff] mb-2">
                  {emergencyMeta.monthsCovered.toFixed(1)} / {emergencyMeta.targetMonths} months covered
                </p>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-[#00C9A7] drop-shadow-[0_0_4px_currentColor]" style={{ width: `${emergencyMeta.progress}%` }} />
                </div>
                <p className="text-[11px] text-[#6b7280] mt-2">Baseline: {formatCurrency(emergencyMeta.baseline || 0)} / month</p>
              </>
            ) : (
              <p className="text-sm text-[#6b7280]">Create an emergency goal to track readiness.</p>
            )}
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-4">
            <button type="button" onClick={() => setShowManualValues((v) => !v)} className="w-full flex items-center justify-between text-left">
              <h3 className="text-sm font-bold text-[#f0f0ff]">Manual Values</h3>
              <span className="material-symbols-outlined text-white/70 text-[18px]">{showManualValues ? "expand_less" : "expand_more"}</span>
            </button>
            {showManualValues && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="block">
                  <p className="text-[11px] text-[#6b7280] mb-1">Manual Assets</p>
                  <input type="number" min="0" step="0.01" value={adjustments.manualAssets} onChange={(e) => setManualAssets(Number(e.target.value || 0))} className="glass-input w-full h-9 px-2 text-xs text-[#f0f0ff]" />
                </label>
                <label className="block">
                  <p className="text-[11px] text-[#6b7280] mb-1">Manual Liabilities</p>
                  <input type="number" min="0" step="0.01" value={adjustments.manualLiabilities} onChange={(e) => setManualLiabilities(Number(e.target.value || 0))} className="glass-input w-full h-9 px-2 text-xs text-[#f0f0ff]" />
                </label>
                <label className="block">
                  <p className="text-[11px] text-[#6b7280] mb-1">Essential Expense / Month</p>
                  <input type="number" min="0" step="0.01" value={adjustments.essentialMonthlyExpense} onChange={(e) => setEssentialMonthlyExpense(Number(e.target.value || 0))} className="glass-input w-full h-9 px-2 text-xs text-[#f0f0ff]" />
                </label>
                <label className="block">
                  <p className="text-[11px] text-[#6b7280] mb-1">Emergency Target (months)</p>
                  <input type="number" min="1" step="1" value={adjustments.emergencyTargetMonths} onChange={(e) => setEmergencyTargetMonths(Number(e.target.value || 6))} className="glass-input w-full h-9 px-2 text-xs text-[#f0f0ff]" />
                </label>
              </div>
            )}
          </div>
        </>
      )}

      {activeAnalyticsSegment === "spending" && (
        <>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-4">
            <h3 className="text-sm font-bold text-[#f0f0ff] mb-3">Monthly Spending</h3>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySpending}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="#6b7280" tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(Number(v))} />
                  <Tooltip {...tooltipStyles} formatter={(v: number | string | undefined) => formatCurrency(Number(v ?? 0))} />
                  <Bar dataKey="amount" fill="#00C9A7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-4">
            <h3 className="text-sm font-bold text-[#f0f0ff] mb-3">Spending by Category</h3>
            {categoryBreakdown.rows.length === 0 ? (
              <p className="text-sm text-[#6b7280]">No spending data for this month.</p>
            ) : (
              <>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryBreakdown.rows} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={90} cx="50%" cy="50%">
                        {categoryBreakdown.rows.map((entry) => (
                          <Cell key={entry.category} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyles} formatter={(v: number | string | undefined) => formatCurrency(Number(v ?? 0))} />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#f0f0ff" fontSize="12" fontWeight="700">
                        {formatCurrency(categoryBreakdown.total)}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categoryBreakdown.rows.map((row) => (
                    <div key={row.category} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] text-xs text-[#6b7280]">
                      <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} />
                      <span>{row.category}</span>
                      <span className="text-[#f0f0ff] font-semibold">{Math.round(row.percentage)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {activeAnalyticsSegment === "investing" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-2.5">
              <p className="text-[#6b7280] uppercase tracking-wide">Goal Savings</p>
              <p className="text-sm font-semibold text-[#00C9A7] mt-0.5">{formatCurrency(goalSavingsTotal)}</p>
            </div>
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-2.5">
              <p className="text-[#6b7280] uppercase tracking-wide">Investments</p>
              <p className="text-sm font-semibold text-[#00D1FF] mt-0.5">{formatCurrency(investmentsTotal)}</p>
            </div>
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-2.5">
              <p className="text-[#6b7280] uppercase tracking-wide">Combined Total</p>
              <p className="text-sm font-semibold text-[#f0f0ff] mt-0.5">{formatCurrency(investingAssets)}</p>
            </div>
            <div className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-2.5">
              <p className="text-[#6b7280] uppercase tracking-wide">Insurance / Month</p>
              <p className="text-sm font-semibold text-[#FF8C42] mt-0.5">{formatCurrency(lifeInsuranceMonthlyCommitment)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-4">
            <h3 className="text-sm font-bold text-[#f0f0ff] mb-3">Monthly Investment Contributions</h3>
            {monthlyInvestmentContributions.every((row) => row.total <= 0) ? (
              <p className="text-sm text-[#6b7280]">No investment data in this window.</p>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyInvestmentContributions}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="#6b7280" tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(Number(v))} />
                    <Tooltip {...tooltipStyles} formatter={(v: number | string | undefined) => formatCurrency(Number(v ?? 0))} />
                    <Bar dataKey="investments" fill="#00D1FF" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="goals" fill="#00C9A7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-4">
            <h3 className="text-sm font-bold text-[#f0f0ff] mb-3">Goal Progress Distribution</h3>
            {goalProgressDistribution.length === 0 ? (
              <p className="text-sm text-[#6b7280]">Add goals to view progress distribution.</p>
            ) : (
              <>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={goalProgressDistribution} dataKey="count" nameKey="label" innerRadius={60} outerRadius={90} cx="50%" cy="50%">
                        {goalProgressDistribution.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyles} formatter={(v: number | string | undefined) => `${Number(v ?? 0)} goals`} />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#f0f0ff" fontSize="12" fontWeight="700">
                        {totalGoalsCount} goals
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {goalProgressDistribution.map((row) => (
                    <div key={row.label} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] text-xs text-[#6b7280]">
                      <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} />
                      <span>{row.label}</span>
                      <span className="text-[#f0f0ff] font-semibold">{row.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-4">
            <h3 className="text-sm font-bold text-[#f0f0ff] mb-3">Savings Growth</h3>
            {savingsGrowth.length < 2 ? (
              <p className="text-sm text-[#6b7280]">Add goals/investments to view trend.</p>
            ) : (
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsGrowth}>
                    <defs>
                      <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00C9A7" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#00C9A7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="#6b7280" tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(Number(v))} />
                    <Tooltip {...tooltipStyles} formatter={(v: number | string | undefined) => formatCurrency(Number(v ?? 0))} />
                    <Area type="monotone" dataKey="value" stroke="#00C9A7" fill="url(#savingsGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
