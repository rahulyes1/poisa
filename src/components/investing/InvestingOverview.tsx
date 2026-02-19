"use client";

import { useMemo } from "react";
import GoalCard from "../savings/GoalCard";
import { useFinanceStore } from "../shared/store";
import { SavingGoal } from "../shared/types";
import { useCurrency } from "../shared/useCurrency";

interface InvestingOverviewProps {
  onEditGoal: (goal: SavingGoal) => void;
}

export default function InvestingOverview({ onEditGoal }: InvestingOverviewProps) {
  const { formatCurrency } = useCurrency();
  const goals = useFinanceStore((state) => state.savingGoals);
  const investments = useFinanceStore((state) => state.investments);

  const { totalSaved, totalInvested } = useMemo(() => {
    const saved = goals.reduce((sum, goal) => sum + goal.savedAmount, 0);
    const invested = investments.reduce((sum, item) => sum + item.amount, 0);
    return { totalSaved: saved, totalInvested: invested };
  }, [goals, investments]);

  const combinedTotal = totalSaved + totalInvested;

  return (
    <section className="px-4 pt-3 pb-4 space-y-4">
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-end justify-between gap-2 mb-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/55 font-semibold">Investing Snapshot</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(combinedTotal)}</p>
          </div>
          <span className="text-xs text-[#9cf4e4] font-semibold">Total Managed</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-white/15 bg-white/5 p-2.5">
            <p className="text-white/55 uppercase tracking-wide">Goal Savings</p>
            <p className="text-sm font-semibold text-white mt-0.5">{formatCurrency(totalSaved)}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 p-2.5">
            <p className="text-white/55 uppercase tracking-wide">Investments</p>
            <p className="text-sm font-semibold text-white mt-0.5">{formatCurrency(totalInvested)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-white">Goals</h3>
          <span className="text-xs text-white/55">{goals.length}</span>
        </div>

        {goals.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-sm text-white/80">No goals yet.</p>
            <p className="text-xs text-white/60 mt-1">Use the add button to create your first savings goal.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onEditGoal={onEditGoal} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold text-white">Investments</h3>
          <span className="text-xs text-white/55">{investments.length}</span>
        </div>

        {investments.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-sm text-white/80">No investments yet.</p>
            <p className="text-xs text-white/60 mt-1">Use the add button to add your first investment.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {investments.map((item) => (
              <article key={item.id} className="glass-card rounded-2xl p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    <p className="text-xs text-white/65">{item.category}</p>
                    <p className="text-[11px] text-white/45 mt-1">{item.date}</p>
                  </div>
                  <p className="text-sm font-bold text-[#9cf4e4]">{formatCurrency(item.amount)}</p>
                </div>
                {item.note && <p className="text-xs text-white/65 mt-2 truncate">{item.note}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
