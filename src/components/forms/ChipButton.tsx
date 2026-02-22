"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

type Accent = "teal" | "blue" | "purple" | "orange";

interface ChipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  dashed?: boolean;
  accent?: Accent;
  compact?: boolean;
  children: ReactNode;
}

const activeClassByAccent: Record<Accent, string> = {
  teal: "border-[#00e5a0] bg-[rgba(0,229,160,0.14)] text-[#00e5a0]",
  blue: "border-[#4d9fff] bg-[rgba(77,159,255,0.14)] text-[#4d9fff]",
  purple: "border-[#a77bff] bg-[rgba(167,123,255,0.14)] text-[#c7b0ff]",
  orange: "border-[#ff7b35] bg-[rgba(255,123,53,0.14)] text-[#ffb082]",
};

export default function ChipButton({
  active = false,
  dashed = false,
  accent = "teal",
  compact = false,
  className = "",
  children,
  ...props
}: ChipButtonProps) {
  const base = compact
    ? "h-8 px-3 text-xs rounded-[999px]"
    : "h-9 px-3.5 text-sm rounded-[999px]";

  const stateClass = active
    ? activeClassByAccent[accent]
    : "border-[#2d333b] bg-[#161b22] text-[#c6d0dc]";

  const dashedClass = dashed ? "border-dashed" : "";

  return (
    <button
      type="button"
      className={`${base} inline-flex items-center justify-center whitespace-nowrap border font-medium active:scale-[0.98] transition ${stateClass} ${dashedClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
