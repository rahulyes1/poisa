"use client";

import { useMemo } from "react";
import GoalCard from "./GoalCard";
import { useFinanceStore } from "../shared/store";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export default function SavingsOverview() {
  const goals = useFinanceStore((state) => state.savingGoals);

  const { totalSaved, totalTarget } = useMemo(() => {
    return goals.reduce(
      (acc, goal) => {
        acc.totalSaved += goal.savedAmount;
        acc.totalTarget += goal.targetAmount;
        return acc;
      },
      { totalSaved: 0, totalTarget: 0 },
    );
  }, [goals]);

  const percent = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  return (
    <section className="px-5 pt-4 pb-4 space-y-4">
      <div className="bg-white dark:bg-[#15152a] rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Savings Progress
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalSaved)}</p>
          </div>
          <p className="text-sm font-medium text-vibrant-teal">{Math.round(percent)}% reached</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          {formatCurrency(totalSaved)} of {formatCurrency(totalTarget)} goal
        </p>
        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div className="h-full rounded-full bg-vibrant-teal" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No savings goals yet.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Use Add Goal to create your first savings target.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </section>
  );
}
