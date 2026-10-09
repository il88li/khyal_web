"use client";
// app/welcome/page.tsx — شاشة الدخول المصمّمة (ثابتة): عنوان + مثال حقيقي + «جرّب الآن» بلا تسجيل +3 بطاقات + خطوتك الأولى
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Sparkles } from "lucide-react";
import { toast } from "@/lib/supabase";

const DEMOS = [
  { cat: "تسويق", prompt: "اكتب وصفة منتج جذاباً لقهوة مختصة", out: "قهوةٌ تُحمَّص يوميًا بحبّاتٍ منتقاة بعناية… من أول رشفة تشعر بدفء التراب وحلاوة التمر في توليفة لا تُنسى. اطلبها اليوم وابدأ صباحك بشيء يستحق الانتظار." },
  { cat: "تصميم", prompt: "صمّم فكرة شعار لمقهى عصري اسمه «رَوق»", out: "الفكرة الأولى: حرف الراء بخط عربي معاصر يتحول فنجانًا يتصاعد منه بخارٌ يشبه حرف الواو — بني داكن مع لمسة ذهبية هادئة، يعمل على الواجهة والأكواب والسوشيال." },
  { cat: "كتابة", prompt: "اكتب مقدمة بودكاست عن التقنية", out: "في هذه الحلقة نسأل سؤالًا واحدًا: حين تكتب الآلة معك، من يملك القلم؟ سنبدأ من موقف بسيط تعرفه، ثم نخرج بفكرة تغيّر طريقتك في العمل… استمع حتى النهاية." },
];

export default function Welcome() {
  const [i, setI] = useState(0), [out, setOut] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState(""), [done, setDone] = useState(false);
  const ctl = useRef<AbortController | null>(null), endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [out]);

  async function trial() {
    if (busy) return;
    setBusy(true); setErr(""); setOut(""); setDone(false);
    ctl.current = new AbortController();
    try {
      const res = await fetch("/api/enhance", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.current.signal, body: JSON.stringify({ text: DEMOS[i].prompt }) });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error === "guest_limit" ? "جرّبتَ خيال ✓ — سجّل الآن للاستمرار بلا حدود." : "تعذّر التوليد الآن، أعد المحاولة بعد لحظات.");
        setBusy(false); return;
      }
      const reader = res.body.getReader(), dec = new TextDecoder(); let buf = "";
      for (;;) {
        const { done: d, value } = await reader.read(); if (d) { if (buf.trim()) setDone(true); break; }
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const l of lines) {
          if (!l.startsWith("data: ") || l.includes("[DONE]")) continue;
          let j: any; try { j = JSON.parse(l.slice(6)); } catch { continue; }
          const t = j.choices?.[0]?.delta?.content; if (t) setOut((o) => o + t);
        }
      }
    } catch (e: any) { if (e?.name !== "AbortError") setErr("تعذّر الاتصال الآن."); }
    setBusy(false);
  }
  const copy = async () => { await navigator.clipboard.writeText(out); navigator.vibrate?.(10); toast("نُسخ البرومبت ✓"); };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 py-6">
      <header className="flex flex-col items-center gap-2 pt-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-snow shadow-pop"><Sparkles size={24} /></span>
        <h1 className="text-3xl font-bold">خيال — برومبتات عربية جاهزة</h1>
        <p className="text-base text-graphite">جرّب برومبتًا حقيقيًا الآن… بلا تسجيل.</p>
      </header>

      {/* المثال الحيّ: اكتبته الآلة أمامك */}
      <section className="flex flex-col gap-3 rounded-xl border border-silver bg-snow p-4 shadow-soft">
        <p className="text-caption text-smoke">البرومبت</p>
        <p className="text-base font-medium">{DEMOS[i].prompt}</p>
        {out ? (
          <>
            <p className="text-caption text-smoke">النتيجة</p>
            <p className="max-h-[34vh] overflow-y-auto whitespace-pre-wrap rounded-xl bg-fog p-3 text-base leading-[1.75]">{out}</p>
            <div className="flex gap-2">
              <button onClick={copy} className="btn btn-soft min-h-11 flex-1"><Copy size={16} />{done ? "انسخ النتيجة" : "نسخ"}</button>
              <Link href="/auth?mode=up" className="btn btn-primary min-h-11 flex-1">احفظها في خيالي</Link>
            </div>
          </>
        ) : busy ? (
          <p className="rounded-xl bg-fog p-3 text-base text-graphite">نحضّر نتيجتك…</p>
        ) : (
          <button onClick={trial} className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand text-base font-medium text-snow shadow-pop active:opacity-80"><Sparkles size={18} />جرّب الآن</button>
        )}
        {err && <p className="rounded-xl bg-fog p-3 text-sm text-graphite">{err}</p>}
        {busy && <button onClick={() => ctl.current?.abort()} className="btn min-h-11 w-full text-smoke">إيقاف</button>}
        <div ref={endRef} />
      </section>

      {/*3 بطاقات مختارة */}
      <section className="flex gap-2">
        {DEMOS.map((d, k) => (
          <button key={d.cat} onClick={() => { ctl.current?.abort(); setI(k); setOut(""); setErr(""); setDone(false); }}
            className={`min-h-11 flex-1 rounded-xl border px-2 py-2 text-sm font-medium active:opacity-70 ${k === i ? "border-brand bg-brand/10 text-brand" : "border-silver bg-snow text-graphite"}`}>{d.cat}</button>
        ))}
      </section>
      <p className="-mt-1 text-caption text-smoke">كل بطاقة برومبت + مخرجه — اضغط لتغيير المثال.</p>

      {/* خطوتك الأولى */}
      <section className="flex flex-col items-center gap-2 rounded-xl border border-silver bg-fog p-4">
        <p className="text-sm font-semibold">خطوتك الأولى</p>
        <div className="flex items-center gap-2">
          {(["جرّب", "احفظ", "انشر"] as const).map((t, k) => (
            <span key={t} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-medium ${k === 0 ? "bg-brand text-snow" : "bg-mist text-smoke"}`}>
              {k === 0 && <Check size={13} />}{t}{k < 2 && <span className="text-smoke">←</span>}
            </span>
          ))}
        </div>
      </section>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Link href="/auth?mode=up" className="flex min-h-12 items-center justify-center rounded-full bg-brand text-base font-medium text-snow shadow-pop">سجّل لتحفظ نتائجك</Link>
        <Link href="/auth" className="flex min-h-12 items-center justify-center rounded-full border border-silver bg-snow text-base">لديّ حساب</Link>
      </div>
    </main>
  );
}
