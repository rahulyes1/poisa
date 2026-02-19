"use client";

import { useState } from "react";
import { useFinanceStore } from "./shared/store";
import { CurrencyCode, TabKey } from "./shared/types";
import { getCurrencySymbol, useCurrency } from "./shared/useCurrency";

const titleMap: Record<TabKey, string> = {
  spending: "Expenses",
  savings: "Savings",
  lending: "Lending",
  investment: "Investment",
  settings: "Settings",
};

const currencyOptions: CurrencyCode[] = ["USD", "INR", "EUR", "GBP", "JPY", "AED"];

interface HeaderProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { currency, currencySymbol } = useCurrency();
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const setCurrency = useFinanceStore((state) => state.setCurrency);

  return (
    <header className="flex-none px-5 pt-10 pb-3 border-b border-white/20 bg-white/5 backdrop-blur-[30px]">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#f0f0ff]">{titleMap[activeTab]}</h1>

        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            onClick={() => setShowCurrencyMenu((value) => !value)}
            className="h-8 min-w-12 px-2 rounded-full border border-white/25 bg-white/10 text-xs font-semibold text-[#f0f0ff]"
          >
            {currencySymbol}
          </button>

          {showCurrencyMenu && (
            <div className="absolute right-10 top-10 w-32 rounded-xl border border-white/25 bg-[#0f1123]/90 backdrop-blur-[24px] shadow-[0_18px_40px_rgba(20,10,60,0.45)] overflow-hidden z-20">
              {currencyOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setCurrency(option);
                    setShowCurrencyMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-semibold transition-colors ${
                    currency === option ? "bg-[#7000FF]/70 text-white" : "text-white/90 hover:bg-white/10"
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
            className={`h-8 w-8 rounded-full border text-sm transition-colors ${
              activeTab === "settings"
                ? "border-cyan-300/70 bg-cyan-300/20 text-cyan-100"
                : "border-white/25 bg-white/10 text-[#f0f0ff]"
            }`}
            title="Settings"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
