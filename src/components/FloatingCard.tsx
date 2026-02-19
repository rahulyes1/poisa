import { useCurrency } from "./shared/useCurrency";

interface FloatingCardProps {
  label: string;
  amount: number;
  buttonLabel: string;
  icon: string;
  onAction: () => void;
}

export default function FloatingCard({ label, amount, buttonLabel, icon, onAction }: FloatingCardProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+76px)] right-4 z-40 pointer-events-none">
      <div className="sm:hidden pointer-events-auto">
        <button
          type="button"
          onClick={onAction}
          className="size-14 rounded-full border border-white/25 bg-[#00C9A7] text-[#032720] shadow-[0_10px_24px_rgba(0,201,167,0.35)] flex items-center justify-center"
          title={buttonLabel}
        >
          <span className="material-symbols-outlined text-[28px]">{icon}</span>
        </button>
      </div>

      <div className="hidden sm:flex pointer-events-auto glass-card rounded-2xl p-3 min-w-[280px] items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-white/65 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-lg font-bold text-[#f0f0ff]">{formatCurrency(amount)}</p>
        </div>
        <button
          type="button"
          onClick={onAction}
          className="h-10 px-4 rounded-xl bg-[#00C9A7] text-[#032720] text-sm font-semibold shadow-[0_0_18px_rgba(0,201,167,0.3)] flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
          <span>{buttonLabel}</span>
        </button>
      </div>
    </div>
  );
}
