"use client";

import { useMemo, useState } from "react";
import PersonCard from "./PersonCard";
import PersonalLoanCard from "./PersonalLoanCard";
import MoneyTookCard from "./MoneyTookCard";
import { useFinanceStore } from "../shared/store";
import { Loan, MoneyTookEntry, PersonalLoan } from "../shared/types";
import { useCurrency } from "../shared/useCurrency";

interface LendingOverviewProps {
  onEditLoan: (loan: Loan) => void;
  onEditPersonalLoan: (loan: PersonalLoan) => void;
  onEditMoneyTook: (entry: MoneyTookEntry) => void;
}

type LendingSegment = "overview" | "money_lent" | "money_took" | "my_loans";

const getMoneyTookOutstanding = (entry: MoneyTookEntry) => {
  if (entry.closed) {
    return 0;
  }
  const paid = entry.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return Math.max(entry.amount - paid, 0);
};

export default function LendingOverview({ onEditLoan, onEditPersonalLoan, onEditMoneyTook }: LendingOverviewProps) {
  const { formatCurrency } = useCurrency();
  const [activeSegment, setActiveSegment] = useState<LendingSegment>("overview");

  const loans = useFinanceStore((state) => state.loans);
  const personalLoans = useFinanceStore((state) => state.personalLoans);
  const moneyTookEntries = useFinanceStore((state) => state.moneyTookEntries);
  const dueSoonPersonalLoans = useFinanceStore((state) => state.dueSoonPersonalLoans);
  const totalPersonalLoanOutstanding = useFinanceStore((state) => state.totalPersonalLoanOutstanding);
  const totalMonthlyEmiDue = useFinanceStore((state) => state.totalMonthlyEmiDue);
  const getMoneyTookOutstandingTotal = useFinanceStore((state) => state.getMoneyTookOutstandingTotal);
  const getMoneyTookBorrowedTotal = useFinanceStore((state) => state.getMoneyTookBorrowedTotal);
  const getMoneyTookDueSoonCount = useFinanceStore((state) => state.getMoneyTookDueSoonCount);
  const getMoneyTookOverdueCount = useFinanceStore((state) => state.getMoneyTookOverdueCount);

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
  const sortedMoneyTook = [...moneyTookEntries].sort((a, b) => (b.dueDate || "").localeCompare(a.dueDate || ""));
  const moneyTookOutstanding = getMoneyTookOutstandingTotal();
  const moneyTookBorrowed = getMoneyTookBorrowedTotal();
  const moneyTookDueSoonCount = getMoneyTookDueSoonCount(3);
  const moneyTookOverdueCount = getMoneyTookOverdueCount();

  return (
    <section className="px-5 pt-4 pb-4 space-y-4">
      <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111118] p-2">
        <div className="grid grid-cols-4 gap-1.5">
          {([
            { id: "overview", label: "Overview" },
            { id: "money_lent", label: "Money Lent" },
            { id: "money_took", label: "Money I Took" },
            { id: "my_loans", label: "My Loans" },
          ] as Array<{ id: LendingSegment; label: string }>).map((segment) => (
            <button
              key={segment.id}
              type="button"
              onClick={() => setActiveSegment(segment.id)}
              className={`segment-pill-tab ${activeSegment === segment.id ? "segment-pill-tab-active" : ""}`}
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

          {(moneyTookDueSoonCount > 0 || moneyTookOverdueCount > 0) && (
            <div className="rounded-xl border border-[rgba(79,70,229,0.45)] bg-[rgba(79,70,229,0.15)] px-3 py-2 text-[#C7D2FE] text-xs font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Money I Took alerts: {moneyTookOverdueCount} overdue, {moneyTookDueSoonCount} due soon
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-2.5">
                <p className="text-[#94A3B8] uppercase tracking-wide">Money Lent</p>
                <p className="text-sm font-semibold text-[#f0f0ff] mt-0.5">{formatCurrency(outstanding)}</p>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  {formatCurrency(paidBack)} of {formatCurrency(totalLent)} repaid
                </p>
              </div>
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-2.5">
                <p className="text-[#94A3B8] uppercase tracking-wide">Money I Took</p>
                <p className="text-sm font-semibold text-[#D7D8FF] mt-0.5">{formatCurrency(moneyTookOutstanding)}</p>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  {formatCurrency(moneyTookBorrowed)} borrowed total
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
              <h3 className="text-sm font-semibold text-white">Money I Took Preview</h3>
              <button
                type="button"
                onClick={() => setActiveSegment("money_took")}
                className="h-6 px-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111118] text-[10px] font-semibold text-[#c7dfdb]"
              >
                View All
              </button>
            </div>
            {sortedMoneyTook.slice(0, 3).length === 0 ? (
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-3 text-[11px] text-[#94A3B8]">
                No entries yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {sortedMoneyTook.slice(0, 3).map((entry) => {
                  const outstandingAmount = getMoneyTookOutstanding(entry);
                  return (
                    <article key={entry.id} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-[#f0f0ff]">{entry.lenderName}</p>
                          <p className="text-[11px] text-[#94A3B8]">Due: {entry.dueDate || "Not set"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-[#D7D8FF]">{formatCurrency(outstandingAmount)}</p>
                          <p className="text-[10px] text-[#94A3B8]">{entry.closed || outstandingAmount <= 0 ? "Closed" : "Active"}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
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

      {activeSegment === "money_took" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-white">Money I Took</h3>
            <span className="text-xs text-white/55">{sortedMoneyTook.length}</span>
          </div>
          <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111118] p-3 text-[11px] text-[#94A3B8] flex flex-wrap gap-3">
            <span>Total borrowed: {formatCurrency(moneyTookBorrowed)}</span>
            <span>Outstanding: {formatCurrency(moneyTookOutstanding)}</span>
            <span>Due soon: {moneyTookDueSoonCount}</span>
            <span>Overdue: {moneyTookOverdueCount}</span>
          </div>
          {sortedMoneyTook.length === 0 ? (
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111118] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-6 text-center">
              <p className="text-sm font-medium text-[#94A3B8]">No money-took entries yet.</p>
              <p className="text-xs text-[#94A3B8] mt-1">Use Add Money I Took to track amounts you borrowed.</p>
            </div>
          ) : (
            <div className="bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-4 space-y-3">
              {sortedMoneyTook.map((entry) => (
                <MoneyTookCard key={entry.id} entry={entry} onEdit={onEditMoneyTook} />
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
