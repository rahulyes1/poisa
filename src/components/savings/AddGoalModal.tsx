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
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#15152a] rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Goal</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
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
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            required
          />
          <input
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Category"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            required
          />
          <input
            type="number"
            min="1"
            step="0.01"
            value={targetAmount}
            onChange={(event) => setTargetAmount(event.target.value)}
            placeholder="Target amount"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            required
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={savedAmount}
            onChange={(event) => setSavedAmount(event.target.value)}
            placeholder="Initial saved amount"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25"
          />
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25"
            required
          />
          <input
            type="text"
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            placeholder="Material icon (optional)"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/25"
          />

          <button
            type="submit"
            className="w-full mt-2 h-11 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Add Goal
          </button>
        </form>
      </div>
    </div>
  );
}
