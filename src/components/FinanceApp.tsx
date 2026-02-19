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
import AddGoalModal from "./savings/AddGoalModal";
import EditGoalModal from "./savings/EditGoalModal";
import LendingOverview from "./lending/LendingOverview";
import AddLendModal from "./lending/AddLendModal";
import EditLoanModal from "./lending/EditLoanModal";
import SavingsBudgetSetter from "./savings/SavingsBudgetSetter";
import SettingsPanel from "./settings/SettingsPanel";
import CurrencyPickerModal from "./CurrencyPickerModal";
import AddInvestmentModal from "./investment/AddInvestmentModal";
import InvestingOverview from "./investing/InvestingOverview";
import AnalyticsDashboard from "./analytics/AnalyticsDashboard";
import { useFinanceStore } from "./shared/store";
import { CurrencyCode, Expense, Loan, SavingGoal, TabKey } from "./shared/types";

type ActionTab = Exclude<TabKey, "settings" | "analytics">;

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
  const [showInvestingBudgetSetter, setShowInvestingBudgetSetter] = useState(false);
  const [showInvestingActions, setShowInvestingActions] = useState(false);

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

  const onTabChange = (tab: TabKey) => {
    setShowInvestingActions(false);
    setActiveTab(tab);
  };

  const floatingConfig = useMemo(() => {
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalInvesting =
      savingGoals.reduce((sum, goal) => sum + goal.savedAmount, 0) +
      investments.reduce((sum, item) => sum + item.amount, 0);
    const totalLent = loans.reduce((sum, loan) => sum + loan.amount, 0);

    return {
      spending: {
        label: "Total Spent",
        amount: totalSpent,
        buttonLabel: "Add Expense",
        icon: "add",
      },
      investing: {
        label: "Total Investing",
        amount: totalInvesting,
        buttonLabel: "Add",
        icon: "add",
      },
      lending: {
        label: "Total Lent",
        amount: totalLent,
        buttonLabel: "Lend",
        icon: "handshake",
      },
    };
  }, [expenses, investments, savingGoals, loans]);

  const onFloatingAction = () => {
    if (activeTab === "spending") {
      setIsAddExpenseOpen(true);
      return;
    }
    if (activeTab === "investing") {
      setShowInvestingActions((value) => !value);
      return;
    }
    if (activeTab === "lending") {
      setIsAddLendOpen(true);
    }
  };

  const cfg =
    activeTab === "settings" || activeTab === "analytics"
      ? null
      : floatingConfig[activeTab as ActionTab];

  const onCurrencySelected = (selected: CurrencyCode) => {
    setCurrency(selected);
  };

  return (
    <div className="bg-[#0a0a0f] font-display text-[#f0f0ff] antialiased min-h-[100dvh] overflow-hidden flex flex-col relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 size-64 rounded-full bg-[#00C9A7]/20 blur-[90px]" />
        <div className="absolute top-1/3 -right-24 size-72 rounded-full bg-[#00D1FF]/20 blur-[110px]" />
        <div className="absolute bottom-0 left-1/4 size-64 rounded-full bg-[#00C9A7]/15 blur-[96px]" />
        <div className="app-texture absolute inset-0" />
      </div>

      <CurrencyPickerModal isOpen={!hasSelectedCurrency} onSelect={onCurrencySelected} />

      <Header activeTab={activeTab} setActiveTab={onTabChange} />

      <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-[calc(env(safe-area-inset-bottom)+136px)] sm:pb-24">
        <div className="px-4 pt-3 flex items-center justify-end gap-2">
          {activeTab === "spending" && (
            <button
              type="button"
              onClick={() => setShowSpendingBudgetSetter((value) => !value)}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-white/20 bg-white/[0.08] text-[11px] font-semibold text-[#dcfff7]"
            >
              <span className="material-symbols-outlined text-[15px]">tune</span>
              Budget
            </button>
          )}

          {activeTab === "investing" && (
            <button
              type="button"
              onClick={() => setShowInvestingBudgetSetter((value) => !value)}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-white/20 bg-white/[0.08] text-[11px] font-semibold text-[#dcfff7]"
            >
              <span className="material-symbols-outlined text-[15px]">savings</span>
              Invest Budget
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

        {activeTab === "investing" && (
          <>
            {showInvestingBudgetSetter && <SavingsBudgetSetter />}
            <InvestingOverview onEditGoal={setEditGoalItem} />
          </>
        )}

        {activeTab === "lending" && <LendingOverview onEditLoan={setEditLoanItem} />}
        {activeTab === "analytics" && <AnalyticsDashboard />}
        {activeTab === "settings" && <SettingsPanel />}
      </main>

      {showInvestingActions && activeTab === "investing" && (
        <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+146px)] z-40 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setShowInvestingActions(false);
              setIsAddGoalOpen(true);
            }}
            className="h-9 px-3 rounded-xl border border-white/20 bg-[#0f2f2a]/95 text-[#d8fff5] text-xs font-semibold backdrop-blur-[12px]"
          >
            Add Goal
          </button>
          <button
            type="button"
            onClick={() => {
              setShowInvestingActions(false);
              setIsAddInvestmentOpen(true);
            }}
            className="h-9 px-3 rounded-xl border border-white/20 bg-[#0f2f2a]/95 text-[#d8fff5] text-xs font-semibold backdrop-blur-[12px]"
          >
            Add Investment
          </button>
        </div>
      )}

      {cfg && (
        <FloatingCard
          label={cfg.label}
          amount={cfg.amount}
          buttonLabel={cfg.buttonLabel}
          icon={cfg.icon}
          onAction={onFloatingAction}
        />
      )}

      <BottomNav activeTab={activeTab} setActiveTab={onTabChange} />

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
