"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  CurrencyCode,
  Expense,
  Investment,
  Loan,
  NewExpense,
  NewInvestment,
  NewLoan,
  NewSavingGoal,
  SavingGoal,
} from "./types";

interface FinanceStoreState {
  currency: CurrencyCode;
  hasSelectedCurrency: boolean;
  selectedMonth: string;
  spendingBudget: number;
  monthlyBudgets: Record<string, number>;
  savingsBudget: number;
  categoryLimits: Record<string, number>;
  expenses: Expense[];
  investments: Investment[];
  savingGoals: SavingGoal[];
  loans: Loan[];
  recurringExpenses: () => Expense[];
  setCurrency: (currency: CurrencyCode) => void;
  setHasSelectedCurrency: (value: boolean) => void;
  setSelectedMonth: (month: string) => void;
  setSpendingBudget: (amount: number) => void;
  setMonthlyBudget: (month: string, amount: number) => void;
  setSavingsBudget: (amount: number) => void;
  setCategoryLimit: (category: string, limit: number) => void;
  addExpense: (expense: NewExpense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addInvestment: (item: NewInvestment) => void;
  updateInvestment: (item: Investment) => void;
  deleteInvestment: (id: string) => void;
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

const initialExpenses: Expense[] = [];
const initialInvestments: Investment[] = [];
const initialSavingGoals: SavingGoal[] = [];
const initialLoans: Loan[] = [];

export const useFinanceStore = create<FinanceStoreState>()(
  persist(
    (set, get) => ({
      currency: "USD",
      hasSelectedCurrency: false,
      selectedMonth: getCurrentMonth(),
      spendingBudget: 3000,
      monthlyBudgets: {},
      savingsBudget: 1000,
      categoryLimits: {},
      expenses: initialExpenses,
      investments: initialInvestments,
      savingGoals: initialSavingGoals,
      loans: initialLoans,
      recurringExpenses: () => get().expenses.filter((expense) => expense.recurring),
      setCurrency: (currency) => set({ currency, hasSelectedCurrency: true }),
      setHasSelectedCurrency: (value) => set({ hasSelectedCurrency: value }),
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
          expenses: [
            {
              ...expense,
              note: expense.note ?? "",
              recurring: expense.recurring ?? false,
              id: generateId(),
            },
            ...state.expenses,
          ],
        })),
      updateExpense: (expense) =>
        set((state) => ({
          expenses: state.expenses.map((existing) => (existing.id === expense.id ? expense : existing)),
        })),
      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((expense) => expense.id !== id),
        })),
      addInvestment: (item) =>
        set((state) => ({
          investments: [{ ...item, id: generateId() }, ...state.investments],
        })),
      updateInvestment: (item) =>
        set((state) => ({
          investments: state.investments.map((existing) => (existing.id === item.id ? item : existing)),
        })),
      deleteInvestment: (id) =>
        set((state) => ({
          investments: state.investments.filter((item) => item.id !== id),
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

