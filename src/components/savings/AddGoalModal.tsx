"use client";

import { FormEvent, useMemo, useState } from "react";
import AmountDisplayInput from "../forms/AmountDisplayInput";
import ChipButton from "../forms/ChipButton";
import ChipScroller from "../forms/ChipScroller";
import ExpandableSection from "../forms/ExpandableSection";
import { GOAL_QUICK_AMOUNTS, GOAL_SUGGESTIONS, GOAL_TYPES, GoalTypeLabel } from "../forms/data/formData";
import { formatInr, monthDiff, today, toNumber } from "../forms/formUtils";
import { useFinanceStore } from "../shared/store";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Priority = "high" | "medium" | "low";

const priorityOptions: Array<{ id: Priority; label: string }> = [
  { id: "high", label: "🔴 High" },
  { id: "medium", label: "🟠 Medium" },
  { id: "low", label: "🔵 Low" },
];

export default function AddGoalModal({ isOpen, onClose }: AddGoalModalProps) {
  const addSavingGoal = useFinanceStore((state) => state.addSavingGoal);

  const [goalType, setGoalType] = useState<GoalTypeLabel>("Emergency Fund");
  const [goalName, setGoalName] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [savedAmount, setSavedAmount] = useState("");
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [markEmergency, setMarkEmergency] = useState(true);
  const [notes, setNotes] = useState("");

  const suggestions = GOAL_SUGGESTIONS[goalType];
  const targetValue = toNumber(targetAmount);
  const savedValue = toNumber(savedAmount);
  const progress = targetValue > 0 ? Math.min((savedValue / targetValue) * 100, 100) : 0;

  const selectedGoalTypeMeta = useMemo(
    () => GOAL_TYPES.find((item) => item.label === goalType) ?? GOAL_TYPES[0],
    [goalType],
  );

  const monthlyStrip = useMemo(() => {
    if (!targetDate || targetValue <= 0) return "";
    const remaining = Math.max(targetValue - savedValue, 0);
    const months = monthDiff(today(), targetDate);
    if (months <= 0 || remaining <= 0) return "";
    const perMonth = remaining / months;
    const dateLabel = new Date(`${targetDate}T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    return `Save ${formatInr(perMonth)}/month to reach by ${dateLabel}`;
  }, [savedValue, targetDate, targetValue]);

  if (!isOpen) return null;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedTarget = toNumber(targetAmount);
    const parsedSaved = toNumber(savedAmount);
    const resolvedName = goalName.trim();

    if (!resolvedName || parsedTarget <= 0) {
      return;
    }

    addSavingGoal({
      name: resolvedName,
      category: goalType,
      targetAmount: parsedTarget,
      savedAmount: parsedSaved > 0 ? parsedSaved : 0,
      date: today(),
      icon: selectedGoalTypeMeta.icon,
      isEmergencyFund: goalType === "Emergency Fund" && markEmergency,
    });

    onClose();
  };

  return (
    <div className="poisa-form-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="poisa-form-panel w-full sm:max-w-[480px] h-[100dvh] sm:h-auto sm:max-h-[92dvh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#2d333b] px-4 py-3 flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-[#7d8590]">
            Cancel
          </button>
          <h2 className="text-base font-semibold text-[#e6edf3]">Add Goal</h2>
          <span className="w-10" />
        </div>

        <form onSubmit={onSubmit} className="px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+20px)] space-y-4">
          <section className="space-y-2">
            <p className="text-xs uppercase tracking-wide poisa-muted">Goal Type</p>
            <ChipScroller>
              {GOAL_TYPES.map((item) => (
                <ChipButton
                  key={item.label}
                  compact
                  accent="teal"
                  active={goalType === item.label}
                  onClick={() => {
                    setGoalType(item.label);
                    setGoalName("");
                    setSelectedSuggestion("");
                    setMarkEmergency(item.label === "Emergency Fund");
                  }}
                >
                  {item.emoji} {item.label}
                </ChipButton>
              ))}
            </ChipScroller>
          </section>

          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">Goal Name</p>
            {suggestions.length > 0 && (
              <ChipScroller>
                {suggestions.map((item) => (
                  <ChipButton
                    key={item}
                    compact
                    accent="teal"
                    active={selectedSuggestion === item}
                    onClick={() => {
                      setSelectedSuggestion(item);
                      setGoalName(item);
                    }}
                  >
                    {item}
                  </ChipButton>
                ))}
              </ChipScroller>
            )}
            <input
              type="text"
              value={goalName}
              onChange={(event) => {
                setGoalName(event.target.value);
                if (selectedSuggestion && selectedSuggestion !== event.target.value) {
                  setSelectedSuggestion("");
                }
              }}
              placeholder="Type your goal name"
              className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#00e5a0]"
              required
            />
          </section>

          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">Target Amount (₹)</p>
            <AmountDisplayInput
              accent="teal"
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
            />
            <div className="grid grid-cols-5 gap-2">
              {GOAL_QUICK_AMOUNTS.map((value, index) => {
                const label = ["₹10K", "₹25K", "₹50K", "₹1L", "₹5L"][index];
                return (
                  <ChipButton key={value} compact onClick={() => setTargetAmount(String(toNumber(targetAmount) + value))}>
                    {label}
                  </ChipButton>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">
              Already saved (₹) <span className="poisa-muted text-xs">(optional)</span>
            </p>
            <input
              type="text"
              inputMode="decimal"
              value={savedAmount}
              onChange={(event) => setSavedAmount(event.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0 — leave empty if starting fresh"
              className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#00e5a0]"
            />
            {targetValue > 0 && savedValue > 0 && (
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-[#2d333b] overflow-hidden">
                  <div className="h-full rounded-full bg-[#00e5a0]" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs poisa-muted">{progress.toFixed(1)}% complete</p>
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className="poisa-dashed-row w-full h-11 px-3 flex items-center justify-between text-sm"
          >
            <span className="text-[#c6d0dc]">{isMoreOpen ? "— Less details" : "＋ More details"}</span>
            <span className="material-symbols-outlined text-[#7d8590]">{isMoreOpen ? "expand_less" : "expand_more"}</span>
          </button>

          <ExpandableSection open={isMoreOpen}>
            <div className="poisa-card p-3 space-y-3">
              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Target Date</span>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#00e5a0]"
                />
              </label>
              {monthlyStrip && (
                <div className="rounded-xl border border-[rgba(0,229,160,0.35)] bg-[rgba(0,229,160,0.08)] px-3 py-2 text-xs text-[#86ffd6]">
                  {monthlyStrip}
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs poisa-muted">Priority</p>
                <div className="grid grid-cols-3 gap-2">
                  {priorityOptions.map((item) => (
                    <ChipButton
                      key={item.id}
                      compact
                      accent="teal"
                      active={priority === item.id}
                      onClick={() => setPriority(item.id)}
                    >
                      {item.label}
                    </ChipButton>
                  ))}
                </div>
              </div>

              {goalType === "Emergency Fund" && (
                <label className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#e6edf3]">Mark as Emergency Fund</p>
                    <p className="text-xs poisa-muted">Shows in emergency readiness tracker</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={markEmergency}
                    onChange={(event) => setMarkEmergency(event.target.checked)}
                    className="size-4 accent-[#00e5a0]"
                  />
                </label>
              )}

              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Notes</span>
                <input
                  type="text"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Any notes about this goal"
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#00e5a0]"
                />
              </label>
            </div>
          </ExpandableSection>

          <button type="submit" className="w-full h-12 rounded-xl bg-[#00e5a0] text-[#062a1f] font-semibold">
            Create Goal
          </button>
        </form>
      </div>
    </div>
  );
}
