"use client";

import { FormEvent, useState } from "react";
import { useFinanceStore } from "../shared/store";

interface AddLifeInsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function AddLifeInsuranceModal({ isOpen, onClose }: AddLifeInsuranceModalProps) {
  const addLifeInsurance = useFinanceStore((state) => state.addLifeInsurance);

  const [providerName, setProviderName] = useState("");
  const [planName, setPlanName] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [dueDate, setDueDate] = useState(today());
  const [note, setNote] = useState("");
  const [paid, setPaid] = useState(false);

  if (!isOpen) {
    return null;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(monthlyAmount);
    if (!providerName.trim() || !Number.isFinite(amount) || amount <= 0) {
      return;
    }

    addLifeInsurance({
      providerName: providerName.trim(),
      planName: planName.trim() || "Life Insurance",
      monthlyAmount: amount,
      dueDate,
      paid,
      note: note.trim() || undefined,
    });

    setProviderName("");
    setPlanName("");
    setMonthlyAmount("");
    setDueDate(today());
    setNote("");
    setPaid(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#f0f0ff]">Add Life Insurance</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-[#6b7280]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="text"
            value={providerName}
            onChange={(event) => setProviderName(event.target.value)}
            placeholder="Provider name"
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
            required
          />
          <input
            type="text"
            value={planName}
            onChange={(event) => setPlanName(event.target.value)}
            placeholder="Plan name (optional)"
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={monthlyAmount}
            onChange={(event) => setMonthlyAmount(event.target.value)}
            placeholder="Monthly amount"
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
            required
          />
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
            required
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
              checked={paid}
              onChange={(event) => setPaid(event.target.checked)}
              className="size-4 border border-white/20 bg-transparent"
            />
            Mark current month paid
          </label>

          <button
            type="submit"
            className="w-full mt-2 h-11 rounded-xl bg-[#00C9A7] text-[#07241f] text-sm font-semibold hover:bg-[#00C9A7]/90 transition-colors"
          >
            Save Insurance
          </button>
        </form>
      </div>
    </div>
  );
}
