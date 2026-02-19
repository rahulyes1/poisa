"use client";

import { FormEvent, useMemo, useState } from "react";
import { useFinanceStore } from "../shared/store";

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const PRESET_CATEGORIES = ["Mutual Fund", "Stocks", "Crypto", "Gold", "Fixed Deposit", "ETF", "Bonds"];

export default function AddInvestmentModal({ isOpen, onClose }: AddInvestmentModalProps) {
  const addInvestment = useFinanceStore((state) => state.addInvestment);
  const investments = useFinanceStore((state) => state.investments);

  const existingCategories = useMemo(
    () => Array.from(new Set(investments.map((item) => item.category))).filter(Boolean),
    [investments],
  );
  const categoryOptions = useMemo(
    () => Array.from(new Set([...PRESET_CATEGORIES, ...existingCategories])),
    [existingCategories],
  );

  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryOptions[0] ?? "Stocks");
  const [customCategory, setCustomCategory] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");

  if (!isOpen) {
    return null;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const category = selectedCategory === "__custom__" ? customCategory.trim() : selectedCategory.trim();
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !category) {
      return;
    }

    addInvestment({
      title: title.trim() || category,
      category,
      amount: parsedAmount,
      date,
      note: note.trim(),
    });

    setDate(today());
    setAmount("");
    setSelectedCategory(categoryOptions[0] ?? "Stocks");
    setCustomCategory("");
    setTitle("");
    setNote("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Add Investment</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="glass-input w-full px-3 py-2 text-sm text-white"
            required
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount"
            className="glass-input w-full px-3 py-2 text-sm text-white placeholder:text-white/50"
            required
          />
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

          {selectedCategory === "__custom__" && (
            <input
              type="text"
              value={customCategory}
              onChange={(event) => setCustomCategory(event.target.value)}
              placeholder="New category"
              className="glass-input w-full px-3 py-2 text-sm text-white placeholder:text-white/50"
              required
            />
          )}

          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title (optional)"
            className="glass-input w-full px-3 py-2 text-sm text-white placeholder:text-white/50"
          />

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note"
            className="glass-input w-full px-3 py-2 text-sm text-white placeholder:text-white/50 min-h-20"
          />

          <button type="submit" className="w-full h-11 rounded-2xl bg-[#00C9A7] hover:bg-[#00C9A7]/90 text-white font-semibold shadow-[0_0_24px_rgba(0,201,167,0.45)]">
            Add Investment
          </button>
        </form>
      </div>
    </div>
  );
}
