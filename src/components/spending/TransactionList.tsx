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

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/** Returns the CSS class for the left border accent based on category name */
function getCategoryBorderClass(category: string): string {
  const key = category.toLowerCase().trim();
  if (key.includes("rent"))           return "category-border-rent";
  if (key.includes("ott") || key.includes("subscription") || key.includes("stream"))
                                       return "category-border-ott";
  if (key.includes("electric"))       return "category-border-electricity";
  if (key.includes("utilit") || key.includes("bills") || key.includes("bill"))
                                       return "category-border-utilities";
  if (key.includes("food") || key.includes("dining") || key.includes("restaurant"))
                                       return "category-border-food";
  if (key.includes("grocer"))         return "category-border-groceries";
  if (key.includes("transport") || key.includes("travel") || key.includes("fuel") || key.includes("uber") || key.includes("cab"))
                                       return "category-border-transport";
  if (key.includes("health") || key.includes("medical") || key.includes("medicine"))
                                       return "category-border-health";
  if (key.includes("shop") || key.includes("cloth") || key.includes("fashion"))
                                       return "category-border-shopping";
  if (key.includes("entertain") || key.includes("movie") || key.includes("game"))
                                       return "category-border-entertainment";
  if (key.includes("edu") || key.includes("course") || key.includes("book"))
                                       return "category-border-education";
  return "category-border-other";
}

/** Icon bg color based on category */
const categoryIconColors: Record<string, { bg: string; text: string }> = {
  rent:          { bg: "rgba(59,130,246,0.15)",  text: "#60A5FA" },
  ott:           { bg: "rgba(139,92,246,0.15)",  text: "#A78BFA" },
  subscription:  { bg: "rgba(139,92,246,0.15)",  text: "#A78BFA" },
  electricity:   { bg: "rgba(245,158,11,0.15)",  text: "#FCD34D" },
  utilities:     { bg: "rgba(245,158,11,0.15)",  text: "#FCD34D" },
  food:          { bg: "rgba(249,115,22,0.15)",  text: "#FB923C" },
  groceries:     { bg: "rgba(132,204,22,0.15)",  text: "#A3E635" },
  transport:     { bg: "rgba(6,182,212,0.15)",   text: "#22D3EE" },
  health:        { bg: "rgba(16,185,129,0.15)",  text: "#34D399" },
  shopping:      { bg: "rgba(236,72,153,0.15)",  text: "#F472B6" },
  entertainment: { bg: "rgba(124,58,237,0.15)",  text: "#A78BFA" },
  education:     { bg: "rgba(14,165,233,0.15)",  text: "#38BDF8" },
  travel:        { bg: "rgba(6,182,212,0.15)",   text: "#22D3EE" },
  other:         { bg: "rgba(100,116,139,0.15)", text: "#94A3B8" },
};

function getCategoryIconColors(category: string) {
  const key = category.toLowerCase().trim();
  for (const [pattern, colors] of Object.entries(categoryIconColors)) {
    if (key.includes(pattern)) return colors;
  }
  return categoryIconColors.other;
}

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
    if (!template.active || !template.paidMonths.includes(selectedMonth)) return sum;
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
      if (!categoryMatch) return false;
      if (!q) return true;
      return expense.name.toLowerCase().includes(q) || expense.category.toLowerCase().includes(q);
    });
  }, [activeCategory, monthlyExpenses, query]);

  const groups = useMemo(() => {
    const sorted = [...filteredMonthlyExpenses].sort((a, b) => b.date.localeCompare(a.date));
    const grouped = sorted.reduce<Record<string, GroupedExpenses>>((acc, expense) => {
      if (!acc[expense.date]) {
        acc[expense.date] = { date: expense.date, label: toDisplayDate(expense.date), total: 0, items: [] };
      }
      acc[expense.date].items.push(expense);
      acc[expense.date].total += expense.amount;
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredMonthlyExpenses]);

  return (
    <section className="pt-2 pb-3 space-y-3">
      {/* Category filter pills */}
      <div className="px-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`h-7 px-3 rounded-full text-[11px] font-semibold whitespace-nowrap border active:scale-95 transition-all ${
                activeCategory === category
                  ? "bg-[#4F46E5]/40 border-[#4F46E5]/60 text-white"
                  : "bg-white/[0.06] border-white/15 text-white/55 hover:bg-white/[0.10]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Recurring tiles */}
      <div className="px-4">
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[11px] font-bold text-[#F1F5F9]">Recurring</h3>
            <span className="text-[10px] font-semibold text-[#94A3B8]">{formatCurrency(recurringTotal)} / month</span>
          </div>

          <div className="flex items-stretch gap-2 mb-2 overflow-x-auto no-scrollbar pb-0.5">
            {recurringTemplates
              .filter((template) => template.active)
              .map((template) => {
                const isDone = template.paidMonths.includes(selectedMonth);
                const isPreset = template.id.startsWith("template-");

                return (
                  <div key={template.id} className="shrink-0 w-[112px]">
                    <div
                      className={`min-h-[76px] rounded-xl border p-2 text-left transition-colors ${
                        isDone
                          ? "border-[#10B981]/50 bg-[#10B981]/12"
                          : "border-white/15 bg-white/[0.04]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px] text-white/75">
                        {template.icon || "receipt_long"}
                      </span>
                      <p className="text-[10px] font-semibold text-[#F1F5F9] mt-1 whitespace-normal break-words leading-tight">
                        {template.title}
                      </p>
                      <p className="text-[10px] text-[#94A3B8] mt-0.5">{formatCurrency(template.amount)}</p>
                    </div>

                    {/* Pill action buttons */}
                    <div className="mt-1.5 grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => toggleRecurringTemplatePaid(template.id, selectedMonth)}
                        className={`h-6 rounded-full text-[9px] font-bold active:scale-95 transition-transform ${
                          isDone
                            ? "border border-[#F43F5E]/40 bg-[#F43F5E]/10 text-[#F43F5E]"
                            : "bg-[#10B981] text-white"
                        }`}
                      >
                        {isDone ? "Undo" : "Done ✓"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTemplate(template)}
                        className="h-6 rounded-full border border-[#4F46E5]/40 bg-[#4F46E5]/10 text-[9px] font-bold text-[#A5B4FC] active:scale-95 transition-transform"
                      >
                        Edit
                      </button>
                    </div>
                    {!isPreset && (
                      <button
                        type="button"
                        onClick={() => deleteRecurringTemplate(template.id)}
                        className="mt-1 h-5 w-full rounded-full border border-[#F43F5E]/25 bg-[#F43F5E]/06 text-[8px] font-semibold uppercase tracking-wide text-[#F43F5E] active:scale-95 transition-transform"
                        title="Delete recurring tile"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}

            {/* Add custom recurring button */}
            <button
              type="button"
              onClick={() => setIsAddRecurringOpen(true)}
              className="shrink-0 w-[96px] min-h-[76px] rounded-xl border border-dashed border-white/20 bg-white/[0.03] p-2 inline-flex flex-col items-center justify-center text-center active:scale-95 transition-transform hover:border-[#4F46E5]/50"
            >
              <span className="material-symbols-outlined text-[16px] text-[#818CF8]">add</span>
              <span className="text-[10px] font-semibold text-[#818CF8] mt-1">Custom</span>
            </button>
          </div>

          {recurring.length === 0 ? (
            <p className="text-[10px] text-[#64748B]">No manual recurring entries yet.</p>
          ) : (
            <div className="space-y-1">
              {recurring.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between">
                  <p className="text-[10px] text-[#64748B] inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px]">autorenew</span>
                    {expense.name}
                  </p>
                  <p className="text-[10px] font-semibold text-[#F1F5F9]">{formatCurrency(expense.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction groups — empty state */}
      {groups.length === 0 ? (
        <section className="px-4 py-1">
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-3xl mb-2">{query ? "🔍" : "💸"}</p>
            <p className="text-sm font-bold text-[#F1F5F9]">
              {query ? "No results found" : "No expenses yet"}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              {query
                ? "Try a different search term or category"
                : "Tap + to add your first expense this month"}
            </p>
          </div>
        </section>
      ) : (
        groups.map((group, groupIndex) => (
          <div key={group.date}>
            <div
              className={`sticky top-0 bg-[#0F172A]/96 backdrop-blur-sm px-4 py-2 border-b border-white/[0.05] z-10 flex justify-between items-center ${
                groupIndex > 0 ? "border-t mt-2 border-white/[0.05]" : ""
              }`}
            >
              <h3 className="text-[11px] font-bold text-[#475569] uppercase tracking-widest">{group.label}</h3>
              <span className="text-[11px] font-medium text-[#64748B]">-{formatCurrency(group.total)}</span>
            </div>

            <div className="px-4 py-1 space-y-2">
              {group.items.map((item) => {
                const borderClass = getCategoryBorderClass(item.category);
                const iconColors = getCategoryIconColors(item.category);

                return (
                  <div
                    key={item.id}
                    className={`glass-card relative rounded-xl overflow-hidden ${borderClass}`}
                    style={{ borderRadius: "14px" }}
                  >
                    <div className="flex items-center gap-2.5 p-3">
                      {/* Category icon */}
                      <div
                        className="size-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: iconColors.bg }}
                      >
                        <span
                          className="material-symbols-outlined text-[17px]"
                          style={{ color: iconColors.text }}
                        >
                          {item.icon || "receipt_long"}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2 mb-px">
                          <h4 className="text-[13px] font-semibold text-[#F1F5F9] truncate inline-flex items-center gap-1">
                            {item.name}
                            {item.recurring && (
                              <span className="material-symbols-outlined text-[12px] text-[#64748B]">autorenew</span>
                            )}
                          </h4>
                          <span className="text-[13px] font-bold text-[#F1F5F9] shrink-0">
                            -{formatCurrency(item.amount)}
                          </span>
                        </div>
                        <p className="text-[10px] font-medium text-[#94A3B8]">{item.category}</p>
                        {item.note && (
                          <p className="text-[11px] text-[#64748B] mt-1 whitespace-normal break-words leading-snug">
                            {item.note}
                          </p>
                        )}
                      </div>

                      {/* Edit / Delete buttons as pills */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditExpense(item)}
                          className="h-7 px-2.5 rounded-full border border-[#4F46E5]/35 bg-[#4F46E5]/10 text-[#A5B4FC] active:scale-95 transition-transform"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[13px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExpense(item.id)}
                          className="h-7 px-2.5 rounded-full border border-[#F43F5E]/30 bg-[#F43F5E]/08 text-[#F43F5E] active:scale-95 transition-transform"
                          title="Delete"
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
