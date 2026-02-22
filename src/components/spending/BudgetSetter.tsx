"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

const formatMonthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, (monthNumber || 1) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

interface BudgetSetterProps {
  onClose: () => void;
}

export default function BudgetSetter({ onClose }: BudgetSetterProps) {
  const { formatCurrency } = useCurrency();
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const getBaseBudgetForMonth = useFinanceStore((state) => state.getBaseBudgetForMonth);
  const setMonthlyBudget = useFinanceStore((state) => state.setMonthlyBudget);

  const currentBudget = getBaseBudgetForMonth(selectedMonth);
  const monthLabel = useMemo(() => formatMonthLabel(selectedMonth), [selectedMonth]);
  const [value, setValue] = useState(String(currentBudget));
  const parsedValue = Number(value);
  const canSave = Number.isFinite(parsedValue) && parsedValue > 0;

  useEffect(() => {
    setValue(String(currentBudget));
  }, [currentBudget]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    setMonthlyBudget(selectedMonth, parsedValue);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("poisa:spending-budget-saved"));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close budget popup"
      />
      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-md rounded-2xl border border-[#2A3345] bg-[#161B22] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#E8EDF5]">Set Spending Budget</h3>
          <button type="button" onClick={onClose} className="text-[#7A8599]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <label className="block">
          <p className="text-[11px] font-semibold uppercase tracking-[1.2px] text-[#7A8599] mb-1.5">
            Budget for {monthLabel}
          </p>
          <input
            type="number"
            min="1"
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="w-full h-11 rounded-xl border border-[#2A3345] bg-[#0D1117] px-3 text-sm text-[#E8EDF5] outline-none focus:border-[#00C896]"
          />
        </label>
        <p className="mt-2 text-xs text-[#7A8599]">
          Current budget: <span className="font-semibold text-[#E8EDF5]">{formatCurrency(currentBudget)}</span>
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


