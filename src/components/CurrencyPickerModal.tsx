"use client";

import { CurrencyCode } from "./shared/types";

interface CurrencyOption {
  code: CurrencyCode;
  label: string;
  symbol: string;
}

const currencyOptions: CurrencyOption[] = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "INR", label: "Indian Rupee", symbol: "Rs" },
  { code: "EUR", label: "Euro", symbol: "EUR" },
  { code: "GBP", label: "British Pound", symbol: "GBP" },
  { code: "JPY", label: "Japanese Yen", symbol: "JPY" },
  { code: "AED", label: "UAE Dirham", symbol: "AED" },
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
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-5">
        <h2 className="text-xl font-bold text-[#f0f0ff] mb-1">Choose Your Currency</h2>
        <p className="text-sm text-[#6b7280] mb-4">Select once to start using the app.</p>

        <div className="space-y-2">
          {currencyOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => onSelect(option.code)}
              className="w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#1a1a26] px-4 py-3 text-left hover:border-[rgba(19,19,236,0.5)] transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#f0f0ff]">{option.label}</p>
                <span className="text-sm text-[#6b7280]">
                  {option.code} {option.symbol}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

