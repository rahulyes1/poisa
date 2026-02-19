"use client";

import { Loan } from "../shared/types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

interface PersonCardProps {
  loan: Loan;
  onTogglePaid: (id: string) => void;
}

export default function PersonCard({ loan, onTogglePaid }: PersonCardProps) {
  const initials = loan.personName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <article className="flex items-center gap-4 py-2">
      <div className="size-12 rounded-2xl bg-vibrant-purple/10 dark:bg-vibrant-purple/20 flex items-center justify-center shrink-0 text-vibrant-purple">
        <span className="text-lg font-bold">{initials || "?"}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h4 className="font-semibold text-slate-900 dark:text-white truncate">{loan.personName}</h4>
          <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(loan.amount)}</span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{loan.reason}</p>
          <button
            type="button"
            onClick={() => onTogglePaid(loan.id)}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
              loan.repaid
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                : "bg-vibrant-orange/10 dark:bg-vibrant-orange/20 text-vibrant-orange"
            }`}
          >
            {loan.repaid ? "Paid" : "Pending"}
          </button>
        </div>
      </div>
    </article>
  );
}
