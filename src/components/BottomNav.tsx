"use client";

import { TabKey } from "./shared/types";

interface NavItem {
  id: TabKey;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: "spending", label: "Spending", icon: "receipt_long" },
  { id: "savings", label: "Savings", icon: "savings" },
  { id: "lending", label: "Lending", icon: "handshake" },
  { id: "investment", label: "Investment", icon: "trending_up" },
];

interface BottomNavProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="flex-none bg-white/10 backdrop-blur-[30px] border-t border-white/20 px-6 pb-6 pt-3 z-40">
      <div className="flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? "text-cyan-200"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {isActive ? (
                <div className="bg-[#7000FF]/35 p-1.5 rounded-full border border-white/20">
                  <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                </div>
              ) : (
                <span className="material-symbols-outlined text-[28px] hover:-translate-y-0.5 transition-transform">
                  {item.icon}
                </span>
              )}
              <span className={`text-[10px] tracking-wide ${isActive ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

