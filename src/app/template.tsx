"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduced = useAppStore((s) => s.reducedMotion);

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 32, duration: 0.22 }}
    >
      {children}
    </motion.div>
  );
}
