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
  onAddMoneyLent: () => void;
  onAddMoneyOwed: () => void;
  onAddLoanEmi: () => void;
  onOpenLendingCalculator: () => void;
}

type LendingSegment = "overview" | "money_lent" | "money_took" | "my_loans";

const getMoneyTookOutstanding = (entry: MoneyTookEntry) => {
  if (entry.closed) {
    return 0;
  }
  const paid = entry.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return Math.max(entry.amount - paid, 0);
};

const getLoanStatus = (loan: Loan) => {
  if (loan.repaid) return "Repaid";
  if (loan.repaidAmount > 0) return "Partial";
  return "Pending";
};

export default function LendingOverview({
  onEditLoan,
  onEditPersonalLoan,
  onEditMoneyTook,
  onAddMoneyLent,
  onAddMoneyOwed,
  onAddLoanEmi,
  onOpenLendingCalculator,
}: LendingOverviewProps) {
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

  const { outstanding } = useMemo(() => {
    return loans.reduce(
      (acc, loan) => {
        if (loan.repaid) {
          return acc;
        } else {
          acc.outstanding += Math.max(loan.amount - loan.repaidAmount, 0);
        }
        return acc;
      },
      { outstanding: 0 },
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
    <section className="px-5 pt-4 pb-4 space-y-[14px]">
      <div className="flex items-center justify-between px-1">
        <p className="text-sm uppercase tracking-wide text-[#7d8590]">Lending</p>
        <button
          type="button"
          onClick={onOpenLendingCalculator}
          className="h-7 w-7 rounded-lg border border-[#00C896]/50 bg-[rgba(0,200,150,0.12)] text-[#7af6cd] inline-flex items-center justify-center"
          title="EMI calculator"
          aria-label="Open lending calculator"
        >
          <span className="material-symbols-outlined text-[14px]">calculate</span>
        </button>
      </div>

      <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111118] p-2">
        <div className="relative">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pr-10 snap-x snap-mandatory">
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
              className={`h-9 min-w-[92px] snap-start rounded-xl px-3 text-sm font-semibold uppercase tracking-wide active:scale-95 transition-all ${
                activeSegment === segment.id
                  ? "bg-[#00C896] text-[#0D1117]"
                  : "bg-transparent border border-transparent text-[#7A8599]"
              }`}
            >
              {segment.label}
            </button>
          ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#111118] to-transparent" />
        </div>
      </div>

      {activeSegment === "overview" && (
        <>
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111118] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Quick Add</h3>
              <span className="text-sm text-white/55">Lent | Owed | Loan/EMI</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={onAddMoneyLent}
                className="h-9 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] text-sm font-semibold text-[#c7dfdb]"
              >
                Money Lent
              </button>
              <button
                type="button"
                onClick={onAddMoneyOwed}
                className="h-9 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] text-sm font-semibold text-[#c7dfdb]"
              >
                Money I Took
              </button>
              <button
                type="button"
                onClick={onAddLoanEmi}
                className="h-9 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] text-sm font-semibold text-[#c7dfdb]"
              >
                Loan / EMI
              </button>
            </div>
          </div>

          {dueSoonCount > 0 && (
            <div className="rounded-xl border border-[rgba(255,140,66,0.35)] bg-[rgba(255,140,66,0.12)] px-3 py-2 text-[#FF8C42] text-sm font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">notification_important</span>
              EMI due soon: {dueSoonCount}
            </div>
          )}

          {(moneyTookDueSoonCount > 0 || moneyTookOverdueCount > 0) && (
            <div className="rounded-xl border border-[rgba(79,70,229,0.45)] bg-[rgba(79,70,229,0.15)] px-3 py-2 text-[#C7D2FE] text-sm font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Money I Took alerts: {moneyTookOverdueCount} overdue, {moneyTookDueSoonCount} due soon
            </div>
          )}

          <div className="bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.08)] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-4">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[#64748B]">Lending Snapshot</p>
                <p className="text-2xl font-bold text-[#f0f0ff]">{formatCurrency(outstanding)}</p>
              </div>
              {pendingCount > 0 ? (
                <p className="text-sm font-medium text-[#FF8C42]">{pendingCount} pending</p>
              ) : (
                <p className="text-sm font-medium text-[#00C896] inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">check</span>
                  All clear
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 text-sm rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26]">
              <div className="p-3">
                <p className="text-[#94A3B8] uppercase tracking-wide text-sm">Money Lent</p>
                <p className="text-base font-semibold text-[#00C896] mt-0.5">{formatCurrency(outstanding)}</p>
                <p className="text-sm text-[#94A3B8] mt-1">{outstanding > 0 ? "Active receivable" : "Fully repaid"}</p>
              </div>
              <div className="border-x border-[#2A3345] p-3">
                <p className="text-[#94A3B8] uppercase tracking-wide text-sm">Money I Took</p>
                <p className="text-base font-semibold text-[#f0f0ff] mt-0.5">{formatCurrency(moneyTookOutstanding)}</p>
                <p className="text-sm text-[#94A3B8] mt-1">{moneyTookOutstanding > 0 ? "Borrowed outstanding" : `${formatCurrency(0)} borrowed`}</p>
              </div>
              <div className="p-3">
                <p className="text-[#94A3B8] uppercase tracking-wide text-sm">Liabilities</p>
                <p className="text-base font-semibold text-[#FF8C42] mt-0.5">{formatCurrency(personalOutstanding)}</p>
                <p className="text-sm text-[#94A3B8] mt-1">{formatCurrency(monthlyEmiDue)}/mo EMI</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111118] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Money Lent Preview</h3>
              <button
                type="button"
                onClick={() => setActiveSegment("money_lent")}
                className="h-6 px-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111118] text-sm font-semibold text-[#c7dfdb]"
              >
                View All
              </button>
            </div>
            {sortedLoans.slice(0, 3).length === 0 ? (
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-3 text-sm text-[#94A3B8]">
                No entries yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {sortedLoans
                  .slice(0, 3)
                  .sort((a, b) => Number(a.repaid) - Number(b.repaid))
                  .map((loan) => {
                  const status = getLoanStatus(loan);
                  const statusClass =
                    status === "Repaid"
                      ? "text-[#00C896] border-[#00C896]/35 bg-[#00C896]/12"
                      : status === "Partial"
                        ? "text-[#F5A623] border-[#F5A623]/35 bg-[#F5A623]/12"
                        : "text-[#FF8C42] border-[#FF8C42]/35 bg-[#FF8C42]/12";
                  const borderColor = status === "Repaid" ? "#00C896" : status === "Pending" ? "#FF8C42" : "#F5A623";
                  return (
                  <article key={loan.id} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-2.5" style={{ borderLeft: `2px solid ${borderColor}`, opacity: loan.repaid ? 0.6 : 1 }}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#f0f0ff]">{loan.personName}</p>
                        {loan.reason && loan.reason.toLowerCase() !== "loan" && <p className="text-sm text-[#94A3B8]">{loan.reason}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#f0f0ff]">{formatCurrency(Math.max(loan.amount - loan.repaidAmount, 0))}</p>
                        <p className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-sm font-semibold ${statusClass}`}>{status}</p>
                      </div>
                    </div>
                  </article>
                )})}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111118] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Money I Took Preview</h3>
              <button
                type="button"
                onClick={() => setActiveSegment("money_took")}
                className="h-6 px-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111118] text-sm font-semibold text-[#c7dfdb]"
              >
                View All
              </button>
            </div>
            {sortedMoneyTook.slice(0, 3).length === 0 ? (
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-3 text-sm text-[#94A3B8]">
                No entries yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {sortedMoneyTook.slice(0, 3).map((entry) => {
                  const outstandingAmount = getMoneyTookOutstanding(entry);
                  const paidAmount = entry.payments.reduce((sum, payment) => sum + payment.amount, 0);
                  const status = entry.closed || outstandingAmount <= 0 ? "Repaid" : paidAmount > 0 ? "Partial" : "Pending";
                  const statusClass =
                    status === "Repaid"
                      ? "text-[#00C896] border-[#00C896]/35 bg-[#00C896]/12"
                      : status === "Partial"
                        ? "text-[#F5A623] border-[#F5A623]/35 bg-[#F5A623]/12"
                        : "text-[#FF8C42] border-[#FF8C42]/35 bg-[#FF8C42]/12";
                  const borderColor = status === "Repaid" ? "#00C896" : status === "Pending" ? "#FF8C42" : "#F5A623";
                  return (
                    <article key={entry.id} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-2.5" style={{ borderLeft: `2px solid ${borderColor}`, opacity: status === "Repaid" ? 0.6 : 1 }}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[#f0f0ff]">{entry.lenderName}</p>
                          {entry.note && <p className="text-sm text-[#94A3B8]">{entry.note}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#D7D8FF]">{formatCurrency(outstandingAmount)}</p>
                          <p className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-sm font-semibold ${statusClass}`}>{status}</p>
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
                className="h-6 px-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#111118] text-sm font-semibold text-[#c7dfdb]"
              >
                View All
              </button>
            </div>
            {sortedPersonalLoans.slice(0, 3).length === 0 ? (
              <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-3 text-sm text-[#94A3B8]">
                No entries yet.
              </div>
            ) : (
              <div className="space-y-1.5">
                {sortedPersonalLoans.slice(0, 3).map((loan) => (
                  <article key={loan.id} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#f0f0ff]">{loan.lenderName}</p>
                        <p className="text-sm text-[#94A3B8]">{loan.customTypeLabel || loan.loanType.replace("_", " ")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#FF8C42]">{formatCurrency(loan.emiAmount ?? 0)}</p>
                        <p className="text-sm text-[#94A3B8]">{loan.closed ? "Closed" : "Active"}</p>
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/55">{sortedLoans.length}</span>
              <button
                type="button"
                onClick={onAddMoneyLent}
                className="h-7 px-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111118] text-sm font-semibold text-[#c7dfdb]"
              >
                Add
              </button>
            </div>
          </div>

          {sortedLoans.length === 0 ? (
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111118] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-6 text-center">
              <p className="text-sm font-medium text-[#94A3B8]">No lent entries yet.</p>
              <p className="text-sm text-[#94A3B8] mt-1">Use Lend to Someone to track receivables.</p>
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/55">{sortedMoneyTook.length}</span>
              <button
                type="button"
                onClick={onAddMoneyOwed}
                className="h-7 px-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111118] text-sm font-semibold text-[#c7dfdb]"
              >
                Add
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111118] p-3 text-sm text-[#94A3B8] flex flex-wrap gap-3">
            <span>Total borrowed: {formatCurrency(moneyTookBorrowed)}</span>
            <span>Outstanding: {formatCurrency(moneyTookOutstanding)}</span>
            <span>Due soon: {moneyTookDueSoonCount}</span>
            <span>Overdue: {moneyTookOverdueCount}</span>
          </div>
          {sortedMoneyTook.length === 0 ? (
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111118] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-6 text-center">
              <p className="text-sm font-medium text-[#94A3B8]">No money-took entries yet.</p>
              <p className="text-sm text-[#94A3B8] mt-1">Use Add Money I Took to track amounts you borrowed.</p>
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenLendingCalculator}
                className="h-7 w-7 rounded-lg border border-[#00C896]/50 bg-[rgba(0,200,150,0.12)] text-[#7af6cd] inline-flex items-center justify-center"
                title="EMI calculator"
                aria-label="Open EMI calculator"
              >
                <span className="material-symbols-outlined text-[14px]">calculate</span>
              </button>
              <span className="text-sm text-white/55">{sortedPersonalLoans.length}</span>
              <button
                type="button"
                onClick={onAddLoanEmi}
                className="h-7 px-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111118] text-sm font-semibold text-[#c7dfdb]"
              >
                Add
              </button>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-[rgba(56,189,248,0.2)] bg-[rgba(56,189,248,0.07)] px-3 py-2">
            <span className="material-symbols-outlined text-[15px] text-[#38BDF8] shrink-0 mt-0.5">info</span>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              <span className="font-semibold text-[#38BDF8]">Mark Paid</span> auto-adds to your Spending tab only when an EMI amount is set on the loan. Without EMI, it only updates the loan status.
            </p>
          </div>

          {sortedPersonalLoans.length === 0 ? (
            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#111118] shadow-[0_0_0_1px_rgba(30,37,45,0.6),0_4px_24px_rgba(0,0,0,0.4)] p-6 text-center">
              <p className="text-sm font-medium text-[#94A3B8]">No personal loans yet.</p>
              <p className="text-sm text-[#94A3B8] mt-1">Use Add My Loan to track EMI dues.</p>
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

