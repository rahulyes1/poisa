"use client";

interface FloatingCalculatorButtonProps {
  visible: boolean;
  onAction: () => void;
  mobileOffsetClass?: string;
  desktopMode?: "inline-with-card" | "floating-small";
}

export default function FloatingCalculatorButton({
  visible,
  onAction,
  mobileOffsetClass = "bottom-[calc(env(safe-area-inset-bottom)+144px)]",
  desktopMode = "floating-small",
}: FloatingCalculatorButtonProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className={`fixed ${mobileOffsetClass} right-4 z-40 pointer-events-none`}>
      <div className="sm:hidden pointer-events-auto">
        <button
          type="button"
          onClick={onAction}
          className="size-14 rounded-full border border-[#00C896]/40 bg-[#00C896] text-[#06221a] shadow-[0_10px_24px_rgba(0,200,150,0.36)] flex items-center justify-center active:scale-90 transition-transform"
          title="Open calculator"
          aria-label="Open calculator"
        >
          <span className="material-symbols-outlined text-[28px]">calculate</span>
        </button>
      </div>

      {desktopMode === "floating-small" && (
        <div className="hidden sm:block pointer-events-auto">
          <button
            type="button"
            onClick={onAction}
            className="size-14 rounded-full border border-[#00C896]/40 bg-[#00C896] text-[#06221a] shadow-[0_10px_24px_rgba(0,200,150,0.30)] flex items-center justify-center active:scale-95 transition-transform"
            title="Open calculator"
            aria-label="Open calculator"
          >
            <span className="material-symbols-outlined text-[24px]">calculate</span>
          </button>
        </div>
      )}

      {desktopMode === "inline-with-card" && (
        <div className="hidden sm:block pointer-events-auto">
          <button
            type="button"
            onClick={onAction}
            className="h-10 px-3 rounded-xl border border-[#00C896]/40 bg-[#00C896] text-[#06221a] text-sm font-semibold shadow-[0_8px_20px_rgba(0,200,150,0.25)] flex items-center gap-1.5 active:scale-95 transition-transform"
            title="Open calculator"
            aria-label="Open calculator"
          >
            <span className="material-symbols-outlined text-[18px]">calculate</span>
            <span>Calc</span>
          </button>
        </div>
      )}
    </div>
  );
}
