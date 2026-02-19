"use client";

import { useMemo, useState } from "react";
import Header from "./Header";
import BottomNav from "./BottomNav";
import FloatingCard from "./FloatingCard";
import ExportButton from "./ExportButton";
import SpendingDashboard from "./spending/SpendingDashboard";
import BudgetSetter from "./spending/BudgetSetter";
import TransactionList from "./spending/TransactionList";
import AddExpenseModal from "./spending/AddExpenseModal";
import SavingsOverview from "./savings/SavingsOverview";
import AddGoalModal from "./savings/AddGoalModal";
import LendingOverview from "./lending/LendingOverview";
import AddLendModal from "./lending/AddLendModal";
import { useFinanceStore } from "./shared/store";
import { TabKey } from "./shared/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export default function FinanceApp() {
  const [activeTab, setActiveTab] = useState<TabKey>("spending");
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === "undefined") {
      return false;
    }
    return document.documentElement.classList.contains("dark");
  });
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddLendOpen, setIsAddLendOpen] = useState(false);
  const expenses = useFinanceStore((state) => state.expenses);
  const savingGoals = useFinanceStore((state) => state.savingGoals);
  const loans = useFinanceStore((state) => state.loans);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const floatingConfig = useMemo(() => {
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalSaved = savingGoals.reduce((sum, goal) => sum + goal.savedAmount, 0);
    const totalLent = loans.reduce((sum, loan) => sum + loan.amount, 0);

    return {
      spending: {
        label: "Total Spent",
        amount: formatCurrency(totalSpent),
        buttonLabel: "Add Expense",
        icon: "add",
      },
      savings: {
        label: "Total Saved",
        amount: formatCurrency(totalSaved),
        buttonLabel: "Add Goal",
        icon: "add",
      },
      lending: {
        label: "Total Lent",
        amount: formatCurrency(totalLent),
        buttonLabel: "Lend Money",
        icon: "handshake",
      },
    };
  }, [expenses, savingGoals, loans]);

  const onFloatingAction = () => {
    if (activeTab === "spending") {
      setIsAddExpenseOpen(true);
      return;
    }
    if (activeTab === "savings") {
      setIsAddGoalOpen(true);
      return;
    }
    setIsAddLendOpen(true);
  };

  const cfg = floatingConfig[activeTab];

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased h-screen overflow-hidden flex flex-col relative">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        toggleDark={toggleDark}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-24">
        <div className="px-5 pt-4 flex justify-end">
          <ExportButton />
        </div>

        {activeTab === "spending" && (
          <>
            <SpendingDashboard />
            <BudgetSetter />
            <TransactionList />
          </>
        )}
        {activeTab === "savings" && <SavingsOverview />}
        {activeTab === "lending" && <LendingOverview />}
      </main>

      <FloatingCard
        label={cfg.label}
        amount={cfg.amount}
        buttonLabel={cfg.buttonLabel}
        icon={cfg.icon}
        onAction={onFloatingAction}
      />

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <AddExpenseModal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} />
      <AddGoalModal isOpen={isAddGoalOpen} onClose={() => setIsAddGoalOpen(false)} />
      <AddLendModal isOpen={isAddLendOpen} onClose={() => setIsAddLendOpen(false)} />
    </div>
  );
}
