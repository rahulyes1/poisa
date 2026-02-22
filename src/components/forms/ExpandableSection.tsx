"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

interface ExpandableSectionProps {
  open: boolean;
  children: ReactNode;
}

export default function ExpandableSection({ open, children }: ExpandableSectionProps) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="pt-3 space-y-3">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
