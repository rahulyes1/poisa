"use client";

import { useMemo } from "react";
import PersonCard from "./PersonCard";
import { useFinanceStore } from "../shared/store";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export default function LendingOverview() {
  const loans = useFinanceStore((state) => state.loans);
  const toggleLoanRepaid = useFinanceStore((state) => state.toggleLoanRepaid);

  const { totalLent, outstanding, paidBack } = useMemo(() => {
    return loans.reduce(
      (acc, loan) => {
        acc.totalLent += loan.amount;
        if (loan.repaid) {
          acc.paidBack += loan.amount;
        } else {
          acc.outstanding += loan.amount;
        }
        return acc;
      },
      { totalLent: 0, outstanding: 0, paidBack: 0 },
    );
  }, [loans]);

  const pendingCount = loans.filter((loan) => !loan.repaid).length;
  const sortedLoans = [...loans].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <section className="px-5 pt-4 pb-4 space-y-4">
      <div className="bg-white dark:bg-[#15152a] rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Net Lending Balance
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(outstanding)}</p>
          </div>
          <p className="text-sm font-medium text-vibrant-orange">{pendingCount} pending</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatCurrency(paidBack)} paid back of {formatCurrency(totalLent)} lent
        </p>
      </div>

      {sortedLoans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No loans yet.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Use Lend Money to track who owes you.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15152a] rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-3">
          {sortedLoans.map((loan) => (
            <PersonCard key={loan.id} loan={loan} onTogglePaid={toggleLoanRepaid} />
          ))}
        </div>
      )}
    </section>
  );
}
