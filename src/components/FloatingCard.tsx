interface FloatingCardProps {
  label: string;
  amount: string;
  buttonLabel: string;
  icon: string;
  onAction: () => void;
}

export default function FloatingCard({ label, amount, buttonLabel, icon, onAction }: FloatingCardProps) {
  return (
    <div className="absolute bottom-20 left-0 w-full px-5 pointer-events-none z-30">
      <div className="flex justify-between items-center bg-white dark:bg-[#15152a] p-4 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 pointer-events-auto">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{amount}</p>
        </div>
        <button
          type="button"
          onClick={onAction}
          className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-6 font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined">{icon}</span>
          <span>{buttonLabel}</span>
        </button>
      </div>
    </div>
  );
}
