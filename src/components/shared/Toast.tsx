"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface Props {
  message: string;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, visible, onClose, duration = 2500 }: Props) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-[calc(16px+var(--safe-top))] left-1/2 -translate-x-1/2 z-[100] bg-ink text-white text-14 font-medium px-5 py-3 rounded-card max-w-[90vw]"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
