"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  CurrencyCode,
  DashboardWindow,
  Expense,
  FinanceAdjustments,
  Investment,
  LifeInsurance,
  Loan,
  MonthMode,
  NewExpense,
  NewInvestment,
  NewLifeInsurance,
  NewLoan,
  NewPersonalLoan,
  NewRecurringTemplate,
  NewSavingGoal,
  NewSpendingTodo,
  PersonalLoan,
  RecurringTemplate,
  SavingGoal,
  SpendingTodo,
} from "./types";

interface FinanceStoreState {
  currency: CurrencyCode;
  hasSelectedCurrency: boolean;
  selectedMonth: string;
  monthMode: MonthMode;
  dashboardWindow: DashboardWindow;
  spendingCarryForwardEnabled: boolean;
  savingsCarryForwardEnabled: boolean;
  spendingBudget: number;
  monthlyBudgets: Record<string, number>;
  savingsBudget: number;
  categoryLimits: Record<string, number>;
  adjustments: FinanceAdjustments;
  expenses: Expense[];
  investments: Investment[];
  savingGoals: SavingGoal[];
  loans: Loan[];
  personalLoans: PersonalLoan[];
  lifeInsurances: LifeInsurance[];
  recurringTemplates: RecurringTemplate[];
  spendingTodos: SpendingTodo[];
  spendingTodoDoneMonths: Record<string, string[]>;
  recurringExpenses: () => Expense[];
  dueSoonPersonalLoans: (leadDays?: number) => PersonalLoan[];
  totalPersonalLoanOutstanding: () => number;
  totalMonthlyEmiDue: () => number;
  getWindowMonths: (anchorMonth: string, window: DashboardWindow) => string[];
  getExpensesForWindow: (anchorMonth: string, window: DashboardWindow) => Expense[];
  getSpentForMonth: (month: string) => number;
  getBaseBudgetForMonth: (month: string) => number;
  getSpendingCarryIn: (month: string) => number;
  getEffectiveSpendingBudget: (month: string) => number;
  getSpendingCarryOut: (month: string) => number;
  setCurrency: (currency: CurrencyCode) => void;
  setHasSelectedCurrency: (value: boolean) => void;
  setSelectedMonth: (month: string, mode?: MonthMode) => void;
  syncCurrentMonth: () => void;
  setDashboardWindow: (window: DashboardWindow) => void;
  setSpendingCarryForwardEnabled: (value: boolean) => void;
  setSavingsCarryForwardEnabled: (value: boolean) => void;
  setSpendingBudget: (amount: number) => void;
  setMonthlyBudget: (month: string, amount: number) => void;
  setSavingsBudget: (amount: number) => void;
  setCategoryLimit: (category: string, limit: number) => void;
  setManualAssets: (value: number) => void;
  setManualLiabilities: (value: number) => void;
  setEssentialMonthlyExpense: (value: number) => void;
  setEmergencyTargetMonths: (value: number) => void;
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
  addPersonalLoan: (loan: NewPersonalLoan) => void;
  updatePersonalLoan: (loan: PersonalLoan) => void;
  deletePersonalLoan: (id: string) => void;
  addPersonalLoanPayment: (id: string, amount: number, date: string) => void;
  markPersonalLoanEmiPaid: (id: string) => void;
  unmarkPersonalLoanEmiPaid: (id: string) => void;
  togglePersonalLoanEmiPaid: (id: string) => void;
  closePersonalLoan: (id: string) => void;
  recalculateNextEmiDate: (id: string) => void;
  addLifeInsurance: (entry: NewLifeInsurance) => void;
  updateLifeInsurance: (entry: LifeInsurance) => void;
  deleteLifeInsurance: (id: string) => void;
  toggleLifeInsurancePaid: (id: string) => void;
  addRecurringTemplate: (template: NewRecurringTemplate) => void;
  updateRecurringTemplate: (template: RecurringTemplate) => void;
  deleteRecurringTemplate: (id: string) => void;
  toggleRecurringTemplatePaid: (id: string, month: string) => void;
  addSpendingTodo: (todo: NewSpendingTodo) => void;
  updateSpendingTodo: (todo: SpendingTodo) => void;
  deleteSpendingTodo: (id: string) => void;
  toggleSpendingTodoDone: (id: string, month: string) => void;
  syncSourcePaymentToExpense: (params: {
    sourceType: "loan_emi" | "insurance_premium" | "recurring_template";
    sourceId: string;
    sourceMonth: string;
    paid: boolean;
    name: string;
    category: string;
    amount: number;
    icon?: string;
  }) => void;
  removeLinkedExpenseAndUnmarkSource: (expenseId: string) => void;
}

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
const getCurrentDate = () => new Date().toISOString().slice(0, 10);

const shiftMonth = (month: string, offset: number) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year || 1970, (monthNumber || 1) - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getMonthsInRange = (fromMonth: string, toMonth: string) => {
  if (fromMonth.localeCompare(toMonth) > 0) {
    return [];
  }

  const months: string[] = [];
  let cursor = fromMonth;
  while (cursor.localeCompare(toMonth) <= 0) {
    months.push(cursor);
    cursor = shiftMonth(cursor, 1);
  }
  return months;
};

const toMonth = (date: string) => date.slice(0, 7);

const getSpentForMonthFromState = (state: FinanceStoreState, month: string) =>
  state.expenses
    .filter((expense) => toMonth(expense.date) === month)
    .reduce((sum, expense) => sum + expense.amount, 0);

const getBaseBudgetForMonthFromState = (state: FinanceStoreState, month: string) =>
  typeof state.monthlyBudgets[month] === "number" ? state.monthlyBudgets[month] : state.spendingBudget;

const getEarliestMonth = (state: FinanceStoreState, targetMonth: string) => {
  const months = [
    targetMonth,
    ...state.expenses.map((expense) => toMonth(expense.date)),
    ...Object.keys(state.monthlyBudgets),
  ].filter(Boolean);

  return months.sort((a, b) => a.localeCompare(b))[0] ?? targetMonth;
};

const getSpendingCarryInFromState = (state: FinanceStoreState, month: string) => {
  if (!state.spendingCarryForwardEnabled) {
    return 0;
  }

  const earliestMonth = getEarliestMonth(state, month);
  let carry = 0;

  for (const cursor of getMonthsInRange(earliestMonth, shiftMonth(month, -1))) {
    const baseBudget = getBaseBudgetForMonthFromState(state, cursor);
    const spent = getSpentForMonthFromState(state, cursor);
    const effectiveBudget = baseBudget + carry;
    carry = Math.max(effectiveBudget - spent, 0);
  }

  return carry;
};

const clampDayOfMonth = (year: number, monthIndex: number, day: number) => {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.max(1, Math.min(day, lastDay));
};

const toDateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const getInitialNextEmiDate = (startDate: string, emiDayOfMonth: number) => {
  const base = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) {
    return undefined;
  }

  let year = base.getFullYear();
  let monthIndex = base.getMonth();
  let day = clampDayOfMonth(year, monthIndex, emiDayOfMonth);
  let candidate = new Date(year, monthIndex, day);

  if (candidate.getTime() < base.getTime()) {
    monthIndex += 1;
    year = monthIndex > 11 ? year + 1 : year;
    monthIndex = monthIndex > 11 ? 0 : monthIndex;
    day = clampDayOfMonth(year, monthIndex, emiDayOfMonth);
    candidate = new Date(year, monthIndex, day);
  }

  return toDateString(candidate);
};

const getDayFromDateString = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return 1;
  }
  return parsed.getDate();
};

const advanceEmiDate = (baseDate: string, emiDayOfMonth?: number) => {
  const base = new Date(`${baseDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) {
    return undefined;
  }

  let year = base.getFullYear();
  let monthIndex = base.getMonth() + 1;
  year = monthIndex > 11 ? year + 1 : year;
  monthIndex = monthIndex > 11 ? 0 : monthIndex;

  const targetDay = typeof emiDayOfMonth === "number" ? emiDayOfMonth : getDayFromDateString(baseDate);
  const day = clampDayOfMonth(year, monthIndex, targetDay);
  return toDateString(new Date(year, monthIndex, day));
};

const getOutstandingForPersonalLoan = (loan: PersonalLoan) => {
  if (loan.closed) {
    return 0;
  }

  const baseAmount =
    typeof loan.outstandingAmount === "number" && loan.outstandingAmount > 0
      ? loan.outstandingAmount
      : loan.totalLoanAmount ?? 0;

  const paidAmount = loan.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return Math.max(baseAmount - paidAmount, 0);
};

const resolvePersonalLoanEmiAmount = (loan: PersonalLoan) => {
  const fromEmi = Number(loan.emiAmount ?? 0);
  if (Number.isFinite(fromEmi) && fromEmi > 0) {
    return fromEmi;
  }

  const fromOutstanding = Number(loan.outstandingAmount ?? 0);
  if (Number.isFinite(fromOutstanding) && fromOutstanding > 0) {
    return fromOutstanding;
  }

  const fromTotal = Number(loan.totalLoanAmount ?? 0);
  if (Number.isFinite(fromTotal) && fromTotal > 0) {
    return fromTotal;
  }

  return 0;
};

const defaultRecurringTemplates: RecurringTemplate[] = [
  {
    id: "template-ott",
    title: "OTT Subscription",
    category: "Subscription",
    amount: 499,
    icon: "subscriptions",
    active: true,
    paidMonths: [],
  },
  {
    id: "template-rent",
    title: "Rent",
    category: "Rent",
    amount: 12000,
    icon: "home",
    active: true,
    paidMonths: [],
  },
  {
    id: "template-electricity",
    title: "Electricity Bill",
    category: "Utilities",
    amount: 1800,
    icon: "electric_bolt",
    active: true,
    paidMonths: [],
  },
];

const defaultSpendingTodos: SpendingTodo[] = [
  {
    id: "todo-rent",
    title: "Rent",
    category: "Rent",
    defaultAmount: 12000,
    note: "",
    active: true,
  },
  {
    id: "todo-electricity",
    title: "Electricity Bill",
    category: "Utilities",
    defaultAmount: 1800,
    note: "",
    active: true,
  },
  {
    id: "todo-life-insurance",
    title: "Life Insurance",
    category: "Bills & Recharge",
    defaultAmount: 0,
    note: "",
    active: true,
  },
  {
    id: "todo-sip",
    title: "SIP",
    category: "Recurring Expenses",
    defaultAmount: 0,
    note: "",
    active: true,
  },
  {
    id: "todo-parents-insurance",
    title: "Parents Insurance",
    category: "Bills & Recharge",
    defaultAmount: 0,
    note: "",
    active: true,
  },
];

const findLinkedExpense = (
  expenses: Expense[],
  sourceType: "loan_emi" | "insurance_premium" | "recurring_template",
  sourceId: string,
  sourceMonth: string,
) =>
  expenses.find(
    (expense) =>
      expense.sourceType === sourceType &&
      expense.sourceId === sourceId &&
      expense.sourceMonth === sourceMonth &&
      expense.isAutoGenerated,
  );

const initialExpenses: Expense[] = [];
const initialInvestments: Investment[] = [];
const initialSavingGoals: SavingGoal[] = [];
const initialLoans: Loan[] = [];
const initialPersonalLoans: PersonalLoan[] = [];
const initialLifeInsurances: LifeInsurance[] = [];
const initialRecurringTemplates: RecurringTemplate[] = defaultRecurringTemplates;
const initialSpendingTodos: SpendingTodo[] = defaultSpendingTodos;

const initialAdjustments: FinanceAdjustments = {
  manualAssets: 0,
  manualLiabilities: 0,
  essentialMonthlyExpense: 0,
  emergencyTargetMonths: 6,
};

export const useFinanceStore = create<FinanceStoreState>()(
  persist(
    (set, get) => ({
      currency: "USD",
      hasSelectedCurrency: false,
      selectedMonth: getCurrentMonth(),
      monthMode: "auto",
      dashboardWindow: 1,
      spendingCarryForwardEnabled: true,
      savingsCarryForwardEnabled: true,
      spendingBudget: 3000,
      monthlyBudgets: {},
      savingsBudget: 1000,
      categoryLimits: {},
      adjustments: initialAdjustments,
      expenses: initialExpenses,
      investments: initialInvestments,
      savingGoals: initialSavingGoals,
      loans: initialLoans,
      personalLoans: initialPersonalLoans,
      lifeInsurances: initialLifeInsurances,
      recurringTemplates: initialRecurringTemplates,
      spendingTodos: initialSpendingTodos,
      spendingTodoDoneMonths: {},
      recurringExpenses: () => get().expenses.filter((expense) => expense.recurring),
      dueSoonPersonalLoans: (leadDays = 3) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return get().personalLoans.filter((loan) => {
          if (!loan.nextEmiDate || loan.closed || getOutstandingForPersonalLoan(loan) <= 0) {
            return false;
          }

          const dueDateRaw = new Date(`${loan.nextEmiDate}T00:00:00`);
          const dueDate = new Date(dueDateRaw.getFullYear(), dueDateRaw.getMonth(), dueDateRaw.getDate());
          const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= leadDays;
        });
      },
      totalPersonalLoanOutstanding: () =>
        get().personalLoans.reduce((sum, loan) => sum + getOutstandingForPersonalLoan(loan), 0),
      totalMonthlyEmiDue: () =>
        get().personalLoans
          .filter((loan) => !loan.closed && getOutstandingForPersonalLoan(loan) > 0)
          .reduce((sum, loan) => sum + (loan.emiAmount ?? 0), 0),
      getWindowMonths: (anchorMonth, window) => {
        const months: string[] = [];
        for (let offset = window - 1; offset >= 0; offset -= 1) {
          months.push(shiftMonth(anchorMonth, -offset));
        }
        return months;
      },
      getExpensesForWindow: (anchorMonth, window) => {
        const months = new Set(get().getWindowMonths(anchorMonth, window));
        return get().expenses.filter((expense) => months.has(toMonth(expense.date)));
      },
      getSpentForMonth: (month) => getSpentForMonthFromState(get(), month),
      getBaseBudgetForMonth: (month) => getBaseBudgetForMonthFromState(get(), month),
      getSpendingCarryIn: (month) => getSpendingCarryInFromState(get(), month),
      getEffectiveSpendingBudget: (month) => {
        const state = get();
        const baseBudget = getBaseBudgetForMonthFromState(state, month);
        if (!state.spendingCarryForwardEnabled) {
          return baseBudget;
        }
        return baseBudget + getSpendingCarryInFromState(state, month);
      },
      getSpendingCarryOut: (month) => {
        const state = get();
        if (!state.spendingCarryForwardEnabled) {
          return 0;
        }

        const effectiveBudget = state.getEffectiveSpendingBudget(month);
        const spent = getSpentForMonthFromState(state, month);
        return Math.max(effectiveBudget - spent, 0);
      },
      setCurrency: (currency) => set({ currency, hasSelectedCurrency: true }),
      setHasSelectedCurrency: (value) => set({ hasSelectedCurrency: value }),
      setSelectedMonth: (month, mode) =>
        set((state) => ({
          selectedMonth: month,
          monthMode: mode ?? state.monthMode,
        })),
      syncCurrentMonth: () =>
        set((state) => {
          if (state.monthMode !== "auto") {
            return state;
          }
          const currentMonth = getCurrentMonth();
          if (state.selectedMonth === currentMonth) {
            return state;
          }
          return { ...state, selectedMonth: currentMonth };
        }),
      setDashboardWindow: (window) => set({ dashboardWindow: window }),
      setSpendingCarryForwardEnabled: (value) => set({ spendingCarryForwardEnabled: value }),
      setSavingsCarryForwardEnabled: (value) => set({ savingsCarryForwardEnabled: value }),
      setSpendingBudget: (amount) => set({ spendingBudget: amount }),
      setMonthlyBudget: (month, amount) =>
        set((state) => ({
          monthlyBudgets: {
            ...state.monthlyBudgets,
            [month]: amount,
          },
        })),
      setSavingsBudget: (amount) => {
        const parsed = Number(amount);
        if (!Number.isFinite(parsed) || parsed < 0) {
          return;
        }
        const normalized = Number(parsed.toFixed(2));
        set({ savingsBudget: normalized });
      },
      setCategoryLimit: (category, limit) =>
        set((state) => ({
          categoryLimits: {
            ...state.categoryLimits,
            [category]: limit,
          },
        })),
      setManualAssets: (value) =>
        set((state) => ({
          adjustments: {
            ...state.adjustments,
            manualAssets: Math.max(value, 0),
          },
        })),
      setManualLiabilities: (value) =>
        set((state) => ({
          adjustments: {
            ...state.adjustments,
            manualLiabilities: Math.max(value, 0),
          },
        })),
      setEssentialMonthlyExpense: (value) =>
        set((state) => ({
          adjustments: {
            ...state.adjustments,
            essentialMonthlyExpense: Math.max(value, 0),
          },
        })),
      setEmergencyTargetMonths: (value) =>
        set((state) => ({
          adjustments: {
            ...state.adjustments,
            emergencyTargetMonths: Math.max(Math.round(value), 1),
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
        set((state) => {
          const target = state.expenses.find((expense) => expense.id === id);
          if (!target) {
            return state;
          }

          const nextState: Partial<FinanceStoreState> = {
            expenses: state.expenses.filter((expense) => expense.id !== id),
          };

          if (target.sourceType && target.sourceId && target.sourceMonth) {
            if (target.sourceType === "loan_emi") {
              nextState.personalLoans = state.personalLoans.map((loan) =>
                loan.id === target.sourceId ? { ...loan, emiPaid: false } : loan,
              );
            }

            if (target.sourceType === "insurance_premium") {
              nextState.lifeInsurances = state.lifeInsurances.map((entry) =>
                entry.id === target.sourceId ? { ...entry, paid: false } : entry,
              );
            }

            if (target.sourceType === "recurring_template") {
              nextState.recurringTemplates = state.recurringTemplates.map((template) =>
                template.id === target.sourceId
                  ? {
                      ...template,
                      paidMonths: template.paidMonths.filter((month) => month !== target.sourceMonth),
                    }
                  : template,
              );
            }
          }

          return nextState;
        }),
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
          savingGoals: [{ ...goal, isEmergencyFund: goal.isEmergencyFund ?? false, id: generateId() }, ...state.savingGoals],
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
          const repaidAmount = loan.repaid ? loan.amount : loan.repaidAmount ?? 0;
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
      addPersonalLoan: (loan) =>
        set((state) => {
          const nextEmiDate =
            loan.nextEmiDate ||
            (typeof loan.emiDayOfMonth === "number" ? getInitialNextEmiDate(loan.startDate, loan.emiDayOfMonth) : undefined);

          const personalLoan: PersonalLoan = {
            ...loan,
            id: generateId(),
            payments: loan.payments ?? [],
            closed: loan.closed ?? false,
            nextEmiDate,
            emiPaid: loan.emiPaid ?? false,
            note: loan.note ?? "",
          };

          return {
            personalLoans: [personalLoan, ...state.personalLoans],
          };
        }),
      updatePersonalLoan: (loan) =>
        set((state) => ({
          personalLoans: state.personalLoans.map((existing) => {
            if (existing.id !== loan.id) {
              return existing;
            }

            const nextEmiDate =
              loan.closed
                ? undefined
                : loan.nextEmiDate ||
                  (typeof loan.emiDayOfMonth === "number" ? getInitialNextEmiDate(loan.startDate, loan.emiDayOfMonth) : undefined);

            return {
              ...loan,
              nextEmiDate,
              emiPaid: loan.emiPaid ?? false,
              note: loan.note ?? "",
            };
          }),
        })),
      deletePersonalLoan: (id) =>
        set((state) => ({
          personalLoans: state.personalLoans.filter((loan) => loan.id !== id),
          expenses: state.expenses.filter(
            (expense) => !(expense.sourceType === "loan_emi" && expense.sourceId === id && expense.isAutoGenerated),
          ),
        })),
      addPersonalLoanPayment: (id, amount, date) =>
        set((state) => ({
          personalLoans: state.personalLoans.map((loan) => {
            if (loan.id !== id || loan.closed) {
              return loan;
            }

            const nextPayments = [...loan.payments, { id: generateId(), amount, date }];
            const nextOutstanding = getOutstandingForPersonalLoan({ ...loan, payments: nextPayments });
            const shouldClose = nextOutstanding <= 0;

            return {
              ...loan,
              payments: nextPayments,
              closed: shouldClose,
              emiPaid: true,
              nextEmiDate:
                shouldClose
                  ? undefined
                  : advanceEmiDate(loan.nextEmiDate ?? date, loan.emiDayOfMonth),
            };
          }),
        })),
      markPersonalLoanEmiPaid: (id) =>
        set((state) => {
          const sourceMonth = state.selectedMonth;
          const targetLoan = state.personalLoans.find((loan) => loan.id === id);
          if (!targetLoan || targetLoan.closed) {
            return state;
          }

          const linked = findLinkedExpense(state.expenses, "loan_emi", id, sourceMonth);
          if (linked) {
            return state;
          }

          const amount = resolvePersonalLoanEmiAmount(targetLoan);
          if (amount <= 0) {
            return state;
          }

          return {
            personalLoans: state.personalLoans.map((loan) =>
              loan.id === id ? { ...loan, emiPaid: true } : loan,
            ),
            expenses: [
              {
                id: generateId(),
                name: `${targetLoan.lenderName} EMI`,
                category: "EMI Expenses",
                amount,
                date: getCurrentDate(),
                icon: "credit_card",
                note: "",
                recurring: false,
                sourceType: "loan_emi",
                sourceId: id,
                sourceMonth,
                isAutoGenerated: true,
              },
              ...state.expenses,
            ],
          };
        }),
      unmarkPersonalLoanEmiPaid: (id) =>
        set((state) => {
          const sourceMonth = state.selectedMonth;
          const linked = findLinkedExpense(state.expenses, "loan_emi", id, sourceMonth);

          return {
            personalLoans: state.personalLoans.map((loan) =>
              loan.id === id ? { ...loan, emiPaid: false } : loan,
            ),
            expenses: linked
              ? state.expenses.filter((expense) => expense.id !== linked.id)
              : state.expenses,
          };
        }),
      togglePersonalLoanEmiPaid: (id) =>
        (() => {
          const state = get();
          const linked = findLinkedExpense(state.expenses, "loan_emi", id, state.selectedMonth);
          if (linked) {
            get().unmarkPersonalLoanEmiPaid(id);
            return;
          }
          get().markPersonalLoanEmiPaid(id);
        })(),
      closePersonalLoan: (id) =>
        set((state) => ({
          personalLoans: state.personalLoans.map((loan) =>
            loan.id === id
              ? {
                  ...loan,
                  closed: true,
                  nextEmiDate: undefined,
                }
              : loan,
          ),
        })),
      recalculateNextEmiDate: (id) =>
        set((state) => ({
          personalLoans: state.personalLoans.map((loan) => {
            if (loan.id !== id || loan.closed) {
              return loan;
            }

            return {
              ...loan,
              emiPaid: false,
              nextEmiDate: advanceEmiDate(loan.nextEmiDate ?? getCurrentDate(), loan.emiDayOfMonth),
            };
          }),
        })),
      addLifeInsurance: (entry) =>
        set((state) => ({
          lifeInsurances: [{ ...entry, paid: entry.paid ?? false, id: generateId() }, ...state.lifeInsurances],
        })),
      updateLifeInsurance: (entry) =>
        set((state) => ({
          lifeInsurances: state.lifeInsurances.map((existing) => (existing.id === entry.id ? entry : existing)),
        })),
      deleteLifeInsurance: (id) =>
        set((state) => ({
          lifeInsurances: state.lifeInsurances.filter((entry) => entry.id !== id),
          expenses: state.expenses.filter(
            (expense) =>
              !(expense.sourceType === "insurance_premium" && expense.sourceId === id && expense.isAutoGenerated),
          ),
        })),
      toggleLifeInsurancePaid: (id) =>
        set((state) => {
          const sourceMonth = state.selectedMonth;
          const target = state.lifeInsurances.find((entry) => entry.id === id);
          if (!target) {
            return state;
          }

          const linked = findLinkedExpense(state.expenses, "insurance_premium", id, sourceMonth);
          const nextPaid = !Boolean(linked);
          const nextLifeInsurances = state.lifeInsurances.map((entry) =>
            entry.id === id ? { ...entry, paid: nextPaid } : entry,
          );

          let nextExpenses = state.expenses;

          if (nextPaid) {
            if (!linked && target.monthlyAmount > 0) {
              nextExpenses = [
                {
                  id: generateId(),
                  name: `${target.providerName} Premium`,
                  category: "Bills & Recharge",
                  amount: target.monthlyAmount,
                  date: getCurrentDate(),
                  icon: "shield",
                  note: "",
                  recurring: false,
                  sourceType: "insurance_premium",
                  sourceId: id,
                  sourceMonth,
                  isAutoGenerated: true,
                },
                ...state.expenses,
              ];
            }
          } else if (linked) {
            nextExpenses = state.expenses.filter((expense) => expense.id !== linked.id);
          }

          return {
            lifeInsurances: nextLifeInsurances,
            expenses: nextExpenses,
          };
        }),
      addRecurringTemplate: (template) =>
        set((state) => {
          const title = template.title.trim();
          const category = template.category.trim();
          const amount = Number(template.amount);
          if (!title || !category || !Number.isFinite(amount) || amount <= 0) {
            return state;
          }

          return {
            recurringTemplates: [
              {
                id: generateId(),
                title,
                category,
                amount,
                icon: template.icon || "receipt_long",
                active: template.active ?? true,
                paidMonths: template.paidMonths ?? [],
              },
              ...state.recurringTemplates,
            ],
          };
        }),
      updateRecurringTemplate: (template) =>
        set((state) => ({
          recurringTemplates: state.recurringTemplates.map((existing) =>
            existing.id === template.id ? template : existing,
          ),
        })),
      deleteRecurringTemplate: (id) =>
        set((state) => ({
          recurringTemplates: state.recurringTemplates.filter((template) => template.id !== id),
          expenses: state.expenses.filter(
            (expense) => !(expense.sourceType === "recurring_template" && expense.sourceId === id && expense.isAutoGenerated),
          ),
        })),
      toggleRecurringTemplatePaid: (id, month) =>
        set((state) => {
          const target = state.recurringTemplates.find((template) => template.id === id);
          if (!target || !target.active) {
            return state;
          }

          const isPaid = target.paidMonths.includes(month);
          const nextPaidMonths = isPaid
            ? target.paidMonths.filter((paidMonth) => paidMonth !== month)
            : [...target.paidMonths, month];

          const nextTemplates = state.recurringTemplates.map((template) =>
            template.id === id ? { ...template, paidMonths: nextPaidMonths } : template,
          );

          let nextExpenses = state.expenses;
          const linked = findLinkedExpense(state.expenses, "recurring_template", id, month);

          if (!isPaid) {
            if (!linked && target.amount > 0) {
              nextExpenses = [
                {
                  id: generateId(),
                  name: target.title,
                  category: "Recurring Expenses",
                  amount: target.amount,
                  date: getCurrentDate(),
                  icon: target.icon || "receipt_long",
                  note: "",
                  recurring: false,
                  sourceType: "recurring_template",
                  sourceId: id,
                  sourceMonth: month,
                  isAutoGenerated: true,
                },
                ...state.expenses,
              ];
            }
          } else if (linked) {
            nextExpenses = state.expenses.filter((expense) => expense.id !== linked.id);
          }

          return {
            recurringTemplates: nextTemplates,
            expenses: nextExpenses,
          };
        }),
      addSpendingTodo: (todo) =>
        set((state) => {
          const title = todo.title.trim();
          const category = todo.category.trim();
          const defaultAmount = Number(todo.defaultAmount);
          if (!title || !category || !Number.isFinite(defaultAmount) || defaultAmount < 0) {
            return state;
          }

          return {
            spendingTodos: [
              {
                id: generateId(),
                title,
                category,
                defaultAmount: Number(defaultAmount.toFixed(2)),
                note: todo.note?.trim() ?? "",
                active: todo.active ?? true,
              },
              ...state.spendingTodos,
            ],
          };
        }),
      updateSpendingTodo: (todo) =>
        set((state) => ({
          spendingTodos: state.spendingTodos.map((existing) => (existing.id === todo.id ? todo : existing)),
        })),
      deleteSpendingTodo: (id) =>
        set((state) => {
          const nextDoneMonths = { ...state.spendingTodoDoneMonths };
          delete nextDoneMonths[id];
          return {
            spendingTodos: state.spendingTodos.filter((todo) => todo.id !== id),
            spendingTodoDoneMonths: nextDoneMonths,
          };
        }),
      toggleSpendingTodoDone: (id, month) =>
        set((state) => {
          const doneMonths = state.spendingTodoDoneMonths[id] ?? [];
          const isDone = doneMonths.includes(month);
          const nextDoneMonths = isDone
            ? doneMonths.filter((doneMonth) => doneMonth !== month)
            : [...doneMonths, month];

          return {
            spendingTodoDoneMonths: {
              ...state.spendingTodoDoneMonths,
              [id]: nextDoneMonths,
            },
          };
        }),
      syncSourcePaymentToExpense: ({ sourceType, sourceId, sourceMonth, paid, name, category, amount, icon }) =>
        set((state) => {
          const linked = findLinkedExpense(state.expenses, sourceType, sourceId, sourceMonth);
          if (paid) {
            if (linked || amount <= 0) {
              return state;
            }
            return {
              expenses: [
                {
                  id: generateId(),
                  name,
                  category,
                  amount,
                  date: getCurrentDate(),
                  icon: icon || "receipt_long",
                  note: "",
                  recurring: false,
                  sourceType,
                  sourceId,
                  sourceMonth,
                  isAutoGenerated: true,
                },
                ...state.expenses,
              ],
            };
          }

          if (!linked) {
            return state;
          }
          return {
            expenses: state.expenses.filter((expense) => expense.id !== linked.id),
          };
        }),
      removeLinkedExpenseAndUnmarkSource: (expenseId) =>
        set((state) => {
          const target = state.expenses.find((expense) => expense.id === expenseId);
          if (!target || !target.sourceType || !target.sourceId || !target.sourceMonth) {
            return {
              expenses: state.expenses.filter((expense) => expense.id !== expenseId),
            };
          }

          const nextState: Partial<FinanceStoreState> = {
            expenses: state.expenses.filter((expense) => expense.id !== expenseId),
          };

          if (target.sourceType === "loan_emi") {
            nextState.personalLoans = state.personalLoans.map((loan) =>
              loan.id === target.sourceId ? { ...loan, emiPaid: false } : loan,
            );
          }
          if (target.sourceType === "insurance_premium") {
            nextState.lifeInsurances = state.lifeInsurances.map((entry) =>
              entry.id === target.sourceId ? { ...entry, paid: false } : entry,
            );
          }
          if (target.sourceType === "recurring_template") {
            nextState.recurringTemplates = state.recurringTemplates.map((template) =>
              template.id === target.sourceId
                ? {
                    ...template,
                    paidMonths: template.paidMonths.filter((month) => month !== target.sourceMonth),
                  }
                : template,
            );
          }

          return nextState;
        }),
    }),
    {
      name: "finance-app-store-v2",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

