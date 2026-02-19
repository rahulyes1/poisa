"use client";

import { FormEvent, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { PersonalLoanType } from "../shared/types";

interface AddPersonalLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

const loanTypeOptions: Array<{ value: PersonalLoanType; label: string }> = [
  { value: "home", label: "Home" },
  { value: "car", label: "Car" },
  { value: "personal", label: "Personal" },
  { value: "education", label: "Education" },
  { value: "credit_card", label: "Credit Card" },
  { value: "business", label: "Business" },
  { value: "other", label: "Other" },
];

export default function AddPersonalLoanModal({ isOpen, onClose }: AddPersonalLoanModalProps) {
  const addPersonalLoan = useFinanceStore((state) => state.addPersonalLoan);

  const [lenderName, setLenderName] = useState("");
  const [loanType, setLoanType] = useState<PersonalLoanType>("personal");
  const [customTypeLabel, setCustomTypeLabel] = useState("");
  const [startDate, setStartDate] = useState(today());
  const [totalLoanAmount, setTotalLoanAmount] = useState("");
  const [outstandingAmount, setOutstandingAmount] = useState("");
  const [emiAmount, setEmiAmount] = useState("");
  const [emiDayOfMonth, setEmiDayOfMonth] = useState("");
  const [nextEmiDate, setNextEmiDate] = useState("");
  const [note, setNote] = useState("");

  if (!isOpen) {
    return null;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!lenderName.trim()) {
      return;
    }

    const parsedTotal = Number(totalLoanAmount);
    const parsedOutstanding = Number(outstandingAmount);
    const parsedEmiAmount = Number(emiAmount);
    const parsedEmiDay = Number(emiDayOfMonth);

    const safeTotal = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : undefined;
    const safeOutstanding = Number.isFinite(parsedOutstanding) && parsedOutstanding > 0 ? parsedOutstanding : undefined;
    const safeEmiAmount = Number.isFinite(parsedEmiAmount) && parsedEmiAmount > 0 ? parsedEmiAmount : undefined;
    const safeEmiDay =
      Number.isFinite(parsedEmiDay) && parsedEmiDay >= 1 && parsedEmiDay <= 31
        ? Math.round(parsedEmiDay)
        : undefined;

    addPersonalLoan({
      lenderName: lenderName.trim(),
      loanType,
      customTypeLabel: loanType === "other" ? customTypeLabel.trim() || undefined : undefined,
      startDate,
      totalLoanAmount: safeTotal,
      outstandingAmount: safeOutstanding,
      emiAmount: safeEmiAmount,
      emiDayOfMonth: safeEmiDay,
      nextEmiDate: nextEmiDate || undefined,
      note: note.trim() || undefined,
    });

    setLenderName("");
    setLoanType("personal");
    setCustomTypeLabel("");
    setStartDate(today());
    setTotalLoanAmount("");
    setOutstandingAmount("");
    setEmiAmount("");
    setEmiDayOfMonth("");
    setNextEmiDate("");
    setNote("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#f0f0ff]">Add My Loan</h2>
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

          <select
            value={loanType}
            onChange={(event) => setLoanType(event.target.value as PersonalLoanType)}
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff] bg-transparent"
          >
            {loanTypeOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#10112a] text-[#f0f0ff]">
                {option.label}
              </option>
            ))}
          </select>

          {loanType === "other" && (
            <input
              type="text"
              value={customTypeLabel}
              onChange={(event) => setCustomTypeLabel(event.target.value)}
              placeholder="Custom type"
              className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
            />
          )}

          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
            required
          />

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={totalLoanAmount}
            onChange={(event) => setTotalLoanAmount(event.target.value)}
            placeholder="Total loan amount (optional)"
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
          />

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={outstandingAmount}
            onChange={(event) => setOutstandingAmount(event.target.value)}
            placeholder="Outstanding amount (optional)"
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
          />

          <div className="grid grid-cols-2 gap-2">
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
              type="number"
              min="1"
              max="31"
              step="1"
              value={emiDayOfMonth}
              onChange={(event) => setEmiDayOfMonth(event.target.value)}
              placeholder="EMI day (1-31)"
              className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
            />
          </div>

          <input
            type="date"
            value={nextEmiDate}
            onChange={(event) => setNextEmiDate(event.target.value)}
            placeholder="Next EMI date (optional)"
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
            Save Loan
          </button>
        </form>
      </div>
    </div>
  );
}
