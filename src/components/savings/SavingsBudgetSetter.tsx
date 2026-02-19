"use client";

import { FormEvent, useEffect, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

export default function SavingsBudgetSetter() {
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
  };

  return (
    <section className="px-5 pt-4">
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-4 flex items-end gap-3"
      >
        <label className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4a4a6a] mb-2">
            Savings Budget
          </p>
          <input
            type="number"
            min="1"
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] placeholder:text-[#3d3d5c] outline-none focus:border-[rgba(0,201,167,0.5)] focus:ring-0"
          />
        </label>
        <button
          type="submit"
          disabled={!canSave}
          className={`h-10 px-4 rounded-xl text-white text-sm font-semibold transition-colors ${
            canSave ? "bg-[#00C9A7] hover:bg-[#00C9A7]/90" : "bg-white/15 text-white/50 cursor-not-allowed"
          }`}
        >
          Save
        </button>
      </form>
      <p className="px-1 mt-2 text-xs text-[#6b7280]">
        Current savings budget: <span className="font-semibold">{formatCurrency(savingsBudget)}</span>
      </p>
    </section>
  );
}

