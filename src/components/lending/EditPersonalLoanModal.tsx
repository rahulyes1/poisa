"use client";

import { FormEvent, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { PersonalLoan, PersonalLoanType } from "../shared/types";

interface EditPersonalLoanModalProps {
  isOpen: boolean;
  item: PersonalLoan | null;
  onClose: () => void;
}

const loanTypeOptions: Array<{ value: PersonalLoanType; label: string }> = [
  { value: "home", label: "Home" },
  { value: "car", label: "Car" },
  { value: "personal", label: "Personal" },
  { value: "education", label: "Education" },
  { value: "credit_card", label: "Credit Card" },
  { value: "business", label: "Business" },
  { value: "other", label: "Other" },
];

export default function EditPersonalLoanModal({ isOpen, item, onClose }: EditPersonalLoanModalProps) {
  const updatePersonalLoan = useFinanceStore((state) => state.updatePersonalLoan);

  const [lenderName, setLenderName] = useState(item?.lenderName ?? "");
  const [loanType, setLoanType] = useState<PersonalLoanType>(item?.loanType ?? "personal");
  const [customTypeLabel, setCustomTypeLabel] = useState(item?.customTypeLabel ?? "");
  const [startDate, setStartDate] = useState(item?.startDate ?? "");
  const [totalLoanAmount, setTotalLoanAmount] = useState(
    typeof item?.totalLoanAmount === "number" ? String(item.totalLoanAmount) : "",
  );
  const [outstandingAmount, setOutstandingAmount] = useState(
    typeof item?.outstandingAmount === "number" ? String(item.outstandingAmount) : "",
  );
  const [emiAmount, setEmiAmount] = useState(typeof item?.emiAmount === "number" ? String(item.emiAmount) : "");
  const [nextEmiDate, setNextEmiDate] = useState(item?.nextEmiDate ?? "");
  const [note, setNote] = useState(item?.note ?? "");
  const [closed, setClosed] = useState(item?.closed ?? false);

  if (!isOpen || !item) {
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

    const safeTotal = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : undefined;
    const safeOutstanding = Number.isFinite(parsedOutstanding) && parsedOutstanding > 0 ? parsedOutstanding : undefined;
    const safeEmiAmount = Number.isFinite(parsedEmiAmount) && parsedEmiAmount > 0 ? parsedEmiAmount : undefined;

    updatePersonalLoan({
      ...item,
      lenderName: lenderName.trim(),
      loanType,
      customTypeLabel: loanType === "other" ? customTypeLabel.trim() || undefined : undefined,
      startDate,
      totalLoanAmount: safeTotal,
      outstandingAmount: safeOutstanding,
      emiAmount: safeEmiAmount,
      emiDayOfMonth: undefined,
      nextEmiDate: nextEmiDate || undefined,
      note: note.trim() || undefined,
      closed,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#f0f0ff]">Edit My Loan</h2>
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
            value={nextEmiDate}
            onChange={(event) => setNextEmiDate(event.target.value)}
            placeholder="EMI date (optional)"
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
