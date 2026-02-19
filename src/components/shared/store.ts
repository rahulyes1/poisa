"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CurrencyCode, Expense, Loan, NewExpense, NewLoan, NewSavingGoal, SavingGoal } from "./types";

interface FinanceStoreState {
  currency: CurrencyCode;
  selectedMonth: string;
  spendingBudget: number;
  monthlyBudgets: Record<string, number>;
  savingsBudget: number;
  categoryLimits: Record<string, number>;
  expenses: Expense[];
  savingGoals: SavingGoal[];
  loans: Loan[];
  recurringExpenses: () => Expense[];
  setCurrency: (currency: CurrencyCode) => void;
  setSelectedMonth: (month: string) => void;
  setSpendingBudget: (amount: number) => void;
  setMonthlyBudget: (month: string, amount: number) => void;
  setSavingsBudget: (amount: number) => void;
  setCategoryLimit: (category: string, limit: number) => void;
  addExpense: (expense: NewExpense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addSavingGoal: (goal: NewSavingGoal) => void;
  updateSavingGoal: (goal: SavingGoal) => void;
  deleteSavingGoal: (id: string) => void;
  topUpGoal: (id: string, amount: number) => void;
  withdrawFromGoal: (id: string, amount: number) => void;
  addLoan: (loan: NewLoan) => void;
  updateLoan: (loan: Loan) => void;
  deleteLoan: (id: string) => void;
  toggleLoanRepaid: (id: string) => void;
  addRepayment: (id: string, amount: number) => void;
}

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const initialExpenses: Expense[] = [
  {
    id: "exp-1",
    name: "Burger King",
    category: "Lunch",
    amount: 12.5,
    date: "2026-02-19",
    icon: "fastfood",
    recurring: false,
  },
  {
    id: "exp-2",
    name: "Uber Ride",
    category: "Transport",
    amount: 24,
    date: "2026-02-19",
    icon: "local_taxi",
    recurring: false,
  },
  {
    id: "exp-3",
    name: "Electric Bill",
    category: "Utilities",
    amount: 140,
    date: "2026-02-18",
    icon: "lightbulb",
    recurring: true,
  },
  {
    id: "exp-4",
    name: "H&M Store",
    category: "Clothing",
    amount: 89.99,
    date: "2026-02-18",
    icon: "shopping_bag",
    recurring: false,
  },
  {
    id: "exp-5",
    name: "Whole Foods",
    category: "Groceries",
    amount: 56,
    date: "2026-02-18",
    icon: "shopping_cart",
    recurring: false,
  },
  {
    id: "exp-6",
    name: "Netflix",
    category: "Entertainment",
    amount: 15,
    date: "2026-02-17",
    icon: "subscriptions",
    recurring: true,
  },
];

const initialSavingGoals: SavingGoal[] = [
  {
    id: "goal-1",
    name: "Emergency Fund",
    category: "Safety net",
    targetAmount: 2000,
    savedAmount: 800,
    date: "2026-04-19",
    icon: "shield",
  },
  {
    id: "goal-2",
    name: "Vacation Fund",
    category: "Travel",
    targetAmount: 1500,
    savedAmount: 450,
    date: "2026-06-01",
    icon: "flight_takeoff",
  },
  {
    id: "goal-3",
    name: "Investments",
    category: "Stocks",
    targetAmount: 5000,
    savedAmount: 1200,
    date: "2026-08-01",
    icon: "trending_up",
  },
];

const initialLoans: Loan[] = [
  {
    id: "loan-1",
    personName: "Alex",
    reason: "Lunch split",
    amount: 80,
    repaidAmount: 20,
    repaid: false,
    date: "2026-02-19",
    dueDate: "2026-03",
  },
  {
    id: "loan-2",
    personName: "Sarah",
    reason: "Concert tickets",
    amount: 120,
    repaidAmount: 120,
    repaid: true,
    date: "2026-02-18",
    dueDate: "2026-02",
  },
  {
    id: "loan-3",
    personName: "Mike",
    reason: "Groceries",
    amount: 45,
    repaidAmount: 0,
    repaid: false,
    date: "2026-02-18",
    dueDate: "2026-03",
  },
  {
    id: "loan-4",
    personName: "Jake",
    reason: "Travel expenses",
    amount: 375,
    repaidAmount: 100,
    repaid: false,
    date: "2026-02-17",
    dueDate: "2026-01",
  },
];

export const useFinanceStore = create<FinanceStoreState>()(
  persist(
    (set, get) => ({
      currency: "USD",
      selectedMonth: getCurrentMonth(),
      spendingBudget: 3000,
      monthlyBudgets: {},
      savingsBudget: 1000,
      categoryLimits: {},
      expenses: initialExpenses,
      savingGoals: initialSavingGoals,
      loans: initialLoans,
      recurringExpenses: () => get().expenses.filter((expense) => expense.recurring),
      setCurrency: (currency) => set({ currency }),
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      setSpendingBudget: (amount) => set({ spendingBudget: amount }),
      setMonthlyBudget: (month, amount) =>
        set((state) => ({
          monthlyBudgets: {
            ...state.monthlyBudgets,
            [month]: amount,
          },
        })),
      setSavingsBudget: (amount) => set({ savingsBudget: amount }),
      setCategoryLimit: (category, limit) =>
        set((state) => ({
          categoryLimits: {
            ...state.categoryLimits,
            [category]: limit,
          },
        })),
      addExpense: (expense) =>
        set((state) => ({
          expenses: [{ ...expense, recurring: expense.recurring ?? false, id: generateId() }, ...state.expenses],
        })),
      updateExpense: (expense) =>
        set((state) => ({
          expenses: state.expenses.map((existing) => (existing.id === expense.id ? expense : existing)),
        })),
      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        })),
      addSavingGoal: (goal) =>
        set((state) => ({
          savingGoals: [{ ...goal, id: generateId() }, ...state.savingGoals],
        })),
      updateSavingGoal: (goal) =>
        set((state) => ({
          savingGoals: state.savingGoals.map((existing) => (existing.id === goal.id ? goal : existing)),
        })),
      deleteSavingGoal: (id) =>
        set((state) => ({
          savingGoals: state.savingGoals.filter((goal) => goal.id !== id),
        })),
      topUpGoal: (id, amount) =>
        set((state) => ({
          savingGoals: state.savingGoals.map((goal) => {
            if (goal.id !== id) {
              return goal;
            }
            const nextSaved = Math.min(goal.savedAmount + amount, goal.targetAmount);
            return { ...goal, savedAmount: nextSaved };
          }),
        })),
      withdrawFromGoal: (id, amount) =>
        set((state) => ({
          savingGoals: state.savingGoals.map((goal) => {
            if (goal.id !== id) {
              return goal;
            }
            const nextSaved = Math.max(goal.savedAmount - amount, 0);
            return { ...goal, savedAmount: nextSaved };
          }),
        })),
      addLoan: (loan) =>
        set((state) => {
          const repaidAmount = loan.repaid ? loan.amount : 0;
          return {
            loans: [{ ...loan, repaidAmount, id: generateId() }, ...state.loans],
          };
        }),
      updateLoan: (loan) =>
        set((state) => ({
          loans: state.loans.map((existing) => (existing.id === loan.id ? loan : existing)),
        })),
      deleteLoan: (id) =>
        set((state) => ({
          loans: state.loans.filter((loan) => loan.id !== id),
        })),
      toggleLoanRepaid: (id) =>
        set((state) => ({
          loans: state.loans.map((loan) => {
            if (loan.id !== id) {
              return loan;
            }
            if (loan.repaid) {
              return { ...loan, repaid: false, repaidAmount: 0 };
            }
            return { ...loan, repaid: true, repaidAmount: loan.amount };
          }),
        })),
      addRepayment: (id, amount) =>
        set((state) => ({
          loans: state.loans.map((loan) => {
            if (loan.id !== id) {
              return loan;
            }
            const nextRepaidAmount = Math.min(loan.repaidAmount + amount, loan.amount);
            return {
              ...loan,
              repaidAmount: nextRepaidAmount,
              repaid: nextRepaidAmount >= loan.amount,
            };
          }),
        })),
    }),
    {
      name: "finance-app-store-v2",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

