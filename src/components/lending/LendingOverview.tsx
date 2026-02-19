"use client";

import { useMemo } from "react";
import PersonCard from "./PersonCard";
import { useFinanceStore } from "../shared/store";
import { Loan } from "../shared/types";
import { useCurrency } from "../shared/useCurrency";

interface LendingOverviewProps {
  onEditLoan: (loan: Loan) => void;
}

export default function LendingOverview({ onEditLoan }: LendingOverviewProps) {
  const { formatCurrency } = useCurrency();
  const loans = useFinanceStore((state) => state.loans);

  const { totalLent, outstanding, paidBack } = useMemo(() => {
    return loans.reduce(
      (acc, loan) => {
        acc.totalLent += loan.amount;
        if (loan.repaid) {
          acc.paidBack += loan.amount;
        } else {
          acc.outstanding += Math.max(loan.amount - loan.repaidAmount, 0);
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
      <div className="bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4a4a6a]">
              Net Lending Balance
            </p>
            <p className="text-xl font-bold text-[#f0f0ff]">{formatCurrency(outstanding)}</p>
          </div>
          <p className="text-sm font-medium text-vibrant-orange">{pendingCount} pending</p>
        </div>
        <p className="text-xs text-[#6b7280]">
          {formatCurrency(paidBack)} paid back of {formatCurrency(totalLent)} lent
        </p>
      </div>

      {sortedLoans.length === 0 ? (
        <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-8 text-center">
          <p className="text-sm font-medium text-[#6b7280]">No loans yet.</p>
          <p className="text-xs text-[#6b7280] mt-1">
            Use Lend Money to track who owes you.
          </p>
        </div>
      ) : (
        <div className="bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-4 space-y-3">
          {sortedLoans.map((loan) => (
            <PersonCard key={loan.id} loan={loan} onEditLoan={onEditLoan} />
          ))}
        </div>
      )}
    </section>
  );
}

