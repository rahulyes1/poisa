"use client";

import { SavingGoal } from "../shared/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

interface GoalCardProps {
  goal: SavingGoal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  const progress = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;

  return (
    <article className="bg-white dark:bg-[#15152a] rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-4">
      <div
        className="size-14 rounded-full flex items-center justify-center text-[11px] font-bold text-slate-900 dark:text-white"
        style={{
          background: `conic-gradient(#00C9A7 ${progress}%, rgba(148, 163, 184, 0.25) ${progress}% 100%)`,
        }}
      >
        <div className="size-11 rounded-full bg-white dark:bg-[#15152a] flex items-center justify-center">
          {Math.round(progress)}%
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className="font-semibold text-slate-900 dark:text-white truncate">{goal.name}</h3>
          <span className="text-sm font-bold text-vibrant-teal">{formatCurrency(goal.savedAmount)}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{goal.category}</p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {formatCurrency(goal.savedAmount)} of {formatCurrency(goal.targetAmount)}
        </p>
      </div>
    </article>
  );
}
