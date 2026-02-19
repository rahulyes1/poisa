"use client";

import { TabKey } from "./shared/types";

interface NavItem {
  id: TabKey;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: "spending", label: "Spending", icon: "receipt_long" },
  { id: "investing", label: "Investing", icon: "savings" },
  { id: "lending", label: "Lending", icon: "handshake" },
  { id: "analytics", label: "Analytics", icon: "bar_chart" },
];

interface BottomNavProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="flex-none bg-[#0a0a0f]/85 backdrop-blur-[24px] border-t border-white/12 px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)] z-40">
      <div className="grid grid-cols-4 items-end gap-1">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className="h-14 flex flex-col items-center justify-center gap-0.5"
            >
              <span
                className={`material-symbols-outlined text-[21px] leading-none transition-colors ${
                  isActive ? "text-[#00C9A7]" : "text-white/50"
                }`}
              >
                {item.icon}
              </span>
              <span className={`text-[10px] leading-none tracking-wide ${isActive ? "text-[#99f5e4] font-semibold" : "text-white/45"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
