"use client";

import { FormEvent, useState } from "react";
import { useFinanceStore } from "../shared/store";
import { RecurringTemplate } from "../shared/types";

interface AddRecurringTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplate?: RecurringTemplate | null;
}

const iconOptions = [
  "subscriptions",
  "home",
  "electric_bolt",
  "wifi",
  "phone_android",
  "receipt_long",
];

export default function AddRecurringTemplateModal({
  isOpen,
  onClose,
  initialTemplate = null,
}: AddRecurringTemplateModalProps) {
  const addRecurringTemplate = useFinanceStore((state) => state.addRecurringTemplate);
  const updateRecurringTemplate = useFinanceStore((state) => state.updateRecurringTemplate);

  const [title, setTitle] = useState(() => initialTemplate?.title ?? "");
  const [category, setCategory] = useState(() => initialTemplate?.category ?? "");
  const [amount, setAmount] = useState(() => (typeof initialTemplate?.amount === "number" ? String(initialTemplate.amount) : ""));
  const [icon, setIcon] = useState(() => initialTemplate?.icon || "receipt_long");

  if (!isOpen) {
    return null;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!title.trim() || !category.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    if (initialTemplate) {
      updateRecurringTemplate({
        ...initialTemplate,
        title: title.trim(),
        category: category.trim(),
        amount: parsedAmount,
        icon,
      });
    } else {
      addRecurringTemplate({
        title: title.trim(),
        category: category.trim(),
        amount: parsedAmount,
        icon,
        active: true,
      });
    }

    setTitle("");
    setCategory("");
    setAmount("");
    setIcon("receipt_long");
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
          <input
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Category"
            className="glass-input w-full h-10 px-3 text-sm text-[#f0f0ff]"
            required
          />
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

          <div className="grid grid-cols-3 gap-2">
            {iconOptions.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => setIcon(iconName)}
                className={`h-10 rounded-lg border inline-flex items-center justify-center ${
                  icon === iconName
                    ? "border-[#00C9A7]/60 bg-[#00C9A7]/18 text-[#c6fff3]"
                    : "border-white/20 bg-white/[0.05] text-white/75"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{iconName}</span>
              </button>
            ))}
          </div>

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
