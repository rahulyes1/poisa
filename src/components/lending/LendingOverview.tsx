"use client";

import { useMemo } from "react";
import PersonCard from "./PersonCard";
import PersonalLoanCard from "./PersonalLoanCard";
import { useFinanceStore } from "../shared/store";
import { Loan, PersonalLoan } from "../shared/types";
import { useCurrency } from "../shared/useCurrency";

interface LendingOverviewProps {
  onEditLoan: (loan: Loan) => void;
  onEditPersonalLoan: (loan: PersonalLoan) => void;
}

export default function LendingOverview({ onEditLoan, onEditPersonalLoan }: LendingOverviewProps) {
  const { formatCurrency } = useCurrency();
  const loans = useFinanceStore((state) => state.loans);
  const personalLoans = useFinanceStore((state) => state.personalLoans);
  const dueSoonPersonalLoans = useFinanceStore((state) => state.dueSoonPersonalLoans);
  const totalPersonalLoanOutstanding = useFinanceStore((state) => state.totalPersonalLoanOutstanding);
  const totalMonthlyEmiDue = useFinanceStore((state) => state.totalMonthlyEmiDue);

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
  const sortedPersonalLoans = [...personalLoans].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const dueSoonCount = dueSoonPersonalLoans(3).length;
  const personalOutstanding = totalPersonalLoanOutstanding();
  const monthlyEmiDue = totalMonthlyEmiDue();

  return (
    <section className="px-5 pt-4 pb-4 space-y-4">
      {dueSoonCount > 0 && (
        <div className="rounded-xl border border-[rgba(255,140,66,0.35)] bg-[rgba(255,140,66,0.12)] px-3 py-2 text-[#FF8C42] text-xs font-semibold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px]">notification_important</span>
          EMI due soon: {dueSoonCount}
        </div>
      )}

      <div className="bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-4">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4a4a6a]">Lending Snapshot</p>
            <p className="text-xl font-bold text-[#f0f0ff]">{formatCurrency(outstanding)}</p>
          </div>
          <p className="text-sm font-medium text-vibrant-orange">{pendingCount} pending</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-2.5">
            <p className="text-[#6b7280] uppercase tracking-wide">Money Lent</p>
            <p className="text-sm font-semibold text-[#f0f0ff] mt-0.5">{formatCurrency(outstanding)}</p>
            <p className="text-[11px] text-[#6b7280] mt-1">
              {formatCurrency(paidBack)} of {formatCurrency(totalLent)} repaid
            </p>
          </div>
          <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-2.5">
            <p className="text-[#6b7280] uppercase tracking-wide">My Liabilities</p>
            <p className="text-sm font-semibold text-[#FF8C42] mt-0.5">{formatCurrency(personalOutstanding)}</p>
            <p className="text-[11px] text-[#6b7280] mt-1">EMI due/month: {formatCurrency(monthlyEmiDue)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-white">Money Lent</h3>
          <span className="text-xs text-white/55">{sortedLoans.length}</span>
        </div>

        {sortedLoans.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-6 text-center">
            <p className="text-sm font-medium text-[#6b7280]">No lent entries yet.</p>
            <p className="text-xs text-[#6b7280] mt-1">Use Lend to Someone to track receivables.</p>
          </div>
        ) : (
          <div className="bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-4 space-y-3">
            {sortedLoans.map((loan) => (
              <PersonCard key={loan.id} loan={loan} onEditLoan={onEditLoan} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-white">My Loans (EMI)</h3>
          <span className="text-xs text-white/55">{sortedPersonalLoans.length}</span>
        </div>
        <p className="px-1 text-[11px] text-white/50">Mark Paid adds a linked EMI expense in Spending for the selected month.</p>

        {sortedPersonalLoans.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-6 text-center">
            <p className="text-sm font-medium text-[#6b7280]">No personal loans yet.</p>
            <p className="text-xs text-[#6b7280] mt-1">Use Add My Loan to track EMI dues.</p>
          </div>
        ) : (
          <div className="bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-4 space-y-3">
            {sortedPersonalLoans.map((loan) => (
              <PersonalLoanCard key={loan.id} loan={loan} onEditPersonalLoan={onEditPersonalLoan} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

