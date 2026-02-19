"use client";

import { useMemo, useState } from "react";
import { Loan } from "../shared/types";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

interface PersonCardProps {
  loan: Loan;
  onEditLoan: (loan: Loan) => void;
}

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const toDueLabel = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

export default function PersonCard({ loan, onEditLoan }: PersonCardProps) {
  const { formatCurrency } = useCurrency();
  const toggleLoanRepaid = useFinanceStore((state) => state.toggleLoanRepaid);
  const addRepayment = useFinanceStore((state) => state.addRepayment);
  const deleteLoan = useFinanceStore((state) => state.deleteLoan);

  const [showRepayInput, setShowRepayInput] = useState(false);
  const [repayAmount, setRepayAmount] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const initials = loan.personName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

  const isOverdue = Boolean(loan.dueDate && !loan.repaid && loan.dueDate < getCurrentMonth());
  const progress = loan.amount > 0 ? Math.min((loan.repaidAmount / loan.amount) * 100, 100) : 0;
  const remaining = Math.max(loan.amount - loan.repaidAmount, 0);

  const remindMessage = useMemo(() => {
    const duePart = loan.dueDate ? ` — due by ${loan.dueDate}` : "";
    return `Hi ${loan.personName} ??, just a friendly reminder that you borrowed ${formatCurrency(loan.amount)} from me on ${loan.date}${duePart}. Please let me know when you're able to return it. Thanks!`;
  }, [loan.amount, loan.date, loan.dueDate, loan.personName, formatCurrency]);

  return (
    <article
      className={`p-3 rounded-2xl bg-[#1a1a26] border border-[rgba(255,255,255,0.06)] ${
        isOverdue ? "border-l-4 border-l-red-500" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${
            isOverdue ? "bg-red-500/10 text-red-400" : "bg-vibrant-purple/12 text-vibrant-purple"
          }`}
        >
          <span className="text-lg font-bold">{initials || "?"}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-[#f0f0ff] truncate">{loan.personName}</h4>
              <p className="text-xs font-medium text-[#6b7280] truncate">{loan.reason}</p>
              {loan.dueDate && <p className="text-xs text-[#6b7280] mt-0.5">Due: {toDueLabel(loan.dueDate)}</p>}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEditLoan(loan)}
                className="size-8 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111118] text-[#6b7280]"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="size-8 rounded-lg border border-[rgba(255,140,66,0.35)] bg-[rgba(255,140,66,0.12)] text-[#FF8C42]"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          </div>

          <div className="mt-2 h-2 rounded-full bg-[#111118] overflow-hidden">
            <div className="h-full bg-[#1313ec] drop-shadow-[0_0_4px_currentColor]" style={{ width: `${progress}%` }} />
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-xs text-[#6b7280]">
              {formatCurrency(loan.repaidAmount)} of {formatCurrency(loan.amount)} repaid
            </p>
            {loan.repaid ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(0,201,167,0.15)] text-[#00C9A7] uppercase tracking-wide">Paid</span>
            ) : isOverdue ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 uppercase tracking-wide">Overdue</span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(255,140,66,0.15)] text-[#FF8C42] uppercase tracking-wide">Pending</span>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowRepayInput((value) => !value)}
              className="h-8 w-8 rounded-lg bg-[rgba(0,201,167,0.2)] text-[#00C9A7] font-bold"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => toggleLoanRepaid(loan.id)}
              className="h-8 px-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111118] text-xs font-semibold text-[#6b7280]"
            >
              Mark Paid
            </button>

            {!loan.repaid && (
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(remindMessage);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="h-8 px-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111118] text-xs font-semibold text-[#6b7280] inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">send</span>
                Remind
              </button>
            )}

            {copied && <span className="text-xs text-[#00C9A7]">Copied!</span>}
          </div>

          {showRepayInput && !loan.repaid && (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="0.01"
                max={remaining}
                step="0.01"
                value={repayAmount}
                onChange={(event) => setRepayAmount(event.target.value)}
                placeholder="Repayment"
                className="h-9 flex-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111118] px-3 text-sm text-[#f0f0ff]"
              />
              <button
                type="button"
                onClick={() => {
                  const amount = Number(repayAmount);
                  if (!Number.isFinite(amount) || amount <= 0) {
                    return;
                  }
                  addRepayment(loan.id, amount);
                  setRepayAmount("");
                  setShowRepayInput(false);
                }}
                className="h-9 px-3 rounded-lg bg-[#1313ec] text-white text-sm font-semibold"
              >
                Add
              </button>
            </div>
          )}

          {showDeleteConfirm && (
            <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-end gap-2 text-xs">
              <span className="text-[#6b7280] mr-auto">Delete? </span>
              <button
                type="button"
                onClick={() => deleteLoan(loan.id)}
                className="h-7 px-3 rounded-lg bg-[rgba(255,140,66,0.2)] text-[#FF8C42] font-semibold"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="h-7 px-3 rounded-lg border border-[rgba(255,255,255,0.08)] text-[#6b7280]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

