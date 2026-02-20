"use client";

import { TabKey } from "./shared/types";

interface NavItem {
  id: TabKey;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: "spending",  label: "Spending",  icon: "receipt_long" },
  { id: "investing", label: "Investing", icon: "savings" },
  { id: "lending",   label: "Lending",   icon: "handshake" },
  { id: "analytics", label: "Analytics", icon: "bar_chart" },
];

interface BottomNavProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 bg-[#0F172A]/92 backdrop-blur-[24px] border-t border-white/10 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+6px)] z-50">
      <div className="grid grid-cols-4 items-end gap-1">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className="relative h-12 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
            >
              {/* Active pill background */}
              {isActive && (
                <span
                  className="absolute inset-x-1 inset-y-0.5 rounded-xl"
                  style={{ background: "rgba(79, 70, 229, 0.18)", border: "1px solid rgba(79, 70, 229, 0.30)" }}
                />
              )}

              {/* Icon — filled when active, outlined when inactive */}
              <span
                className="material-symbols-outlined text-[20px] leading-none relative z-10 transition-colors"
                style={{
                  color: isActive ? "#818CF8" : "rgba(255,255,255,0.40)",
                  fontVariationSettings: isActive
                    ? "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 20"
                    : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20",
                }}
              >
                {item.icon}
              </span>

              {/* Label */}
              <span
                className="text-[9px] leading-none tracking-wide relative z-10 transition-colors"
                style={{
                  color: isActive ? "#A5B4FC" : "rgba(255,255,255,0.38)",
                  fontWeight: isActive ? 700 : 400,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
