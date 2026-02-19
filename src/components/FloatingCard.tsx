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
      <div className="glass-card flex justify-between items-center p-4 rounded-2xl pointer-events-auto">
        <div>
          <p className="text-xs text-white/65 font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="text-xl font-bold text-[#f0f0ff]">{formatCurrency(amount)}</p>
        </div>
        <button
          type="button"
          onClick={onAction}
          className="bg-[#7000FF] hover:bg-[#7000FF]/90 text-white rounded-2xl h-12 px-6 font-bold shadow-[0_0_20px_rgba(112,0,255,0.45)] flex items-center gap-2 transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined">{icon}</span>
          <span>{buttonLabel}</span>
        </button>
      </div>
    </div>
  );
}

