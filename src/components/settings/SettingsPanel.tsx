"use client";

import ExportButton from "../ExportButton";
import { CurrencyCode } from "../shared/types";
import { useFinanceStore } from "../shared/store";

const options: CurrencyCode[] = ["USD", "INR", "EUR", "GBP", "JPY", "AED"];

export default function SettingsPanel() {
  const currency = useFinanceStore((state) => state.currency);
  const setCurrency = useFinanceStore((state) => state.setCurrency);

  return (
    <section className="px-5 pt-5 pb-4 space-y-4">
      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-4">
        <h3 className="text-sm font-bold text-[#f0f0ff] mb-3">Settings</h3>

        <p className="text-xs font-semibold uppercase tracking-wide text-[#4a4a6a] mb-2">Currency</p>
        <div className="grid grid-cols-3 gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCurrency(option)}
              className={`h-10 rounded-xl text-xs font-semibold border transition-colors ${
                currency === option
                  ? "border-[rgba(0,201,167,0.7)] bg-[#00C9A7] text-white shadow-[0_0_14px_rgba(0,201,167,0.25)]"
                  : "border-[rgba(255,255,255,0.06)] bg-[#1a1a26] text-[#6b7280] hover:border-[rgba(0,201,167,0.5)]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#111118] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] p-4">
        <h4 className="text-sm font-bold text-[#f0f0ff] mb-3">Data</h4>
        <ExportButton />
      </div>
    </section>
  );
}

