export type TabKey = "spending" | "investing" | "lending" | "analytics" | "settings";

export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "JPY" | "AED";
export type DashboardWindow = 1 | 3 | 6 | 12;
export type MonthMode = "auto" | "manual";

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  icon: string;
  note: string;
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
  isEmergencyFund?: boolean;
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

export interface Investment {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  note: string;
}

export type NewInvestment = Omit<Investment, "id">;

export interface FinanceAdjustments {
  manualAssets: number;
  manualLiabilities: number;
  essentialMonthlyExpense: number;
  emergencyTargetMonths: number;
}

export type PersonalLoanType = "home" | "car" | "personal" | "education" | "credit_card" | "business" | "other";

export interface PersonalLoanPayment {
  id: string;
  date: string;
  amount: number;
}

export interface PersonalLoan {
  id: string;
  lenderName: string;
  loanType: PersonalLoanType;
  customTypeLabel?: string;
  startDate: string;
  totalLoanAmount?: number;
  emiAmount?: number;
  emiDayOfMonth?: number;
  nextEmiDate?: string;
  outstandingAmount?: number;
  note?: string;
  closed: boolean;
  payments: PersonalLoanPayment[];
}

export type NewPersonalLoan = Omit<PersonalLoan, "id" | "payments" | "closed"> & {
  payments?: PersonalLoanPayment[];
  closed?: boolean;
};
