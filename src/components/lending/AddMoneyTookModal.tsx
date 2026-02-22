"use client";

import { FormEvent, useState } from "react";
import { useFinanceStore } from "../shared/store";

interface AddMoneyTookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddMoneyTookModal({ isOpen, onClose }: AddMoneyTookModalProps) {
  const addMoneyTookEntry = useFinanceStore((state) => state.addMoneyTookEntry);
  const [lenderName, setLenderName] = useState("");
  const [amount, setAmount] = useState("");
  const [emiAmount, setEmiAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  if (!isOpen) {
    return null;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedAmount = Number(amount);
    const parsedEmiAmount = Number(emiAmount);

    if (!lenderName.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    addMoneyTookEntry({
      lenderName: lenderName.trim(),
      amount: parsedAmount,
      emiAmount: Number.isFinite(parsedEmiAmount) && parsedEmiAmount > 0 ? parsedEmiAmount : undefined,
      dueDate: dueDate || undefined,
      note: note.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#f0f0ff]">Add Money I Took</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-[#6b7280]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="text"
            value={lenderName}
            onChange={(event) => setLenderName(event.target.value)}
            placeholder="Lender name"
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
            required
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Borrowed amount"
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
            required
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={emiAmount}
            onChange={(event) => setEmiAmount(event.target.value)}
            placeholder="EMI amount (optional)"
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
          />
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note (optional)"
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff] min-h-20"
          />
          <button
            type="submit"
            className="w-full mt-2 h-11 rounded-xl bg-[#00C9A7] text-[#07241f] text-sm font-semibold hover:bg-[#00C9A7]/90 transition-colors"
          >
            Save Entry
          </button>
        </form>
      </div>
    </div>
  );
}
