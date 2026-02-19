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

const toPrettyDate = (date: string) => {
  const value = new Date(`${date}T00:00:00`);
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function AnalyticsDashboard() {
  const { formatCurrency } = useCurrency();
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const expenses = useFinanceStore((state) => state.expenses);
  const goals = useFinanceStore((state) => state.savingGoals);
  const investments = useFinanceStore((state) => state.investments);
  const loans = useFinanceStore((state) => state.loans);

  const totalGoalSavings = goals.reduce((sum, goal) => sum + goal.savedAmount, 0);
  const totalInvestments = investments.reduce((sum, item) => sum + item.amount, 0);
  const totalSavings = totalGoalSavings + totalInvestments;
  const outstandingLoans = loans.filter((loan) => !loan.repaid).reduce((sum, loan) => sum + Math.max(loan.amount - loan.repaidAmount, 0), 0);
  const netPosition = totalSavings - outstandingLoans;

  const monthlySpending = useMemo(() => {
    const totals = expenses.reduce<Record<string, number>>((acc, expense) => {
      const month = expense.date.slice(0, 7);
      acc[month] = (acc[month] || 0) + expense.amount;
      return acc;
    }, {});

    return Object.entries(totals)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({
        month,
        label: toMonthShort(month),
        amount,
      }));
  }, [expenses]);

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

  return (
    <section className="px-5 pt-4 pb-6 space-y-4">
      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] p-4">
        <h3 className="text-sm font-bold text-[#f0f0ff] mb-3">Net Worth Snapshot</h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-[#6b7280]">
            <span>Total Investing</span>
            <span className="font-semibold text-[#00C9A7]">{formatCurrency(totalSavings)}</span>
          </div>
          <div className="flex items-center justify-between text-[#6b7280]">
            <span>Outstanding Loans</span>
            <span className="font-semibold text-[#FF8C42]">-{formatCurrency(outstandingLoans)}</span>
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

