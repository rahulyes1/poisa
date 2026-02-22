import { useCurrency } from "./shared/useCurrency";

interface FloatingCardProps {
  label: string;
  amount: number;
  buttonLabel: string;
  icon: string;
  onAction: () => void;
  mobileOffsetClass?: string;
}

export default function FloatingCard({
  label,
  amount,
  buttonLabel,
  icon,
  onAction,
  mobileOffsetClass = "bottom-[calc(env(safe-area-inset-bottom)+76px)]",
}: FloatingCardProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div className={`fixed ${mobileOffsetClass} right-4 z-40 pointer-events-none`}>
      {/* Mobile FAB */}
      <div className="sm:hidden pointer-events-auto">
        <button
          type="button"
          onClick={onAction}
          className="poisa-fab poisa-pressable size-14 rounded-full flex items-center justify-center"
          title={buttonLabel}
        >
          <span className={`material-symbols-outlined text-[28px] poisa-fab-icon ${icon === "add" ? "poisa-fab-icon-add" : ""}`}>
            {icon}
          </span>
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
          className="poisa-fab poisa-pressable h-10 px-4 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
        >
          <span className={`material-symbols-outlined text-[18px] poisa-fab-icon ${icon === "add" ? "poisa-fab-icon-add" : ""}`}>{icon}</span>
          <span>{buttonLabel}</span>
        </button>
      </div>
    </div>
  );
}
