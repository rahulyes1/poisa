"use client";

import { useMemo, useState } from "react";
import ChipButton from "../forms/ChipButton";
import { computeTaxComparison, computeTaxForRegime, TaxRegime } from "./taxLogic";

export type CalculatorType = "budget_burn" | "sip" | "goal" | "lending" | "freedom" | "tax";
type LendingCalculatorTab = "emi" | "affordability";
type TenureUnit = "months" | "years";

export interface CalculatorPrefills {
  monthlyBudget?: number;
  totalSpentSoFar?: number;
  currentDayOfMonth?: number;
  existingEmis?: number;
  currentMonthlyExpenses?: number;
  currentNetWorth?: number;
}

interface CalculatorModalProps {
  isOpen: boolean;
  type: CalculatorType | null;
  initialLendingTab?: LendingCalculatorTab;
  prefills?: CalculatorPrefills;
  onClose: () => void;
}

const DEFAULTS = {
  sipRate: 12,
  goalRate: 10,
  affordabilityRate: 10,
  freedomRate: 7,
  inflationRate: 6,
};

const parseNumber = (value: string) => {
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned) {
    return null;
  }
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

const toFixed2 = (value: number) => Number(value.toFixed(2));

const formatCurrency = (value: number | null) => {
  if (value === null || !Number.isFinite(value) || value < 0) {
    return "--";
  }
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNumber = (value: number | null, suffix = "") => {
  if (value === null || !Number.isFinite(value) || value < 0) {
    return "--";
  }
  return `${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
};

const getDaysInCurrentMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
};

const statusClass = {
  on_track: "text-[#10B981]",
  at_risk: "text-[#F5A623]",
  over_budget: "text-[#FF6B6B]",
  neutral: "text-[#7d8590]",
};

export default function CalculatorModal({
  isOpen,
  type,
  initialLendingTab = "emi",
  prefills,
  onClose,
}: CalculatorModalProps) {
  const [lendingTab, setLendingTab] = useState<LendingCalculatorTab>(initialLendingTab);

  const [budgetAmount, setBudgetAmount] = useState(String(prefills?.monthlyBudget ?? 0));
  const [budgetSpent, setBudgetSpent] = useState(String(prefills?.totalSpentSoFar ?? 0));
  const [budgetDay, setBudgetDay] = useState(String(prefills?.currentDayOfMonth ?? new Date().getDate()));

  const [sipMonthly, setSipMonthly] = useState("");
  const [sipRate, setSipRate] = useState(String(DEFAULTS.sipRate));
  const [sipYears, setSipYears] = useState("");

  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("0");
  const [goalRate, setGoalRate] = useState(String(DEFAULTS.goalRate));
  const [goalYears, setGoalYears] = useState("");

  const [emiLoanAmount, setEmiLoanAmount] = useState("");
  const [emiRate, setEmiRate] = useState("");
  const [emiTenure, setEmiTenure] = useState("");
  const [emiTenureUnit, setEmiTenureUnit] = useState<TenureUnit>("months");

  const [affIncome, setAffIncome] = useState("");
  const [affExistingEmi, setAffExistingEmi] = useState(String(prefills?.existingEmis ?? 0));
  const [affRate, setAffRate] = useState(String(DEFAULTS.affordabilityRate));
  const [affTenureMonths, setAffTenureMonths] = useState("");

  const [freedomMonthlyExpenses, setFreedomMonthlyExpenses] = useState(String(prefills?.currentMonthlyExpenses ?? 0));
  const [freedomNetWorth, setFreedomNetWorth] = useState(String(prefills?.currentNetWorth ?? 0));
  const [freedomReturn, setFreedomReturn] = useState(String(DEFAULTS.freedomRate));
  const [freedomInflation, setFreedomInflation] = useState(String(DEFAULTS.inflationRate));
  const [freedomMonthlySavings, setFreedomMonthlySavings] = useState("");
  const [freedomTargetYears, setFreedomTargetYears] = useState("15");

  const [taxRegimeMode, setTaxRegimeMode] = useState<"new" | "old" | "compare">("new");
  const [taxGrossSalary, setTaxGrossSalary] = useState("");
  const [taxOtherIncome, setTaxOtherIncome] = useState("");
  const [tax80C, setTax80C] = useState("");
  const [tax80D, setTax80D] = useState("");
  const [taxHra, setTaxHra] = useState("");
  const [taxNps, setTaxNps] = useState("");
  const [taxHomeLoan, setTaxHomeLoan] = useState("");
  const [taxOtherDeduction, setTaxOtherDeduction] = useState("");

  const budgetOutputs = useMemo(() => {
    const budget = parseNumber(budgetAmount);
    const spent = parseNumber(budgetSpent);
    const currentDay = parseNumber(budgetDay);
    const daysInMonth = getDaysInCurrentMonth();

    if (budget === null || spent === null || currentDay === null || currentDay <= 0) {
      return {
        dailyAvg: null,
        projectedTotal: null,
        daysUntilExhausted: null,
        status: "neutral" as keyof typeof statusClass,
        statusLabel: "--",
      };
    }

    const dailyAvg = spent / currentDay;
    const projectedTotal = dailyAvg * daysInMonth;
    const remaining = budget - spent;
    const daysUntilExhausted = dailyAvg > 0 && remaining > 0 ? remaining / dailyAvg : null;

    let status: keyof typeof statusClass = "on_track";
    let statusLabel = "On Track";
    if (spent > budget) {
      status = "over_budget";
      statusLabel = "Over Budget";
    } else if (projectedTotal > budget) {
      status = "at_risk";
      statusLabel = "At Risk";
    }

    return {
      dailyAvg: toFixed2(dailyAvg),
      projectedTotal: toFixed2(projectedTotal),
      daysUntilExhausted: daysUntilExhausted !== null ? toFixed2(daysUntilExhausted) : null,
      status,
      statusLabel,
    };
  }, [budgetAmount, budgetDay, budgetSpent]);

  const sipOutputs = useMemo(() => {
    const monthly = parseNumber(sipMonthly);
    const annualRate = parseNumber(sipRate);
    const years = parseNumber(sipYears);
    if (monthly === null || annualRate === null || years === null || monthly < 0 || years <= 0 || annualRate < 0) {
      return { invested: null, returns: null, futureValue: null, wealthGained: null };
    }

    const r = annualRate / 12 / 100;
    const n = Math.round(years * 12);
    if (n <= 0) {
      return { invested: null, returns: null, futureValue: null, wealthGained: null };
    }

    const invested = monthly * n;
    const futureValue =
      r === 0
        ? monthly * n
        : monthly * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    const returns = futureValue - invested;

    return {
      invested: toFixed2(invested),
      returns: toFixed2(returns),
      futureValue: toFixed2(futureValue),
      wealthGained: toFixed2(returns),
    };
  }, [sipMonthly, sipRate, sipYears]);

  const goalOutputs = useMemo(() => {
    const target = parseNumber(goalTarget);
    const current = parseNumber(goalCurrent);
    const annualRate = parseNumber(goalRate);
    const years = parseNumber(goalYears);

    if (target === null || current === null || annualRate === null || years === null || target <= 0 || years <= 0 || annualRate < 0) {
      return { requiredMonthly: null, totalInvested: null, returns: null };
    }

    const r = annualRate / 12 / 100;
    const n = Math.round(years * 12);
    if (n <= 0) {
      return { requiredMonthly: null, totalInvested: null, returns: null };
    }

    const currentFuture = current * Math.pow(1 + r, n);
    const remaining = target - currentFuture;
    const pmt =
      remaining <= 0
        ? 0
        : r === 0
          ? remaining / n
          : (remaining * r) / (Math.pow(1 + r, n) - 1);

    const totalInvested = pmt * n;
    const returns = Math.max(target - (current + totalInvested), 0);

    return {
      requiredMonthly: toFixed2(pmt),
      totalInvested: toFixed2(totalInvested),
      returns: toFixed2(returns),
    };
  }, [goalCurrent, goalRate, goalTarget, goalYears]);

  const emiOutputs = useMemo(() => {
    const principal = parseNumber(emiLoanAmount);
    const annualRate = parseNumber(emiRate);
    const tenureValue = parseNumber(emiTenure);

    if (principal === null || annualRate === null || tenureValue === null || principal <= 0 || annualRate < 0 || tenureValue <= 0) {
      return { emi: null, totalPayable: null, totalInterest: null, principalPct: 0, interestPct: 0 };
    }

    const months = Math.round(emiTenureUnit === "years" ? tenureValue * 12 : tenureValue);
    if (months <= 0) {
      return { emi: null, totalPayable: null, totalInterest: null, principalPct: 0, interestPct: 0 };
    }

    const r = annualRate / 12 / 100;
    const emi =
      r === 0
        ? principal / months
        : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    const totalPayable = emi * months;
    const totalInterest = Math.max(totalPayable - principal, 0);
    const principalPct = totalPayable > 0 ? (principal / totalPayable) * 100 : 0;
    const interestPct = totalPayable > 0 ? (totalInterest / totalPayable) * 100 : 0;

    return {
      emi: toFixed2(emi),
      totalPayable: toFixed2(totalPayable),
      totalInterest: toFixed2(totalInterest),
      principalPct,
      interestPct,
    };
  }, [emiLoanAmount, emiRate, emiTenure, emiTenureUnit]);

  const affordabilityOutputs = useMemo(() => {
    const income = parseNumber(affIncome);
    const existingEmis = parseNumber(affExistingEmi);
    const annualRate = parseNumber(affRate);
    const tenureMonths = parseNumber(affTenureMonths);

    if (income === null || existingEmis === null || annualRate === null || tenureMonths === null || income <= 0 || annualRate < 0 || tenureMonths <= 0) {
      return { maxEmi: null, maxLoan: null, comfort: "neutral" as keyof typeof statusClass, comfortLabel: "--" };
    }

    const maxEmi = income * 0.4 - existingEmis;
    if (maxEmi <= 0) {
      return { maxEmi: null, maxLoan: null, comfort: "over_budget" as keyof typeof statusClass, comfortLabel: "Overloaded" };
    }

    const r = annualRate / 12 / 100;
    const n = Math.round(tenureMonths);
    const maxLoan =
      r === 0
        ? maxEmi * n
        : maxEmi * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));

    const burdenRatio = existingEmis / income;
    let comfort: keyof typeof statusClass = "on_track";
    let comfortLabel = "Comfortable";
    if (burdenRatio > 0.35) {
      comfort = "over_budget";
      comfortLabel = "Overloaded";
    } else if (burdenRatio > 0.2) {
      comfort = "at_risk";
      comfortLabel = "Stretched";
    }

    return {
      maxEmi: toFixed2(maxEmi),
      maxLoan: toFixed2(maxLoan),
      comfort,
      comfortLabel,
    };
  }, [affExistingEmi, affIncome, affRate, affTenureMonths]);

  const freedomOutputs = useMemo(() => {
    const monthlyExpenses = parseNumber(freedomMonthlyExpenses);
    const netWorth = parseNumber(freedomNetWorth);
    const annualReturn = parseNumber(freedomReturn);
    const annualInflation = parseNumber(freedomInflation);
    const monthlySavings = parseNumber(freedomMonthlySavings);
    const targetYears = parseNumber(freedomTargetYears);

    if (
      monthlyExpenses === null ||
      netWorth === null ||
      annualReturn === null ||
      annualInflation === null ||
      monthlySavings === null ||
      targetYears === null ||
      monthlyExpenses <= 0 ||
      netWorth < 0 ||
      monthlySavings < 0 ||
      targetYears <= 0
    ) {
      return { freedomNumber: null, yearsToFreedom: null, monthlyRequired: null };
    }

    const realReturn = (annualReturn - annualInflation) / 100;
    if (realReturn <= 0) {
      return { freedomNumber: null, yearsToFreedom: null, monthlyRequired: null };
    }

    const annualExpenses = monthlyExpenses * 12;
    const freedomNumber = annualExpenses / realReturn;
    const monthlyRealRate = realReturn / 12;

    let yearsToFreedom: number | null = null;
    if (monthlySavings > 0 || netWorth > 0) {
      let corpus = netWorth;
      for (let month = 1; month <= 1200; month += 1) {
        corpus = corpus * (1 + monthlyRealRate) + monthlySavings;
        if (corpus >= freedomNumber) {
          yearsToFreedom = month / 12;
          break;
        }
      }
    }

    const n = Math.round(targetYears * 12);
    let monthlyRequired: number | null = null;
    if (n > 0) {
      const futureCurrent = netWorth * Math.pow(1 + monthlyRealRate, n);
      const remaining = freedomNumber - futureCurrent;
      if (remaining <= 0) {
        monthlyRequired = 0;
      } else if (monthlyRealRate === 0) {
        monthlyRequired = remaining / n;
      } else {
        monthlyRequired = (remaining * monthlyRealRate) / (Math.pow(1 + monthlyRealRate, n) - 1);
      }
    }

    return {
      freedomNumber: toFixed2(freedomNumber),
      yearsToFreedom: yearsToFreedom === null ? null : toFixed2(yearsToFreedom),
      monthlyRequired: monthlyRequired === null ? null : toFixed2(Math.max(monthlyRequired, 0)),
    };
  }, [freedomInflation, freedomMonthlyExpenses, freedomMonthlySavings, freedomNetWorth, freedomReturn, freedomTargetYears]);

  const taxOutputs = useMemo(() => {
    const gross = parseNumber(taxGrossSalary) ?? 0;
    const other = parseNumber(taxOtherIncome) ?? 0;
    const input = {
      annualGrossSalary: gross,
      otherIncome: other,
      deductions: {
        section80C: parseNumber(tax80C) ?? 0,
        section80D: parseNumber(tax80D) ?? 0,
        hra: parseNumber(taxHra) ?? 0,
        section80CCD1B: parseNumber(taxNps) ?? 0,
        homeLoanInterest24: parseNumber(taxHomeLoan) ?? 0,
        otherDeductions: parseNumber(taxOtherDeduction) ?? 0,
      },
    };

    const compare = computeTaxComparison(input);
    const selected =
      taxRegimeMode === "compare"
        ? compare.winner === "new"
          ? compare.newRegime
          : compare.oldRegime
        : computeTaxForRegime(input, taxRegimeMode as TaxRegime);

    return {
      compare,
      selected,
      hasInput: gross > 0 || other > 0,
    };
  }, [
    tax80C,
    tax80D,
    taxGrossSalary,
    taxHra,
    taxHomeLoan,
    taxNps,
    taxOtherDeduction,
    taxOtherIncome,
    taxRegimeMode,
  ]);

  const title = useMemo(() => {
    if (type === "budget_burn") return "Budget Burn Rate Calculator";
    if (type === "sip") return "SIP Calculator";
    if (type === "goal") return "Goal Calculator";
    if (type === "lending") return "Lending Calculator";
    if (type === "freedom") return "Financial Freedom Calculator";
    if (type === "tax") return "Tax Calculator";
    return "Calculator";
  }, [type]);

  const ctaLabel = useMemo(() => {
    if (type === "budget_burn") return "Apply to Spending";
    if (type === "sip" || type === "goal") return "Apply to Investing";
    if (type === "lending") return "Apply to Lending";
    if (type === "tax") return "Apply to Analytics";
    return "Apply to Analytics";
  }, [type]);

  if (!isOpen || !type) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-[520px] h-[85dvh] max-h-[85dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#2d333b] bg-[#0D1117] p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#2d333b]" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#e6edf3]">{title}</h2>
          <button type="button" onClick={onClose} className="text-[#7d8590]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {type === "budget_burn" && (
          <div className="space-y-3">
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Monthly Budget (₹)</p>
              <input value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Total Spent So Far (₹)</p>
              <input value={budgetSpent} onChange={(e) => setBudgetSpent(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Current Day of Month</p>
              <input value={budgetDay} onChange={(e) => setBudgetDay(e.target.value)} inputMode="numeric" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>

            <div className="rounded-2xl border border-[#2d333b] bg-[#161B22] p-3 space-y-1.5">
              <p className="text-xs poisa-muted">Daily Avg Spend</p>
              <p className="text-sm text-[#e6edf3] font-semibold">{formatCurrency(budgetOutputs.dailyAvg)}</p>
              <p className="text-xs poisa-muted">Projected Month-end Total</p>
              <p className="text-sm text-[#e6edf3] font-semibold">{formatCurrency(budgetOutputs.projectedTotal)}</p>
              <p className="text-xs poisa-muted">Days Until Budget Runs Out</p>
              <p className="text-sm text-[#e6edf3] font-semibold">{formatNumber(budgetOutputs.daysUntilExhausted, " days")}</p>
              <p className={`text-sm font-bold ${statusClass[budgetOutputs.status]}`}>{budgetOutputs.statusLabel}</p>
            </div>
          </div>
        )}

        {type === "sip" && (
          <div className="space-y-3">
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Monthly Investment Amount (₹)</p>
              <input value={sipMonthly} onChange={(e) => setSipMonthly(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Expected Annual Return (%)</p>
              <input value={sipRate} onChange={(e) => setSipRate(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Investment Period (Years)</p>
              <input value={sipYears} onChange={(e) => setSipYears(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>
            <div className="rounded-2xl border border-[#2d333b] bg-[#161B22] p-3 space-y-1.5">
              <p className="text-xs poisa-muted">Total Amount Invested</p>
              <p className="text-sm text-[#e6edf3] font-semibold">{formatCurrency(sipOutputs.invested)}</p>
              <p className="text-xs poisa-muted">Estimated Returns</p>
              <p className="text-sm text-[#e6edf3] font-semibold">{formatCurrency(sipOutputs.returns)}</p>
              <p className="text-xs poisa-muted">Total Future Value</p>
              <p className="text-2xl font-black text-[#00C896]">{formatCurrency(sipOutputs.futureValue)}</p>
              <p className="text-xs poisa-muted">Wealth Gained</p>
              <p className="text-sm text-[#e6edf3] font-semibold">{formatCurrency(sipOutputs.wealthGained)}</p>
            </div>
          </div>
        )}

        {type === "goal" && (
          <div className="space-y-3">
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Target Amount (₹)</p>
              <input value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Current Savings (₹)</p>
              <input value={goalCurrent} onChange={(e) => setGoalCurrent(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Expected Annual Return (%)</p>
              <input value={goalRate} onChange={(e) => setGoalRate(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Time to Achieve Goal (Years)</p>
              <input value={goalYears} onChange={(e) => setGoalYears(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>

            <div className="rounded-2xl border border-[#2d333b] bg-[#161B22] p-3 space-y-1.5">
              <p className="text-xs poisa-muted">Required Monthly Investment</p>
              <p className="text-2xl font-black text-[#00C896]">{formatCurrency(goalOutputs.requiredMonthly)}</p>
              <p className="text-xs poisa-muted">Total You Will Invest</p>
              <p className="text-sm text-[#e6edf3] font-semibold">{formatCurrency(goalOutputs.totalInvested)}</p>
              <p className="text-xs poisa-muted">Returns Generated</p>
              <p className="text-sm text-[#e6edf3] font-semibold">{formatCurrency(goalOutputs.returns)}</p>
            </div>
          </div>
        )}

        {type === "lending" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <ChipButton active={lendingTab === "emi"} accent="orange" onClick={() => setLendingTab("emi")}>
                EMI
              </ChipButton>
              <ChipButton active={lendingTab === "affordability"} accent="orange" onClick={() => setLendingTab("affordability")}>
                Affordability
              </ChipButton>
            </div>

            {lendingTab === "emi" ? (
              <div className="space-y-3">
                <label className="block">
                  <p className="text-xs poisa-muted mb-1">Loan Amount (₹)</p>
                  <input value={emiLoanAmount} onChange={(e) => setEmiLoanAmount(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
                </label>
                <label className="block">
                  <p className="text-xs poisa-muted mb-1">Annual Interest Rate (%)</p>
                  <input value={emiRate} onChange={(e) => setEmiRate(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
                </label>
                <label className="block">
                  <p className="text-xs poisa-muted mb-1">Loan Tenure</p>
                  <div className="flex gap-2">
                    <input value={emiTenure} onChange={(e) => setEmiTenure(e.target.value)} inputMode="decimal" className="flex-1 h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
                    <ChipButton compact accent="orange" active={emiTenureUnit === "months"} onClick={() => setEmiTenureUnit("months")}>
                      Months
                    </ChipButton>
                    <ChipButton compact accent="orange" active={emiTenureUnit === "years"} onClick={() => setEmiTenureUnit("years")}>
                      Years
                    </ChipButton>
                  </div>
                </label>

                <div className="rounded-2xl border border-[#2d333b] bg-[#161B22] p-3 space-y-1.5">
                  <p className="text-xs poisa-muted">Monthly EMI</p>
                  <p className="text-2xl font-black text-[#00C896]">{formatCurrency(emiOutputs.emi)}</p>
                  <p className="text-xs poisa-muted">Total Amount Payable</p>
                  <p className="text-sm text-[#e6edf3] font-semibold">{formatCurrency(emiOutputs.totalPayable)}</p>
                  <p className="text-xs poisa-muted">Total Interest Payable</p>
                  <p className="text-sm text-[#e6edf3] font-semibold">{formatCurrency(emiOutputs.totalInterest)}</p>

                  <div className="pt-1">
                    <p className="text-xs poisa-muted mb-1">Principal vs Interest</p>
                    <div className="h-2 w-full rounded-full bg-[#0D1117] overflow-hidden flex">
                      <div style={{ width: `${emiOutputs.principalPct}%` }} className="bg-[#00C896] h-full" />
                      <div style={{ width: `${emiOutputs.interestPct}%` }} className="bg-[#FF6B6B] h-full" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block">
                  <p className="text-xs poisa-muted mb-1">Monthly Income (₹)</p>
                  <input value={affIncome} onChange={(e) => setAffIncome(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
                </label>
                <label className="block">
                  <p className="text-xs poisa-muted mb-1">Existing Monthly EMIs (₹)</p>
                  <input value={affExistingEmi} onChange={(e) => setAffExistingEmi(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
                </label>
                <label className="block">
                  <p className="text-xs poisa-muted mb-1">Annual Interest Rate (%)</p>
                  <input value={affRate} onChange={(e) => setAffRate(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
                </label>
                <label className="block">
                  <p className="text-xs poisa-muted mb-1">Desired Tenure (Months)</p>
                  <input value={affTenureMonths} onChange={(e) => setAffTenureMonths(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
                </label>

                <div className="rounded-2xl border border-[#2d333b] bg-[#161B22] p-3 space-y-1.5">
                  <p className="text-xs poisa-muted">Maximum Affordable EMI</p>
                  <p className="text-2xl font-black text-[#00C896]">{formatCurrency(affordabilityOutputs.maxEmi)}</p>
                  <p className="text-xs poisa-muted">Maximum Loan Eligible</p>
                  <p className="text-sm text-[#e6edf3] font-semibold">{formatCurrency(affordabilityOutputs.maxLoan)}</p>
                  <p className={`text-sm font-bold ${statusClass[affordabilityOutputs.comfort]}`}>Comfort Zone: {affordabilityOutputs.comfortLabel}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {type === "freedom" && (
          <div className="space-y-3">
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Current Monthly Expenses (₹)</p>
              <input value={freedomMonthlyExpenses} onChange={(e) => setFreedomMonthlyExpenses(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Current Net Worth / Savings (₹)</p>
              <input value={freedomNetWorth} onChange={(e) => setFreedomNetWorth(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Expected Annual Return on Corpus (%)</p>
              <input value={freedomReturn} onChange={(e) => setFreedomReturn(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Annual Expense Inflation (%)</p>
              <input value={freedomInflation} onChange={(e) => setFreedomInflation(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Monthly Savings (₹)</p>
              <input value={freedomMonthlySavings} onChange={(e) => setFreedomMonthlySavings(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Target Years (for required monthly savings)</p>
              <input value={freedomTargetYears} onChange={(e) => setFreedomTargetYears(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>

            <div className="rounded-2xl border border-[#2d333b] bg-[#161B22] p-3 space-y-1.5">
              <p className="text-xs poisa-muted">Freedom Number (Corpus Needed)</p>
              <p className="text-2xl font-black text-[#00C896]">{formatCurrency(freedomOutputs.freedomNumber)}</p>
              <p className="text-xs poisa-muted">Years to Freedom (current savings rate)</p>
              <p className="text-sm text-[#e6edf3] font-semibold">{formatNumber(freedomOutputs.yearsToFreedom, " years")}</p>
              <p className="text-xs poisa-muted">Monthly Savings Required to reach in target years</p>
              <p className="text-sm text-[#e6edf3] font-semibold">{formatCurrency(freedomOutputs.monthlyRequired)}</p>
            </div>
          </div>
        )}

        {type === "tax" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <ChipButton active={taxRegimeMode === "new"} accent="teal" onClick={() => setTaxRegimeMode("new")}>
                New
              </ChipButton>
              <ChipButton active={taxRegimeMode === "old"} accent="teal" onClick={() => setTaxRegimeMode("old")}>
                Old
              </ChipButton>
              <ChipButton active={taxRegimeMode === "compare"} accent="teal" onClick={() => setTaxRegimeMode("compare")}>
                Compare
              </ChipButton>
            </div>

            <label className="block">
              <p className="text-xs poisa-muted mb-1">Annual Gross Salary (INR)</p>
              <input value={taxGrossSalary} onChange={(e) => setTaxGrossSalary(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>
            <label className="block">
              <p className="text-xs poisa-muted mb-1">Other Income (INR)</p>
              <input value={taxOtherIncome} onChange={(e) => setTaxOtherIncome(e.target.value)} inputMode="decimal" className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-[#e6edf3] outline-none focus:border-[#00C896]" />
            </label>

            {(taxRegimeMode === "old" || taxRegimeMode === "compare") && (
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="80C" value={tax80C} onChange={(e) => setTax80C(e.target.value)} inputMode="decimal" className="h-10 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-xs text-[#e6edf3] outline-none focus:border-[#00C896]" />
                <input placeholder="80D" value={tax80D} onChange={(e) => setTax80D(e.target.value)} inputMode="decimal" className="h-10 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-xs text-[#e6edf3] outline-none focus:border-[#00C896]" />
                <input placeholder="HRA" value={taxHra} onChange={(e) => setTaxHra(e.target.value)} inputMode="decimal" className="h-10 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-xs text-[#e6edf3] outline-none focus:border-[#00C896]" />
                <input placeholder="80CCD(1B)" value={taxNps} onChange={(e) => setTaxNps(e.target.value)} inputMode="decimal" className="h-10 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-xs text-[#e6edf3] outline-none focus:border-[#00C896]" />
                <input placeholder="Home Loan Sec24" value={taxHomeLoan} onChange={(e) => setTaxHomeLoan(e.target.value)} inputMode="decimal" className="h-10 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-xs text-[#e6edf3] outline-none focus:border-[#00C896]" />
                <input placeholder="Other Deductions" value={taxOtherDeduction} onChange={(e) => setTaxOtherDeduction(e.target.value)} inputMode="decimal" className="h-10 rounded-xl border border-[#2d333b] bg-[#161B22] px-3 text-xs text-[#e6edf3] outline-none focus:border-[#00C896]" />
              </div>
            )}

            {taxRegimeMode !== "compare" && (
              <div className="rounded-2xl border border-[#2d333b] bg-[#161B22] p-3 space-y-1.5">
                <p className="text-xs poisa-muted">Total Tax Payable</p>
                <p className="text-2xl font-black text-[#00C896]">{formatCurrency(taxOutputs.selected.totalTax)}</p>
                <p className="text-xs poisa-muted">Taxable Income</p>
                <p className="text-sm text-[#e6edf3] font-semibold">{formatCurrency(taxOutputs.selected.taxableIncome)}</p>
                <p className="text-xs poisa-muted">Monthly TDS</p>
                <p className="text-sm text-[#F5A623] font-semibold">{formatCurrency(taxOutputs.selected.monthlyTds)}</p>
                <p className="text-xs poisa-muted">Monthly In-Hand</p>
                <p className="text-sm text-[#e6edf3] font-semibold">{formatCurrency(taxOutputs.selected.monthlyInHand)}</p>
                {taxOutputs.selected.zeroTaxByRebate && (
                  <p className="text-xs font-semibold text-[#00C896]">Zero Tax - 87A Rebate Applied</p>
                )}
              </div>
            )}

            {taxRegimeMode === "compare" && (
              <div className="rounded-2xl border border-[#2d333b] bg-[#161B22] p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl border border-[#2d333b] bg-[#0D1117] p-2">
                    <p className="poisa-muted">New Regime</p>
                    <p className="font-semibold text-[#00C896]">{formatCurrency(taxOutputs.compare.newRegime.totalTax)}</p>
                  </div>
                  <div className="rounded-xl border border-[#2d333b] bg-[#0D1117] p-2">
                    <p className="poisa-muted">Old Regime</p>
                    <p className="font-semibold text-[#F5A623]">{formatCurrency(taxOutputs.compare.oldRegime.totalTax)}</p>
                  </div>
                </div>
                <p className="text-xs text-[#e6edf3]">
                  Better: <span className="font-semibold text-[#00C896]">{taxOutputs.compare.winner === "new" ? "New Regime" : "Old Regime"}</span>
                </p>
                <p className="text-sm font-bold text-[#00C896]">Savings: {formatCurrency(taxOutputs.compare.savings)}</p>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full h-11 rounded-xl bg-[#00C896] text-[#06221a] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={type === "tax" && !taxOutputs.hasInput}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
