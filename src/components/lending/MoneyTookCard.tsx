"use client";

import { useMemo, useState } from "react";
import { MoneyTookEntry } from "../shared/types";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

interface MoneyTookCardProps {
  entry: MoneyTookEntry;
  onEdit: (entry: MoneyTookEntry) => void;
}

const today = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getDiffDays = (dueDate?: string) => {
  if (!dueDate) {
    return null;
  }
  const parsed = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  const normalizedDue = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return Math.floor((normalizedDue.getTime() - today().getTime()) / (1000 * 60 * 60 * 24));
};

const currentDate = () => new Date().toISOString().slice(0, 10);

export default function MoneyTookCard({ entry, onEdit }: MoneyTookCardProps) {
  const { formatCurrency } = useCurrency();
  const addMoneyTookPayment = useFinanceStore((state) => state.addMoneyTookPayment);
  const deleteMoneyTookEntry = useFinanceStore((state) => state.deleteMoneyTookEntry);

  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(currentDate());

  const outstanding = useMemo(() => {
    if (entry.closed) {
      return 0;
    }
    const paid = entry.payments.reduce((sum, payment) => sum + payment.amount, 0);
    return Math.max(entry.amount - paid, 0);
  }, [entry.amount, entry.closed, entry.payments]);

  const diffDays = getDiffDays(entry.dueDate);
  const isDueSoon = !entry.closed && outstanding > 0 && typeof diffDays === "number" && diffDays >= 0 && diffDays <= 3;
  const isOverdue = !entry.closed && outstanding > 0 && typeof diffDays === "number" && diffDays < 0;
  const isClosed = entry.closed || outstanding <= 0;

  return (
    <article
      className={`p-3 rounded-2xl border bg-[#1a1a26]/70 ${
        isOverdue
          ? "border-red-500/55"
          : isDueSoon
            ? "border-[#FF8C42]/45"
            : "border-[rgba(255,255,255,0.14)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-[#f0f0ff] truncate">{entry.lenderName}</h4>
          <p className="text-sm text-[#7f9591] mt-0.5">
            Due: {entry.dueDate || "Not set"}
          </p>
          {entry.emiAmount && (
            <p className="text-sm text-[#8ba09c] mt-0.5">EMI: {formatCurrency(entry.emiAmount)}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="size-8 rounded-lg border border-white/20 bg-white/[0.08] text-[#9eb5b1]"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
          <button
            type="button"
            onClick={() => deleteMoneyTookEntry(entry.id)}
            className="size-8 rounded-lg border border-[rgba(255,140,66,0.35)] bg-[rgba(255,140,66,0.12)] text-[#FF8C42]"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-[rgba(255,255,255,0.12)] bg-white/[0.04] px-2.5 py-2">
          <p className="text-[#6b7280] uppercase tracking-wide">Borrowed</p>
          <p className="text-sm font-semibold text-[#f0f0ff] mt-0.5">{formatCurrency(entry.amount)}</p>
        </div>
        <div className="rounded-lg border border-[rgba(255,255,255,0.12)] bg-white/[0.04] px-2.5 py-2">
          <p className="text-[#6b7280] uppercase tracking-wide">Outstanding</p>
          <p className="text-sm font-semibold text-[#f0f0ff] mt-0.5">{formatCurrency(outstanding)}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        {isClosed ? (
          <span className="px-2 py-0.5 rounded-full bg-[rgba(0,201,167,0.15)] text-[#00C9A7] font-semibold uppercase tracking-wide text-[11px]">
            Closed
          </span>
        ) : isOverdue ? (
          <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold uppercase tracking-wide text-[11px]">
            Overdue
          </span>
        ) : isDueSoon ? (
          <span className="px-2 py-0.5 rounded-full bg-[rgba(255,140,66,0.15)] text-[#FF8C42] font-semibold uppercase tracking-wide text-[11px]">
            Due Soon
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[#a6b8b4] font-semibold uppercase tracking-wide text-[11px]">
            Active
          </span>
        )}

        {!isClosed && (
          <button
            type="button"
            onClick={() => setShowPaymentInput((value) => !value)}
            className="h-8 px-3 rounded-lg bg-[rgba(0,201,167,0.2)] text-[#00C9A7] text-sm font-semibold"
          >
            + Payment
          </button>
        )}
      </div>

      {entry.note && <p className="mt-2 text-sm text-[#6b7280] whitespace-normal break-words">{entry.note}</p>}

      {showPaymentInput && !isClosed && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={paymentAmount}
            onChange={(event) => setPaymentAmount(event.target.value)}
            placeholder="Payment amount"
            className="glass-input h-9 flex-1 px-3 text-sm text-[#f0f0ff]"
          />
          <input
            type="date"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
            className="glass-input h-9 px-2 text-sm text-[#f0f0ff] w-[132px]"
          />
          <button
            type="button"
            onClick={() => {
              const amount = Number(paymentAmount);
              if (!Number.isFinite(amount) || amount <= 0) {
                return;
              }
              addMoneyTookPayment(entry.id, amount, paymentDate);
              setPaymentAmount("");
              setShowPaymentInput(false);
            }}
            className="h-9 px-3 rounded-lg bg-[#00C9A7] text-[#07241f] text-sm font-semibold"
          >
            Add
          </button>
        </div>
      )}

      {entry.payments.length > 0 && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
          <p className="text-[11px] uppercase tracking-wide text-white/55 mb-1">Recent Payments</p>
          <div className="space-y-1">
            {[...entry.payments]
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 3)
              .map((payment) => (
                <div key={payment.id} className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{payment.date}</span>
                  <span className="text-white/85 font-semibold">{formatCurrency(payment.amount)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </article>
  );
}
