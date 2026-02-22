"use client";

import { FormEvent, useMemo, useState } from "react";
import ChipButton from "../forms/ChipButton";
import ChipScroller from "../forms/ChipScroller";
import ExpandableSection from "../forms/ExpandableSection";
import { LOAN_CATEGORIES, LOAN_LENDER_PLACEHOLDERS, LOAN_TYPE_BY_CATEGORY, LoanCategoryLabel } from "../forms/data/formData";
import { formatInr, today, toNumber } from "../forms/formUtils";
import { useFinanceStore } from "../shared/store";
import { PersonalLoanType } from "../shared/types";

interface AddPersonalLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mapLabelToLoanType = (label: string): PersonalLoanType => {
  const value = label.toLowerCase();
  if (value.includes("home")) return "home";
  if (value.includes("car")) return "car";
  if (value.includes("personal")) return "personal";
  if (value.includes("education")) return "education";
  if (value.includes("business")) return "business";
  if (value.includes("credit card") || value.includes("card")) return "credit_card";
  return "other";
};

export default function AddPersonalLoanModal({ isOpen, onClose }: AddPersonalLoanModalProps) {
  const addPersonalLoan = useFinanceStore((state) => state.addPersonalLoan);

  const [loanCategory, setLoanCategory] = useState<LoanCategoryLabel>("Bank");
  const [selectedLoanTypeLabel, setSelectedLoanTypeLabel] = useState("Personal Loan");
  const [lenderName, setLenderName] = useState("");
  const [emiAmount, setEmiAmount] = useState("");
  const [emiDueDay, setEmiDueDay] = useState<number | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [totalLoanAmount, setTotalLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenureValue, setTenureValue] = useState("");
  const [tenureUnit, setTenureUnit] = useState<"months" | "years">("months");
  const [startDate, setStartDate] = useState(today());
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderLeadDays, setReminderLeadDays] = useState<"1 day" | "3 days" | "7 days">("3 days");
  const [notes, setNotes] = useState("");

  const emiValue = toNumber(emiAmount);
  const totalLoanValue = toNumber(totalLoanAmount);
  const tenureNumeric = toNumber(tenureValue);
  const tenureMonths = tenureUnit === "years" ? Math.round(tenureNumeric * 12) : Math.round(tenureNumeric);
  const summaryTotalPayable = emiValue > 0 && tenureMonths > 0 ? emiValue * tenureMonths : 0;
  const summaryInterest = summaryTotalPayable > 0 && totalLoanValue > 0 ? Math.max(summaryTotalPayable - totalLoanValue, 0) : 0;
  const submitLabel =
    emiValue > 0 && lenderName.trim()
      ? `Add ${formatInr(emiValue)} EMI — ${lenderName.trim()}`
      : "Add Loan";

  const loanTypeOptions = LOAN_TYPE_BY_CATEGORY[loanCategory];
  const lenderPlaceholder = LOAN_LENDER_PLACEHOLDERS[loanCategory];

  const derivedLoanType = useMemo(() => mapLabelToLoanType(selectedLoanTypeLabel), [selectedLoanTypeLabel]);
  const customTypeLabel = derivedLoanType === "other" ? selectedLoanTypeLabel : undefined;

  if (!isOpen) return null;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedEmi = toNumber(emiAmount);
    const name = lenderName.trim();
    if (!name || parsedEmi <= 0) {
      return;
    }

    addPersonalLoan({
      lenderName: name,
      loanType: derivedLoanType,
      customTypeLabel,
      startDate: startDate || today(),
      totalLoanAmount: totalLoanValue > 0 ? totalLoanValue : undefined,
      emiAmount: parsedEmi,
      emiDayOfMonth: emiDueDay ?? undefined,
      note: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="poisa-form-overlay flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="poisa-form-panel w-full sm:max-w-[500px] h-[100dvh] sm:h-auto sm:max-h-[92dvh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#2d333b] px-4 py-3 flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-[#7d8590]">
            Cancel
          </button>
          <h2 className="text-base font-semibold text-[#e6edf3]">Add Loan / EMI</h2>
          <span className="w-10" />
        </div>

        <form onSubmit={onSubmit} className="px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+20px)] space-y-4">
          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">From</p>
            <ChipScroller>
              {LOAN_CATEGORIES.map((item) => (
                <ChipButton
                  key={item.label}
                  compact
                  accent="orange"
                  active={loanCategory === item.label}
                  onClick={() => {
                    setLoanCategory(item.label);
                    setSelectedLoanTypeLabel(LOAN_TYPE_BY_CATEGORY[item.label][0] ?? "Other");
                  }}
                >
                  {item.emoji} {item.label}
                </ChipButton>
              ))}
            </ChipScroller>
          </section>

          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">
              Type <span className="poisa-muted text-xs">(optional)</span>
            </p>
            <ChipScroller>
              {loanTypeOptions.map((item) => (
                <ChipButton
                  key={item}
                  compact
                  accent="orange"
                  active={selectedLoanTypeLabel === item}
                  onClick={() => setSelectedLoanTypeLabel(item)}
                >
                  {item}
                </ChipButton>
              ))}
            </ChipScroller>
          </section>

          <label className="block space-y-1">
            <span className="text-sm text-[#e6edf3]">Lender Name</span>
            <input
              type="text"
              value={lenderName}
              onChange={(event) => setLenderName(event.target.value)}
              placeholder={lenderPlaceholder}
              className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
              required
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-[#e6edf3]">EMI Amount (₹)</span>
            <input
              type="text"
              inputMode="decimal"
              value={emiAmount}
              onChange={(event) => setEmiAmount(event.target.value.replace(/[^\d.]/g, ""))}
              placeholder="Monthly EMI you pay"
              className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
              required
            />
          </label>

          <section className="space-y-2">
            <p className="text-sm text-[#e6edf3]">
              Due date <span className="poisa-muted text-xs">(optional)</span>
            </p>
            <ChipScroller>
              {Array.from({ length: 31 }).map((_, index) => {
                const day = index + 1;
                const suffix = day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th";
                return (
                  <ChipButton
                    key={day}
                    compact
                    accent="orange"
                    active={emiDueDay === day}
                    onClick={() => {
                      setEmiDueDay(day);
                      setReminderEnabled(true);
                    }}
                  >
                    {day}
                    {suffix}
                  </ChipButton>
                );
              })}
            </ChipScroller>
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
                <span className="text-xs poisa-muted">Total Loan Amount (₹)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={totalLoanAmount}
                  onChange={(event) => setTotalLoanAmount(event.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="Original loan amount sanctioned"
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Interest Rate %</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={interestRate}
                  onChange={(event) => setInterestRate(event.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="e.g. 12"
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
                />
              </label>

              <div className="space-y-1">
                <span className="text-xs poisa-muted">Tenure</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tenureValue}
                    onChange={(event) => setTenureValue(event.target.value.replace(/[^\d.]/g, ""))}
                    className="flex-1 h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
                  />
                  <ChipButton compact accent="orange" active={tenureUnit === "months"} onClick={() => setTenureUnit("months")}>
                    Months
                  </ChipButton>
                  <ChipButton compact accent="orange" active={tenureUnit === "years"} onClick={() => setTenureUnit("years")}>
                    Years
                  </ChipButton>
                </div>
              </div>

              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
                />
              </label>

              {emiValue > 0 && tenureMonths > 0 && (
                <div className="rounded-xl border border-[rgba(255,123,53,0.4)] bg-[rgba(255,123,53,0.12)] px-3 py-2 text-xs text-[#ffd2b5] space-y-1">
                  <p>Months remaining: {tenureMonths}</p>
                  <p>Total payable: {formatInr(summaryTotalPayable)}</p>
                  <p>Total interest: {formatInr(summaryInterest)}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#e6edf3]">🔔 EMI reminder</p>
                    <p className="text-xs poisa-muted">Notify X days before due date</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(event) => setReminderEnabled(event.target.checked)}
                    className="size-4 accent-[#ff7b35]"
                  />
                </label>
                {reminderEnabled && (
                  <select
                    value={reminderLeadDays}
                    onChange={(event) => setReminderLeadDays(event.target.value as "1 day" | "3 days" | "7 days")}
                    className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
                  >
                    <option value="1 day">1 day before</option>
                    <option value="3 days">3 days before</option>
                    <option value="7 days">7 days before</option>
                  </select>
                )}
              </div>

              <label className="block space-y-1">
                <span className="text-xs poisa-muted">Notes</span>
                <input
                  type="text"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#ff7b35]"
                />
              </label>
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
