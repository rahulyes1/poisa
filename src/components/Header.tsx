"use client";

import { useMemo, useRef, useState } from "react";
import { useFinanceStore } from "./shared/store";
import { CurrencyCode, TabKey } from "./shared/types";
import { getCurrencySymbol, useCurrency } from "./shared/useCurrency";

const titleMap: Record<TabKey, string> = {
  spending: "Spending",
  investing: "Investing",
  lending: "Lending",
  analytics: "Analytics",
  settings: "Settings",
};

const currencyOptions: CurrencyCode[] = ["USD", "INR", "EUR", "GBP", "JPY", "AED"];

interface HeaderProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  spendingQuery: string;
  onSpendingQueryChange: (value: string) => void;
}

const formatMonthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, (monthNumber || 1) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long" });
};

export default function Header({
  activeTab,
  setActiveTab,
  spendingQuery,
  onSpendingQueryChange,
}: HeaderProps) {
  const { currency, currencySymbol } = useCurrency();
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setSelectedMonth = useFinanceStore((state) => state.setSelectedMonth);
  const setCurrency = useFinanceStore((state) => state.setCurrency);

  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const monthInputRef = useRef<HTMLInputElement>(null);

  const monthLabel = useMemo(() => formatMonthLabel(selectedMonth), [selectedMonth]);

  const onMonthSelected = (month: string) => {
    if (!month) {
      return;
    }
    const currentMonth = new Date().toISOString().slice(0, 7);
    const nextMode = month === currentMonth ? "auto" : "manual";
    setSelectedMonth(month, nextMode);
  };

  const openMonthPicker = () => {
    const monthInput = monthInputRef.current;
    if (!monthInput) {
      return;
    }

    const pickerInput = monthInput as HTMLInputElement & { showPicker?: () => void };
    if (typeof pickerInput.showPicker === "function") {
      pickerInput.showPicker();
      return;
    }

    monthInput.focus();
    monthInput.click();
  };

  return (
    <header className="flex-none px-3 pt-[calc(env(safe-area-inset-top)+6px)] pb-1.5 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-[22px] z-30">
      <div className="flex items-center justify-between h-7">
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold">{titleMap[activeTab]}</p>
          {activeTab === "spending" && (
            <button
              type="button"
              onClick={() => setShowSearch((value) => !value)}
              className="h-6 w-6 rounded-full border border-white/20 bg-white/[0.08] text-white/80 inline-flex items-center justify-center"
              title="Search transactions"
            >
              <span className="material-symbols-outlined text-[14px]">search</span>
            </button>
          )}
        </div>

        <div className="relative flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowCurrencyMenu((value) => !value)}
            className="h-6 min-w-8 px-1.5 rounded-full border border-white/20 bg-white/[0.08] text-[10px] font-semibold text-white"
          >
            {currencySymbol}
          </button>

          {showCurrencyMenu && (
            <div className="absolute right-8 top-8 w-32 rounded-xl border border-white/20 bg-[#0f1b20]/95 backdrop-blur-[22px] shadow-[0_16px_34px_rgba(0,0,0,0.45)] overflow-hidden z-20">
              {currencyOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setCurrency(option);
                    setShowCurrencyMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-semibold transition-colors ${
                    currency === option ? "bg-[#00C9A7]/26 text-[#ccfff3]" : "text-white/90 hover:bg-white/[0.08]"
                  }`}
                >
                  {getCurrencySymbol(option)} {option}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`h-6 w-6 rounded-full border transition-colors ${
              activeTab === "settings"
                ? "border-[#00C9A7]/70 bg-[#00C9A7]/20 text-[#bbfff0]"
                : "border-white/20 bg-white/[0.08] text-white/80"
            }`}
            title="Settings"
          >
            <span className="material-symbols-outlined text-[13px] leading-none">settings</span>
          </button>
        </div>
      </div>

      {activeTab === "spending" && showSearch && (
        <div className="pt-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-white/55 text-[15px]">search</span>
            <input
              type="text"
              value={spendingQuery}
              onChange={(event) => onSpendingQueryChange(event.target.value)}
              placeholder="Search transactions..."
              className="glass-input w-full h-8 pl-8 pr-3 text-xs text-[#f0f0ff]"
            />
          </div>
        </div>
      )}

      <div className="pt-1.5 pb-0.5 flex items-center justify-center">
        <div
          className="relative h-8 min-w-36 px-5 rounded-xl border border-white/25 bg-white/[0.08] backdrop-blur-[18px] inline-flex items-center justify-center shadow-[0_1px_0_rgba(255,255,255,0.15)] cursor-pointer"
          onClick={openMonthPicker}
        >
          <span className="text-base font-semibold text-white/92">{monthLabel}</span>
          <input
            ref={monthInputRef}
            type="month"
            value={selectedMonth}
            onChange={(event) => onMonthSelected(event.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="Select month"
          />
        </div>
      </div>
    </header>
  );
}
