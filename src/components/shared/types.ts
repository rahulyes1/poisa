export type TabKey = "spending" | "savings" | "lending";

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  icon: string;
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
  repaid: boolean;
  date: string;
}

export type NewLoan = Omit<Loan, "id">;
