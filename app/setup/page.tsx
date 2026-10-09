"use client";
// app/setup/page.tsx — بعد الدخول: (1) بياناتك (2) التخصيص (3) تثبيت التطبيق
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, ChevronRight, Bell, Share } from "lucide-react";
import { enablePush, explain, sb, thumb, toast, uid, uploadImage } from "@/lib/supabase";

const ACC: [string, string][] = [["برتقالي", "255 79 0"], ["أزرق", "44 112 221"], ["أخضر", "36 178 109"], ["بنفسجي", "124 58 237"], ["وردي", "236 72 153"], ["فحمي", "34 34 34"]];
const LANGS = ["عربي", "إنجليزي", "ثنائي"], TONES = ["رسمي", "ودّي", "تقني", "تسويقي", "أكاديمي"];
const input = "min-h-12 w-full rounded-xl border border-silver bg-snow px-4 text-sm outline-none transition-colors focus:border-brand";
const primary = "flex min-h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-medium text-snow shadow-pop active:opacity-80 disabled:bg-mist disabled:text-ash disabled:shadow-none";

function Chips({ items, value, set }: { items: string[]; value: string; set: (v: string) => void }) {
  return <div className="flex flex-wrap gap-2">{items.map((i) => <button key={i} onClick={() => set(i)} className={`min-h-10 rounded-full border px-4 text-sm ${value === i ? "border-brand bg-brand text-snow" : "border-silver bg-snow text-graphite"}`}>{i}</button>)}</div>;
}

export default function Setup() {
  const r = useRouter(), file = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0), [dir, setDir] = useState(1), [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [up, setUp] = useState(false);
  const [f, setF] = useState({ display_name: "", username: "", bio: "", avatar_url: "" });
  const [acc, setAcc] = useState("255 79 0"), [hap, setHap] = useState(true), [lang, setLang] = useState("عربي"), [tone, setTone] = useState("ودّي");
  const [canInstall, setCan] = useState(false), [installed, setInstalled] = useState(false), [pushOn, setPushOn] = useState(false);

  useEffect(() => {
    (async () => {
      const u = (await sb.auth.getSession()).data.session?.user; if (!u) return r.replace("/welcome");
      const { data } = await sb.from("profiles").select("display_name,username,bio,avatar_url,onboarded").eq("id", u.id).maybeSingle();
      if (data?.onboarded) return r.replace("/");
      const base = (u.email ?? "user").split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase();
      setF({ display_name: data?.display_name ?? ((u.user_metadata?.full_name as string) || base), username: data?.username ?? base + u.id.slice(0, 4), bio: data?.bio ?? "", avatar_url: data?.avatar_url ?? ((u.user_metadata?.avatar_url as string) || "") });
      setAcc(localStorage.getItem("khiyal:accent") || "255 79 0"); setHap(localStorage.getItem("khiyal:haptics") !== "0");
      setCan(!!(window as any).__installPrompt); setInstalled(matchMedia("(display-mode: standalone)").matches || !!(navigator as any).standalone);
      setReady(true);
    })();
    const h = () => setCan(!!(window as any).__installPrompt);
    window.addEventListener("khiyal:installable", h); return () => window.removeEventListener("khiyal:installable", h);
  }, []); // eslint-disable-line

  const go = (n: number) => { setDir(n); setStep((s) => s + n); };
  async function pick(fl?: File) {
    const id = await uid(); if (!fl || !id) return; setUp(true);
    try { const im = await uploadImage(fl, id); setF((x) => ({ ...x, avatar_url: thumb(im.url, 400) })); } catch (e: any) { toast(explain(e)); }
    setUp(false);
  }
  async function saveProfile() {
    const username = f.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (f.display_name.trim().length < 2) return toast("اكتب اسمك");
    if (username.length < 3) return toast("المعرّف 3 أحرف إنجليزية على الأقل");
    setBusy(true); const id = await uid();
    const { error } = await sb.from("profiles").upsert({ id, display_name: f.display_name.trim(), username, bio: f.bio.trim() || null, avatar_url: f.avatar_url || null });
    setBusy(false);
    if (error) return toast(error.code === "23505" ? "هذا المعرّف مستخدم، اختر غيره" : explain(error));
    setF((x) => ({ ...x, username })); go(1);
  }
  const pickAcc = (v: string) => { setAcc(v); localStorage.setItem("khiyal:accent", v); document.documentElement.style.setProperty("--brand", v); };
  function saveCustom() {
    localStorage.setItem("khiyal:haptics", hap ? "1" : "0");
    try { const p = JSON.parse(localStorage.getItem("khiyal:enhance") || "{}"); localStorage.setItem("khiyal:enhance", JSON.stringify({ ...p, lang, tone })); } catch {}
    go(1);
  }
  async function install() { const w = window as any, e = w.__installPrompt; if (!e) return; e.prompt(); const c = await e.userChoice; w.__installPrompt = null; setCan(false); if (c.outcome === "accepted") setInstalled(true); }
  async function notif() { const x = await enablePush(); toast(x === "ok" ? "فُعّلت الإشعارات" : x === "denied" ? "الإذن مرفوض من المتصفح" : "غير مدعوم على هذا الجهاز"); setPushOn(x === "ok"); }
  async function finish() { setBusy(true); const id = await uid(); await sb.from("profiles").update({ onboarded: true }).eq("id", id!); (window as any).__feedDirty = true; r.replace("/"); }

  if (!ready) return <main className="flex min-h-dvh items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-silver border-t-brand" /></main>;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const steps = ["بياناتك", "تخصيصك", "تثبيت التطبيق"];
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 py-6">
      <div className="flex items-center gap-3">
        <button onClick={() => go(-1)} disabled={step === 0} aria-label="رجوع" className="flex h-10 w-10 items-center justify-center rounded-full border border-silver bg-snow disabled:opacity-30"><ChevronRight size={20} /></button>
        <div className="flex flex-1 gap-1.5">{steps.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-brand" : "bg-mist"}`} />)}</div>
        <span className="text-caption text-smoke">{step + 1}/3</span>
      </div>
      <h1 className="text-3xl font-bold">{steps[step]}</h1>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} initial={{ opacity: 0, x: dir * -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * 24 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex flex-1 flex-col gap-4">
          {step === 0 && (<>
            <button onClick={() => file.current?.click()} className="relative mx-auto h-24 w-24 overflow-hidden rounded-full border-2 border-snow bg-brand/10 shadow-soft" aria-label="صورة الحساب">
              {f.avatar_url ? <img src={f.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-3xl font-bold text-brand">{f.display_name.slice(0, 1) || "؟"}</span>}
              <span className="absolute inset-x-0 bottom-0 flex h-7 items-center justify-center bg-charcoal/50 text-snow">{up ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-snow/40 border-t-snow" /> : <Camera size={14} />}</span>
            </button>
            <input ref={file} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
            <input value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} placeholder="اسمك" maxLength={40} className={input} />
            <div className="relative"><span dir="ltr" className="absolute start-4 top-1/2 -translate-y-1/2 text-smoke">@</span><input dir="ltr" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} placeholder="username" maxLength={24} className={`${input} ps-9 text-start`} /></div>
            <textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} rows={3} maxLength={160} placeholder="نبذة قصيرة (اختياري)" className={`${input} resize-none py-3`} />
            <div className="mt-auto"><button onClick={saveProfile} disabled={busy} className={primary}>{busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-snow/40 border-t-snow" /> : "التالي"}</button></div>
          </>)}

          {step === 1 && (<>
            <p className="text-caption text-smoke">لون التطبيق</p>
            <div className="flex flex-wrap gap-3">{ACC.map(([n, v]) => <button key={v} onClick={() => pickAcc(v)} aria-label={n} className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-snow shadow-soft ${acc === v ? "border-charcoal" : "border-snow"}`} style={{ background: `rgb(${v})` }}>{acc === v && <Check size={20} />}</button>)}</div>
            <p className="text-caption text-smoke">لغة التحسين المفضّلة</p><Chips items={LANGS} value={lang} set={setLang} />
            <p className="text-caption text-smoke">النبرة المفضّلة</p><Chips items={TONES} value={tone} set={setTone} />
            <button role="switch" aria-checked={hap} onClick={() => setHap(!hap)} className="flex min-h-12 items-center justify-between rounded-xl border border-silver bg-snow px-4 text-sm"><span>الاهتزاز عند التفاعل</span>
              <span dir="ltr" className={`flex h-7 w-12 items-center rounded-full border px-0.5 ${hap ? "border-brand bg-brand" : "border-silver bg-mist"}`}><span className={`h-5 w-5 rounded-full bg-snow transition-transform ${hap ? "translate-x-5" : ""}`} /></span></button>
            <div className="mt-auto"><button onClick={saveCustom} className={primary}>التالي</button></div>
          </>)}

          {step === 2 && (<>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-silver bg-snow p-6 text-center shadow-soft">
              <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2.8 }} className="flex h-20 w-20 items-center justify-center rounded-full bg-brand text-snow shadow-pop"><Check size={38} /></motion.span>
              <p className="text-lg font-semibold">{installed ? "التطبيق مثبّت على جهازك" : "ثبّت خيال على هاتفك"}</p>
              <p className="max-w-[34ch] text-sm text-graphite">{installed ? "كل شيء جاهز. استمتع!" : "يفتح بنقرة من الشاشة الرئيسية، ويعمل بملء الشاشة وبسرعة."}</p>
            </div>
            {!installed && (canInstall
              ? <button onClick={install} className={primary}>تثبيت التطبيق</button>
              : <p className="rounded-xl bg-brand/5 p-4 text-sm text-graphite">{ios ? <>اضغط زر المشاركة <Share size={14} className="inline" /> في Safari ثم «إضافة إلى الشاشة الرئيسية».</> : "من قائمة المتصفح (⋮) اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»."}</p>)}
            <button onClick={notif} disabled={pushOn} className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-silver bg-snow text-sm disabled:text-ash"><Bell size={18} />{pushOn ? "الإشعارات مفعّلة" : "تفعيل الإشعارات"}</button>
            <div className="mt-auto flex flex-col gap-2">
              <button onClick={finish} disabled={busy} className={primary}>{busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-snow/40 border-t-snow" /> : "ابدأ استخدام خيال"}</button>
              {!installed && <button onClick={finish} className="btn !min-h-10 text-smoke">تخطي</button>}
            </div>
          </>)}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
