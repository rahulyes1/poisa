"use client";

import { useMemo } from "react";
import GoalCard from "./GoalCard";
import { useFinanceStore } from "../shared/store";
import { SavingGoal } from "../shared/types";
import { useCurrency } from "../shared/useCurrency";

interface SavingsOverviewProps {
  onEditGoal: (goal: SavingGoal) => void;
}

export default function SavingsOverview({ onEditGoal }: SavingsOverviewProps) {
  const { formatCurrency } = useCurrency();
  const savingsBudget = useFinanceStore((state) => state.savingsBudget);
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
      <div className="bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4a4a6a]">
              Savings Progress
            </p>
            <p className="text-xl font-bold text-[#f0f0ff]">{formatCurrency(totalSaved)}</p>
          </div>
          <p className="text-sm font-medium text-vibrant-teal">{Math.round(percent)}% reached</p>
        </div>
        <p className="text-xs text-[#6b7280] mb-2">
          {formatCurrency(totalSaved)} of {formatCurrency(totalTarget)} goal
        </p>
        <div className="h-2.5 rounded-full bg-[#1a1a26] overflow-hidden">
          <div
            className="h-full rounded-full bg-vibrant-teal drop-shadow-[0_0_4px_currentColor]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[#6b7280]">
          Savings budget: <span className="font-semibold">{formatCurrency(savingsBudget)}</span>
        </p>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-8 text-center">
          <p className="text-sm font-medium text-[#6b7280]">No savings goals yet.</p>
          <p className="text-xs text-[#6b7280] mt-1">
            Use Add Goal to create your first savings target.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onEditGoal={onEditGoal} />
          ))}
        </div>
      )}
    </section>
  );
}

