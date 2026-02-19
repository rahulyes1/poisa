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
    if (!personName.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    addLoan({
      personName: personName.trim(),
      reason: "Loan",
      amount: parsedAmount,
      date,
      repaid,
      dueDate: dueDate || undefined,
      repaidAmount: repaid ? parsedAmount : 0,
    });

    setPersonName("");
    setAmount("");
    setDate(today());
    setDueDate("");
    setRepaid(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#f0f0ff]">Lend Money</h2>
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
          <label className="flex items-center gap-2 text-sm text-[#c4d4d1]">
            <input
              type="checkbox"
              checked={repaid}
              onChange={(event) => setRepaid(event.target.checked)}
              className="size-4 border border-white/20 bg-transparent"
            />
            Mark as already paid back
          </label>

          <button
            type="submit"
            className="w-full mt-2 h-11 rounded-xl bg-[#00C9A7] text-[#07241f] text-sm font-semibold hover:bg-[#00C9A7]/90 transition-colors"
          >
            Save Loan
          </button>
        </form>
      </div>
    </div>
  );
}
