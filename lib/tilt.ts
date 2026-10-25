"use client";
// lib/tilt.ts — ميل خفيف للبطاقات (حدّ أقصى درجتان) بمؤشر فأرة فقط؛ معطّل على اللمس وعند تخفيف الحركة.
import { useCallback, useEffect, useState } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { motionAllowed } from "@/lib/cardFx";

export function useTilt(max = 2) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const check = () => setOn(mq.matches && motionAllowed());
    check();
    mq.addEventListener?.("change", check);
    window.addEventListener("khiyal:reduce", check);
    return () => { mq.removeEventListener?.("change", check); window.removeEventListener("khiyal:reduce", check); };
  }, []);
  const rx = useMotionValue(0), ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 24, mass: 0.6 });
  const sry = useSpring(ry, { stiffness: 220, damping: 24, mass: 0.6 });
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 2 * max);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 2 * max);
  }, [max, rx, ry]);
  const onPointerLeave = useCallback(() => { rx.set(0); ry.set(0); }, [rx, ry]);
  return on ? { style: { rotateX: srx, rotateY: sry, transformPerspective: 1000 }, onPointerMove, onPointerLeave } : {};
}
