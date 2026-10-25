"use client";
// components/PromptPeekLayer.tsx — طبقة «الاطلالة» على البرومبت فوق الصورة (مكوّن مشترك: بطاقة الرئيسية + معاينة الصورة)
//
// السلوك (متطابق في الموضعين؛ الفرق الوحيد maxVh: 70 للرئيسية، 85 للمعاينة):
//  • لا نص ظاهر وقت الراحة؛ كبسولة «برومبت» أسفل الصورة (تنبض نبضتين ثم تسكن، وتتوقف خارج الشاشة).
//  • الفتح: ضغطة مطوّلة 450ms على الصورة (اهتزاز خفيف ويُلغى النقر التالي) أو النقر على الكبسولة.
//  • عند الفتح: تمويه حيّ للصورة 0→12px مع تعتيم 0→0.35 (rAF بمنحنى iOS، وتدهور لطيف إن بطُؤ الإطار).
//  • الإغلاق: سحب لأسفل فقط والنص في أعلاه (وإلا يمرّر النص) — أو Esc — أو زر مخفي لقارئات الشاشة. لا زر X ولا إغلاق بالنقر خارجاً.
//  • إمكانية الوصول: حبس التركيز داخل الطبقة وإعادته للكبسولة عند الإغلاق.
import { useCallback, useEffect, useRef, useState } from "react";
import { CopyButton } from "./ui";
import { useNoMotion } from "@/lib/motion";

type ActionsFn = (api: { close: () => void }) => React.ReactNode;

export type PromptPeekLayerProps = {
  imageSrc: string;
  imageAlt: string;
  /** النص المعروض (قد يكون مقتطعاً حسب مستوى المستخدم) */
  promptText: string;
  /** أقصى ارتفاع للطبقة كنسبة من الشاشة: 70 للرئيسية، 85 للمعاينة */
  maxVh?: 70 | 85;
  title?: string | null;
  tags?: string[] | null;
  /** النص الذي يخرج عند زر النسخ، و onCopy لتنفيذ النسخ المعتاد في الشاشة (نسخ + عدّاد + إشعار) */
  copyText: string;
  onCopy?: () => void | Promise<void>;
  /** عناصر إضافية بجانب زر النسخ (مثل تبديل الأصلي/المحسّن) */
  topExtra?: React.ReactNode;
  /** ملاحظة القفل / كشف النص الكامل */
  lockNote?: React.ReactNode;
  /** أزرار الأفعال المنقولة من البطاقة (عبّئ المتغيرات، جرّبه أو حسّنه، فرّع) */
  actions?: React.ReactNode | ActionsFn;
  /** صنف الحاوية (مثل prompt-card-media) */
  className?: string;
  /** الحاوية الحيّة للصورة/المعرض؛ تُعرض الصورة الافتراضية إن غابت */
  children?: React.ReactNode;
};

/* cubic-bezier(0.16,1,0.3,1) = --ease-ios-out */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const cx = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - x;
      const d = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
      if (Math.abs(d) < 1e-6) break;
      t -= cx / d;
    }
    t = Math.min(1, Math.max(0, t));
    return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
  };
}
const easeOut = bezier(0.16, 1, 0.3, 1);

const HOLD_MS = 450, MOVE_TOL = 10, BLUR_MS = 350, SEEN_KEY = "khiyal:peek";
const seen = () => { try { return sessionStorage.getItem(SEEN_KEY) === "1"; } catch { return false; } };

export default function PromptPeekLayer({
  imageSrc, imageAlt, promptText, maxVh = 70, title, tags, copyText, onCopy, topExtra, lockNote, actions, className = "", children,
}: PromptPeekLayerProps) {
  const noMotion = useNoMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
  const [pulseKey, setPulseKey] = useState(0);
  const [inView, setInView] = useState(false);
  const [animated, setAnimated] = useState(false);
  const tRef = useRef(0);
  const raf = useRef(0);
  const hold = useRef<{ timer: ReturnType<typeof setTimeout> | null; x: number; y: number; fired: boolean }>({ timer: null, x: 0, y: 0, fired: false });
  const open = phase === "open";

  /* ───────── التمويه الحيّ: rAF بمنحنى iOS مع تدهور لطيف ───────── */
  const setT = useCallback((v: number) => {
    tRef.current = v;
    stageRef.current?.style.setProperty("--peek-t", v.toFixed(3));
  }, []);
  const animateTo = useCallback((to: 0 | 1, done?: () => void) => {
    cancelAnimationFrame(raf.current);
    const stage = stageRef.current;
    const from = tRef.current;
    if (!stage || noMotion || from === to) { if (stage && noMotion) stage.dataset.snap = "1"; setT(to); done?.(); return; }
    delete stage.dataset.snap;
    const t0 = performance.now();
    let last = t0, slow = 0;
    const step = (now: number) => {
      const dt = now - last; last = now;
      slow = dt > 20 ? slow + 1 : 0;
      if (slow >= 2) { stage.dataset.snap = "1"; setT(to); done?.(); return; } // إطاران بطيئان متتاليان ← اقفز للنهاية
      const k = Math.min(1, (now - t0) / BLUR_MS);
      setT(from + (to - from) * easeOut(k));
      if (k < 1) raf.current = requestAnimationFrame(step); else done?.();
    };
    raf.current = requestAnimationFrame(step);
  }, [noMotion, setT]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /* ───────── فتح/إغلاق ───────── */
  const openLayer = useCallback(() => {
    if (phase === "open") return;
    const stage = stageRef.current;
    if (stage) {
      const r = stage.getBoundingClientRect();
      const cap = (window.innerHeight * maxVh) / 100;
      // الطبقة تلتصق بأسفل الصورة وتنمو لأعلى: لا تتجاوز سقف النسبة ولا حدّ الشاشة العلوي
      stage.style.setProperty("--peek-maxh", `${Math.max(220, Math.min(cap, r.bottom - 8))}px`);
    }
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch {}
    setPhase("open");
    animateTo(1);
    requestAnimationFrame(() => layerRef.current?.focus({ preventScroll: true }));
  }, [phase, maxVh, animateTo]);

  const closeLayer = useCallback(() => {
    if (phase !== "open") return;
    setPhase("closing");
    animateTo(0, () => setPhase("closed"));
    pillRef.current?.focus({ preventScroll: true });
  }, [phase, animateTo]);

  /* Esc يغلق الطبقة أولاً (التقاطي كي لا يغلق المعاينة الأم)، وحبس Tab داخل الطبقة */
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); closeLayer(); return; }
      if (e.key !== "Tab") return;
      const nodes: HTMLElement[] = Array.from(layerRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])') ?? []);
      if (!nodes.length) return;
      const first = nodes[0], lastN = nodes[nodes.length - 1], act = document.activeElement;
      if (e.shiftKey && (act === first || act === layerRef.current)) { e.preventDefault(); lastN.focus(); }
      else if (!e.shiftKey && act === lastN) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [open, closeLayer]);

  /* ───────── الكبسولة: نبضتان ثم سكون؛ إعادة النبض عند عودة البطاقة للشاشة؛ توقف خارجها ───────── */
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let wasOut = true;
    const io = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) {
        setInView(true);
        if (wasOut && !seen() && !noMotion) { setAnimated(true); setPulseKey((k: number) => k + 1); }
        wasOut = false;
      } else { setInView(false); wasOut = true; }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [noMotion]);

  /* ───────── الضغطة المطوّلة على الصورة ───────── */
  const clearHold = () => { const h = hold.current; if (h.timer) { clearTimeout(h.timer); h.timer = null; } };
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== "closed") return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const t = e.target as Element;
    if (t.closest(".peek-layer, .peek-pill")) return;
    const h = hold.current;
    clearHold();
    h.x = e.clientX; h.y = e.clientY; h.fired = false;
    h.timer = setTimeout(() => {
      h.timer = null; h.fired = true;
      navigator.vibrate?.(10);
      openLayer(); // يبقى fired=true حتى يُبتلع النقر التالي أو تبدأ ضغطة جديدة
    }, HOLD_MS);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const h = hold.current;
    if (h.timer && Math.hypot(e.clientX - h.x, e.clientY - h.y) > MOVE_TOL) clearHold();
  };
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    // بعد فتح الطبقة بالضغط المطوّل: لا يعمل النقر المعتاد (فتح المعاينة/التكبير)
    if (hold.current.fired) { e.preventDefault(); e.stopPropagation(); hold.current.fired = false; }
  };
  const onContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hold.current.timer || hold.current.fired) e.preventDefault(); // يمنع قائمة السياق أثناء نافذة الضغط فقط
  };

  /* ───────── سحب لأسفل للإغلاق (لمس + فأرة) ───────── */
  useEffect(() => {
    const layer = layerRef.current, scroller = scrollRef.current;
    if (!layer || !scroller || !open) return;
    let active = false, startedInScroll = false, lastY = 0, y0 = 0, t0 = 0, dy = 0, tracking = false;
    const h = () => layer.offsetHeight || 1;
    const begin = (y: number, target: EventTarget | null) => {
      tracking = true; active = false; dy = 0; lastY = y; y0 = y; t0 = performance.now();
      startedInScroll = target instanceof Node && scroller.contains(target);
    };
    const move = (y: number, e: Event) => {
      if (!tracking) return;
      const prev = lastY; lastY = y;
      if (!active) {
        const canStart = (!startedInScroll || scroller.scrollTop <= 0) && y > prev;
        if (!canStart) return;
        active = true; y0 = prev; t0 = performance.now();
      }
      if (e.cancelable) e.preventDefault();
      dy = Math.max(0, y - y0);
      const v = dy / Math.max(1, performance.now() - t0); // بطيء = مقاومة أكبر
      const off = dy * (0.5 + 0.5 * Math.min(1, v / 1.2));
      layer.style.transition = "none";
      layer.style.transform = `translateY(${off}px)`;
      if (dy === 0) active = false;
    };
    const end = () => {
      if (!tracking) return;
      tracking = false;
      if (!active) return;
      const v = dy / Math.max(1, performance.now() - t0);
      layer.style.transition = "";
      layer.style.transform = "";
      active = false;
      if (dy > h() * 0.3 || v > 0.6) closeLayer(); // وإلا يرتدّ بنعومة عبر الانتقال
    };
    const ts = (e: TouchEvent) => begin(e.touches[0].clientY, e.target);
    const tm = (e: TouchEvent) => move(e.touches[0].clientY, e);
    const pd = (e: PointerEvent) => { if (e.pointerType === "mouse" && e.button === 0 && !(e.target as Element).closest("a,button,input,textarea")) { begin(e.clientY, e.target); layer.setPointerCapture?.(e.pointerId); } };
    const pm = (e: PointerEvent) => { if (e.pointerType === "mouse") move(e.clientY, e); };
    const pu = (e: PointerEvent) => { if (e.pointerType === "mouse") end(); };
    layer.addEventListener("touchstart", ts, { passive: true });
    layer.addEventListener("touchmove", tm, { passive: false });
    layer.addEventListener("touchend", end);
    layer.addEventListener("touchcancel", end);
    layer.addEventListener("pointerdown", pd);
    layer.addEventListener("pointermove", pm);
    layer.addEventListener("pointerup", pu);
    layer.addEventListener("pointercancel", pu);
    return () => {
      layer.removeEventListener("touchstart", ts); layer.removeEventListener("touchmove", tm);
      layer.removeEventListener("touchend", end); layer.removeEventListener("touchcancel", end);
      layer.removeEventListener("pointerdown", pd); layer.removeEventListener("pointermove", pm);
      layer.removeEventListener("pointerup", pu); layer.removeEventListener("pointercancel", pu);
    };
  }, [open, closeLayer]);

  const acts = typeof actions === "function" ? (actions as ActionsFn)({ close: closeLayer }) : actions;

  return (
    <div
      ref={stageRef}
      className={`peek-stage ${className}`}
      data-peek={phase}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={clearHold}
      onPointerCancel={clearHold}
      onPointerLeave={clearHold}
      onClickCapture={onClickCapture}
      onContextMenu={onContextMenu}
    >
      <div className="peek-img-target">
        {children ?? <img src={imageSrc} alt={imageAlt} draggable={false} className="block h-full w-full object-cover" />}
      </div>

      <button
        key={pulseKey}
        ref={pillRef}
        type="button"
        onClick={openLayer}
        aria-label="عرض البرومبت"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-inview={inView ? "1" : undefined}
        className={`peek-pill ${animated && !noMotion ? "is-anim" : ""}`}
      >
        <span className="peek-pill-i">برومبت</span>
      </button>

      <div
        ref={layerRef}
        className="peek-layer"
        role="dialog"
        aria-modal="true"
        aria-label="البرومبت"
        aria-hidden={!open}
        tabIndex={-1}
      >
        <button type="button" onClick={closeLayer} className="sr-only" aria-label="إغلاق البرومبت">إغلاق البرومبت</button>
        <span className="peek-grip" aria-hidden />
        <div className="peek-top">
          <CopyButton text={copyText} label="نسخ" onCopy={onCopy} className="peek-copy" />
          {topExtra}
        </div>
        <div ref={scrollRef} className="peek-scroll">
          {title && <p className="text-base font-bold text-white">{title}</p>}
          <p className="peek-text">{promptText}</p>
          {!!tags?.length && <div className="flex flex-wrap gap-1">{tags.map((t) => <span key={t} className="rounded-full bg-white/15 px-2 text-micro text-white">{t}</span>)}</div>}
          {lockNote}
          {acts}
        </div>
      </div>
    </div>
  );
}
