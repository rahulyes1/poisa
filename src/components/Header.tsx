"use client";

import { useMemo, useState } from "react";
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
}

const formatMonthLabel = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, (monthNumber || 1) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long" });
};

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { currency, currencySymbol } = useCurrency();
  const selectedMonth = useFinanceStore((state) => state.selectedMonth);
  const setCurrency = useFinanceStore((state) => state.setCurrency);

  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const monthLabel = useMemo(() => formatMonthLabel(selectedMonth), [selectedMonth]);

  return (
    <header className="flex-none px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-2 border-b border-white/10 bg-[#0a0a0f]/75 backdrop-blur-[24px] z-30">
      <div className="flex items-center justify-between h-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/45 font-semibold">{titleMap[activeTab]}</p>

        <div className="relative flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowCurrencyMenu((value) => !value)}
            className="h-7 min-w-9 px-2 rounded-full border border-white/20 bg-white/[0.08] text-[11px] font-semibold text-white"
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
            className={`h-7 w-7 rounded-full border transition-colors ${
              activeTab === "settings"
                ? "border-[#00C9A7]/70 bg-[#00C9A7]/20 text-[#bbfff0]"
                : "border-white/20 bg-white/[0.08] text-white/80"
            }`}
            title="Settings"
          >
            <span className="material-symbols-outlined text-[15px] leading-none">settings</span>
          </button>
        </div>
      </div>

      <div className="pt-2 pb-0.5 flex items-center justify-center">
        <div className="h-9 min-w-44 px-6 rounded-2xl border border-white/30 bg-white/10 backdrop-blur-[20px] inline-flex items-center justify-center shadow-[0_1px_0_rgba(255,255,255,0.15)]">
          <span className="text-lg font-semibold text-white/92">{monthLabel}</span>
        </div>
      </div>
    </header>
  );
}
