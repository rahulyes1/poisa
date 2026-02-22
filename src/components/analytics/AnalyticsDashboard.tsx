"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ReferenceLine,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import CalculatorHub, { CalculatorHubItem } from "../calculators/CalculatorHub";
import { computeTaxComparison, computeTaxForRegime, TaxRegime } from "../calculators/taxLogic";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

const PIE_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#F43F5E", "#8B5CF6", "#06B6D4", "#EC4899", "#F97316"];

type AnalyticsSegment = "overview" | "spending" | "investing" | "tax";
type TaxMode = "new" | "old" | "compare";

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

const parseIsoDate = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
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

interface AnalyticsDashboardProps {
  onOpenFreedomCalculator: () => void;
  onOpenCalculator: (item: CalculatorHubItem) => void;
}

export default function AnalyticsDashboard({ onOpenFreedomCalculator, onOpenCalculator }: AnalyticsDashboardProps) {
  const { formatCurrency } = useCurrency();

  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const dashboardWindow = useFinanceStore((state) => state.dashboardWindow);
  const savingsCarryForwardEnabled = useFinanceStore((state) => state.savingsCarryForwardEnabled);
  const getWindowMonths = useFinanceStore((state) => state.getWindowMonths);
  const getExpensesForWindow = useFinanceStore((state) => state.getExpensesForWindow);
  const getSpentForMonth = useFinanceStore((state) => state.getSpentForMonth);
  const getEffectiveSpendingBudget = useFinanceStore((state) => state.getEffectiveSpendingBudget);
  const getMonthlyIncome = useFinanceStore((state) => state.getMonthlyIncome);
  const totalMonthlyEmiDue = useFinanceStore((state) => state.totalMonthlyEmiDue);

  const expenses = useFinanceStore((state) => state.expenses);
  const goals = useFinanceStore((state) => state.savingGoals);
  const investments = useFinanceStore((state) => state.investments);
  const loans = useFinanceStore((state) => state.loans);
  const personalLoans = useFinanceStore((state) => state.personalLoans);
  const lifeInsurances = useFinanceStore((state) => state.lifeInsurances);
  const netWorthHistory = useFinanceStore((state) => state.netWorthHistory);
  const upsertNetWorthHistoryPoint = useFinanceStore((state) => state.upsertNetWorthHistoryPoint);

  const adjustments = useFinanceStore((state) => state.adjustments);
  const setManualAssets = useFinanceStore((state) => state.setManualAssets);
  const setManualLiabilities = useFinanceStore((state) => state.setManualLiabilities);
  const setEssentialMonthlyExpense = useFinanceStore((state) => state.setEssentialMonthlyExpense);
  const setEmergencyTargetMonths = useFinanceStore((state) => state.setEmergencyTargetMonths);

  const [activeAnalyticsSegment, setActiveAnalyticsSegment] = useState<AnalyticsSegment>("overview");
  const [showManualValues, setShowManualValues] = useState(false);
  const [selectedCalculatorId, setSelectedCalculatorId] = useState("burn");
  const [hoveredInvestmentMonth, setHoveredInvestmentMonth] = useState<string | null>(null);
  const [taxMode, setTaxMode] = useState<TaxMode>("new");
  const [taxCalculated, setTaxCalculated] = useState(false);
  const [taxGrossSalary, setTaxGrossSalary] = useState("");
  const [taxOtherIncome, setTaxOtherIncome] = useState("");
  const [tax80C, setTax80C] = useState("");
  const [tax80D, setTax80D] = useState("");
  const [taxHra, setTaxHra] = useState("");
  const [taxNps, setTaxNps] = useState("");
  const [taxHomeLoan, setTaxHomeLoan] = useState("");
  const [taxOtherDeduction, setTaxOtherDeduction] = useState("");

  const tooltipStyles = {
    contentStyle: {
      backgroundColor: "#1E293B",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "12px",
      color: "#F1F5F9",
      fontSize: "12px",
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

  useEffect(() => {
    upsertNetWorthHistoryPoint({ month: selectedMonth, netWorth: netPosition });
  }, [netPosition, selectedMonth, upsertNetWorthHistoryPoint]);

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

  const netWorthTrend = useMemo(
    () =>
      [...netWorthHistory]
        .sort((a, b) => a.month.localeCompare(b.month))
        .map((item) => ({
          month: item.month,
          label: toMonthLabel(item.month),
          value: item.netWorth,
          positiveValue: item.netWorth >= 0 ? item.netWorth : null,
          negativeValue: item.netWorth < 0 ? item.netWorth : null,
        })),
    [netWorthHistory],
  );

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

  const investedThisMonth = useMemo(() => {
    const goalsMonthTotal = goals
      .filter((goal) => goal.date.slice(0, 7) === selectedMonth)
      .reduce((sum, goal) => sum + goal.savedAmount, 0);
    const investmentsMonthTotal = investments
      .filter((item) => item.date.slice(0, 7) === selectedMonth)
      .reduce((sum, item) => sum + item.amount, 0);
    return goalsMonthTotal + investmentsMonthTotal;
  }, [goals, investments, selectedMonth]);

  const monthlyIncome = getMonthlyIncome(selectedMonth);
  const monthlyIncomeTotal = (monthlyIncome?.salary ?? 0) + (monthlyIncome?.otherIncome ?? 0);
  const monthBudget = getEffectiveSpendingBudget(selectedMonth);

  const financialDataDays = useMemo(() => {
    const dates = [
      ...expenses.map((expense) => parseIsoDate(expense.date)),
      ...goals.map((goal) => parseIsoDate(goal.date)),
      ...investments.map((item) => parseIsoDate(item.date)),
      ...loans.map((loan) => parseIsoDate(loan.date)),
      ...personalLoans.map((loan) => parseIsoDate(loan.startDate)),
      ...lifeInsurances.map((item) => parseIsoDate(item.dueDate)),
    ].filter((value): value is Date => value !== null);

    if (dates.length === 0) {
      return 0;
    }

    const firstDate = dates.reduce((earliest, current) =>
      current.getTime() < earliest.getTime() ? current : earliest,
    );
    const today = new Date();
    const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffMs = currentDay.getTime() - firstDate.getTime();
    if (diffMs < 0) {
      return 0;
    }
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }, [expenses, goals, investments, lifeInsurances, loans, personalLoans]);

  const financialHealth = useMemo(() => {
    if (financialDataDays < 30) return null;

    const savingsRatePct = monthlyIncomeTotal > 0 ? (investedThisMonth / monthlyIncomeTotal) * 100 : 0;
    const emiRatioPct = monthlyIncomeTotal > 0 ? (emiLiabilityMonthly / monthlyIncomeTotal) * 100 : 0;
    const overPct = monthBudget > 0 ? ((thisMonthSpend - monthBudget) / monthBudget) * 100 : 0;

    const savingsScore = savingsRatePct >= 20 ? 25 : savingsRatePct >= 10 ? 15 : savingsRatePct >= 5 ? 8 : 0;
    const budgetScore = thisMonthSpend <= monthBudget ? 25 : overPct <= 10 ? 15 : overPct <= 25 ? 8 : 0;
    const emiScore = emiRatioPct < 20 ? 25 : emiRatioPct <= 30 ? 15 : emiRatioPct <= 40 ? 8 : 0;
    const emergencyScore =
      !emergencyMeta.emergencyGoal
        ? 0
        : emergencyMeta.monthsCovered >= 6
          ? 25
          : emergencyMeta.monthsCovered >= 3
            ? 15
            : emergencyMeta.monthsCovered >= 1
              ? 8
              : 0;

    const incomeAvailable = monthlyIncomeTotal > 0;
    const rawScore = incomeAvailable ? savingsScore + budgetScore + emiScore + emergencyScore : savingsScore + budgetScore;
    const score = incomeAvailable ? rawScore : (rawScore / 50) * 100;

    let label = "Excellent";
    let color = "#00C896";
    if (score < 40) {
      label = "Needs Attention";
      color = "#FF6B6B";
    } else if (score < 60) {
      label = "Fair";
      color = "#F5A623";
    } else if (score < 80) {
      label = "Good";
      color = "#7C6FF7";
    }

    const factors = [
      { label: "Savings Rate", score: savingsScore },
      { label: "Budget Control", score: budgetScore },
      { label: "EMI Ratio", score: emiScore },
      { label: "Emergency Fund", score: emergencyScore },
    ];
    const weakest = [...factors].sort((a, b) => a.score - b.score)[0];
    const insight =
      weakest.label === "Emergency Fund"
        ? "Set up an emergency fund to improve your score."
        : weakest.label === "EMI Ratio"
          ? "Lower EMI-to-income ratio to improve score."
          : weakest.label === "Savings Rate"
            ? "Increase investments to improve your savings score."
            : "Stay within budget to improve your score.";

    return { score: Number(score.toFixed(0)), label, color, factors, insight };
  }, [
    emergencyMeta.emergencyGoal,
    emergencyMeta.monthsCovered,
    emiLiabilityMonthly,
    financialDataDays,
    investedThisMonth,
    monthBudget,
    monthlyIncomeTotal,
    thisMonthSpend,
  ]);

  const taxInput = useMemo(
    () => ({
      annualGrossSalary: Number(taxGrossSalary || 0),
      otherIncome: Number(taxOtherIncome || 0),
      deductions: {
        section80C: Number(tax80C || 0),
        section80D: Number(tax80D || 0),
        hra: Number(taxHra || 0),
        section80CCD1B: Number(taxNps || 0),
        homeLoanInterest24: Number(taxHomeLoan || 0),
        otherDeductions: Number(taxOtherDeduction || 0),
      },
    }),
    [tax80C, tax80D, taxGrossSalary, taxHra, taxHomeLoan, taxNps, taxOtherDeduction, taxOtherIncome],
  );

  const taxHasInput = useMemo(
    () =>
      taxInput.annualGrossSalary > 0 ||
      taxInput.otherIncome > 0 ||
      taxInput.deductions.section80C > 0 ||
      taxInput.deductions.section80D > 0 ||
      taxInput.deductions.hra > 0 ||
      taxInput.deductions.section80CCD1B > 0 ||
      taxInput.deductions.homeLoanInterest24 > 0 ||
      taxInput.deductions.otherDeductions > 0,
    [taxInput],
  );

  const taxComputed = useMemo(() => {
    if (taxMode === "compare") {
      const compare = computeTaxComparison(taxInput);
      return {
        selected: compare.winner === "new" ? compare.newRegime : compare.oldRegime,
        compare,
      };
    }
    return {
      selected: computeTaxForRegime(taxInput, taxMode as TaxRegime),
      compare: computeTaxComparison(taxInput),
    };
  }, [taxInput, taxMode]);

  const activeContribution = useMemo(() => {
    if (!hoveredInvestmentMonth) return null;
    return monthlyInvestmentContributions.find((row) => row.label === hoveredInvestmentMonth) ?? null;
  }, [hoveredInvestmentMonth, monthlyInvestmentContributions]);

  const hasNegativeNetWorth = useMemo(
    () => netWorthTrend.some((row) => row.value < 0),
    [netWorthTrend],
  );

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
    <section className="px-4 pt-4 pb-6 space-y-4">
      {/* Segment selector */}
      <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-2">
        <div className="relative">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pr-10">
            {(["overview", "spending", "investing", "tax"] as AnalyticsSegment[]).map((segment) => (
            <button
              key={segment}
              type="button"
              onClick={() => setActiveAnalyticsSegment(segment)}
              className={`h-8 min-w-[92px] rounded-xl px-3 text-[11px] font-semibold uppercase tracking-wide active:scale-95 transition-all ${
                activeAnalyticsSegment === segment
                  ? "bg-[#00C896] text-[#0D1117]"
                  : "bg-transparent border border-transparent text-[#7A8599]"
              }`}
            >
              {segment}
            </button>
          ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#161B22] to-transparent" />
        </div>
      </div>

      {activeAnalyticsSegment === "overview" && (
        <>
          <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#7A8599] font-semibold">Financial Health</p>
            {!financialHealth ? (
              <div className="mt-3 rounded-xl border border-dashed border-[#2A3345] bg-[#0D1117] p-4 text-center text-sm text-[#7A8599]">
                Add more data to generate your score
              </div>
            ) : (
              <>
                <div className="mt-3 flex flex-col items-center">
                  <div
                    className="relative size-32 rounded-full"
                    style={{
                      background: `conic-gradient(${financialHealth.color} ${Math.min(financialHealth.score, 100)}%, #2A3345 0)`,
                    }}
                  >
                    <div className="absolute inset-[8px] rounded-full bg-[#0D1117] border border-[#2A3345] flex flex-col items-center justify-center">
                      <p className="text-5xl font-black leading-none" style={{ color: financialHealth.color }}>{financialHealth.score}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-semibold" style={{ color: financialHealth.color }}>{financialHealth.label}</p>
                </div>
                <div className="mt-2 space-y-1.5">
                  {financialHealth.factors.map((factor) => (
                    <div key={factor.label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#7A8599]">{factor.label}</span>
                        <span className="text-[#F1F5F9]">{factor.score}/25</span>
                      </div>
                      <div className="mt-0.5 h-1 rounded-full bg-[#2A3345]">
                        <div className="h-full rounded-full bg-[#00C896]" style={{ width: `${(factor.score / 25) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-[#7A8599]">{financialHealth.insight}</p>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] text-xs">
            <div className="grid grid-cols-3">
              <div className="p-3">
                <p className="text-[#64748B] uppercase tracking-wide text-[10px]">Invested</p>
                <p className="text-sm font-bold text-[#10B981] mt-1">{formatCurrency(investingAssets)}</p>
              </div>
              <div className="border-x border-[#2A3345] p-3">
                <p className="text-[#64748B] uppercase tracking-wide text-[10px]">EMI / mo</p>
                <p className="text-sm font-bold text-[#F59E0B] mt-1">{formatCurrency(emiLiabilityMonthly)}</p>
              </div>
              <div className="p-3">
                <p className="text-[#64748B] uppercase tracking-wide text-[10px]">Spent</p>
                <p className="text-sm font-bold text-[#F1F5F9] mt-1">{formatCurrency(thisMonthSpend)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#F1F5F9] pt-[18px]">Net Worth Snapshot</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAnalyticsSegment("tax")}
                  className="h-7 rounded-lg bg-[#00C896] px-2.5 text-[11px] font-semibold text-[#0D1117]"
                >
                  Tax Calculator
                </button>
                <button
                  type="button"
                  onClick={onOpenFreedomCalculator}
                  className="h-7 w-7 rounded-lg border border-[#00C896]/50 bg-[rgba(0,200,150,0.12)] text-[#7af6cd] inline-flex items-center justify-center"
                  title="Financial freedom calculator"
                  aria-label="Open financial freedom calculator"
                >
                  <span className="material-symbols-outlined text-[14px]">calculate</span>
                </button>
              </div>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-[#64748B]">
                <span>Investing Assets</span>
                <span className="font-semibold text-[#10B981]">{formatCurrency(investingAssets)}</span>
              </div>
              <div className="flex items-center justify-between text-[#64748B]">
                <span>Money Lent (Receivable)</span>
                <span className="font-semibold text-[#10B981]">{formatCurrency(moneyLentReceivable)}</span>
              </div>
              <div className="flex items-center justify-between text-[#64748B]">
                <span>Loan Liabilities</span>
                <span className="font-semibold text-[#F43F5E]">-{formatCurrency(personalLoanLiabilities)}</span>
              </div>
              <div className="flex items-center justify-between text-[#64748B]">
                <span>Manual Adjustments</span>
                <span className="font-semibold text-[#F1F5F9]">
                  +{formatCurrency(adjustments.manualAssets)} / -{formatCurrency(adjustments.manualLiabilities)}
                </span>
              </div>
              <div className="h-px bg-white/06" />
              <div className="rounded-xl border border-[rgba(0,200,150,0.2)] bg-[rgba(0,200,150,0.08)] px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-white">Net Position</span>
                  <span className={`text-2xl font-black ${netPosition >= 0 ? "text-[#00C896]" : "text-[#FF6B6B]"}`}>
                    {formatCurrency(netPosition)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4">
            <h3 className="text-sm font-bold text-[#F1F5F9] pt-[18px]">Net Worth Over Time</h3>
            {netWorthTrend.length < 2 ? (
              <div className="mt-3 rounded-xl border border-dashed border-[#2A3345] bg-[#0D1117] p-6 text-center">
                <span className="material-symbols-outlined text-[30px] text-[#2A3345]">trending_up</span>
                {netWorthTrend.length === 1 ? (
                  <>
                    <div className="mt-3 flex justify-center">
                      <span
                        className="inline-block size-3 rounded-full border-2 border-[#F1F5F9]"
                        style={{ backgroundColor: (netWorthTrend[0]?.value ?? 0) < 0 ? "#FF6B6B" : "#00C896" }}
                      />
                    </div>
                    <p className="mt-2 text-[13px] text-[#7A8599]">
                      Current: {formatCurrency(netWorthTrend[0]?.value ?? 0)}
                    </p>
                    <p className="mt-1 text-[11px] text-[#5D677A]">Come back next month to see your trend</p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-[13px] text-[#7A8599]">Your net worth history will appear here automatically</p>
                    <p className="mt-1 text-[11px] text-[#5D677A]">First snapshot saves on the 1st of next month</p>
                  </>
                )}
              </div>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netWorthTrend}>
                    <defs>
                      <linearGradient id="netWorthPositiveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00C896" stopOpacity={0.30} />
                        <stop offset="100%" stopColor="#00C896" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="netWorthNegativeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF6B6B" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#FF6B6B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748B" tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(Number(v))} tick={{ fontSize: 10 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) {
                          return null;
                        }
                        const row = payload[0]?.payload as { label: string; value: number } | undefined;
                        if (!row) {
                          return null;
                        }
                        return (
                          <div
                            style={{
                              backgroundColor: "#1E293B",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "12px",
                              color: "#F1F5F9",
                              fontSize: "12px",
                              padding: "8px 10px",
                            }}
                          >
                            <p className="text-[#94A3B8]">{row.label}</p>
                            <p className="font-semibold">{formatCurrency(row.value)}</p>
                          </div>
                        );
                      }}
                    />
                    {hasNegativeNetWorth && (
                      <ReferenceLine y={0} stroke="#64748B" strokeDasharray="4 4" />
                    )}
                    <Area
                      type="monotone"
                      dataKey="positiveValue"
                      stroke="#00C896"
                      fill="url(#netWorthPositiveGradient)"
                      connectNulls={false}
                      strokeWidth={3}
                    />
                    <Area
                      type="monotone"
                      dataKey="negativeValue"
                      stroke="#FF6B6B"
                      fill="url(#netWorthNegativeGradient)"
                      connectNulls={false}
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="positiveValue"
                      stroke="#00C896"
                      strokeWidth={3}
                      connectNulls={false}
                      dot={{ r: 8, fill: "#00C896", stroke: "#F1F5F9", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="negativeValue"
                      stroke="#FF6B6B"
                      strokeWidth={3}
                      connectNulls={false}
                      dot={{ r: 8, fill: "#FF6B6B", stroke: "#F1F5F9", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/08 bg-[#1E293B] p-4">
            <h3 className="text-sm font-bold text-[#F1F5F9] pt-[18px] mb-3">Emergency Readiness</h3>
            {emergencyMeta.emergencyGoal ? (
              <>
                <p className="text-xs text-[#64748B] mb-1">Goal: {emergencyMeta.emergencyGoal.name}</p>
                <p className="text-sm font-semibold text-[#F1F5F9] mb-2">
                  {emergencyMeta.monthsCovered.toFixed(1)} / {emergencyMeta.targetMonths} months covered
                </p>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${emergencyMeta.progress}%`,
                      background: "linear-gradient(90deg, #10B981, #34D399)",
                    }}
                  />
                </div>
                <p className="text-[11px] text-[#64748B] mt-2">Baseline: {formatCurrency(emergencyMeta.baseline || 0)} / month</p>
              </>
            ) : (
              <div className="text-center py-3">
                <span className="material-symbols-outlined text-[26px] text-[#2A3345]">shield</span>
                <p className="text-sm text-[#64748B]">Create an emergency goal to track readiness.</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/08 bg-[#1E293B] p-4">
            <button type="button" onClick={() => setShowManualValues((v) => !v)} className="w-full flex items-center justify-between text-left active:scale-[0.99] transition-transform">
              <h3 className="text-sm font-bold text-[#F1F5F9] pt-[18px]">Manual Values</h3>
              <span className="material-symbols-outlined text-[#94A3B8] text-[18px]">{showManualValues ? "expand_less" : "expand_more"}</span>
            </button>
            {showManualValues && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="block">
                  <p className="text-[11px] text-[#64748B] mb-1">Manual Assets</p>
                  <input type="number" min="0" step="0.01" value={adjustments.manualAssets} onChange={(e) => setManualAssets(Number(e.target.value || 0))} className="glass-input w-full h-9 px-2 text-xs text-[#F1F5F9]" />
                </label>
                <label className="block">
                  <p className="text-[11px] text-[#64748B] mb-1">Manual Liabilities</p>
                  <input type="number" min="0" step="0.01" value={adjustments.manualLiabilities} onChange={(e) => setManualLiabilities(Number(e.target.value || 0))} className="glass-input w-full h-9 px-2 text-xs text-[#F1F5F9]" />
                </label>
                <label className="block">
                  <p className="text-[11px] text-[#64748B] mb-1">Essential Expense / Month</p>
                  <input type="number" min="0" step="0.01" value={adjustments.essentialMonthlyExpense} onChange={(e) => setEssentialMonthlyExpense(Number(e.target.value || 0))} className="glass-input w-full h-9 px-2 text-xs text-[#F1F5F9]" />
                </label>
                <label className="block">
                  <p className="text-[11px] text-[#64748B] mb-1">Emergency Target (months)</p>
                  <input type="number" min="1" step="1" value={adjustments.emergencyTargetMonths} onChange={(e) => setEmergencyTargetMonths(Number(e.target.value || 6))} className="glass-input w-full h-9 px-2 text-xs text-[#F1F5F9]" />
                </label>
              </div>
            )}
          </div>

          <CalculatorHub
            selectedId={selectedCalculatorId}
            onSelect={(item) => {
              setSelectedCalculatorId(item.id);
              onOpenCalculator(item);
            }}
            title="Calculators"
          />
        </>
      )}

      {activeAnalyticsSegment === "spending" && (
        <>
          <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4">
            <h3 className="text-sm font-bold text-[#F1F5F9] pt-[18px]">Monthly Spending Trend</h3>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlySpending}>
                  <defs>
                    <linearGradient id="spendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
                      <stop offset="100%" stopColor="rgba(99,102,241,0)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748B" tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(Number(v))} tick={{ fontSize: 10 }} />
                  <Tooltip {...tooltipStyles} formatter={(v: number | string | undefined) => formatCurrency(Number(v ?? 0))} />
                  <Area type="monotone" dataKey="amount" stroke="none" fill="url(#spendAreaGradient)" />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#6366F1"
                    strokeWidth={3}
                    dot={{ r: 8, fill: "#6366F1", strokeWidth: 2, stroke: "#F1F5F9" }}
                    activeDot={{ r: 8, fill: "#6366F1", stroke: "#F1F5F9", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4">
            <h3 className="text-sm font-bold text-[#F1F5F9] pt-[18px]">Spending by Category</h3>
            {categoryBreakdown.rows.length === 0 ? (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-[30px] text-[#2A3345]">pie_chart</span>
                <p className="text-sm text-[#64748B]">No spending data for this month.</p>
              </div>
            ) : (
              <>
                <div className="h-[230px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown.rows}
                        dataKey="amount"
                        nameKey="category"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        cx="50%"
                        cy="50%"
                      >
                        {categoryBreakdown.rows.map((entry) => (
                          <Cell key={entry.category} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyles} formatter={(v: number | string | undefined) => formatCurrency(Number(v ?? 0))} />
                      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="#94A3B8" fontSize="10">
                        Total
                      </text>
                      <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fill="#F1F5F9" fontSize="13" fontWeight="800">
                        {formatCurrency(categoryBreakdown.total)}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3">
                  {categoryBreakdown.rows.map((row, index) => (
                    <div key={row.category} className={`flex items-center justify-between py-2 ${index > 0 ? "border-t border-[#2A3345]" : ""}`}>
                      <div className="inline-flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                        <span className="text-sm text-[#7A8599]">{row.category}</span>
                      </div>
                      <span className="text-sm font-semibold text-[#F1F5F9]">{formatCurrency(row.amount)}</span>
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
          <div className="grid grid-cols-2 gap-[10px] text-xs">
            <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-[18px]">
              <p className="text-[#64748B] uppercase tracking-wide text-[10px]">Goal Savings</p>
              <p className="text-sm font-bold text-[#10B981] mt-1">{formatCurrency(goalSavingsTotal)}</p>
            </div>
            <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-[18px]">
              <p className="text-[#64748B] uppercase tracking-wide text-[10px]">Investments</p>
              <p className="text-sm font-bold text-[#818CF8] mt-1">{formatCurrency(investmentsTotal)}</p>
            </div>
            <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-[18px]">
              <p className="text-[#64748B] uppercase tracking-wide text-[10px]">Combined Total</p>
              <p className="text-sm font-bold text-[#F1F5F9] mt-1">{formatCurrency(investingAssets)}</p>
            </div>
            <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-[18px]">
              <p className="text-[#64748B] uppercase tracking-wide text-[10px]">Insurance / Month</p>
              <p className="text-sm font-bold text-[#F59E0B] mt-1">{formatCurrency(lifeInsuranceMonthlyCommitment)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4">
            <h3 className="text-sm font-bold text-[#F1F5F9] pt-[18px]">Monthly Investment Contributions</h3>
            <div className="mt-3 rounded-xl border border-[#2A3345] bg-[#1C2230] px-3 py-2 text-xs">
              {activeContribution ? (
                <div className="flex items-center justify-between">
                  <span className="text-[#7A8599]">{activeContribution.label}</span>
                  <span>
                    <span className="text-[#00C896]">Goals {formatCurrency(activeContribution.goals)}</span>
                    <span className="mx-2 text-[#7A8599]">|</span>
                    <span className="text-[#7C6FF7]">Investments {formatCurrency(activeContribution.investments)}</span>
                  </span>
                </div>
              ) : (
                <p className="text-[#7A8599]">Hover/tap a bar to view month details</p>
              )}
            </div>
            {monthlyInvestmentContributions.every((row) => row.total <= 0) ? (
              <div className="text-center py-4">
                <span className="material-symbols-outlined text-[30px] text-[#2A3345]">bar_chart</span>
                <p className="text-sm text-[#64748B]">No investment data in this window.</p>
              </div>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyInvestmentContributions}
                    onMouseMove={(state) => {
                      const payload = (state as unknown as { activePayload?: Array<{ payload?: { label?: string } }> })?.activePayload;
                      const activeLabel = payload?.[0]?.payload?.label ?? null;
                      setHoveredInvestmentMonth(activeLabel);
                    }}
                    onMouseLeave={() => setHoveredInvestmentMonth(null)}
                  >
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748B" tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(Number(v))} tick={{ fontSize: 10 }} />
                    <Tooltip content={() => null} />
                    <Bar dataKey="goals" fill="#00C896" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="investments" fill="#7C6FF7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4">
            <h3 className="text-sm font-bold text-[#F1F5F9] pt-[18px]">Goal Progress Distribution</h3>
            {goalProgressDistribution.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-[#2A3345] bg-[#0D1117] p-6 text-center">
                <span className="material-symbols-outlined text-[30px] text-[#2A3345]">my_location</span>
                <p className="mt-2 text-[13px] text-[#7A8599]">Add goals to view progress distribution</p>
              </div>
            ) : (
              <>
                <div className="h-[230px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={goalProgressDistribution}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        cx="50%"
                        cy="50%"
                      >
                        {goalProgressDistribution.map((entry) => (
                          <Cell key={entry.label} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyles} formatter={(v: number | string | undefined) => `${Number(v ?? 0)} goals`} />
                      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="#94A3B8" fontSize="10">
                        Goals
                      </text>
                      <text x="50%" y="55%" textAnchor="middle" dominantBaseline="middle" fill="#F1F5F9" fontSize="16" fontWeight="800">
                        {totalGoalsCount}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {goalProgressDistribution.map((row) => (
                    <div key={row.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/08 bg-[#0F172A] text-xs text-[#94A3B8]">
                      <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} />
                      <span>{row.label}</span>
                      <span className="text-[#F1F5F9] font-semibold">{row.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-white/08 bg-[#1E293B] p-4">
            <h3 className="text-sm font-bold text-[#F1F5F9] pt-[18px] mb-3">Savings Growth</h3>
            {savingsGrowth.length < 2 ? (
              <div className="text-center py-4">
                <span className="material-symbols-outlined text-[30px] text-[#2A3345]">trending_up</span>
                <p className="text-sm text-[#64748B]">Add goals/investments to view trend.</p>
              </div>
            ) : (
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={savingsGrowth}>
                    <defs>
                      <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.30} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748B" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748B" tickLine={false} axisLine={false} tickFormatter={(v) => formatCurrency(Number(v))} tick={{ fontSize: 10 }} />
                    <Tooltip {...tooltipStyles} formatter={(v: number | string | undefined) => formatCurrency(Number(v ?? 0))} />
                    <Area type="monotone" dataKey="value" stroke="#10B981" fill="url(#savingsGradient)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {activeAnalyticsSegment === "tax" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4">
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setTaxMode("new")} className={`h-9 rounded-full text-xs font-semibold ${taxMode === "new" ? "bg-[#00C896] text-[#0D1117]" : "border border-[#2A3345] text-[#7A8599]"}`}>New Regime</button>
              <button type="button" onClick={() => setTaxMode("old")} className={`h-9 rounded-full text-xs font-semibold ${taxMode === "old" ? "bg-[#00C896] text-[#0D1117]" : "border border-[#2A3345] text-[#7A8599]"}`}>Old Regime</button>
              <button type="button" onClick={() => setTaxMode("compare")} className={`h-9 rounded-full text-xs font-semibold ${taxMode === "compare" ? "bg-[#00C896] text-[#0D1117]" : "border border-[#2A3345] text-[#7A8599]"}`}>Compare</button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4 space-y-2">
            <h3 className="text-sm font-bold text-[#F1F5F9] pt-[18px]">Income Details</h3>
            <input value={taxGrossSalary} onChange={(e) => setTaxGrossSalary(e.target.value)} inputMode="decimal" placeholder="Annual Gross Salary (INR)" className="w-full h-11 rounded-xl border border-[#2A3345] bg-[#0D1117] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            <input value={taxOtherIncome} onChange={(e) => setTaxOtherIncome(e.target.value)} inputMode="decimal" placeholder="Other Income (INR)" className="w-full h-11 rounded-xl border border-[#2A3345] bg-[#0D1117] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
          </div>

          {(taxMode === "old" || taxMode === "compare") && (
            <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4 space-y-2">
              <h3 className="text-sm font-bold text-[#F1F5F9] pt-[18px]">Deductions</h3>
              <div className="grid grid-cols-2 gap-2">
                <input value={tax80C} onChange={(e) => setTax80C(e.target.value)} inputMode="decimal" placeholder="80C (max 1,50,000)" className="h-10 rounded-xl border border-[#2A3345] bg-[#0D1117] px-3 text-xs text-[#e6edf3] outline-none focus:border-[#00C896]" />
                <input value={tax80D} onChange={(e) => setTax80D(e.target.value)} inputMode="decimal" placeholder="80D (max 75,000)" className="h-10 rounded-xl border border-[#2A3345] bg-[#0D1117] px-3 text-xs text-[#e6edf3] outline-none focus:border-[#00C896]" />
                <input value={taxHra} onChange={(e) => setTaxHra(e.target.value)} inputMode="decimal" placeholder="HRA" className="h-10 rounded-xl border border-[#2A3345] bg-[#0D1117] px-3 text-xs text-[#e6edf3] outline-none focus:border-[#00C896]" />
                <input value={taxNps} onChange={(e) => setTaxNps(e.target.value)} inputMode="decimal" placeholder="80CCD(1B) NPS (max 50,000)" className="h-10 rounded-xl border border-[#2A3345] bg-[#0D1117] px-3 text-xs text-[#e6edf3] outline-none focus:border-[#00C896]" />
                <input value={taxHomeLoan} onChange={(e) => setTaxHomeLoan(e.target.value)} inputMode="decimal" placeholder="Home Loan Sec24 (max 2,00,000)" className="h-10 rounded-xl border border-[#2A3345] bg-[#0D1117] px-3 text-xs text-[#e6edf3] outline-none focus:border-[#00C896]" />
                <input value={taxOtherDeduction} onChange={(e) => setTaxOtherDeduction(e.target.value)} inputMode="decimal" placeholder="Other Deductions" className="h-10 rounded-xl border border-[#2A3345] bg-[#0D1117] px-3 text-xs text-[#e6edf3] outline-none focus:border-[#00C896]" />
              </div>
            </div>
          )}

          <div className="rounded-full border border-[#2A3345] bg-[#161B22] px-3 py-2 text-xs text-[#7A8599]">
            {taxMode === "new" ? "Standard deduction 75,000 auto-applied. Zero tax if taxable income <= 12,00,000 (Rebate 87A)." : taxMode === "old" ? "Standard deduction 50,000 auto-applied." : "New: standard deduction 75,000 and Old: standard deduction 50,000."}
          </div>

          <button type="button" disabled={!taxHasInput} onClick={() => setTaxCalculated(true)} className="h-11 w-full rounded-xl bg-[#00C896] text-[#06221a] font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
            Calculate Tax -&gt;
          </button>

          {taxCalculated && (
            <>
              <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4">
                <p className="text-xs text-[#7A8599]">Total Tax Payable</p>
                <p className={`text-3xl font-black ${(taxComputed.selected.effectiveRate ?? 0) >= 25 ? "text-[#FF6B6B]" : "text-[#00C896]"}`}>
                  {formatCurrency(taxComputed.selected.totalTax)}
                </p>
                <p className="mt-2 text-xs text-[#7A8599]">
                  Effective Tax Rate: {taxComputed.selected.effectiveRate === null ? "--" : `${taxComputed.selected.effectiveRate.toFixed(2)}%`}
                </p>
                <div className="mt-1 h-2 rounded-full bg-[#2A3345]">
                  <div className="h-full rounded-full bg-[#00C896]" style={{ width: `${Math.min(taxComputed.selected.effectiveRate ?? 0, 100)}%` }} />
                </div>
              </div>

              <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4">
                <h3 className="text-sm font-bold text-[#F1F5F9] pt-[18px]">Breakdown</h3>
                <div className="mt-2 space-y-2 text-sm">
                  {[
                    ["Gross Income", taxComputed.selected.grossIncome],
                    ["Total Deductions", taxComputed.selected.totalDeductions],
                    ["Taxable Income", taxComputed.selected.taxableIncome],
                    ["Income Tax", taxComputed.selected.incomeTax],
                    ["Rebate 87A", taxComputed.selected.rebate87A],
                    ["Cess 4%", taxComputed.selected.cess],
                    ["Net Tax Payable", taxComputed.selected.totalTax],
                    ["Monthly TDS", taxComputed.selected.monthlyTds],
                    ["Estimated Monthly In-Hand", taxComputed.selected.monthlyInHand],
                  ].map(([label, value]) => {
                    const labelText = String(label);
                    const isTaxMetric =
                      labelText === "Income Tax" ||
                      labelText === "Cess 4%" ||
                      labelText === "Net Tax Payable" ||
                      labelText === "Monthly TDS";
                    return (
                      <div key={labelText} className="flex items-center justify-between border-b border-[#2A3345] pb-1">
                        <span className="text-[#7A8599]">{labelText}</span>
                        <span className={`font-semibold ${isTaxMetric ? "text-[#F5A623]" : "text-[#F1F5F9]"}`}>{formatCurrency(Number(value))}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4">
                <h3 className="text-sm font-bold text-[#F1F5F9] pt-[18px]">Slab Breakup</h3>
                <div className="mt-2 space-y-2 text-sm">
                  {taxComputed.selected.slabBreakup.map((slab) => (
                    <div key={slab.label} className="rounded-xl border border-[#2A3345] bg-[#0D1117] px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[#7A8599]">{slab.label}</span>
                        <span className="text-[#F5A623] font-semibold">{(slab.rate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-[#64748B]">Taxable: {formatCurrency(slab.taxableAmount)}</span>
                        <span className="text-[#F5A623]">Tax: {formatCurrency(slab.taxAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {taxComputed.selected.zeroTaxByRebate && <p className="mt-3 text-sm font-semibold text-[#00C896]">🎉 Zero Tax — 87A Rebate Applied</p>}
              </div>

              {taxMode === "compare" && (
                <div className="rounded-2xl border border-[#2A3345] bg-[#161B22] p-4">
                  <h3 className="text-sm font-bold text-[#F1F5F9] pt-[18px]">Comparison</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-[#2A3345] bg-[#0D1117] p-3">
                      <p className="text-xs text-[#7A8599]">New Regime</p>
                      <p className="text-lg font-bold text-[#00C896]">{formatCurrency(taxComputed.compare.newRegime.totalTax)}</p>
                    </div>
                    <div className="rounded-xl border border-[#2A3345] bg-[#0D1117] p-3">
                      <p className="text-xs text-[#7A8599]">Old Regime</p>
                      <p className="text-lg font-bold text-[#F5A623]">{formatCurrency(taxComputed.compare.oldRegime.totalTax)}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[#F1F5F9]">
                    Winner:{" "}
                    <span className="inline-flex rounded-full border border-[#00C896]/45 bg-[#00C896]/12 px-2 py-0.5 font-semibold text-[#00C896]">
                      {taxComputed.compare.winner === "new" ? "New Regime" : "Old Regime"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#00C896]">Savings: {formatCurrency(taxComputed.compare.savings)}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}


