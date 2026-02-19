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
    <section className="px-4 pt-1">
      <form
        onSubmit={onSubmit}
        className="glass-card rounded-xl p-2.5 flex items-end gap-2"
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
            className="glass-input w-full px-2.5 py-1.5 text-xs text-[#f0f0ff]"
          />
        </label>
        <button
          type="submit"
          className="h-8 px-3 rounded-lg bg-[#00C9A7] text-white text-xs font-semibold hover:bg-[#00C9A7]/90 transition-colors"
        >
          Save
        </button>
      </form>
      <p className="px-1 mt-1.5 text-[11px] text-white/70">
        Current budget: <span className="font-semibold">{formatCurrency(spendingBudget)}</span>
      </p>
    </section>
  );
}

