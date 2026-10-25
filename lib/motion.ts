"use client";
// lib/motion.ts — هل الحركة معطّلة؟ (تفضيل النظام أو خيار «تخفيف الحركة» داخل التطبيق)
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export function useNoMotion() {
  const os = useReducedMotion();
  const [app, setApp] = useState(false);
  useEffect(() => {
    const read = () => setApp(localStorage.getItem("khiyal:reduce") === "1");
    read();
    window.addEventListener("khiyal:reduce", read);
    return () => window.removeEventListener("khiyal:reduce", read);
  }, []);
  return !!os || app;
}
