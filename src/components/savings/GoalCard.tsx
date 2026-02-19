"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { SavingGoal } from "../shared/types";
import { useFinanceStore } from "../shared/store";
import { useCurrency } from "../shared/useCurrency";

interface GoalCardProps {
  goal: SavingGoal;
  onEditGoal: (goal: SavingGoal) => void;
}

const getDaysUntil = (deadline: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetRaw = new Date(`${deadline}T00:00:00`);
  const target = new Date(targetRaw.getFullYear(), targetRaw.getMonth(), targetRaw.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((target.getTime() - today.getTime()) / msPerDay);
};

export default function GoalCard({ goal, onEditGoal }: GoalCardProps) {
  const { formatCurrency } = useCurrency();
  const deleteSavingGoal = useFinanceStore((state) => state.deleteSavingGoal);
  const topUpGoal = useFinanceStore((state) => state.topUpGoal);
  const withdrawFromGoal = useFinanceStore((state) => state.withdrawFromGoal);

  const [actionMode, setActionMode] = useState<"topup" | "withdraw" | null>(null);
  const [amountInput, setAmountInput] = useState("");

  const progress = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;
  const isComplete = progress >= 100;
  const daysLeft = useMemo(() => getDaysUntil(goal.date), [goal.date]);

  const hasCelebratedRef = useRef(isComplete);

  useEffect(() => {
    if (isComplete && !hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.65 },
      });
    }
  }, [isComplete]);

  const onConfirmAction = () => {
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount <= 0 || !actionMode) {
      return;
    }

    if (actionMode === "topup") {
      topUpGoal(goal.id, amount);
    } else {
      withdrawFromGoal(goal.id, amount);
    }

    setAmountInput("");
    setActionMode(null);
  };

  return (
    <article className="bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#f0f0ff] truncate">{goal.name}</h3>
          <p className="text-[11px] text-[#6b7280] truncate">{goal.category}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEditGoal(goal)}
            className="size-7 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] text-[#6b7280]"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
          </button>
          <button
            type="button"
            onClick={() => deleteSavingGoal(goal.id)}
            className="size-7 rounded-lg border border-[rgba(255,140,66,0.35)] bg-[rgba(255,140,66,0.12)] text-[#FF8C42]"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="size-12 rounded-full flex items-center justify-center text-[10px] font-bold text-[#f0f0ff] shrink-0"
          style={{
            background: `conic-gradient(#00C9A7 ${progress}%, rgba(148, 163, 184, 0.25) ${progress}% 100%)`,
          }}
        >
          <div className="size-9 rounded-full bg-[#1a1a26] flex items-center justify-center">{Math.round(progress)}%</div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#f0f0ff]">
            {formatCurrency(goal.savedAmount)} / {formatCurrency(goal.targetAmount)}
          </p>
          {isComplete ? (
            <p className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(0,201,167,0.15)] text-[#00C9A7]">
              Goal reached!
            </p>
          ) : (
            <p
              className={`text-[10px] font-medium mt-1 ${
                daysLeft > 7
                  ? "text-[#6b7280]"
                  : daysLeft >= 3
                    ? "text-[#FF8C42]"
                    : daysLeft >= 0
                      ? "text-red-400"
                      : "text-red-500"
              }`}
            >
              {daysLeft < 0 ? "Deadline passed" : `${daysLeft} days left`}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            setActionMode("topup");
            setAmountInput("");
          }}
          className="h-7 px-2 rounded-lg bg-[rgba(0,201,167,0.2)] text-[#00C9A7] text-[11px] font-semibold"
        >
          + Top-up
        </button>
        <button
          type="button"
          onClick={() => {
            setActionMode("withdraw");
            setAmountInput("");
          }}
          className="h-7 px-2 rounded-lg bg-[rgba(255,140,66,0.2)] text-[#FF8C42] text-[11px] font-semibold"
        >
          - Withdraw
        </button>
      </div>

      {actionMode && (
        <div className="mt-2.5 pt-2.5 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            placeholder={actionMode === "topup" ? "Top-up amount" : "Withdraw amount"}
            className="h-8 flex-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 text-xs text-[#f0f0ff]"
          />
          <button
            type="button"
            onClick={onConfirmAction}
            className="h-8 px-3 rounded-lg bg-[#00C9A7] text-white text-xs font-semibold"
          >
            Confirm
          </button>
        </div>
      )}
    </article>
  );
}

