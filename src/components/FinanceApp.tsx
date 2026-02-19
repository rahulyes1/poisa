"use client";

import { useMemo, useState } from "react";
import Header from "./Header";
import BottomNav from "./BottomNav";
import FloatingCard from "./FloatingCard";
import SpendingDashboard from "./spending/SpendingDashboard";
import BudgetSetter from "./spending/BudgetSetter";
import TransactionList from "./spending/TransactionList";
import AddExpenseModal from "./spending/AddExpenseModal";
import EditExpenseModal from "./spending/EditExpenseModal";
import SavingsOverview from "./savings/SavingsOverview";
import AddGoalModal from "./savings/AddGoalModal";
import EditGoalModal from "./savings/EditGoalModal";
import LendingOverview from "./lending/LendingOverview";
import AddLendModal from "./lending/AddLendModal";
import EditLoanModal from "./lending/EditLoanModal";
import SavingsBudgetSetter from "./savings/SavingsBudgetSetter";
import SettingsPanel from "./settings/SettingsPanel";
import CurrencyPickerModal from "./CurrencyPickerModal";
import { useFinanceStore } from "./shared/store";
import { CurrencyCode, Expense, Loan, SavingGoal, TabKey } from "./shared/types";
import AnalyticsDashboard from "./analytics/AnalyticsDashboard";

const toMonthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const shiftMonth = (month: string, diff: number) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + diff, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export default function FinanceApp() {
  const [activeTab, setActiveTab] = useState<TabKey>("spending");
  const [isDark, setIsDark] = useState(true);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddLendOpen, setIsAddLendOpen] = useState(false);
  const [editExpenseItem, setEditExpenseItem] = useState<Expense | null>(null);
  const [editGoalItem, setEditGoalItem] = useState<SavingGoal | null>(null);
  const [editLoanItem, setEditLoanItem] = useState<Loan | null>(null);
  const [showSpendingBudgetSetter, setShowSpendingBudgetSetter] = useState(false);
  const [showSavingsBudgetSetter, setShowSavingsBudgetSetter] = useState(false);

  const currency = useFinanceStore((state) => state.currency);
  const setCurrency = useFinanceStore((state) => state.setCurrency);
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const expenses = useFinanceStore((state) => state.expenses);
  const savingGoals = useFinanceStore((state) => state.savingGoals);
  const loans = useFinanceStore((state) => state.loans);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      return;
    }
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  };

  const monthlyExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.slice(0, 7) === selectedMonth),
    [expenses, selectedMonth],
  );

  const floatingConfig = useMemo(() => {
    const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalSaved = savingGoals.reduce((sum, goal) => sum + goal.savedAmount, 0);
    const totalLent = loans.reduce((sum, loan) => sum + loan.amount, 0);

    return {
      spending: {
        label: "Total Spent",
        amount: totalSpent,
        buttonLabel: "Add Expense",
        icon: "add",
      },
      savings: {
        label: "Total Saved",
        amount: totalSaved,
        buttonLabel: "Add Goal",
        icon: "add",
      },
      lending: {
        label: "Total Lent",
        amount: totalLent,
        buttonLabel: "Lend Money",
        icon: "handshake",
      },
    };
  }, [monthlyExpenses, savingGoals, loans]);

  const onFloatingAction = () => {
    if (activeTab === "spending") {
      setIsAddExpenseOpen(true);
      return;
    }
    if (activeTab === "savings") {
      setIsAddGoalOpen(true);
      return;
    }
    if (activeTab === "lending") {
      setIsAddLendOpen(true);
    }
  };

  const cfg = activeTab === "settings" || activeTab === "analytics" ? null : floatingConfig[activeTab];

  const onCurrencySelected = (selected: CurrencyCode) => {
    setCurrency(selected);
  };

  return (
    <div className="bg-[#0a0a0f] font-display text-[#f0f0ff] antialiased h-screen overflow-hidden flex flex-col relative">
      <CurrencyPickerModal isOpen={!currency} onSelect={onCurrencySelected} />

      <Header activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} toggleDark={toggleDark} />

      <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
          className="h-8 w-8 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] text-[#f0f0ff]"
        >
          <span className="material-symbols-outlined text-base">chevron_left</span>
        </button>

        <p className="text-sm font-semibold text-[#f0f0ff]">{toMonthLabel(selectedMonth)}</p>

        <button
          type="button"
          onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
          className="h-8 w-8 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] text-[#f0f0ff]"
        >
          <span className="material-symbols-outlined text-base">chevron_right</span>
        </button>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-24">
        <div className="px-5 pt-5 flex items-center justify-end gap-2">
          {activeTab === "spending" && (
            <button
              type="button"
              onClick={() => setShowSpendingBudgetSetter((value) => !value)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#1a1a26] text-xs font-semibold text-[#f0f0ff]"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              Budget Set
            </button>
          )}

          {activeTab === "savings" && (
            <button
              type="button"
              onClick={() => setShowSavingsBudgetSetter((value) => !value)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[#1a1a26] text-xs font-semibold text-[#f0f0ff]"
            >
              <span className="material-symbols-outlined text-base">savings</span>
              Savings Budget
            </button>
          )}
        </div>

        {activeTab === "spending" && (
          <>
            <SpendingDashboard />
            {showSpendingBudgetSetter && <BudgetSetter />}
            <TransactionList onEditExpense={setEditExpenseItem} />
          </>
        )}
        {activeTab === "savings" && (
          <>
            {showSavingsBudgetSetter && <SavingsBudgetSetter />}
            <SavingsOverview onEditGoal={setEditGoalItem} />
          </>
        )}
        {activeTab === "lending" && <LendingOverview onEditLoan={setEditLoanItem} />}
        {activeTab === "analytics" && <AnalyticsDashboard />}
        {activeTab === "settings" && <SettingsPanel />}
      </main>

      {cfg && (
        <FloatingCard
          label={cfg.label}
          amount={cfg.amount}
          buttonLabel={cfg.buttonLabel}
          icon={cfg.icon}
          onAction={onFloatingAction}
        />
      )}

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <AddExpenseModal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} />
      <EditExpenseModal key={editExpenseItem?.id ?? "edit-expense"} isOpen={Boolean(editExpenseItem)} item={editExpenseItem} onClose={() => setEditExpenseItem(null)} />
      <AddGoalModal isOpen={isAddGoalOpen} onClose={() => setIsAddGoalOpen(false)} />
      <EditGoalModal key={editGoalItem?.id ?? "edit-goal"} isOpen={Boolean(editGoalItem)} item={editGoalItem} onClose={() => setEditGoalItem(null)} />
      <AddLendModal isOpen={isAddLendOpen} onClose={() => setIsAddLendOpen(false)} />
      <EditLoanModal key={editLoanItem?.id ?? "edit-loan"} isOpen={Boolean(editLoanItem)} item={editLoanItem} onClose={() => setEditLoanItem(null)} />
    </div>
  );
}

