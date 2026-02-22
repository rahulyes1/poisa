"use client";

const featureCards = [
  {
    title: "Spending Tracker",
    desc: "Track every expense with budgets, categories, and monthly carry forward.",
    icon: "receipt_long",
  },
  {
    title: "Investing Goals",
    desc: "Manage savings goals, investments, and insurance in one place.",
    icon: "savings",
  },
  {
    title: "Lending + Money I Took",
    desc: "Track money lent and money borrowed with due and repayment updates.",
    icon: "handshake",
  },
  {
    title: "Analytics View",
    desc: "Visualize trends and category insights to understand your money flow.",
    icon: "bar_chart",
  },
  {
    title: "Spending PDF",
    desc: "Download a clean, aligned monthly spending report when you need it.",
    icon: "picture_as_pdf",
  },
  {
    title: "Cloud Sync",
    desc: "Your account data is synced so your setup follows you across devices.",
    icon: "cloud_sync",
  },
];

interface FeaturePosterModalProps {
  isOpen: boolean;
  onSkip: () => void;
  onGetStarted: () => void;
}

export default function FeaturePosterModal({ isOpen, onSkip, onGetStarted }: FeaturePosterModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[rgba(17,17,24,0.96)] p-5 sm:p-6 shadow-[0_24px_48px_rgba(0,0,0,0.45)]">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8FA1B8]">Poisa Features</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Welcome to Your Finance Hub</h2>
          <p className="mt-2 text-sm text-[#A5B4C8]">
            Quick overview of what you can do inside Poisa.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {featureCards.map((item) => (
            <article key={item.title} className="rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#1a1a26] p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="size-8 rounded-xl bg-[rgba(79,70,229,0.24)] text-[#C7D2FE] inline-flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F1F5F9]">{item.title}</h3>
                  <p className="text-[12px] text-[#9CA3AF] mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="h-9 px-3 rounded-xl border border-[rgba(255,255,255,0.14)] bg-white/[0.04] text-xs font-semibold text-[#D1D5DB]"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            className="h-9 px-4 rounded-xl bg-[#4F46E5] text-white text-xs font-semibold"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
