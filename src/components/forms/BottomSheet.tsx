"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function BottomSheet({ isOpen, title, onClose, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70]">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-[#2d333b] bg-[#161b22] p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#2d333b]" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-[#e6edf3]">{title}</h3>
              <button type="button" onClick={onClose} className="text-[#7d8590]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
