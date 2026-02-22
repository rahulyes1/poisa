"use client";

import { forwardRef, InputHTMLAttributes } from "react";

type Accent = "teal" | "blue" | "purple" | "orange";

interface AmountDisplayInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  accent?: Accent;
  large?: boolean;
  invalid?: boolean;
}

const accentByType: Record<Accent, string> = {
  teal: "text-[#00e5a0] border-[#2d333b] focus-within:border-[#00e5a0]",
  blue: "text-[#4d9fff] border-[#2d333b] focus-within:border-[#4d9fff]",
  purple: "text-[#a77bff] border-[#2d333b] focus-within:border-[#a77bff]",
  orange: "text-[#ff7b35] border-[#2d333b] focus-within:border-[#ff7b35]",
};

const AmountDisplayInput = forwardRef<HTMLInputElement, AmountDisplayInputProps>(function AmountDisplayInput(
  { accent = "teal", large = false, invalid = false, className = "", ...props },
  ref,
) {
  const sizeClass = large ? "h-20 text-5xl" : "h-16 text-3xl";
  const invalidClass = invalid ? "border-[#ff7b35] shadow-[0_0_0_2px_rgba(255,123,53,0.12)]" : accentByType[accent];

  return (
    <div
      className={`w-full rounded-2xl border bg-[#161b22] px-4 flex items-center gap-2 transition ${sizeClass} ${invalidClass} ${className}`}
    >
      <span className="font-poisa-amount text-[#cfd8e3] select-none">₹</span>
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        className="w-full bg-transparent border-0 outline-none font-poisa-amount placeholder:text-[#7d8590] text-inherit"
        {...props}
      />
    </div>
  );
});

export default AmountDisplayInput;
