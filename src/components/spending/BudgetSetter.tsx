"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

const formatMonthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, (monthNumber || 1) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export default function BudgetSetter() {
  const { formatCurrency } = useCurrency();
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const getBaseBudgetForMonth = useFinanceStore((state) => state.getBaseBudgetForMonth);
  const setMonthlyBudget = useFinanceStore((state) => state.setMonthlyBudget);

  const currentBudget = getBaseBudgetForMonth(selectedMonth);
  const monthLabel = useMemo(() => formatMonthLabel(selectedMonth), [selectedMonth]);
  const [value, setValue] = useState(String(currentBudget));

  useEffect(() => {
    setValue(String(currentBudget));
  }, [currentBudget]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      return;
    }
    setMonthlyBudget(selectedMonth, nextValue);
  };

  return (
    <section className="px-4 pt-1">
      <form
        onSubmit={onSubmit}
        className="glass-card rounded-xl p-2.5 flex items-end gap-2"
      >
        <label className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60 mb-1.5">
            Budget for {monthLabel}
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
        Current budget: <span className="font-semibold">{formatCurrency(currentBudget)}</span>
      </p>
    </section>
  );
}

