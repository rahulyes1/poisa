"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import AddPersonalLoanModal from "./lending/AddPersonalLoanModal";
import EditPersonalLoanModal from "./lending/EditPersonalLoanModal";
import SavingsBudgetSetter from "./savings/SavingsBudgetSetter";
import SettingsPanel from "./settings/SettingsPanel";
import CurrencyPickerModal from "./CurrencyPickerModal";
import AddInvestmentModal from "./investment/AddInvestmentModal";
import AddLifeInsuranceModal from "./investing/AddLifeInsuranceModal";
import InvestingOverview from "./investing/InvestingOverview";
import AnalyticsDashboard from "./analytics/AnalyticsDashboard";
import { useFinanceStore } from "./shared/store";
import { CurrencyCode, Expense, Loan, PersonalLoan, SavingGoal, TabKey } from "./shared/types";

type ActionTab = Exclude<TabKey, "settings" | "analytics">;

export default function FinanceApp() {
  const [activeTab, setActiveTab] = useState<TabKey>("spending");
  const [spendingQuery, setSpendingQuery] = useState("");
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddLendOpen, setIsAddLendOpen] = useState(false);
  const [isAddPersonalLoanOpen, setIsAddPersonalLoanOpen] = useState(false);
  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false);
  const [isAddLifeInsuranceOpen, setIsAddLifeInsuranceOpen] = useState(false);
  const [editExpenseItem, setEditExpenseItem] = useState<Expense | null>(null);
  const [editGoalItem, setEditGoalItem] = useState<SavingGoal | null>(null);
  const [editLoanItem, setEditLoanItem] = useState<Loan | null>(null);
  const [editPersonalLoanItem, setEditPersonalLoanItem] = useState<PersonalLoan | null>(null);
  const [showSpendingBudgetSetter, setShowSpendingBudgetSetter] = useState(false);
  const [showInvestingBudgetSetter, setShowInvestingBudgetSetter] = useState(false);
  const [showInvestingActions, setShowInvestingActions] = useState(false);
  const [showLendingActions, setShowLendingActions] = useState(false);

  const hasSelectedCurrency = useFinanceStore((state) => state.hasSelectedCurrency);
  const setCurrency = useFinanceStore((state) => state.setCurrency);
  const syncCurrentMonth = useFinanceStore((state) => state.syncCurrentMonth);
  const expenses = useFinanceStore((state) => state.expenses);
  const investments = useFinanceStore((state) => state.investments);
  const savingGoals = useFinanceStore((state) => state.savingGoals);
  const loans = useFinanceStore((state) => state.loans);

  useEffect(() => {
    syncCurrentMonth();
    document.documentElement.classList.add("dark");

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncCurrentMonth();
      }
    };

    const onWindowFocus = () => {
      syncCurrentMonth();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, [syncCurrentMonth]);

  useEffect(() => {
    const onSpendingBudgetSaved = () => {
      setShowSpendingBudgetSetter(false);
    };

    window.addEventListener("poisa:spending-budget-saved", onSpendingBudgetSaved);
    return () => {
      window.removeEventListener("poisa:spending-budget-saved", onSpendingBudgetSaved);
    };
  }, []);

  const onTabChange = (tab: TabKey) => {
    setShowInvestingActions(false);
    setShowLendingActions(false);
    if (tab !== "spending") {
      setSpendingQuery("");
    }
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
      setShowLendingActions((value) => !value);
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
    <div className="bg-[#0F172A] font-display text-[#F1F5F9] antialiased min-h-[100dvh] overflow-hidden flex flex-col relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 size-64 rounded-full bg-[#4F46E5]/14 blur-[90px]" />
        <div className="absolute top-1/3 -right-24 size-72 rounded-full bg-[#00C9A7]/12 blur-[110px]" />
        <div className="absolute bottom-0 left-1/4 size-64 rounded-full bg-[#4F46E5]/10 blur-[96px]" />
        <div className="app-texture absolute inset-0" />
      </div>

      <CurrencyPickerModal isOpen={!hasSelectedCurrency} onSelect={onCurrencySelected} />

      <Header
        activeTab={activeTab}
        setActiveTab={onTabChange}
        spendingQuery={spendingQuery}
        onSpendingQueryChange={setSpendingQuery}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-[calc(env(safe-area-inset-bottom)+126px)] sm:pb-[calc(env(safe-area-inset-bottom)+112px)]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {activeTab === "spending" && (
              <>
                <SpendingDashboard
                  isBudgetOpen={showSpendingBudgetSetter}
                  onToggleBudget={() => setShowSpendingBudgetSetter((value) => !value)}
                />
                {showSpendingBudgetSetter && <BudgetSetter />}
                <TransactionList
                  query={spendingQuery}
                  onEditExpense={setEditExpenseItem}
                />
              </>
            )}

            {activeTab === "investing" && (
              <>
                {showInvestingBudgetSetter && <SavingsBudgetSetter />}
                <InvestingOverview
                  onEditGoal={setEditGoalItem}
                  onAddLifeInsurance={() => setIsAddLifeInsuranceOpen(true)}
                  isBudgetOpen={showInvestingBudgetSetter}
                  onToggleBudget={() => setShowInvestingBudgetSetter((value) => !value)}
                />
              </>
            )}

            {activeTab === "lending" && (
              <LendingOverview
                onEditLoan={setEditLoanItem}
                onEditPersonalLoan={setEditPersonalLoanItem}
              />
            )}
            {activeTab === "analytics" && <AnalyticsDashboard />}
            {activeTab === "settings" && <SettingsPanel />}
          </motion.div>
        </AnimatePresence>
      </main>

      {showInvestingActions && activeTab === "investing" && (
        <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+146px)] z-40 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setShowInvestingActions(false);
              setIsAddGoalOpen(true);
            }}
            className="h-9 px-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111118]/95 text-[#d8fff5] text-xs font-semibold backdrop-blur-[12px]"
          >
            Add Goal
          </button>
          <button
            type="button"
            onClick={() => {
              setShowInvestingActions(false);
              setIsAddInvestmentOpen(true);
            }}
            className="h-9 px-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111118]/95 text-[#d8fff5] text-xs font-semibold backdrop-blur-[12px]"
          >
            Add Investment
          </button>
          <button
            type="button"
            onClick={() => {
              setShowInvestingActions(false);
              setIsAddLifeInsuranceOpen(true);
            }}
            className="h-9 px-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111118]/95 text-[#d8fff5] text-xs font-semibold backdrop-blur-[12px]"
          >
            Add Insurance
          </button>
        </div>
      )}

      {showLendingActions && activeTab === "lending" && (
        <div className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+146px)] z-40 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setShowLendingActions(false);
              setIsAddLendOpen(true);
            }}
            className="h-9 px-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111118]/95 text-[#d8fff5] text-xs font-semibold backdrop-blur-[12px]"
          >
            Lend to Someone
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLendingActions(false);
              setIsAddPersonalLoanOpen(true);
            }}
            className="h-9 px-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111118]/95 text-[#d8fff5] text-xs font-semibold backdrop-blur-[12px]"
          >
            Add My Loan
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
      <AddPersonalLoanModal isOpen={isAddPersonalLoanOpen} onClose={() => setIsAddPersonalLoanOpen(false)} />
      <EditPersonalLoanModal
        key={editPersonalLoanItem?.id ?? "edit-personal-loan"}
        isOpen={Boolean(editPersonalLoanItem)}
        item={editPersonalLoanItem}
        onClose={() => setEditPersonalLoanItem(null)}
      />
      <AddInvestmentModal isOpen={isAddInvestmentOpen} onClose={() => setIsAddInvestmentOpen(false)} />
      <AddLifeInsuranceModal isOpen={isAddLifeInsuranceOpen} onClose={() => setIsAddLifeInsuranceOpen(false)} />
    </div>
  );
}

