"use client";

import { ReactNode } from "react";

interface ChipScrollerProps {
  children: ReactNode;
  className?: string;
}

export default function ChipScroller({ children, className = "" }: ChipScrollerProps) {
  return (
    <div className={`-mx-1 overflow-x-auto no-scrollbar ${className}`}>
      <div className="px-1 flex items-center gap-2 min-w-max">{children}</div>
    </div>
  );
}
