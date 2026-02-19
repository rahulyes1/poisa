"use client";

import { useMemo, useState } from "react";
import { Expense } from "../shared/types";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

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
    bg: "bg-vibrant-orange/12",
    dot: "bg-vibrant-orange",
  },
  {
    icon: "text-vibrant-teal",
    bg: "bg-vibrant-teal/12",
    dot: "bg-vibrant-teal",
  },
  {
    icon: "text-vibrant-pink",
    bg: "bg-vibrant-pink/12",
    dot: "bg-vibrant-pink",
  },
  {
    icon: "text-vibrant-purple",
    bg: "bg-vibrant-purple/12",
    dot: "bg-vibrant-purple",
  },
];

interface GroupedExpenses {
  date: string;
  label: string;
  total: number;
  items: Expense[];
}

interface TransactionListProps {
  onEditExpense: (expense: Expense) => void;
}

export default function TransactionList({ onEditExpense }: TransactionListProps) {
  const { formatCurrency } = useCurrency();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const expenses = useFinanceStore((state) => state.expenses);
  const getRecurringExpenses = useFinanceStore((state) => state.recurringExpenses);
  const deleteExpense = useFinanceStore((state) => state.deleteExpense);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const recurring = getRecurringExpenses();
  const recurringMonthlyTotal = recurring.reduce((sum, item) => sum + item.amount, 0);

  const monthlyExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.slice(0, 7) === currentMonth),
    [expenses, currentMonth],
  );

  const categories = useMemo(() => {
    const unique = Array.from(new Set(monthlyExpenses.map((expense) => expense.category))).sort();
    return ["All", ...unique];
  }, [monthlyExpenses]);

  const filteredMonthlyExpenses = useMemo(() => {
    const q = query.trim().toLowerCase();

    return monthlyExpenses.filter((expense) => {
      const categoryMatch = activeCategory === "All" || expense.category === activeCategory;
      if (!categoryMatch) {
        return false;
      }

      if (!q) {
        return true;
      }

      return expense.name.toLowerCase().includes(q) || expense.category.toLowerCase().includes(q);
    });
  }, [activeCategory, monthlyExpenses, query]);

  const groups = useMemo(() => {
    const sorted = [...filteredMonthlyExpenses].sort((a, b) => b.date.localeCompare(a.date));
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
  }, [filteredMonthlyExpenses]);

  return (
    <section className="pt-4 pb-4 space-y-4">
      <div className="px-5 space-y-2">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-base">search</span>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search transactions..."
            className="glass-input w-full h-10 pl-10 pr-3 text-sm text-[#f0f0ff]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`h-8 px-3 rounded-full text-xs font-semibold whitespace-nowrap border ${
                activeCategory === category
                  ? "bg-[#00C9A7]/45 border-white/30 text-white"
                  : "bg-white/10 border-white/20 text-white/65"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-[#f0f0ff]">Recurring</h3>
            <span className="text-xs font-semibold text-white/70">{formatCurrency(recurringMonthlyTotal)} / month</span>
          </div>

          {recurring.length === 0 ? (
            <p className="text-xs text-white/70">No recurring expenses yet.</p>
          ) : (
            <div className="space-y-2">
              {recurring.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between">
                  <p className="text-xs text-[#6b7280] inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">autorenew</span>
                    {expense.name}
                  </p>
                  <p className="text-xs font-semibold text-[#f0f0ff]">{formatCurrency(expense.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <section className="px-5 py-2">
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-sm font-medium text-white/80">No results</p>
            <p className="text-xs text-white/65 mt-1">Try a different search or category filter.</p>
          </div>
        </section>
      ) : (
        groups.map((group, groupIndex) => (
          <div key={group.date}>
            <div
              className={`sticky top-0 bg-[#0a0a0f]/95 backdrop-blur-sm px-5 py-3 border-b border-[rgba(255,255,255,0.06)] z-10 flex justify-between items-center ${
                groupIndex > 0 ? "border-t mt-2 border-[rgba(255,255,255,0.06)]" : ""
              }`}
            >
              <h3 className="text-sm font-bold text-[#4a4a6a] uppercase tracking-wide">{group.label}</h3>
              <span className="text-xs font-medium text-[#6b7280]">-{formatCurrency(group.total)}</span>
            </div>

            <div className="px-5 py-2 space-y-4">
              {group.items.map((item, index) => {
                const colors = colorVariants[(groupIndex + index) % colorVariants.length];
                const showConfirm = confirmDeleteId === item.id;

                return (
                  <div key={item.id} className="glass-card relative rounded-2xl p-3">
                    <div className="flex items-center gap-3">
                      <div className={`size-11 rounded-2xl ${colors.bg} flex items-center justify-center shrink-0 ${colors.icon}`}>
                        <span className="material-symbols-outlined">{item.icon || "receipt_long"}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2 mb-0.5">
                          <h4 className="font-semibold text-[#f0f0ff] truncate inline-flex items-center gap-1">
                            {item.name}
                            {item.recurring && <span className="material-symbols-outlined text-[14px] text-[#6b7280]">autorenew</span>}
                          </h4>
                          <span className="font-bold text-[#f0f0ff]">-{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-medium text-white/70">{item.category}</p>
                          <div className={`size-1.5 rounded-full ${colors.dot}`} />
                        </div>
                        {item.note && <p className="text-xs text-white/65 mt-1 truncate">{item.note}</p>}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditExpense(item)}
                          className="size-8 rounded-lg border border-white/20 bg-white/10 text-white/75"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="size-8 rounded-lg border border-[rgba(255,140,66,0.35)] bg-[rgba(255,140,66,0.12)] text-[#FF8C42]"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {showConfirm && (
                      <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-end gap-2 text-xs">
                        <span className="text-[#6b7280] mr-auto">Delete?</span>
                        <button
                          type="button"
                          onClick={() => {
                            deleteExpense(item.id);
                            setConfirmDeleteId(null);
                          }}
                          className="h-7 px-3 rounded-lg bg-[rgba(255,140,66,0.2)] text-[#FF8C42] font-semibold"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="h-7 px-3 rounded-lg border border-[rgba(255,255,255,0.08)] text-[#6b7280]"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

