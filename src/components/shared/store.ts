"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Expense, Loan, NewExpense, NewLoan, NewSavingGoal, SavingGoal } from "./types";

interface FinanceStoreState {
  spendingBudget: number;
  expenses: Expense[];
  savingGoals: SavingGoal[];
  loans: Loan[];
  addExpense: (expense: NewExpense) => void;
  setSpendingBudget: (amount: number) => void;
  addSavingGoal: (goal: NewSavingGoal) => void;
  addLoan: (loan: NewLoan) => void;
  toggleLoanRepaid: (id: string) => void;
}

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const initialExpenses: Expense[] = [
  {
    id: "exp-1",
    name: "Burger King",
    category: "Lunch",
    amount: 12.5,
    date: "2026-02-19",
    icon: "fastfood",
  },
  {
    id: "exp-2",
    name: "Uber Ride",
    category: "Transport",
    amount: 24,
    date: "2026-02-19",
    icon: "local_taxi",
  },
  {
    id: "exp-3",
    name: "Electric Bill",
    category: "Utilities",
    amount: 140,
    date: "2026-02-18",
    icon: "lightbulb",
  },
  {
    id: "exp-4",
    name: "H&M Store",
    category: "Clothing",
    amount: 89.99,
    date: "2026-02-18",
    icon: "shopping_bag",
  },
  {
    id: "exp-5",
    name: "Whole Foods",
    category: "Groceries",
    amount: 56,
    date: "2026-02-18",
    icon: "shopping_cart",
  },
  {
    id: "exp-6",
    name: "Netflix",
    category: "Entertainment",
    amount: 15,
    date: "2026-02-17",
    icon: "subscriptions",
  },
];

const initialSavingGoals: SavingGoal[] = [
  {
    id: "goal-1",
    name: "Emergency Fund",
    category: "Safety net",
    targetAmount: 2000,
    savedAmount: 800,
    date: "2026-02-19",
    icon: "shield",
  },
  {
    id: "goal-2",
    name: "Vacation Fund",
    category: "Travel",
    targetAmount: 1500,
    savedAmount: 450,
    date: "2026-02-18",
    icon: "flight_takeoff",
  },
  {
    id: "goal-3",
    name: "Investments",
    category: "Stocks",
    targetAmount: 5000,
    savedAmount: 1200,
    date: "2026-02-17",
    icon: "trending_up",
  },
];

const initialLoans: Loan[] = [
  {
    id: "loan-1",
    personName: "Alex",
    reason: "Lunch split",
    amount: 80,
    repaid: false,
    date: "2026-02-19",
  },
  {
    id: "loan-2",
    personName: "Sarah",
    reason: "Concert tickets",
    amount: 120,
    repaid: true,
    date: "2026-02-18",
  },
  {
    id: "loan-3",
    personName: "Mike",
    reason: "Groceries",
    amount: 45,
    repaid: false,
    date: "2026-02-18",
  },
  {
    id: "loan-4",
    personName: "Jake",
    reason: "Travel expenses",
    amount: 375,
    repaid: false,
    date: "2026-02-17",
  },
];

export const useFinanceStore = create<FinanceStoreState>()(
  persist(
    (set) => ({
      spendingBudget: 3000,
      expenses: initialExpenses,
      savingGoals: initialSavingGoals,
      loans: initialLoans,
      addExpense: (expense) =>
        set((state) => ({
          expenses: [{ ...expense, id: generateId() }, ...state.expenses],
        })),
      setSpendingBudget: (amount) => set({ spendingBudget: amount }),
      addSavingGoal: (goal) =>
        set((state) => ({
          savingGoals: [{ ...goal, id: generateId() }, ...state.savingGoals],
        })),
      addLoan: (loan) =>
        set((state) => ({
          loans: [{ ...loan, id: generateId() }, ...state.loans],
        })),
      toggleLoanRepaid: (id) =>
        set((state) => ({
          loans: state.loans.map((loan) =>
            loan.id === id ? { ...loan, repaid: !loan.repaid } : loan,
          ),
        })),
    }),
    {
      name: "finance-app-store-v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
