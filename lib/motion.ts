"use client";
// lib/motion.ts — هل الحركة معطّلة؟ (تفضيل النظام أو خيار «تخفيف الحركة» داخل التطبيق) + اهتزاز خفيف + عدّاد تصاعدي قصير
import { useEffect, useRef, useState } from "react";
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

/** اهتزاز خفيف: يعمل فقط إن دعمه الجهاز وكان مفتاح «الاهتزاز» في الإعدادات مفعّلاً. */
export function haptic(ms = 10) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    if (localStorage.getItem("khiyal:haptics") === "0") return;
  } catch {}
  navigator.vibrate(ms);
}

/** عدّاد تصاعدي عند أول ظهور (400ms افتراضاً) — يتخطّاه عند تخفيف الحركة، ويكتمل فوراً لأي تغيير لاحق. */
export function useCountUp(target: number, ms = 400) {
  const off = useNoMotion();
  const [value, setValue] = useState(target);
  const played = useRef(false);
  useEffect(() => {
    if (off || played.current || target === 0) { setValue(target); return; }
    played.current = true;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const u = Math.min(1, (t - start) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - u, 3))));
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, off]);
  return value;
}
