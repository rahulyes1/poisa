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
    <div className="absolute bottom-20 left-0 w-full px-5 pointer-events-none z-30">
      <div className="flex justify-between items-center bg-[#111118] p-4 rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)] border-t border-[rgba(255,255,255,0.06)] pointer-events-auto">
        <div>
          <p className="text-xs text-[#4a4a6a] font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="text-xl font-bold text-[#f0f0ff]">{formatCurrency(amount)}</p>
        </div>
        <button
          type="button"
          onClick={onAction}
          className="bg-[#1313ec] hover:bg-[#1313ec]/90 text-white rounded-2xl h-12 px-6 font-bold shadow-[0_0_20px_rgba(19,19,236,0.35)] flex items-center gap-2 transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined">{icon}</span>
          <span>{buttonLabel}</span>
        </button>
      </div>
    </div>
  );
}

