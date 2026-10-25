"use client";
// components/ButtonFx.tsx — تفاعل الأزرار الأساسية (.btn-primary): بقعة ضوء تتبّع الفأرة (سطح المكتب) + موجة عند اللمس/النقر.
// مستمع واحد مفوَّض على document بلا مكتبة ولا إعادة رسم React؛ التأثير نفسه بـ CSS (app/clean.css) خلف النص فلا يغطيه.
// يحترم تخفيف الحركة (تفضيل النظام وخيار التطبيق والأجهزة الضعيفة) عبر motionAllowed().
import { useEffect } from "react";
import { motionAllowed } from "@/lib/cardFx";

const SEL = ".btn-primary:not(:disabled):not([aria-busy=\"true\"])";
const find = (t: EventTarget | null) => (t instanceof Element ? (t.closest(SEL) as HTMLElement | null) : null);

export default function ButtonFx() {
  useEffect(() => {
    let raf = 0;
    const down = (e: PointerEvent) => {
      const b = find(e.target);
      if (!b || !motionAllowed()) return;
      const r = b.getBoundingClientRect();
      b.style.setProperty("--rx", `${e.clientX - r.left}px`);
      b.style.setProperty("--ry", `${e.clientY - r.top}px`);
      b.classList.remove("fx-rip");
      void b.offsetWidth; // يعيد تشغيل الحركة عند النقر المتكرر
      b.classList.add("fx-rip");
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const b = find(e.target);
      if (!b) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--sx", `${e.clientX - r.left}px`);
        b.style.setProperty("--sy", `${e.clientY - r.top}px`);
      });
    };
    const end = (e: AnimationEvent) => { if (e.target instanceof Element) e.target.classList.remove("fx-rip"); };
    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("animationend", end);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("animationend", end);
    };
  }, []);
  return null;
}
