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
  { id: "analytics", label: "Analytics", icon: "bar_chart" },
  { id: "settings", label: "Settings", icon: "settings" },
];

interface BottomNavProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="flex-none bg-[#0a0a0f] border-t border-[rgba(255,255,255,0.06)] px-6 pb-6 pt-3 z-40">
      <div className="flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? "text-[#1313ec]"
                  : "text-[#3d3d5c] hover:text-[#f0f0ff]"
              }`}
            >
              {isActive ? (
                <div className="bg-[rgba(19,19,236,0.2)] p-1.5 rounded-full">
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

