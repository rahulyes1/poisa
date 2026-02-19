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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    <article className="bg-[#111118] rounded-2xl border border-[rgba(255,255,255,0.06)] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-4">
      <div className="flex items-start gap-4">
        <div
          className="size-14 rounded-full flex items-center justify-center text-[11px] font-bold text-[#f0f0ff] shrink-0"
          style={{
            background: `conic-gradient(#00C9A7 ${progress}%, rgba(148, 163, 184, 0.25) ${progress}% 100%)`,
          }}
        >
          <div className="size-11 rounded-full bg-[#1a1a26] flex items-center justify-center">{Math.round(progress)}%</div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-semibold text-[#f0f0ff] truncate">{goal.name}</h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEditGoal(goal)}
                className="size-8 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] text-[#6b7280]"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="size-8 rounded-lg border border-[rgba(255,140,66,0.35)] bg-[rgba(255,140,66,0.12)] text-[#FF8C42]"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-[#6b7280] mb-1">{goal.category}</p>

          {isComplete ? (
            <p className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[rgba(0,201,167,0.15)] text-[#00C9A7]">?? Goal reached!</p>
          ) : (
            <p
              className={`text-xs font-medium ${
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

          <p className="text-xs font-medium text-[#6b7280] mt-1">
            {formatCurrency(goal.savedAmount)} of {formatCurrency(goal.targetAmount)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setActionMode("topup");
            setAmountInput("");
          }}
          className="h-8 w-8 rounded-lg bg-[rgba(0,201,167,0.2)] text-[#00C9A7] font-bold"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => {
            setActionMode("withdraw");
            setAmountInput("");
          }}
          className="h-8 w-8 rounded-lg bg-[rgba(255,140,66,0.2)] text-[#FF8C42] font-bold"
        >
          -
        </button>
      </div>

      {actionMode && (
        <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center gap-2">
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            placeholder={actionMode === "topup" ? "Top-up amount" : "Withdraw amount"}
            className="h-9 flex-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#1a1a26] px-3 text-sm text-[#f0f0ff]"
          />
          <button
            type="button"
            onClick={onConfirmAction}
            className="h-9 px-3 rounded-lg bg-[#1313ec] text-white text-sm font-semibold"
          >
            Confirm
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-end gap-2 text-xs">
          <span className="text-[#6b7280] mr-auto">Delete? </span>
          <button
            type="button"
            onClick={() => deleteSavingGoal(goal.id)}
            className="h-7 px-3 rounded-lg bg-[rgba(255,140,66,0.2)] text-[#FF8C42] font-semibold"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(false)}
            className="h-7 px-3 rounded-lg border border-[rgba(255,255,255,0.08)] text-[#6b7280]"
          >
            Cancel
          </button>
        </div>
      )}
    </article>
  );
}

