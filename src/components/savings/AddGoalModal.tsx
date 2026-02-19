"use client";

import { FormEvent, useState } from "react";
import { useFinanceStore } from "../shared/store";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function AddGoalModal({ isOpen, onClose }: AddGoalModalProps) {
  const addSavingGoal = useFinanceStore((state) => state.addSavingGoal);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [date, setDate] = useState(today());
  const [icon, setIcon] = useState("savings");

  if (!isOpen) {
    return null;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedTarget = Number(targetAmount);
    const parsedSaved = Number(savedAmount || "0");
    if (!name.trim() || !category.trim() || !Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      return;
    }

    addSavingGoal({
      name: name.trim(),
      category: category.trim(),
      targetAmount: parsedTarget,
      savedAmount: Number.isFinite(parsedSaved) && parsedSaved > 0 ? parsedSaved : 0,
      date,
      icon: icon.trim() || "savings",
    });

    setName("");
    setCategory("General");
    setTargetAmount("");
    setSavedAmount("");
    setDate(today());
    setIcon("savings");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#f0f0ff]">Add Goal</h2>
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
            placeholder="Goal name"
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] placeholder:text-[#3d3d5c] outline-none focus:border-[rgba(0,201,167,0.5)] focus:ring-0"
            required
          />
          <input
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Category"
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] placeholder:text-[#3d3d5c] outline-none focus:border-[rgba(0,201,167,0.5)] focus:ring-0"
            required
          />
          <input
            type="number"
            min="1"
            step="0.01"
            value={targetAmount}
            onChange={(event) => setTargetAmount(event.target.value)}
            placeholder="Target amount"
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] placeholder:text-[#3d3d5c] outline-none focus:border-[rgba(0,201,167,0.5)] focus:ring-0"
            required
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={savedAmount}
            onChange={(event) => setSavedAmount(event.target.value)}
            placeholder="Initial saved amount"
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] placeholder:text-[#3d3d5c] outline-none focus:border-[rgba(0,201,167,0.5)] focus:ring-0"
          />
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] outline-none focus:border-[rgba(0,201,167,0.5)] focus:ring-0"
            required
          />
          <input
            type="text"
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            placeholder="Material icon (optional)"
            className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 py-2 text-sm text-[#f0f0ff] placeholder:text-[#3d3d5c] outline-none focus:border-[rgba(0,201,167,0.5)] focus:ring-0"
          />

          <button
            type="submit"
            className="w-full mt-2 h-11 rounded-xl bg-[#00C9A7] text-white text-sm font-semibold hover:bg-[#00C9A7]/90 transition-colors"
          >
            Add Goal
          </button>
        </form>
      </div>
    </div>
  );
}

