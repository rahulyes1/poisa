"use client";

import { FormEvent, useMemo, useState } from "react";
import AmountDisplayInput from "../forms/AmountDisplayInput";
import ChipButton from "../forms/ChipButton";
import ChipScroller from "../forms/ChipScroller";
import ExpandableSection from "../forms/ExpandableSection";
import { CONTACT_CHIP_COLORS, LENDING_QUICK_AMOUNTS, RETURN_WINDOW_OPTIONS } from "../forms/data/formData";
import { addDays, formatInr, initialsFromName, toNumber, today } from "../forms/formUtils";
import { useFinanceStore } from "../shared/store";

interface AddMoneyTookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BorrowDateMode = "today" | "yesterday" | "pick";

const dateModeLabel: Record<BorrowDateMode, string> = {
  today: "Today",
  yesterday: "Yesterday",
  pick: "📅 Pick date",
};

const resolveBorrowDate = (mode: BorrowDateMode, pickedDate: string) => {
  if (mode === "today") return today();
  if (mode === "yesterday") return addDays(today(), -1);
  return pickedDate || today();
};

const toDueDateFromWindow = (baseDate: string, windowLabel: (typeof RETURN_WINDOW_OPTIONS)[number]) => {
  if (windowLabel === "1 week") return addDays(baseDate, 7);
  if (windowLabel === "1 month") return addDays(baseDate, 30);
  if (windowLabel === "3 months") return addDays(baseDate, 90);
  return undefined;
};

export default function AddMoneyTookModal({ isOpen, onClose }: AddMoneyTookModalProps) {
  const addMoneyTookEntry = useFinanceStore((state) => state.addMoneyTookEntry);
  const moneyTookEntries = useFinanceStore((state) => state.moneyTookEntries);

  const [selectedContact, setSelectedContact] = useState("");
  const [newContactMode, setNewContactMode] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [manualContact, setManualContact] = useState("");
  const [amount, setAmount] = useState("");
  const [borrowDateMode, setBorrowDateMode] = useState<BorrowDateMode>("today");
  const [pickedBorrowDate, setPickedBorrowDate] = useState(today());
  const [payBackBy, setPayBackBy] = useState<(typeof RETURN_WINDOW_OPTIONS)[number]>("1 month");
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [exactRepaymentDate, setExactRepaymentDate] = useState("");
  const [remindBeforeDue, setRemindBeforeDue] = useState(false);
  const [trackPartialRepayment, setTrackPartialRepayment] = useState(false);
  const [paidBackSoFar, setPaidBackSoFar] = useState("");

  const contactOptions = useMemo(
    () => Array.from(new Set(moneyTookEntries.map((entry) => entry.lenderName.trim()).filter(Boolean))).slice(0, 10),
    [moneyTookEntries],
  );

  const amountValue = toNumber(amount);
  const interestValue = toNumber(interestRate);
  const totalRepay = amountValue > 0 && interestValue > 0 ? amountValue + (amountValue * interestValue) / 100 : 0;
  const finalContact = selectedContact || manualContact.trim();
  const submitLabel =
    amountValue > 0 && finalContact
      ? `I owe ${formatInr(amountValue)} to ${finalContact}`
      : "Record Amount Owed";

  const borrowDate = resolveBorrowDate(borrowDateMode, pickedBorrowDate);

  if (!isOpen) return null;

  const confirmNewContact = () => {
    const name = newContactName.trim();
    if (!name) return;
    setSelectedContact(name);
    setManualContact("");
    setNewContactName("");
    setNewContactMode(false);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lenderName = finalContact.trim();
    const parsedAmount = toNumber(amount);
    if (!lenderName || parsedAmount <= 0) {
      return;
    }

    addMoneyTookEntry({
      lenderName,
      amount: parsedAmount,
      dueDate: exactRepaymentDate || toDueDateFromWindow(borrowDate, payBackBy),
      note: purpose.trim() || undefined,
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
          <h2 className="text-base font-semibold text-[#e6edf3]">Money I Owe</h2>
          <span className="w-10" />
        </div>

        <form onSubmit={onSubmit} className="px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+20px)] space-y-4">
          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">Who do you owe?</p>
            <ChipScroller>
              {contactOptions.map((name, index) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setSelectedContact(name);
                    setManualContact("");
                  }}
                  className={`h-9 pl-1 pr-3 rounded-full border inline-flex items-center gap-2 ${
                    selectedContact === name
                      ? "border-[#ff7b35] bg-[rgba(255,123,53,0.16)] text-[#ffd2b5]"
                      : "border-[#2d333b] bg-[#161b22] text-[#c6d0dc]"
                  }`}
                >
                  <span
                    className="size-7 rounded-full inline-flex items-center justify-center text-[11px] font-semibold text-white"
                    style={{ backgroundColor: CONTACT_CHIP_COLORS[index % CONTACT_CHIP_COLORS.length] }}
                  >
                    {initialsFromName(name)}
                  </span>
                  <span className="text-xs">{name}</span>
                </button>
              ))}
              <ChipButton dashed accent="orange" compact onClick={() => setNewContactMode(true)}>
                ➕ New
              </ChipButton>
            </ChipScroller>
            {newContactMode && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newContactName}
                  onChange={(event) => setNewContactName(event.target.value)}
                  placeholder="Type name"
                  className="flex-1 h-10 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
                  autoFocus
                />
                <button type="button" onClick={confirmNewContact} className="h-10 px-3 rounded-xl bg-[#ff7b35] text-[#2b1205] text-sm font-semibold">
                  Add
                </button>
              </div>
            )}
            <input
              type="text"
              value={manualContact}
              onChange={(event) => {
                setManualContact(event.target.value);
                setSelectedContact("");
              }}
              placeholder="Or type contact manually"
              className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
            />
          </section>

          <section className="space-y-2">
            <AmountDisplayInput
              accent="orange"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
            />
            <div className="grid grid-cols-5 gap-2">
              {LENDING_QUICK_AMOUNTS.map((value) => (
                <ChipButton key={value} compact accent="orange" onClick={() => setAmount(String(toNumber(amount) + value))}>
                  +{value >= 1000 ? `${value / 1000}K` : value}
                </ChipButton>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">When?</p>
            <div className="grid grid-cols-3 gap-2">
              {(["today", "yesterday", "pick"] as BorrowDateMode[]).map((mode) => (
                <ChipButton
                  key={mode}
                  compact
                  accent="orange"
                  active={borrowDateMode === mode}
                  onClick={() => setBorrowDateMode(mode)}
                >
                  {dateModeLabel[mode]}
                </ChipButton>
              ))}
            </div>
            {borrowDateMode === "pick" && (
              <input
                type="date"
                value={pickedBorrowDate}
                onChange={(event) => setPickedBorrowDate(event.target.value)}
                className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
              />
            )}
          </section>

          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">Pay back by</p>
            <div className="grid grid-cols-4 gap-2">
              {RETURN_WINDOW_OPTIONS.map((option) => (
                <ChipButton
                  key={option}
                  compact
                  accent="orange"
                  active={payBackBy === option}
                  onClick={() => setPayBackBy(option)}
                >
                  {option}
                </ChipButton>
              ))}
            </div>
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
                <span className="text-xs poisa-muted">What for?</span>
                <input
                  type="text"
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  placeholder="They paid for dinner, lent for emergency..."
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Interest %</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={interestRate}
                  onChange={(event) => setInterestRate(event.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0 — leave empty"
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
                />
              </label>
              {totalRepay > 0 && <p className="text-xs text-[#ffb082]">Total to repay: {formatInr(totalRepay)}</p>}

              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Exact repayment date</span>
                <input
                  type="date"
                  value={exactRepaymentDate}
                  onChange={(event) => {
                    const next = event.target.value;
                    setExactRepaymentDate(next);
                    if (next) setRemindBeforeDue(true);
                  }}
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
                />
              </label>

              <label className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#e6edf3]">🔔 Remind me before due</p>
                  <p className="text-xs poisa-muted">Get notified 3 days before</p>
                </div>
                <input
                  type="checkbox"
                  checked={remindBeforeDue}
                  onChange={(event) => setRemindBeforeDue(event.target.checked)}
                  className="size-4 accent-[#ff7b35]"
                />
              </label>

              <label className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#e6edf3]">Partial repayment tracking</p>
                  <p className="text-xs poisa-muted">Track how much I&apos;ve paid back so far</p>
                </div>
                <input
                  type="checkbox"
                  checked={trackPartialRepayment}
                  onChange={(event) => setTrackPartialRepayment(event.target.checked)}
                  className="size-4 accent-[#ff7b35]"
                />
              </label>

              {trackPartialRepayment && (
                <label className="block space-y-1">
                  <span className="text-xs poisa-muted">Paid back so far (₹)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={paidBackSoFar}
                    onChange={(event) => setPaidBackSoFar(event.target.value.replace(/[^\d.]/g, ""))}
                    className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
                  />
                </label>
              )}
            </div>
          </ExpandableSection>

          <button type="submit" className="w-full h-12 rounded-xl bg-[#ff7b35] text-[#2b1205] font-semibold">
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
