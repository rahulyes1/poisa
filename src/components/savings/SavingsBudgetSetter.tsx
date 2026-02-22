"use client";

import { FormEvent, useEffect, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

interface SavingsBudgetSetterProps {
  onClose: () => void;
}

export default function SavingsBudgetSetter({ onClose }: SavingsBudgetSetterProps) {
  const { formatCurrency } = useCurrency();
  const savingsBudget = useFinanceStore((state) => state.savingsBudget);
  const setSavingsBudget = useFinanceStore((state) => state.setSavingsBudget);
  const [value, setValue] = useState(savingsBudget.toString());
  const parsedValue = Number(value.replace(/,/g, "").trim());
  const canSave = Number.isFinite(parsedValue) && parsedValue >= 0;

  useEffect(() => {
    setValue(savingsBudget.toString());
  }, [savingsBudget]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    const normalized = Number(parsedValue.toFixed(2));
    setSavingsBudget(normalized);
    setValue(normalized.toString());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close savings budget popup"
      />
      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-md rounded-2xl border border-[#2A3345] bg-[#161B22] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#E8EDF5]">Set Savings Budget</h3>
          <button type="button" onClick={onClose} className="text-[#7A8599]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <label className="block">
          <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#7A8599] mb-1.5">
            Savings Budget
          </p>
          <input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="w-full h-11 rounded-xl border border-[#2A3345] bg-[#0D1117] px-3 text-sm text-[#E8EDF5] outline-none focus:border-[#00C896]"
          />
        </label>
        <p className="mt-2 text-xs text-[#7A8599]">
          Current savings budget: <span className="font-semibold text-[#E8EDF5]">{formatCurrency(savingsBudget)}</span>
        </p>
        <button
          type="submit"
          disabled={!canSave}
          className="mt-3 h-10 w-full rounded-xl bg-[#00C896] text-[#06221a] text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </form>
    </div>
  );
}

