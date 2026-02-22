"use client";

import { FormEvent, useMemo, useState } from "react";
import AmountDisplayInput from "../forms/AmountDisplayInput";
import ChipButton from "../forms/ChipButton";
import ChipScroller from "../forms/ChipScroller";
import ExpandableSection from "../forms/ExpandableSection";
import { CONTACT_CHIP_COLORS, LENDING_QUICK_AMOUNTS, RETURN_WINDOW_OPTIONS } from "../forms/data/formData";
import { addDays, formatInr, initialsFromName, toNumber, today } from "../forms/formUtils";
import { useFinanceStore } from "../shared/store";

interface AddLendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const toDueDateFromWindow = (windowLabel: (typeof RETURN_WINDOW_OPTIONS)[number]) => {
  if (windowLabel === "1 week") return addDays(today(), 7);
  if (windowLabel === "1 month") return addDays(today(), 30);
  if (windowLabel === "3 months") return addDays(today(), 90);
  return undefined;
};

export default function AddLendModal({ isOpen, onClose }: AddLendModalProps) {
  const addLoan = useFinanceStore((state) => state.addLoan);
  const loans = useFinanceStore((state) => state.loans);

  const [selectedContact, setSelectedContact] = useState("");
  const [newContactMode, setNewContactMode] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [manualContact, setManualContact] = useState("");
  const [amount, setAmount] = useState("");
  const [expectBackIn, setExpectBackIn] = useState<(typeof RETURN_WINDOW_OPTIONS)[number]>("1 month");
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [exactReturnDate, setExactReturnDate] = useState("");
  const [remindMe, setRemindMe] = useState(false);

  const recentContacts = useMemo(
    () => Array.from(new Set(loans.map((loan) => loan.personName.trim()).filter(Boolean))).slice(0, 10),
    [loans],
  );
  const contactOptions = useMemo(() => {
    const all = [...recentContacts];
    if (selectedContact && !all.includes(selectedContact)) {
      all.unshift(selectedContact);
    }
    return all;
  }, [recentContacts, selectedContact]);

  const amountValue = toNumber(amount);
  const interestValue = toNumber(interestRate);
  const totalCollect = amountValue > 0 && interestValue > 0 ? amountValue + (amountValue * interestValue) / 100 : 0;

  const resolvedContact = selectedContact || manualContact.trim();
  const submitLabel =
    amountValue > 0 && resolvedContact
      ? `Record ${formatInr(amountValue)} lent to ${resolvedContact}`
      : "Record Lent";

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
    const finalName = resolvedContact.trim();
    const parsedAmount = toNumber(amount);
    if (!finalName || parsedAmount <= 0) {
      return;
    }

    addLoan({
      personName: finalName,
      reason: purpose.trim() || "Loan",
      amount: parsedAmount,
      date: today(),
      dueDate: exactReturnDate || toDueDateFromWindow(expectBackIn),
      repaid: false,
      repaidAmount: 0,
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
          <h2 className="text-base font-semibold text-[#e6edf3]">Money I Lent</h2>
          <span className="w-10" />
        </div>

        <form onSubmit={onSubmit} className="px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+20px)] space-y-4">
          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">To whom?</p>
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
                      ? "border-[#a77bff] bg-[rgba(167,123,255,0.16)] text-[#d9c8ff]"
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
              <ChipButton dashed accent="purple" compact onClick={() => setNewContactMode(true)}>
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
                  className="flex-1 h-10 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#a77bff]"
                  autoFocus
                />
                <button type="button" onClick={confirmNewContact} className="h-10 px-3 rounded-xl bg-[#a77bff] text-[#130a22] text-sm font-semibold">
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
              className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#a77bff]"
            />
          </section>

          <section className="space-y-2">
            <AmountDisplayInput
              accent="purple"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
              placeholder="0"
            />
            <div className="grid grid-cols-5 gap-2">
              {LENDING_QUICK_AMOUNTS.map((value) => (
                <ChipButton key={value} compact accent="purple" onClick={() => setAmount(String(toNumber(amount) + value))}>
                  +{value >= 1000 ? `${value / 1000}K` : value}
                </ChipButton>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">Expect back in</p>
            <div className="grid grid-cols-4 gap-2">
              {RETURN_WINDOW_OPTIONS.map((option) => (
                <ChipButton
                  key={option}
                  compact
                  accent="purple"
                  active={expectBackIn === option}
                  onClick={() => setExpectBackIn(option)}
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
                  placeholder="Dinner, trip, emergency..."
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#a77bff]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Interest %</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={interestRate}
                  onChange={(event) => setInterestRate(event.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0 — leave empty for no interest"
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#a77bff]"
                />
              </label>
              {totalCollect > 0 && <p className="text-xs text-[#a88de6]">Total to collect: {formatInr(totalCollect)}</p>}

              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Exact return date</span>
                <input
                  type="date"
                  value={exactReturnDate}
                  onChange={(event) => setExactReturnDate(event.target.value)}
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#a77bff]"
                />
              </label>

              <label className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#e6edf3]">🔔 Remind me</p>
                  <p className="text-xs poisa-muted">Notify when return date is near</p>
                </div>
                <input
                  type="checkbox"
                  checked={remindMe}
                  onChange={(event) => setRemindMe(event.target.checked)}
                  className="size-4 accent-[#a77bff]"
                />
              </label>
            </div>
          </ExpandableSection>

          <button type="submit" className="w-full h-12 rounded-xl bg-[#a77bff] text-[#130a22] font-semibold">
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
