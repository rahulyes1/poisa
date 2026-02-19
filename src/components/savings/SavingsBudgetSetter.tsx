"use client";

import { FormEvent, useEffect, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

export default function SavingsBudgetSetter() {
  const { formatCurrency } = useCurrency();
  const savingsBudget = useFinanceStore((state) => state.savingsBudget);
  const setSavingsBudget = useFinanceStore((state) => state.setSavingsBudget);
  const [value, setValue] = useState(savingsBudget.toString());

  useEffect(() => {
    setValue(savingsBudget.toString());
  }, [savingsBudget]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    setSavingsBudget(parsed);
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
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] placeholder:text-[#3d3d5c] outline-none focus:border-[rgba(19,19,236,0.5)] focus:ring-0"
          />
        </label>
        <button
          type="submit"
          className="h-10 px-4 rounded-xl bg-[#1313ec] text-white text-sm font-semibold hover:bg-[#1313ec]/90 transition-colors"
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

