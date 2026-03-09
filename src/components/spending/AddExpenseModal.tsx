"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import AmountDisplayInput from "../forms/AmountDisplayInput";
import BottomSheet from "../forms/BottomSheet";
import ChipButton from "../forms/ChipButton";
import ChipScroller from "../forms/ChipScroller";
import ExpandableSection from "../forms/ExpandableSection";
import { CATEGORY_EMOJIS, EXPENSE_CATEGORIES, EXPENSE_QUICK_AMOUNTS } from "../forms/data/formData";
import { addDays, formatInr, toNumber, today } from "../forms/formUtils";
import { useFinanceStore } from "../shared/store";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DateMode = "today" | "yesterday" | "pick";

const dateModeLabel: Record<DateMode, string> = {
  today: "Today",
  yesterday: "Yesterday",
  pick: "📅 Pick date",
};

const fallbackIcon = "receipt_long";

const defaultIconByCategory = EXPENSE_CATEGORIES.reduce<Record<string, string>>((acc, item) => {
  acc[item.label] = item.icon;
  return acc;
}, {});

const getDateByMode = (mode: DateMode, pickedDate: string) => {
  if (mode === "today") return today();
  if (mode === "yesterday") return addDays(today(), -1);
  return pickedDate || today();
};

export default function AddExpenseModal({ isOpen, onClose }: AddExpenseModalProps) {
  const addExpense = useFinanceStore((state) => state.addExpense);
  const addLoan = useFinanceStore((state) => state.addLoan);
  const expenses = useFinanceStore((state) => state.expenses);
  const loans = useFinanceStore((state) => state.loans);

  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const [dateMode, setDateMode] = useState<DateMode>("today");
  const [pickedDate, setPickedDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitContactQuery, setSplitContactQuery] = useState("");
  const [splitContact, setSplitContact] = useState("");
  const [showAmountError, setShowAmountError] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [customCategoryEmoji, setCustomCategoryEmoji] = useState("🍔");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategories, setCustomCategories] = useState<Array<{ label: string; emoji: string }>>([]);

  const existingCategories = useMemo(
    () =>
      Array.from(new Set(expenses.map((expense) => expense.category)))
        .filter(Boolean)
        .filter((category) => !EXPENSE_CATEGORIES.some((item) => item.label === category))
        .map((label) => ({ label, emoji: "🏷️" })),
    [expenses],
  );

  const categoryOptions = useMemo(
    () => [...EXPENSE_CATEGORIES.map((item) => ({ label: item.label, emoji: item.emoji })), ...existingCategories, ...customCategories],
    [customCategories, existingCategories],
  );

  const recentContacts = useMemo(() => {
    const names = loans.map((loan) => loan.personName.trim()).filter(Boolean);
    return Array.from(new Set(names)).slice(0, 8);
  }, [loans]);

  const filteredContacts = useMemo(() => {
    const query = splitContactQuery.trim().toLowerCase();
    if (!query) return recentContacts;
    return recentContacts.filter((name) => name.toLowerCase().includes(query));
  }, [recentContacts, splitContactQuery]);

  const parsedAmount = toNumber(amount);
  const categoryLabel = selectedCategory || "Category";
  const headerAddLabel = parsedAmount > 0 ? `Add ${formatInr(parsedAmount)}` : "Add";
  const submitLabel =
    parsedAmount > 0
      ? `Add ${formatInr(parsedAmount)} · ${categoryLabel}`
      : "Add Expense";

  const submitCta = submitLabel;
  const date = getDateByMode(dateMode, pickedDate);

  const resetForm = () => {
    setDateMode("today");
    setPickedDate(today());
    setAmount("");
    setSelectedCategory("Food");
    setNote("");
    setIsMoreOpen(false);
    setIsRecurring(false);
    setSplitEnabled(false);
    setSplitContactQuery("");
    setSplitContact("");
    setShowAmountError(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => amountInputRef.current?.focus(), 60);
  }, [isOpen]);

  const handleQuickAdd = (value: number) => {
    const next = toNumber(amount) + value;
    setAmount(String(next));
    setShowAmountError(false);
    amountInputRef.current?.focus();
  };

  const onSubmit = (event?: FormEvent) => {
    event?.preventDefault();

    if (!parsedAmount || parsedAmount <= 0) {
      setShowAmountError(true);
      amountInputRef.current?.focus();
      return;
    }

    addExpense({
      name: categoryLabel,
      category: categoryLabel,
      amount: parsedAmount,
      date,
      icon: defaultIconByCategory[categoryLabel] ?? fallbackIcon,
      note: note.trim(),
      recurring: isRecurring,
    });

    const splitTarget = splitContact.trim() || splitContactQuery.trim();
    if (splitEnabled && splitTarget) {
      addLoan({
        personName: splitTarget,
        reason: "Expense split",
        amount: Number((parsedAmount * 0.5).toFixed(2)),
        date,
        repaid: false,
        repaidAmount: 0,
      });
    }

    resetForm();
    onClose();
  };

  const addCustomCategory = () => {
    const label = customCategoryName.trim();
    if (!label) return;
    setCustomCategories((prev) => {
      const exists = prev.some((item) => item.label.toLowerCase() === label.toLowerCase());
      if (exists) return prev;
      return [...prev, { label, emoji: customCategoryEmoji }];
    });
    setSelectedCategory(label);
    setCustomCategoryName("");
    setCustomCategoryEmoji("🍔");
    setIsCategorySheetOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="poisa-form-overlay flex items-end sm:items-center justify-center">
      <div className="poisa-form-panel w-full sm:max-w-[440px] h-[100dvh] sm:h-auto sm:max-h-[92dvh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+96px)]">
        <div className="sticky top-0 z-10 bg-[#0d1117] border-b border-[#2d333b] px-4 py-3 flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-[#7d8590]">
            Cancel
          </button>
          <h2 className="text-base font-semibold text-[#e6edf3]">Add Expense</h2>
          <button
            type="button"
            onClick={() => onSubmit()}
            className="text-sm font-semibold text-[#00e5a0]"
          >
            {headerAddLabel}
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-4 pt-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(["today", "yesterday", "pick"] as DateMode[]).map((mode) => (
              <ChipButton
                key={mode}
                active={dateMode === mode}
                accent="teal"
                onClick={() => setDateMode(mode)}
              >
                {dateModeLabel[mode]}
              </ChipButton>
            ))}
          </div>
          {dateMode === "pick" && (
            <input
              type="date"
              value={pickedDate}
              onChange={(event) => setPickedDate(event.target.value)}
              className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#161b22] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#00e5a0]"
            />
          )}

          <AmountDisplayInput
            ref={amountInputRef}
            large
            accent="teal"
            invalid={showAmountError}
            placeholder="0"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value.replace(/[^\d.]/g, ""));
              setShowAmountError(false);
            }}
          />

          <div className="grid grid-cols-5 gap-2">
            {EXPENSE_QUICK_AMOUNTS.map((value) => (
              <ChipButton key={value} compact onClick={() => handleQuickAdd(value)}>
                +{value >= 1000 ? `${value / 1000}K` : value}
              </ChipButton>
            ))}
          </div>

          <div className="space-y-2">
            <ChipScroller>
              {categoryOptions.map((item) => (
                <ChipButton
                  key={item.label}
                  active={selectedCategory === item.label}
                  accent="teal"
                  onClick={() => setSelectedCategory(item.label)}
                >
                  <span className="mr-1">{item.emoji}</span>
                  {item.label}
                </ChipButton>
              ))}
              <ChipButton dashed accent="teal" onClick={() => setIsCategorySheetOpen(true)}>
                ➕ Other
              </ChipButton>
            </ChipScroller>
          </div>

          <label className="poisa-card flex items-center gap-2 h-11 px-3">
            <span className="text-[#7d8590]">📝</span>
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Swiggy lunch, auto to metro, chai tapri..."
              className="w-full bg-transparent border-0 outline-none text-sm text-[#e6edf3] placeholder:text-[#7d8590]"
            />
          </label>

          <button
            type="button"
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className="poisa-dashed-row w-full h-11 px-3 flex items-center justify-between text-sm"
          >
            <span className="text-[#c6d0dc]">{isMoreOpen ? "— Less options" : "＋ More options"}</span>
            <span className="material-symbols-outlined text-[#7d8590]">{isMoreOpen ? "expand_less" : "expand_more"}</span>
          </button>

          <ExpandableSection open={isMoreOpen}>
            <div className="poisa-card p-3 space-y-3">
              <label className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#e6edf3]">🤝 Split with someone</p>
                  <p className="text-xs poisa-muted">Auto-adds to your lending tracker</p>
                </div>
                <input
                  type="checkbox"
                  checked={splitEnabled}
                  onChange={(event) => setSplitEnabled(event.target.checked)}
                  className="size-4 accent-[#00e5a0]"
                />
              </label>

              {splitEnabled && (
                <div className="space-y-2">
                  <ChipScroller>
                    {filteredContacts.map((name) => (
                      <ChipButton
                        key={name}
                        compact
                        active={splitContact === name}
                        accent="teal"
                        onClick={() => {
                          setSplitContact(name);
                          setSplitContactQuery("");
                        }}
                      >
                        {name}
                      </ChipButton>
                    ))}
                  </ChipScroller>
                  <input
                    type="text"
                    value={splitContactQuery}
                    onChange={(event) => {
                      setSplitContactQuery(event.target.value);
                      setSplitContact("");
                    }}
                    placeholder="Search or type contact name"
                    className="w-full h-10 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#00e5a0]"
                  />
                </div>
              )}

              <label className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#e6edf3]">🔁 Recurring monthly</p>
                  <p className="text-xs poisa-muted">Auto-logs same amount every month</p>
                </div>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(event) => setIsRecurring(event.target.checked)}
                  className="size-4 accent-[#00e5a0]"
                />
              </label>
            </div>
          </ExpandableSection>
        </form>

        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+68px)] sm:bottom-6 sm:left-1/2 sm:w-[420px] sm:-translate-x-1/2 px-4 z-[65]">
          <button
            type="button"
            onClick={() => onSubmit()}
            className="w-full h-12 rounded-2xl bg-[#00e5a0] text-[#062a1f] font-semibold shadow-[0_10px_24px_rgba(0,229,160,0.25)]"
          >
            {submitCta}
          </button>
        </div>
      </div>

      <BottomSheet isOpen={isCategorySheetOpen} onClose={() => setIsCategorySheetOpen(false)} title="Custom Category">
        <div className="space-y-3">
          <ChipScroller>
            {CATEGORY_EMOJIS.map((emoji) => (
              <ChipButton
                key={emoji}
                compact
                active={customCategoryEmoji === emoji}
                accent="teal"
                onClick={() => setCustomCategoryEmoji(emoji)}
              >
                {emoji}
              </ChipButton>
            ))}
          </ChipScroller>
          <input
            type="text"
            value={customCategoryName}
            onChange={(event) => setCustomCategoryName(event.target.value)}
            placeholder="Category name"
            className="w-full h-11 rounded-xl border border-[#2d333b] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none focus:border-[#00e5a0]"
          />
          <button
            type="button"
            onClick={addCustomCategory}
            className="w-full h-11 rounded-xl bg-[#00e5a0] text-[#062a1f] font-semibold"
          >
            Add Category
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
