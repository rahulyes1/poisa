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
      {/* Mobile FAB */}
      <div className="sm:hidden pointer-events-auto">
        <button
          type="button"
          onClick={onAction}
          className="size-14 rounded-full border border-[#4F46E5]/40 bg-[#4F46E5] text-white shadow-[0_10px_24px_rgba(79,70,229,0.40)] flex items-center justify-center active:scale-90 transition-transform"
          title={buttonLabel}
        >
          <span className="material-symbols-outlined text-[28px]">{icon}</span>
        </button>
      </div>

      {/* Desktop card */}
      <div className="hidden sm:flex pointer-events-auto glass-card rounded-2xl p-5 min-w-[280px] items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-widest">{label}</p>
          <p
            className="font-extrabold text-[#F1F5F9] leading-tight"
            style={{ fontSize: "2.5rem" }}
          >
            {formatCurrency(amount)}
          </p>
        </div>
        <button
          type="button"
          onClick={onAction}
          className="h-10 px-4 rounded-xl bg-[#4F46E5] text-white text-sm font-semibold shadow-[0_0_18px_rgba(79,70,229,0.35)] flex items-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
          <span>{buttonLabel}</span>
        </button>
      </div>
    </div>
  );
}
