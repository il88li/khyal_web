"use client";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { Copy, Flame, Send, Target, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ago, burst, extractVars, fillVars, sb, thumb, toast, uid } from "@/lib/supabase";
import { challengeOf } from "@/types";
import type { Img } from "@/types";

// components/BottomSheet.tsx — نافذة سفلية: سحب من المقبض للإغلاق (spring)، Esc، قفل التمرير

export function BottomSheet({ open, onClose, title, children, compact }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; compact?: boolean }) {
  const controls = useDragControls();
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.body.style.overflow = "hidden"; window.addEventListener("keydown", k);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", k); };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (<>
        <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-charcoal/40" />
        <motion.div key="sh" role="dialog" aria-label={title} drag="y" dragListener={false} dragControls={controls} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, i) => (i.offset.y > 120 || i.velocity.y > 600) && onClose()}
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 460, damping: 38 }}
          className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-xl flex-col rounded-t-xl border border-silver bg-snow shadow-soft ${compact ? "max-h-[85dvh] pb-3" : "h-[85dvh]"}`} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div onPointerDown={(e) => controls.start(e)} style={{ touchAction: "none" }} className="flex shrink-0 cursor-grab flex-col items-center gap-1.5 px-5 pb-2 pt-2.5">
            <span className="h-1 w-8 rounded-full bg-silver" />{title && <h2 className="text-caption font-semibold">{title}</h2>}
          </div>
          <div className="flex min-h-0 flex-1 flex-col px-4">{children}</div>
        </motion.div>
      </>)}
    </AnimatePresence>
  );
}

// components/Toaster.tsx — تنبيه علوي: خلفية Charcoal ونص Snow وحواف 12px
export function Toaster() {
  const [m, setM] = useState("");
  useEffect(() => {
    let t: any;
    const h = (e: Event) => { setM((e as CustomEvent).detail); clearTimeout(t); t = setTimeout(() => setM(""), 2000); };
    window.addEventListener("khiyal:toast", h);
    return () => window.removeEventListener("khiyal:toast", h);
  }, []);
  return (
    <AnimatePresence>
      {m && <motion.div role="status" initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 38 }}
        className="fixed inset-x-5 z-50 mx-auto max-w-md rounded-xl bg-charcoal px-3 py-2 text-caption text-snow shadow-soft" style={{ top: "calc(12px + env(safe-area-inset-top))" }}>{m}</motion.div>}
    </AnimatePresence>
  );
}

// components/CopyButton.tsx — النسخ الوحيد المسموح (التحديد اليدوي معطّل)
export function CopyButton({ text, label = "نسخ البرومبت" }: { text: string; label?: string }) {
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); navigator.vibrate?.(10); toast("نُسخ البرومبت"); }}
      className="btn"><Copy size={14} />{label}</button>
  );
}

// components/Lightbox.tsx — عارض صور: سحب بين الصور، تكبير بإصبعين، نقر مزدوج، مؤشر نقطي رفيع

function Zoom({ im, onZoom }: { im: Img; onZoom: (z: boolean) => void }) {
  const [s, setS] = useState(1), [t, setT] = useState({ x: 0, y: 0 }), g = useRef({ d: 0, s: 1, x: 0, y: 0, tx: 0, ty: 0, last: 0 });
  const dist = (e: React.TouchEvent) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  const set = (n: number) => { setS(n); onZoom(n > 1); if (n === 1) setT({ x: 0, y: 0 }); };
  return (
    <div className="flex h-full w-full shrink-0 snap-center items-center justify-center overflow-hidden"
      onTouchStart={(e) => {
        const c = g.current;
        if (e.touches.length === 2) { c.d = dist(e); c.s = s; }
        else { c.x = e.touches[0].clientX; c.y = e.touches[0].clientY; c.tx = t.x; c.ty = t.y; const n = Date.now(); if (n - c.last < 300) set(s > 1 ? 1 : 2.5); c.last = n; }
      }}
      onTouchMove={(e) => {
        const c = g.current;
        if (e.touches.length === 2) set(Math.min(5, Math.max(1, (c.s * dist(e)) / c.d)));
        else if (s > 1) setT({ x: c.tx + e.touches[0].clientX - c.x, y: c.ty + e.touches[0].clientY - c.y });
      }}
      onTouchEnd={() => s < 1.05 && set(1)}>
      <img src={thumb(im.url, 1600)} alt="" draggable={false} className="max-h-full max-w-full object-contain"
        style={{ transform: `translate(${t.x}px,${t.y}px) scale(${s})`, touchAction: s > 1 ? "none" : "pan-x", transition: "transform 0.05s linear" }} />
    </div>
  );
}

export function Lightbox({ images, start = 0, onClose }: { images: Img[]; start?: number; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null), [idx, setIdx] = useState(start), [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    (box.current?.children[start] as HTMLElement | undefined)?.scrollIntoView({ inline: "center", behavior: "instant" as ScrollBehavior });
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.body.style.overflow = "hidden"; window.addEventListener("keydown", k);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", k); };
  }, []); // eslint-disable-line
  return (
    <div className="fixed inset-0 z-[60] bg-charcoal" role="dialog" aria-label="عارض الصور">
      <button onClick={onClose} aria-label="إغلاق" className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-silver bg-snow text-charcoal" style={{ top: "calc(12px + env(safe-area-inset-top))" }}><X size={20} /></button>
      <div ref={box} onScroll={(e) => setIdx(Math.round(Math.abs(e.currentTarget.scrollLeft) / e.currentTarget.clientWidth))}
        className={`flex h-full snap-x snap-mandatory [scrollbar-width:none] ${zoomed ? "overflow-hidden" : "overflow-x-auto"}`}>
        {images.map((im, i) => <Zoom key={i} im={im} onZoom={setZoomed} />)}
      </div>
      {images.length > 1 && <div className="absolute inset-x-0 flex justify-center gap-1" style={{ bottom: "calc(20px + env(safe-area-inset-bottom))" }}>{images.map((_, i) => <span key={i} className={`h-1 rounded-full bg-snow ${i === idx ? "w-5" : "w-1.5 opacity-50"}`} />)}</div>}
    </div>
  );
}

// components/Gallery.tsx — صور صفحة التفاصيل: 4:5 مع contain، مؤشر نقطي، ضغط يفتح Lightbox، شارة GIF

export function Gallery({ images }: { images: Img[] }) {
  const [i, setI] = useState(0), [open, setOpen] = useState<number | null>(null);
  if (!images.length) return null;
  return (
    <div className="relative overflow-hidden rounded-xl bg-mist">
      <div onScroll={(e) => setI(Math.round(Math.abs(e.currentTarget.scrollLeft) / e.currentTarget.clientWidth))} className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]" style={{ aspectRatio: "4/5" }}>
        {images.map((im, k) => (
          <button key={k} onClick={() => setOpen(k)} className="relative h-full w-full shrink-0 snap-center">
            <img src={thumb(im.url, 1600)} alt="" width={im.w} height={im.h} className="h-full w-full object-contain" />
            {im.url.endsWith(".gif") && <span className="absolute left-3 top-3 rounded-full bg-brand px-2 text-[11px] text-snow">GIF</span>}
          </button>))}
      </div>
      {images.length > 1 && <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1">{images.map((_, k) => <span key={k} className={`h-1 rounded-full bg-charcoal ${k === i ? "w-4" : "w-1.5 opacity-40"}`} />)}</div>}
      {open !== null && <Lightbox images={images} start={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

// components/Comments.tsx — تعليقات حيّة: إضافة/حذف فوري (Optimistic) + Realtime

type C = { id: string; body: string; created_at: string; author_id: string; author: { display_name: string | null; username: string | null; avatar_url: string | null } | null };
const SEL = "id,body,created_at,author_id,author:profiles!author_id(display_name,username,avatar_url)";

export function Comments({ promptId }: { promptId: string }) {
  const [items, setItems] = useState<C[] | null>(null), [me, setMe] = useState<string>(), [mine, setMine] = useState<C["author"]>(null), [text, setText] = useState(""), end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let ch: ReturnType<typeof sb.channel>;
    uid().then(async (id) => { setMe(id); if (id) setMine((await sb.from("profiles").select("display_name,username,avatar_url").eq("id", id).single()).data); });
    sb.from("comments").select(SEL).eq("prompt_id", promptId).order("created_at").limit(100).then(({ data }) => setItems((data as unknown as C[]) ?? []));
    ch = sb.channel(`c-${promptId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `prompt_id=eq.${promptId}` }, async (p: any) => {
        const { data } = await sb.from("comments").select(SEL).eq("id", p.new.id).single();
        if (data) setItems((a) => (a && !a.some((x) => x.id === p.new.id) ? [...a, data as unknown as C] : a));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "comments" }, (p: any) => setItems((a) => a && a.filter((x) => x.id !== p.old.id))).subscribe();
    return () => { sb.removeChannel(ch); };
  }, [promptId]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [items?.length]);

  async function send() {
    const body = text.trim(); if (!body) return; if (!me) return toast("سجّل الدخول أولاً");
    const id = crypto.randomUUID(); setText(""); navigator.vibrate?.(8);
    setItems((a) => [...(a ?? []), { id, body, created_at: new Date().toISOString(), author_id: me, author: mine }]);
    const { error } = await sb.from("comments").insert({ id, prompt_id: promptId, author_id: me, body });
    if (error) { setItems((a) => a && a.filter((x) => x.id !== id)); setText(body); toast("تعذّر إرسال التعليق"); }
  }
  async function del(c: C) {
    setItems((a) => a && a.filter((x) => x.id !== c.id));
    const { error } = await sb.from("comments").delete().eq("id", c.id);
    if (error) { setItems((a) => (a ? [...a, c].sort((x, y) => x.created_at.localeCompare(y.created_at)) : a)); toast("تعذّر الحذف"); }
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto py-1">
        {!items ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-9 animate-pulse rounded-xl bg-fog" />)
          : !items.length ? <p className="py-8 text-center text-graphite">كن أول من يعلّق.</p>
          : items.map((c) => (
            <div key={c.id} className="flex gap-2">
              <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-mist">{c.author?.avatar_url && <img src={c.author.avatar_url} alt="" className="h-full w-full object-cover" />}</span>
              <div className="min-w-0 flex-1"><p className="text-[10px] text-smoke"><span className="font-semibold text-charcoal">{c.author?.display_name ?? c.author?.username ?? "مستخدم"}</span> · {ago(c.created_at)}</p>
                <p className="max-w-[65ch] whitespace-pre-wrap break-words text-caption">{c.body}</p></div>
              {c.author_id === me && <button onClick={() => del(c)} aria-label="حذف" className="icon-btn shrink-0 self-start"><X size={14} /></button>}
            </div>))}
        <div ref={end} />
      </div>
      <div className="flex items-center gap-1.5 border-t border-silver bg-snow pt-2 pb-1">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }} maxLength={500} placeholder="اكتب تعليقاً…" className="h-9 min-h-9 flex-1 rounded-full border border-silver bg-fog px-3 text-caption outline-none transition-colors focus:border-brand" />
        <button onClick={send} disabled={!text.trim()} aria-label="إرسال" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-snow transition-opacity active:opacity-80 disabled:bg-mist disabled:text-ash"><Send size={15} /></button>
      </div>
    </div>
  );
}

// components/Splash.tsx — شاشة افتتاح متحركة (تظهر مرة لكل جلسة): شعار بنبض وحلقات + اسم + شريط تحميل

export function Splash() {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");
  useEffect(() => {
    try { if (sessionStorage.getItem("khiyal:splash")) { setPhase("gone"); return; } } catch {}
    const wait = Math.max(0, 1500 - performance.now()); // حدّ أدنى لظهورها حتى تكتمل الحركة
    const a = setTimeout(() => setPhase("out"), wait);
    const b = setTimeout(() => { setPhase("gone"); try { sessionStorage.setItem("khiyal:splash", "1"); } catch {} }, wait + 450);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  if (phase === "gone") return null;
  return (
    <div id="khiyal-splash" className={phase === "out" ? "out" : ""} aria-hidden>
      <div className="logo"><span className="ring" /><span className="ring r2" />
        <svg viewBox="0 0 24 24"><path d="M12,2 Q12,12 22,12 Q12,12 12,22 Q12,12 2,12 Q12,12 12,2 Z" fill="#fff" /></svg></div>
      <div className="name">خيال</div><div className="tag">حسّن برومبتك بنقرة</div><div className="bar"><i /></div>
    </div>
  );
}

// components/DailyCard.tsx — سبب العودة اليومية: سلسلة الأيام المتتالية + تحدي اليوم

type Streak = { streak: number; best: number; changed?: boolean };
let req: Promise<Streak | null> | null = null; // نسخة واحدة من الطلب حتى لو ظهرت البطاقة مرتين (جوال/سطح مكتب)

export function DailyCard() {
  const [st, setSt] = useState<Streak | null>(null), ch = challengeOf(new Date()), path = usePathname();
  useEffect(() => {
    (async () => {
      const id = await uid(); if (!id) return;
      const key = `khiyal:streak:${new Date().toDateString()}`;
      try { const c = localStorage.getItem(key); if (c) { setSt(JSON.parse(c)); return; } } catch {}
      if (!req) req = (async () => { const { data, error } = await sb.rpc("touch_streak", { p_offset: -new Date().getTimezoneOffset() }); return error || !data ? null : (data as Streak); })();
      const d = await req; if (!d) return;
      try { localStorage.setItem(key, JSON.stringify({ ...d, changed: false })); } catch {}
      setSt(d);
      if (d.changed && d.streak > 1) { toast(`🔥 ${d.streak} أيام متتالية! استمر`); burst(innerWidth / 2, 140, 18); }
    })();
  }, []);
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-silver bg-snow p-3 shadow-soft">
      {st && st.streak > 0 && (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand"><Flame size={18} /></span>
          <div className="flex-1"><p className="text-caption font-bold">{st.streak} {st.streak === 1 ? "يوم" : "أيام"} متتالية</p><p className="text-[10px] text-smoke">أفضل سلسلة لك: {st.best}</p></div>
        </div>)}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mist text-brand"><Target size={14} /></span>
        <div className="min-w-0 flex-1"><p className="text-[10px] text-smoke">تحدي اليوم</p><p className="text-caption">{ch}</p></div>
      </div>
      <Link href={`/enhance?text=${encodeURIComponent(ch)}`} className="btn btn-primary !min-h-8">ابدأ التحدي</Link>
      {path !== "/community" && <Link href="/community" className="btn btn-soft !min-h-8">نتيجة التحدي في المجتمع</Link>}
    </section>
  );
}

/** تعبئة متغيرات القالب ثم نسخ النتيجة أو إرسالها للمحسّن */
export function VarsSheet({ text, open, onClose }: { text: string; open: boolean; onClose: () => void }) {
  const vars = useMemo(() => extractVars(text), [text]), [vals, setVals] = useState<Record<string, string>>({});
  const out = fillVars(text, vals), ready = vars.every((v) => (vals[v] ?? "").trim());
  return (
    <BottomSheet open={open} onClose={onClose} title="عبّئ المتغيرات">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
        {vars.map((v) => (
          <label key={v} className="flex flex-col gap-1"><span className="text-[10px] text-smoke">{v}</span>
            <input value={vals[v] ?? ""} onChange={(e) => setVals({ ...vals, [v]: e.target.value })} placeholder={`اكتب ${v}…`} className="min-h-9 rounded-xl border border-silver bg-snow px-3 text-caption outline-none transition-colors focus:border-brand" /></label>))}
        <p className="whitespace-pre-wrap rounded-xl bg-mist p-2.5 text-caption">{out}</p>
        <div className="flex gap-2">
          <button disabled={!ready} onClick={async () => { await navigator.clipboard.writeText(out); navigator.vibrate?.(10); toast("نُسخ البرومبت جاهزاً"); }} className="btn btn-primary !min-h-8 flex-1 disabled:opacity-50">نسخ النتيجة</button>
          <Link href={`/enhance?text=${encodeURIComponent(out)}`} className="btn !min-h-8">حسّن</Link>
        </div>
      </div>
    </BottomSheet>
  );
}
