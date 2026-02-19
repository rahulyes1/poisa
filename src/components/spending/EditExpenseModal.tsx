"use client";

import { FormEvent, useMemo, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { Expense } from "../shared/types";

interface EditExpenseModalProps {
  isOpen: boolean;
  item: Expense | null;
  onClose: () => void;
}

const PRESET_CATEGORIES = [
  "Food",
  "Transport",
  "Groceries",
  "Bills",
  "Shopping",
  "Entertainment",
  "Health",
  "Travel",
  "Education",
  "Other",
];

const iconByCategory: Record<string, string> = {
  Food: "restaurant",
  Transport: "directions_car",
  Groceries: "local_grocery_store",
  Bills: "receipt_long",
  Shopping: "shopping_bag",
  Entertainment: "movie",
  Health: "medical_services",
  Travel: "flight",
  Education: "school",
  Other: "category",
};

const resolveIcon = (category: string) => iconByCategory[category] ?? "receipt_long";

export default function EditExpenseModal({ isOpen, item, onClose }: EditExpenseModalProps) {
  const updateExpense = useFinanceStore((state) => state.updateExpense);
  const expenses = useFinanceStore((state) => state.expenses);

  const existingCategories = useMemo(
    () => Array.from(new Set(expenses.map((expense) => expense.category))).filter(Boolean),
    [expenses],
  );
  const categoryOptions = useMemo(
    () => Array.from(new Set([...PRESET_CATEGORIES, ...existingCategories])),
    [existingCategories],
  );

  const initialCategory = item?.category ?? "Other";
  const isCustomInitial = initialCategory && !categoryOptions.includes(initialCategory);

  const [date, setDate] = useState(item?.date ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [selectedCategory, setSelectedCategory] = useState(isCustomInitial ? "__custom__" : initialCategory);
  const [customCategory, setCustomCategory] = useState(isCustomInitial ? initialCategory : "");
  const [note, setNote] = useState(item?.note ?? "");
  const [recurring, setRecurring] = useState(item?.recurring ?? false);

  if (!isOpen || !item) {
    return null;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const category = selectedCategory === "__custom__" ? customCategory.trim() : selectedCategory.trim();
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !category) {
      return;
    }

    updateExpense({
      ...item,
      name: category,
      category,
      amount: parsedAmount,
      date,
      icon: resolveIcon(category),
      note: note.trim(),
      recurring,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Edit Expense</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60 mb-1.5">Date</p>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="glass-input w-full px-3 py-2 text-sm text-white" required />
          </label>

          <label className="block">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60 mb-1.5">Amount</p>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="glass-input w-full px-3 py-2 text-sm text-white"
              required
            />
          </label>

          <label className="block">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60 mb-1.5">Category</p>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="glass-input w-full px-3 py-2 text-sm text-white bg-transparent"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option} className="bg-[#10112a] text-white">
                  {option}
                </option>
              ))}
              <option value="__custom__" className="bg-[#10112a] text-white">
                Create new category
              </option>
            </select>
          </label>

          {selectedCategory === "__custom__" && (
            <input
              type="text"
              value={customCategory}
              onChange={(event) => setCustomCategory(event.target.value)}
              placeholder="New category"
              className="glass-input w-full px-3 py-2 text-sm text-white"
              required
            />
          )}

          <label className="block">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60 mb-1.5">Note</p>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add note"
              className="glass-input w-full px-3 py-2 text-sm text-white min-h-20"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-white/75">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(event) => setRecurring(event.target.checked)}
              className="size-4 border border-white/40 bg-transparent"
            />
            Mark as recurring (monthly)
          </label>

          <button type="submit" className="w-full mt-1 h-11 rounded-2xl bg-[#7000FF] hover:bg-[#7000FF]/90 text-white font-semibold shadow-[0_0_24px_rgba(112,0,255,0.45)]">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
