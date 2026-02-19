"use client";

import { useEffect, useMemo, useState } from "react";
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
import InvestmentOverview from "./investment/InvestmentOverview";
import AddInvestmentModal from "./investment/AddInvestmentModal";
import { useFinanceStore } from "./shared/store";
import { CurrencyCode, Expense, Loan, SavingGoal, TabKey } from "./shared/types";

export default function FinanceApp() {
  const [activeTab, setActiveTab] = useState<TabKey>("spending");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddLendOpen, setIsAddLendOpen] = useState(false);
  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false);
  const [editExpenseItem, setEditExpenseItem] = useState<Expense | null>(null);
  const [editGoalItem, setEditGoalItem] = useState<SavingGoal | null>(null);
  const [editLoanItem, setEditLoanItem] = useState<Loan | null>(null);
  const [showSpendingBudgetSetter, setShowSpendingBudgetSetter] = useState(false);
  const [showSavingsBudgetSetter, setShowSavingsBudgetSetter] = useState(false);

  const hasSelectedCurrency = useFinanceStore((state) => state.hasSelectedCurrency);
  const setCurrency = useFinanceStore((state) => state.setCurrency);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const expenses = useFinanceStore((state) => state.expenses);
  const investments = useFinanceStore((state) => state.investments);
  const savingGoals = useFinanceStore((state) => state.savingGoals);
  const loans = useFinanceStore((state) => state.loans);

  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    setSelectedMonth(currentMonth);
    document.documentElement.classList.add("dark");
  }, [setSelectedMonth]);

  const floatingConfig = useMemo(() => {
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalSaved = savingGoals.reduce((sum, goal) => sum + goal.savedAmount, 0);
    const totalLent = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalInvested = investments.reduce((sum, item) => sum + item.amount, 0);

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
      investment: {
        label: "Total Invested",
        amount: totalInvested,
        buttonLabel: "Add Investment",
        icon: "trending_up",
      },
    };
  }, [expenses, investments, savingGoals, loans]);

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
      return;
    }
    if (activeTab === "investment") {
      setIsAddInvestmentOpen(true);
    }
  };

  const cfg = activeTab === "settings" ? null : floatingConfig[activeTab];

  const onCurrencySelected = (selected: CurrencyCode) => {
    setCurrency(selected);
  };

  return (
    <div className="bg-[#0a0a0f] font-display text-[#f0f0ff] antialiased h-screen overflow-hidden flex flex-col relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-28 -left-20 size-72 rounded-full bg-[#7000FF]/35 blur-[90px]" />
        <div className="absolute top-1/3 -right-24 size-80 rounded-full bg-[#00D1FF]/30 blur-[110px]" />
        <div className="absolute bottom-0 left-1/4 size-72 rounded-full bg-[#7000FF]/20 blur-[100px]" />
      </div>
      <CurrencyPickerModal isOpen={!hasSelectedCurrency} onSelect={onCurrencySelected} />

      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-24">
        <div className="px-5 pt-5 flex items-center justify-end gap-2">
          {activeTab === "spending" && (
            <button
              type="button"
              onClick={() => setShowSpendingBudgetSetter((value) => !value)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-white/25 bg-white/10 text-xs font-semibold text-[#f0f0ff] backdrop-blur-[20px]"
            >
              <span className="material-symbols-outlined text-base">tune</span>
              Budget Set
            </button>
          )}

          {activeTab === "savings" && (
            <button
              type="button"
              onClick={() => setShowSavingsBudgetSetter((value) => !value)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-white/25 bg-white/10 text-xs font-semibold text-[#f0f0ff] backdrop-blur-[20px]"
            >
              <span className="material-symbols-outlined text-base">savings</span>
              Savings Budget
            </button>
          )}
        </div>

        {activeTab === "spending" && (
          <>
            {showSpendingBudgetSetter && <BudgetSetter />}
            <SpendingDashboard />
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
        {activeTab === "investment" && <InvestmentOverview />}
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
      <EditExpenseModal
        key={editExpenseItem?.id ?? "edit-expense"}
        isOpen={Boolean(editExpenseItem)}
        item={editExpenseItem}
        onClose={() => setEditExpenseItem(null)}
      />
      <AddGoalModal isOpen={isAddGoalOpen} onClose={() => setIsAddGoalOpen(false)} />
      <EditGoalModal
        key={editGoalItem?.id ?? "edit-goal"}
        isOpen={Boolean(editGoalItem)}
        item={editGoalItem}
        onClose={() => setEditGoalItem(null)}
      />
      <AddLendModal isOpen={isAddLendOpen} onClose={() => setIsAddLendOpen(false)} />
      <EditLoanModal
        key={editLoanItem?.id ?? "edit-loan"}
        isOpen={Boolean(editLoanItem)}
        item={editLoanItem}
        onClose={() => setEditLoanItem(null)}
      />
      <AddInvestmentModal isOpen={isAddInvestmentOpen} onClose={() => setIsAddInvestmentOpen(false)} />
    </div>
  );
}
