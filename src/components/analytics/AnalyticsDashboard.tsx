"use client";

import { useMemo } from "react";
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

export default function AnalyticsDashboard() {
  const { formatCurrency } = useCurrency();
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const dashboardWindow = useFinanceStore((state) => state.dashboardWindow);
  const savingsCarryForwardEnabled = useFinanceStore((state) => state.savingsCarryForwardEnabled);
  const getWindowMonths = useFinanceStore((state) => state.getWindowMonths);
  const getExpensesForWindow = useFinanceStore((state) => state.getExpensesForWindow);
  const expenses = useFinanceStore((state) => state.expenses);
  const goals = useFinanceStore((state) => state.savingGoals);
  const investments = useFinanceStore((state) => state.investments);
  const loans = useFinanceStore((state) => state.loans);
  const personalLoans = useFinanceStore((state) => state.personalLoans);
  const adjustments = useFinanceStore((state) => state.adjustments);
  const setManualAssets = useFinanceStore((state) => state.setManualAssets);
  const setManualLiabilities = useFinanceStore((state) => state.setManualLiabilities);
  const setEssentialMonthlyExpense = useFinanceStore((state) => state.setEssentialMonthlyExpense);
  const setEmergencyTargetMonths = useFinanceStore((state) => state.setEmergencyTargetMonths);

  const windowMonths = useMemo(
    () => getWindowMonths(selectedMonth, dashboardWindow),
    [dashboardWindow, getWindowMonths, selectedMonth],
  );
  const windowMonthSet = useMemo(() => new Set(windowMonths), [windowMonths]);

  const scopedGoals = savingsCarryForwardEnabled
    ? goals
    : goals.filter((goal) => windowMonthSet.has(goal.date.slice(0, 7)));

  const scopedInvestments = savingsCarryForwardEnabled
    ? investments
    : investments.filter((item) => windowMonthSet.has(item.date.slice(0, 7)));

  const investingAssets =
    scopedGoals.reduce((sum, goal) => sum + goal.savedAmount, 0) +
    scopedInvestments.reduce((sum, item) => sum + item.amount, 0);

  const moneyLentReceivable = loans.reduce(
    (sum, loan) => sum + Math.max(loan.amount - loan.repaidAmount, 0),
    0,
  );

  const personalLoanLiabilities = personalLoans.reduce((sum, loan) => sum + getPersonalOutstanding(loan), 0);

  const totalAssets = investingAssets + moneyLentReceivable + adjustments.manualAssets;
  const totalLiabilities = personalLoanLiabilities + adjustments.manualLiabilities;
  const netPosition = totalAssets - totalLiabilities;

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

  const savingsGrowth = useMemo(() => {
    const sortedGoals = [...goals].sort((a, b) => a.date.localeCompare(b.date));
    return sortedGoals.reduce<Array<{ date: string; label: string; value: number }>>((acc, goal) => {
      const previous = acc[acc.length - 1]?.value ?? 0;
      const next = previous + goal.savedAmount;
      return [
        ...acc,
        {
          date: goal.date,
          label: toPrettyDate(goal.date),
          value: next,
        },
      ];
    }, []);
  }, [goals]);

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
      const totalDebt = liabilities + adjustments.manualLiabilities;

      return {
        month,
        label: toMonthLabel(month),
        value: assets - totalDebt,
      };
    });
  }, [adjustments.manualAssets, adjustments.manualLiabilities, goals, investments, loans, personalLoans, selectedMonth]);

  return (
    <section className="px-5 pt-4 pb-6 space-y-4">
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
        <h3 className="text-sm font-bold text-[#f0f0ff] mb-3">Adjustments</h3>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <p className="text-[11px] text-[#6b7280] mb-1">Manual Assets</p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={adjustments.manualAssets}
              onChange={(event) => setManualAssets(Number(event.target.value || 0))}
              className="glass-input w-full h-9 px-2 text-xs text-[#f0f0ff]"
            />
          </label>
          <label className="block">
            <p className="text-[11px] text-[#6b7280] mb-1">Manual Liabilities</p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={adjustments.manualLiabilities}
              onChange={(event) => setManualLiabilities(Number(event.target.value || 0))}
              className="glass-input w-full h-9 px-2 text-xs text-[#f0f0ff]"
            />
          </label>
          <label className="block">
            <p className="text-[11px] text-[#6b7280] mb-1">Essential Expense / Month</p>
            <input
              type="number"
              min="0"
              step="0.01"
              value={adjustments.essentialMonthlyExpense}
              onChange={(event) => setEssentialMonthlyExpense(Number(event.target.value || 0))}
              className="glass-input w-full h-9 px-2 text-xs text-[#f0f0ff]"
            />
          </label>
          <label className="block">
            <p className="text-[11px] text-[#6b7280] mb-1">Emergency Target (months)</p>
            <input
              type="number"
              min="1"
              step="1"
              value={adjustments.emergencyTargetMonths}
              onChange={(event) => setEmergencyTargetMonths(Number(event.target.value || 6))}
              className="glass-input w-full h-9 px-2 text-xs text-[#f0f0ff]"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-4">
        <h3 className="text-sm font-bold text-[#f0f0ff] mb-3">Monthly Spending</h3>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySpending}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" stroke="#6b7280" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#6b7280"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(Number(value))}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a26", border: "1px solid rgba(255,255,255,0.06)", color: "#f0f0ff" }}
                formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))}
              />
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
                  <Pie
                    data={categoryBreakdown.rows}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={60}
                    outerRadius={90}
                    cx="50%"
                    cy="50%"
                  >
                    {categoryBreakdown.rows.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a26", border: "1px solid rgba(255,255,255,0.06)", color: "#f0f0ff" }}
                    formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))}
                  />
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
                <YAxis
                  stroke="#6b7280"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a26", border: "1px solid rgba(255,255,255,0.06)", color: "#f0f0ff" }}
                  formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))}
                />
                <Area type="monotone" dataKey="value" stroke="#00C9A7" fill="url(#netWorthGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-4">
        <h3 className="text-sm font-bold text-[#f0f0ff] mb-3">Savings Growth</h3>

        {savingsGrowth.length < 2 ? (
          <p className="text-sm text-[#6b7280]">Add more goals to see your savings trend.</p>
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
                <YAxis
                  stroke="#6b7280"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(Number(value))}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a26", border: "1px solid rgba(255,255,255,0.06)", color: "#f0f0ff" }}
                  formatter={(value: number | string | undefined) => formatCurrency(Number(value ?? 0))}
                />
                <Area type="monotone" dataKey="value" stroke="#00C9A7" fill="url(#savingsGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}

