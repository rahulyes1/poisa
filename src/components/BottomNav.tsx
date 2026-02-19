"use client";

import { TabKey } from "./shared/types";

interface NavItem {
  id: TabKey | "home";
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "spending", label: "Spending", icon: "receipt_long" },
  { id: "savings", label: "Savings", icon: "savings" },
  { id: "lending", label: "Lending", icon: "handshake" },
];

interface BottomNavProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="flex-none bg-white dark:bg-[#15152a] border-t border-slate-100 dark:border-slate-800 px-6 pb-6 pt-3 z-40">
      <div className="flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => item.id !== "home" && setActiveTab(item.id as TabKey)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-slate-400 hover:text-primary dark:hover:text-primary"
              }`}
            >
              {isActive ? (
                <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-xl">
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
