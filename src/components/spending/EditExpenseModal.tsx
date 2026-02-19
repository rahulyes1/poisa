"use client";

import { FormEvent, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { Expense } from "../shared/types";
import CategoryIconPicker from "./CategoryIconPicker";

interface EditExpenseModalProps {
  isOpen: boolean;
  item: Expense | null;
  onClose: () => void;
}

export default function EditExpenseModal({ isOpen, item, onClose }: EditExpenseModalProps) {
  const updateExpense = useFinanceStore((state) => state.updateExpense);

  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState(item?.category ?? "General");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [date, setDate] = useState(item?.date ?? "");
  const [icon, setIcon] = useState(item?.icon || "receipt_long");
  const [recurring, setRecurring] = useState(item?.recurring ?? false);

  if (!isOpen || !item) {
    return null;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!name.trim() || !category.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    updateExpense({
      ...item,
      name: name.trim(),
      category: category.trim(),
      amount: parsedAmount,
      date,
      icon: icon.trim() || "receipt_long",
      recurring,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#f0f0ff]">Edit Expense</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#1a1a26] text-[#6b7280]"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Expense name"
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] placeholder:text-[#3d3d5c] outline-none focus:border-[rgba(19,19,236,0.5)] focus:ring-0"
            required
          />
          <input
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Category"
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] placeholder:text-[#3d3d5c] outline-none focus:border-[rgba(19,19,236,0.5)] focus:ring-0"
            required
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount"
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] placeholder:text-[#3d3d5c] outline-none focus:border-[rgba(19,19,236,0.5)] focus:ring-0"
            required
          />
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] outline-none focus:border-[rgba(19,19,236,0.5)] focus:ring-0"
            required
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4a4a6a] mb-2">Category Icon</p>
            <CategoryIconPicker value={icon} onChange={setIcon} />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#6b7280]">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(event) => setRecurring(event.target.checked)}
              className="size-4 border border-[rgba(255,255,255,0.08)] bg-[#1a1a26]"
            />
            Mark as recurring (monthly)
          </label>

          <button
            type="submit"
            className="w-full mt-2 h-11 rounded-xl bg-[#1313ec] text-white text-sm font-semibold hover:bg-[#1313ec]/90 transition-colors"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

