"use client";

import { CurrencyCode } from "./shared/types";

interface CurrencyOption {
  code: CurrencyCode;
  label: string;
  symbol: string;
  flag: string;
}

const currencyOptions: CurrencyOption[] = [
  { code: "USD", label: "US Dollar",       symbol: "$",  flag: "🇺🇸" },
  { code: "INR", label: "Indian Rupee",    symbol: "₹",  flag: "🇮🇳" },
  { code: "EUR", label: "Euro",            symbol: "€",  flag: "🇪🇺" },
  { code: "GBP", label: "British Pound",   symbol: "£",  flag: "🇬🇧" },
  { code: "JPY", label: "Japanese Yen",    symbol: "¥",  flag: "🇯🇵" },
  { code: "AED", label: "UAE Dirham",      symbol: "د.إ", flag: "🇦🇪" },
];

interface CurrencyPickerModalProps {
  isOpen: boolean;
  onSelect: (currency: CurrencyCode) => void;
}

export default function CurrencyPickerModal({ isOpen, onSelect }: CurrencyPickerModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md flex items-center justify-center p-5">
      <div className="w-full max-w-sm glass-card rounded-3xl p-6">
        {/* Header */}
        <div className="text-center mb-5">
          <p className="text-3xl mb-2">💰</p>
          <h2 className="text-xl font-black text-[#F1F5F9]">Choose Currency</h2>
          <p className="text-sm text-[#94A3B8] mt-1">Select your default currency to get started</p>
        </div>

        {/* Currency cards grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {currencyOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => onSelect(option.code)}
              className="group rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-left
                         hover:border-[#00C896]/60 hover:bg-[#00C896]/10
                         active:scale-95 transition-all duration-150"
              style={{ borderRadius: "14px" }}
            >
              <p className="text-2xl mb-1">{option.flag}</p>
              <p
                className="text-2xl font-black leading-none mb-1.5"
                style={{ color: "#00C896" }}
              >
                {option.symbol}
              </p>
              <p className="text-[11px] font-bold text-[#F1F5F9] leading-tight">{option.label}</p>
              <p className="text-[10px] font-semibold text-[#64748B] mt-0.5">{option.code}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
