export type TabKey = "spending" | "savings" | "lending" | "analytics" | "settings";

export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "JPY" | "AED";

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  icon: string;
  recurring: boolean;
}

export type NewExpense = Omit<Expense, "id">;

export interface SavingGoal {
  id: string;
  name: string;
  category: string;
  targetAmount: number;
  savedAmount: number;
  date: string;
  icon: string;
}

export type NewSavingGoal = Omit<SavingGoal, "id">;

export interface Loan {
  id: string;
  personName: string;
  reason: string;
  amount: number;
  repaidAmount: number;
  repaid: boolean;
  date: string;
  dueDate?: string;
}

export type NewLoan = Omit<Loan, "id">;

