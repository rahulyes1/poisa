"use client";

import { FormEvent, useEffect, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

export default function BudgetSetter() {
  const { formatCurrency } = useCurrency();
  const spendingBudget = useFinanceStore((state) => state.spendingBudget);
  const setSpendingBudget = useFinanceStore((state) => state.setSpendingBudget);
  const [value, setValue] = useState(spendingBudget.toString());

  useEffect(() => {
    setValue(spendingBudget.toString());
  }, [spendingBudget]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      return;
    }
    setSpendingBudget(nextValue);
  };

  return (
    <section className="px-5 pt-2">
      <form
        onSubmit={onSubmit}
        className="glass-card rounded-2xl p-3 flex items-end gap-3"
      >
        <label className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60 mb-1.5">
            Monthly Budget
          </p>
          <input
            type="number"
            min="1"
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="glass-input w-full px-3 py-2 text-sm text-[#f0f0ff]"
          />
        </label>
        <button
          type="submit"
          className="h-9 px-4 rounded-xl bg-[#7000FF] text-white text-sm font-semibold hover:bg-[#7000FF]/90 transition-colors"
        >
          Save
        </button>
      </form>
      <p className="px-1 mt-2 text-xs text-white/70">
        Current budget: <span className="font-semibold">{formatCurrency(spendingBudget)}</span>
      </p>
    </section>
  );
}

