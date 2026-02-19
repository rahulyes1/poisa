"use client";

import { FormEvent, useEffect, useState } from "react";
import { useFinanceStore } from "../shared/store";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default function BudgetSetter() {
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
    <section className="px-5 pt-4">
      <form
        onSubmit={onSubmit}
        className="bg-white dark:bg-[#15152a] rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-end gap-3"
      >
        <label className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
            Monthly Budget
          </p>
          <input
            type="number"
            min="1"
            step="0.01"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/25"
          />
        </label>
        <button
          type="submit"
          className="h-10 px-4 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Save
        </button>
      </form>
      <p className="px-1 mt-2 text-xs text-slate-500 dark:text-slate-400">
        Current budget: <span className="font-semibold">{formatCurrency(spendingBudget)}</span>
      </p>
    </section>
  );
}
