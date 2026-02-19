"use client";

import { useMemo, useState } from "react";
import { Expense, RecurringTemplate } from "../shared/types";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";
import AddRecurringTemplateModal from "./AddRecurringTemplateModal";

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
  query: string;
  onEditExpense: (expense: Expense) => void;
}

export default function TransactionList({ query, onEditExpense }: TransactionListProps) {
  const { formatCurrency } = useCurrency();
  const [activeCategory, setActiveCategory] = useState("All");
  const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);

  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const expenses = useFinanceStore((state) => state.expenses);
  const getRecurringExpenses = useFinanceStore((state) => state.recurringExpenses);
  const recurringTemplates = useFinanceStore((state) => state.recurringTemplates);
  const toggleRecurringTemplatePaid = useFinanceStore((state) => state.toggleRecurringTemplatePaid);
  const deleteRecurringTemplate = useFinanceStore((state) => state.deleteRecurringTemplate);
  const deleteExpense = useFinanceStore((state) => state.deleteExpense);

  const recurring = getRecurringExpenses();
  const recurringMonthlyTotal = recurring.reduce((sum, item) => sum + item.amount, 0);
  const tileMonthlyTotal = recurringTemplates.reduce((sum, template) => {
    if (!template.active || !template.paidMonths.includes(selectedMonth)) {
      return sum;
    }
    return sum + template.amount;
  }, 0);
  const recurringTotal = recurringMonthlyTotal + tileMonthlyTotal;

  const monthlyExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.slice(0, 7) === selectedMonth),
    [expenses, selectedMonth],
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
    <section className="pt-2 pb-3 space-y-3">
      <div className="px-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`h-7 px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap border ${
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

      <div className="px-4">
        <div className="glass-card rounded-xl p-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[11px] font-bold text-[#f0f0ff]">Recurring</h3>
            <span className="text-[10px] font-semibold text-white/70">{formatCurrency(recurringTotal)} / month</span>
          </div>

          <div className="flex items-stretch gap-1.5 mb-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {recurringTemplates
              .filter((template) => template.active)
              .map((template) => {
                const isDone = template.paidMonths.includes(selectedMonth);
                const isPreset = template.id.startsWith("template-");

                return (
                  <div key={template.id} className="shrink-0 w-[112px]">
                    <div
                      className={`min-h-[72px] rounded-lg border p-1.5 text-left ${
                        isDone
                          ? "border-[#00C9A7]/55 bg-[#00C9A7]/20"
                          : "border-white/20 bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="material-symbols-outlined text-[13px] text-white/80">
                          {template.icon || "receipt_long"}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                            isDone ? "bg-[#00C9A7]/30 text-[#bafced]" : "bg-white/10 text-white/65"
                          }`}
                        >
                          {isDone ? "Done" : "Tap"}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-[#f0f0ff] mt-1 whitespace-normal break-words leading-tight pr-7">
                        {template.title}
                      </p>
                      <p className="text-[10px] text-white/70 mt-0.5">{formatCurrency(template.amount)}</p>
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => toggleRecurringTemplatePaid(template.id, selectedMonth)}
                        className={`h-6 rounded-md text-[10px] font-semibold ${
                          isDone
                            ? "border border-[rgba(255,140,66,0.35)] bg-[rgba(255,140,66,0.12)] text-[#FF8C42]"
                            : "bg-[rgba(0,201,167,0.2)] text-[#c8fff5]"
                        }`}
                      >
                        {isDone ? "Undo" : "Done"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTemplate(template)}
                        className="h-6 rounded-md border border-white/20 bg-white/[0.08] text-[10px] font-semibold text-white/85"
                      >
                        Edit
                      </button>
                    </div>
                    {!isPreset && (
                      <button
                        type="button"
                        onClick={() => deleteRecurringTemplate(template.id)}
                        className="mt-1 h-5 w-full rounded-md border border-[rgba(255,140,66,0.35)] bg-[rgba(255,140,66,0.08)] text-[9px] font-semibold uppercase tracking-wide text-[#FF8C42]"
                        title="Delete recurring tile"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}

            <button
              type="button"
              onClick={() => setIsAddRecurringOpen(true)}
              className="shrink-0 w-[92px] min-h-[72px] rounded-lg border border-dashed border-white/25 bg-white/[0.04] p-1.5 inline-flex flex-col items-center justify-center text-center"
            >
              <span className="material-symbols-outlined text-[14px] text-white/75">add</span>
              <span className="text-[10px] font-semibold text-white/75 mt-1">Custom</span>
            </button>
          </div>

          {recurring.length === 0 ? (
            <p className="text-[10px] text-white/60">No manual recurring entries yet.</p>
          ) : (
            <div className="space-y-1">
              {recurring.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between">
                  <p className="text-[10px] text-[#6b7280] inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px]">autorenew</span>
                    {expense.name}
                  </p>
                  <p className="text-[10px] font-semibold text-[#f0f0ff]">{formatCurrency(expense.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <section className="px-4 py-1">
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-sm font-medium text-white/80">No results</p>
            <p className="text-xs text-white/65 mt-1">Try a different search or category filter.</p>
          </div>
        </section>
      ) : (
        groups.map((group, groupIndex) => (
          <div key={group.date}>
            <div
              className={`sticky top-0 bg-[#0a0a0f]/95 backdrop-blur-sm px-4 py-2 border-b border-[rgba(255,255,255,0.06)] z-10 flex justify-between items-center ${
                groupIndex > 0 ? "border-t mt-2 border-[rgba(255,255,255,0.06)]" : ""
              }`}
            >
              <h3 className="text-xs font-bold text-[#4a4a6a] uppercase tracking-wide">{group.label}</h3>
              <span className="text-[11px] font-medium text-[#6b7280]">-{formatCurrency(group.total)}</span>
            </div>

            <div className="px-4 py-1 space-y-2">
              {group.items.map((item, index) => {
                const colors = colorVariants[(groupIndex + index) % colorVariants.length];

                return (
                  <div key={item.id} className="glass-card relative rounded-xl p-2">
                    <div className="flex items-center gap-2">
                      <div className={`size-8 rounded-lg ${colors.bg} flex items-center justify-center shrink-0 ${colors.icon}`}>
                        <span className="material-symbols-outlined text-[16px]">{item.icon || "receipt_long"}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2 mb-px">
                          <h4 className="text-[13px] font-semibold text-[#f0f0ff] truncate inline-flex items-center gap-1">
                            {item.name}
                            {item.recurring && <span className="material-symbols-outlined text-[13px] text-[#6b7280]">autorenew</span>}
                          </h4>
                          <span className="text-[13px] font-bold text-[#f0f0ff]">-{formatCurrency(item.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-medium text-white/70">{item.category}</p>
                          <div className={`size-1.5 rounded-full ${colors.dot}`} />
                        </div>
                        {item.note && (
                          <p className="text-[11px] text-white/65 mt-1 whitespace-normal break-words leading-snug">
                            {item.note}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditExpense(item)}
                          className="size-6 rounded-md border border-white/20 bg-white/10 text-white/75"
                        >
                          <span className="material-symbols-outlined text-[13px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExpense(item.id)}
                          className="size-6 rounded-md border border-[rgba(255,140,66,0.35)] bg-[rgba(255,140,66,0.12)] text-[#FF8C42]"
                        >
                          <span className="material-symbols-outlined text-[13px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <AddRecurringTemplateModal
        key={`add-recurring-${isAddRecurringOpen ? "open" : "closed"}`}
        isOpen={isAddRecurringOpen}
        onClose={() => setIsAddRecurringOpen(false)}
      />
      <AddRecurringTemplateModal
        key={`edit-recurring-${editingTemplate?.id ?? "none"}-${editingTemplate ? "open" : "closed"}`}
        isOpen={Boolean(editingTemplate)}
        initialTemplate={editingTemplate}
        onClose={() => setEditingTemplate(null)}
      />
    </section>
  );
}

