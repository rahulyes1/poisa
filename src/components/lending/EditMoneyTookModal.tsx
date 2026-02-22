"use client";

import { FormEvent, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { MoneyTookEntry } from "../shared/types";

interface EditMoneyTookModalProps {
  isOpen: boolean;
  item: MoneyTookEntry | null;
  onClose: () => void;
}

export default function EditMoneyTookModal({ isOpen, item, onClose }: EditMoneyTookModalProps) {
  const updateMoneyTookEntry = useFinanceStore((state) => state.updateMoneyTookEntry);

  const [lenderName, setLenderName] = useState(item?.lenderName ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [emiAmount, setEmiAmount] = useState(
    typeof item?.emiAmount === "number" ? String(item.emiAmount) : "",
  );
  const [dueDate, setDueDate] = useState(item?.dueDate ?? "");
  const [note, setNote] = useState(item?.note ?? "");
  const [closed, setClosed] = useState(item?.closed ?? false);

  if (!isOpen || !item) {
    return null;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const parsedEmiAmount = Number(emiAmount);
    if (!lenderName.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    updateMoneyTookEntry({
      ...item,
      lenderName: lenderName.trim(),
      amount: parsedAmount,
      emiAmount: Number.isFinite(parsedEmiAmount) && parsedEmiAmount > 0 ? parsedEmiAmount : undefined,
      dueDate: dueDate || undefined,
      note: note.trim() || undefined,
      closed,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#f0f0ff]">Edit Money I Took</h2>
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
          <label className="flex items-center gap-2 text-sm text-[#c4d4d1]">
            <input
              type="checkbox"
              checked={closed}
              onChange={(event) => setClosed(event.target.checked)}
              className="size-4 border border-white/20 bg-transparent"
            />
            Mark as cleared totally
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
