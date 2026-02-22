"use client";

import { CalculatorType } from "./CalculatorModal";

export type CalculatorHubItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
  calculatorType: CalculatorType;
};

const HUB_ITEMS: CalculatorHubItem[] = [
  { id: "burn", icon: "local_fire_department", title: "Burn Rate", description: "Days till budget runs out", calculatorType: "budget_burn" },
  { id: "emi", icon: "bar_chart", title: "EMI", description: "Monthly loan payment", calculatorType: "lending" },
  { id: "sip", icon: "trending_up", title: "SIP", description: "Mutual fund returns", calculatorType: "sip" },
  { id: "goal", icon: "my_location", title: "Goal", description: "Monthly savings needed", calculatorType: "goal" },
  { id: "affordability", icon: "home", title: "Affordability", description: "Max loan you can take", calculatorType: "lending" },
  { id: "tax", icon: "account_balance", title: "Tax", description: "FY 2025-26 tax estimate", calculatorType: "tax" },
  { id: "freedom", icon: "flutter_dash", title: "Freedom", description: "Financial freedom number", calculatorType: "freedom" },
];

interface CalculatorHubProps {
  selectedId?: string;
  onSelect: (item: CalculatorHubItem) => void;
  className?: string;
  title?: string;
}

export default function CalculatorHub({
  selectedId,
  onSelect,
  className = "",
  title = "Calculators",
}: CalculatorHubProps) {
  return (
    <section className={`rounded-2xl border border-[#2A3345] bg-[#161B22] p-4 ${className}`}>
      <h3 className="text-[11px] uppercase tracking-[0.12em] text-[#7A8599] font-semibold">{title}</h3>
      <div className="relative mt-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pr-12">
          {HUB_ITEMS.map((item) => {
            const active = selectedId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className={`snap-start shrink-0 w-[140px] h-[100px] rounded-[14px] border p-2.5 text-left transition-all ${
                  active
                    ? "border-[#00C896] bg-[#1C2230]"
                    : "border-[#2A3345] bg-[#1C2230]"
                }`}
              >
                <span
                  className={`inline-flex size-8 items-center justify-center rounded-lg ${
                    active ? "bg-[rgba(0,200,150,0.1)] text-[#00C896]" : "bg-[#0D1117] text-[#A7B1C2]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                </span>
                <p className="mt-2 text-[12px] font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-[10px] text-[#7A8599] leading-tight">{item.description}</p>
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#161B22] to-transparent" />
      </div>
    </section>
  );
}
