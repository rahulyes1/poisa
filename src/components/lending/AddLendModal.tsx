"use client";

import { FormEvent, useState } from "react";
import { useFinanceStore } from "../shared/store";

interface AddLendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function AddLendModal({ isOpen, onClose }: AddLendModalProps) {
  const addLoan = useFinanceStore((state) => state.addLoan);

  const [personName, setPersonName] = useState("");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [dueDate, setDueDate] = useState("");
  const [repaid, setRepaid] = useState(false);

  if (!isOpen) {
    return null;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!personName.trim() || !reason.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    addLoan({
      personName: personName.trim(),
      reason: reason.trim(),
      amount: parsedAmount,
      date,
      repaid,
      dueDate: dueDate || undefined,
      repaidAmount: repaid ? parsedAmount : 0,
    });

    setPersonName("");
    setReason("");
    setAmount("");
    setDate(today());
    setDueDate("");
    setRepaid(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#f0f0ff]">Lend Money</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#1a1a26] text-[#6b7280]"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="text"
            value={personName}
            onChange={(event) => setPersonName(event.target.value)}
            placeholder="Person name"
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] placeholder:text-[#3d3d5c] outline-none focus:border-[rgba(19,19,236,0.5)] focus:ring-0"
            required
          />
          <input
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Reason"
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] placeholder:text-[#3d3d5c] outline-none focus:border-[rgba(19,19,236,0.5)] focus:ring-0"
            required
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount"
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] placeholder:text-[#3d3d5c] outline-none focus:border-[rgba(19,19,236,0.5)] focus:ring-0"
            required
          />
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] outline-none focus:border-[rgba(19,19,236,0.5)] focus:ring-0"
            required
          />
          <input
            type="month"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            placeholder="Due date (optional)"
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] placeholder:text-[#3d3d5c] outline-none focus:border-[rgba(19,19,236,0.5)] focus:ring-0"
          />
          <label className="flex items-center gap-2 text-sm text-[#6b7280]">
            <input
              type="checkbox"
              checked={repaid}
              onChange={(event) => setRepaid(event.target.checked)}
              className="size-4 border border-[rgba(255,255,255,0.08)] bg-[#1a1a26]"
            />
            Mark as already paid back
          </label>

          <button
            type="submit"
            className="w-full mt-2 h-11 rounded-xl bg-[#1313ec] text-white text-sm font-semibold hover:bg-[#1313ec]/90 transition-colors"
          >
            Save Loan
          </button>
        </form>
      </div>
    </div>
  );
}

