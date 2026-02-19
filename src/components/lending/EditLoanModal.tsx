"use client";

import { FormEvent, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { Loan } from "../shared/types";

interface EditLoanModalProps {
  isOpen: boolean;
  item: Loan | null;
  onClose: () => void;
}

export default function EditLoanModal({ isOpen, item, onClose }: EditLoanModalProps) {
  const updateLoan = useFinanceStore((state) => state.updateLoan);

  const [personName, setPersonName] = useState(item?.personName ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [date, setDate] = useState(item?.date ?? "");
  const [dueDate, setDueDate] = useState(item?.dueDate ?? "");
  const [repaid, setRepaid] = useState(item?.repaid ?? false);
  const [repaidAmount, setRepaidAmount] = useState(item ? String(item.repaidAmount) : "");

  if (!isOpen || !item) {
    return null;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const parsedRepaidAmount = Number(repaidAmount || "0");

    if (!personName.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    const safeRepaidAmount = Math.max(0, Math.min(parsedRepaidAmount, parsedAmount));

    updateLoan({
      ...item,
      personName: personName.trim(),
      reason: item.reason?.trim() || "Loan",
      amount: parsedAmount,
      repaid: repaid || safeRepaidAmount >= parsedAmount,
      repaidAmount: repaid ? parsedAmount : safeRepaidAmount,
      date,
      dueDate: dueDate || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#f0f0ff]">Edit Loan</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-[#6b7280]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="text"
            value={personName}
            onChange={(event) => setPersonName(event.target.value)}
            placeholder="Person name"
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
            required
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount"
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
            required
          />
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
            required
          />
          <input
            type="month"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            placeholder="Due date (optional)"
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={repaidAmount}
            onChange={(event) => setRepaidAmount(event.target.value)}
            placeholder="Repaid amount"
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
          />
          <label className="flex items-center gap-2 text-sm text-[#c4d4d1]">
            <input
              type="checkbox"
              checked={repaid}
              onChange={(event) => setRepaid(event.target.checked)}
              className="size-4 border border-white/20 bg-transparent"
            />
            Mark fully repaid
          </label>

          <button
            type="submit"
            className="w-full mt-2 h-11 rounded-xl bg-[#00C9A7] text-[#07241f] text-sm font-semibold hover:bg-[#00C9A7]/90 transition-colors"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
