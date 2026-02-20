"use client";

import { useMemo, useState } from "react";
import PersonCard from "./PersonCard";
import PersonalLoanCard from "./PersonalLoanCard";
import { useFinanceStore } from "../shared/store";
import { Loan, PersonalLoan } from "../shared/types";
import { useCurrency } from "../shared/useCurrency";

interface LendingOverviewProps {
  onEditLoan: (loan: Loan) => void;
  onEditPersonalLoan: (loan: PersonalLoan) => void;
}

type LendingSegment = "overview" | "money_lent" | "my_loans";

export default function LendingOverview({ onEditLoan, onEditPersonalLoan }: LendingOverviewProps) {
  const { formatCurrency } = useCurrency();
  const [activeSegment, setActiveSegment] = useState<LendingSegment>("overview");

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
      <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111118] p-2">
        <div className="grid grid-cols-3 gap-1.5">
          {([
            { id: "overview", label: "Overview" },
            { id: "money_lent", label: "Money Lent" },
            { id: "my_loans", label: "My Loans" },
          ] as Array<{ id: LendingSegment; label: string }>).map((segment) => (
            <button
              key={segment.id}
              type="button"
              onClick={() => setActiveSegment(segment.id)}
              className={`h-8 rounded-xl text-[10px] font-semibold uppercase tracking-wide active:scale-95 transition-all ${
                activeSegment === segment.id
                  ? "bg-white/[0.08] border border-white/35 text-white"
                  : "bg-[#111118] border border-[rgba(255,255,255,0.08)] text-[#94A3B8]"
              }`}
            >
              {segment.label}
            </button>
          ))}
        </div>
      </div>

      {activeSegment === "overview" && (
        <>
          {dueSoonCount > 0 && (
            <div className="rounded-xl border border-[rgba(255,140,66,0.35)] bg-[rgba(255,140,66,0.12)] px-3 py-2 text-[#FF8C42] text-xs font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">notification_important</span>
              EMI due soon: {dueSoonCount}
            </div>
          )}

          <div className="bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-4">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Lending Snapshot</p>
                <p className="text-xl font-bold text-[#f0f0ff]">{formatCurrency(outstanding)}</p>
              </div>
              <p className="text-sm font-medium text-[#FF8C42]">{pendingCount} pending</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-2.5">
                <p className="text-[#94A3B8] uppercase tracking-wide">Money Lent</p>
                <p className="text-sm font-semibold text-[#f0f0ff] mt-0.5">{formatCurrency(outstanding)}</p>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  {formatCurrency(paidBack)} of {formatCurrency(totalLent)} repaid
                </p>
              </div>
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-2.5">
                <p className="text-[#94A3B8] uppercase tracking-wide">My Liabilities</p>
                <p className="text-sm font-semibold text-[#FF8C42] mt-0.5">{formatCurrency(personalOutstanding)}</p>
                <p className="text-[11px] text-[#94A3B8] mt-1">EMI due/month: {formatCurrency(monthlyEmiDue)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111118] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Money Lent Preview</h3>
              <button
                type="button"
                onClick={() => setActiveSegment("money_lent")}
                className="h-6 px-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111118] text-[10px] font-semibold text-[#c7dfdb]"
              >
                View All
              </button>
            </div>
            {sortedLoans.slice(0, 3).length === 0 ? (
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-3 text-[11px] text-[#94A3B8]">
                No entries yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {sortedLoans.slice(0, 3).map((loan) => (
                  <article key={loan.id} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[#f0f0ff]">{loan.personName}</p>
                        <p className="text-[11px] text-[#94A3B8]">{loan.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-[#f0f0ff]">{formatCurrency(Math.max(loan.amount - loan.repaidAmount, 0))}</p>
                        <p className="text-[10px] text-[#94A3B8]">{loan.repaid ? "Repaid" : "Pending"}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111118] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">My Loans Preview</h3>
              <button
                type="button"
                onClick={() => setActiveSegment("my_loans")}
                className="h-6 px-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111118] text-[10px] font-semibold text-[#c7dfdb]"
              >
                View All
              </button>
            </div>
            {sortedPersonalLoans.slice(0, 3).length === 0 ? (
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-3 text-[11px] text-[#94A3B8]">
                No entries yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {sortedPersonalLoans.slice(0, 3).map((loan) => (
                  <article key={loan.id} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[#f0f0ff]">{loan.lenderName}</p>
                        <p className="text-[11px] text-[#94A3B8]">{loan.customTypeLabel || loan.loanType.replace("_", " ")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-[#FF8C42]">{formatCurrency(loan.emiAmount ?? 0)}</p>
                        <p className="text-[10px] text-[#94A3B8]">{loan.closed ? "Closed" : "Active"}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeSegment === "money_lent" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-white">Money Lent</h3>
            <span className="text-xs text-white/55">{sortedLoans.length}</span>
          </div>

          {sortedLoans.length === 0 ? (
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111118] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-6 text-center">
              <p className="text-sm font-medium text-[#94A3B8]">No lent entries yet.</p>
              <p className="text-xs text-[#94A3B8] mt-1">Use Lend to Someone to track receivables.</p>
            </div>
          ) : (
            <div className="bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-4 space-y-3">
              {sortedLoans.map((loan) => (
                <PersonCard key={loan.id} loan={loan} onEditLoan={onEditLoan} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeSegment === "my_loans" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-white">My Loans (EMI)</h3>
            <span className="text-xs text-white/55">{sortedPersonalLoans.length}</span>
          </div>
          <p className="px-1 text-[11px] text-white/50">Mark Paid adds a linked EMI expense in Spending for the selected month.</p>

          {sortedPersonalLoans.length === 0 ? (
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111118] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-6 text-center">
              <p className="text-sm font-medium text-[#94A3B8]">No personal loans yet.</p>
              <p className="text-xs text-[#94A3B8] mt-1">Use Add My Loan to track EMI dues.</p>
            </div>
          ) : (
            <div className="bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-4 space-y-3">
              {sortedPersonalLoans.map((loan) => (
                <PersonalLoanCard key={loan.id} loan={loan} onEditPersonalLoan={onEditPersonalLoan} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

