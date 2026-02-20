"use client";

import { FormEvent, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { RecurringTemplate } from "../shared/types";

interface AddRecurringTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplate?: RecurringTemplate | null;
}

const recurringCategoryOptions = [
  "Rent",
  "Utilities",
  "Subscription",
  "Bills & Recharge",
  "EMI Expenses",
  "Life Insurance",
  "SIP",
  "Parents Insurance",
  "Recurring Expenses",
  "Other",
];

const resolveIconFromCategory = (category: string) => {
  const key = category.toLowerCase().trim();
  if (key.includes("rent")) return "home";
  if (key.includes("utilit") || key.includes("electric")) return "electric_bolt";
  if (key.includes("subscription") || key.includes("ott") || key.includes("stream")) return "subscriptions";
  if (key.includes("emi") || key.includes("loan")) return "credit_card";
  if (key.includes("insurance")) return "shield";
  if (key.includes("sip") || key.includes("invest")) return "trending_up";
  if (key.includes("recharge") || key.includes("bill")) return "receipt_long";
  return "receipt_long";
};

export default function AddRecurringTemplateModal({
  isOpen,
  onClose,
  initialTemplate = null,
}: AddRecurringTemplateModalProps) {
  const addRecurringTemplate = useFinanceStore((state) => state.addRecurringTemplate);
  const updateRecurringTemplate = useFinanceStore((state) => state.updateRecurringTemplate);

  const [title, setTitle] = useState(() => initialTemplate?.title ?? "");
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const initialCategory = initialTemplate?.category ?? "";
    if (initialCategory && recurringCategoryOptions.includes(initialCategory)) {
      return initialCategory;
    }
    return initialCategory ? "__custom__" : recurringCategoryOptions[0];
  });
  const [customCategory, setCustomCategory] = useState(() => {
    const initialCategory = initialTemplate?.category ?? "";
    if (!initialCategory || recurringCategoryOptions.includes(initialCategory)) {
      return "";
    }
    return initialCategory;
  });
  const [amount, setAmount] = useState(() => (typeof initialTemplate?.amount === "number" ? String(initialTemplate.amount) : ""));

  if (!isOpen) {
    return null;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const category = (selectedCategory === "__custom__" ? customCategory : selectedCategory).trim();
    if (!title.trim() || !category || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }
    const icon = resolveIconFromCategory(category);

    if (initialTemplate) {
      updateRecurringTemplate({
        ...initialTemplate,
        title: title.trim(),
        category,
        amount: parsedAmount,
        icon,
      });
    } else {
      addRecurringTemplate({
        title: title.trim(),
        category,
        amount: parsedAmount,
        icon,
        active: true,
      });
    }

    setTitle("");
    setSelectedCategory(recurringCategoryOptions[0]);
    setCustomCategory("");
    setAmount("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#f0f0ff]">
            {initialTemplate ? "Edit Recurring Tile" : "Add Recurring Tile"}
          </h2>
          <button type="button" onClick={onClose} className="size-8 rounded-full text-white/70 hover:bg-white/10">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
            className="glass-input w-full h-10 px-3 text-sm text-[#f0f0ff]"
            required
          />
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="glass-input w-full h-10 px-3 text-sm text-[#f0f0ff] bg-transparent"
          >
            {recurringCategoryOptions.map((option) => (
              <option key={option} value={option} className="bg-[#111118] text-[#f0f0ff]">
                {option}
              </option>
            ))}
            <option value="__custom__" className="bg-[#111118] text-[#f0f0ff]">
              Custom Category
            </option>
          </select>

          {selectedCategory === "__custom__" && (
            <input
              type="text"
              value={customCategory}
              onChange={(event) => setCustomCategory(event.target.value)}
              placeholder="Custom category"
              className="glass-input w-full h-10 px-3 text-sm text-[#f0f0ff]"
              required
            />
          )}

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Monthly amount"
            className="glass-input w-full h-10 px-3 text-sm text-[#f0f0ff]"
            required
          />

          <button
            type="submit"
            className="w-full h-10 rounded-xl bg-[#00C9A7] text-[#07241f] text-sm font-semibold hover:bg-[#00C9A7]/90 transition-colors"
          >
            {initialTemplate ? "Update Tile" : "Save Tile"}
          </button>
        </form>
      </div>
    </div>
  );
}

