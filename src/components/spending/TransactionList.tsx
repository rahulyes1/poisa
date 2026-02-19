"use client";

import { useMemo } from "react";
import { Expense } from "../shared/types";
import { useFinanceStore } from "../shared/store";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const toDisplayDate = (date: string) => {
  const current = new Date();
  const value = new Date(`${date}T00:00:00`);
  const today = new Date(current.getFullYear(), current.getMonth(), current.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const target = new Date(value.getFullYear(), value.getMonth(), value.getDate());

  if (target.getTime() === today.getTime()) {
    return "Today";
  }
  if (target.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const colorVariants = [
  {
    icon: "text-vibrant-orange",
    bg: "bg-vibrant-orange/10 dark:bg-vibrant-orange/20",
    dot: "bg-vibrant-orange",
  },
  {
    icon: "text-vibrant-teal",
    bg: "bg-vibrant-teal/10 dark:bg-vibrant-teal/20",
    dot: "bg-vibrant-teal",
  },
  {
    icon: "text-vibrant-pink",
    bg: "bg-vibrant-pink/10 dark:bg-vibrant-pink/20",
    dot: "bg-vibrant-pink",
  },
  {
    icon: "text-vibrant-purple",
    bg: "bg-vibrant-purple/10 dark:bg-vibrant-purple/20",
    dot: "bg-vibrant-purple",
  },
];

interface GroupedExpenses {
  date: string;
  label: string;
  total: number;
  items: Expense[];
}

export default function TransactionList() {
  const expenses = useFinanceStore((state) => state.expenses);

  const groups = useMemo(() => {
    const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    const grouped = sorted.reduce<Record<string, GroupedExpenses>>((acc, expense) => {
      if (!acc[expense.date]) {
        acc[expense.date] = {
          date: expense.date,
          label: toDisplayDate(expense.date),
          total: 0,
          items: [],
        };
      }
      acc[expense.date].items.push(expense);
      acc[expense.date].total += expense.amount;
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses]);

  if (groups.length === 0) {
    return (
      <section className="px-5 py-6">
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No expenses yet.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Use Add Expense to create your first transaction.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-4 pb-4">
      {groups.map((group, groupIndex) => (
        <div key={group.date}>
          <div
            className={`sticky top-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm px-5 py-3 border-b border-slate-200 dark:border-slate-800 z-10 flex justify-between items-center ${
              groupIndex > 0 ? "border-t mt-2" : ""
            }`}
          >
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {group.label}
            </h3>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              -{formatCurrency(group.total)}
            </span>
          </div>

          <div className="px-5 py-2 space-y-4">
            {group.items.map((item, index) => {
              const colors = colorVariants[(groupIndex + index) % colorVariants.length];
              return (
                <div key={item.id} className="flex items-center gap-4 py-2">
                  <div
                    className={`size-12 rounded-2xl ${colors.bg} flex items-center justify-center shrink-0 ${colors.icon}`}
                  >
                    <span className="material-symbols-outlined">{item.icon || "receipt_long"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-semibold text-slate-900 dark:text-white truncate">{item.name}</h4>
                      <span className="font-bold text-slate-900 dark:text-white">-{formatCurrency(item.amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.category}</p>
                      <div className={`size-1.5 rounded-full ${colors.dot}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
