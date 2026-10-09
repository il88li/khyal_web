"use client";
// app/auth/page.tsx — دخول/إنشاء حساب (Google + بريد وكلمة مرور، بلا تأكيد بريد) ثم /setup
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import { sb } from "@/lib/supabase";

const ERR: Record<string, string> = {
  "Invalid login credentials": "البريد أو كلمة المرور غير صحيحة",
  "User already registered": "هذا البريد مسجّل مسبقاً، سجّل الدخول",
  "Password should be at least 6 characters": "كلمة المرور 6 أحرف على الأقل",
  "Database error saving new user": "التسجيل مغلق حالياً",
};
const field = "min-h-12 w-full rounded-xl border border-silver bg-snow ps-11 pe-4 text-sm outline-none transition-colors focus:border-brand";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in"), [email, setEmail] = useState(""), [pw, setPw] = useState(""), [show, setShow] = useState(false);
  const [busy, setBusy] = useState<"" | "email" | "google">(""), [err, setErr] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get("mode") === "up") setMode("up");
    if (q.get("error")) setErr("تعذّر تسجيل الدخول عبر Google، حاول مجدداً");
  }, []);

  async function submit() {
    setErr(""); setBusy("email");
    const { data, error } = mode === "in" ? await sb.auth.signInWithPassword({ email, password: pw }) : await sb.auth.signUp({ email, password: pw });
    setBusy("");
    if (error) return setErr(ERR[error.message] ?? error.message);
    if (data.session) { router.replace("/setup"); router.refresh(); } else setErr("فعّل تعطيل تأكيد البريد من لوحة Supabase");
  }
  async function forgot() {
    if (!email) return setErr("اكتب بريدك أولاً");
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/reset` });
    setErr(error ? error.message : "أرسلنا رابط الاستعادة إلى بريدك");
  }
  async function google() {
    setErr(""); setBusy("google");
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } });
    if (error) { setBusy(""); setErr(error.message); }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 py-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-snow shadow-pop"><Sparkles size={30} /></motion.span>
        <h1 className="text-3xl font-bold">{mode === "in" ? "أهلاً بعودتك" : "أنشئ حسابك"}</h1>
        <p className="text-base text-graphite">{mode === "in" ? "سجّل دخولك لمتابعة برومبتاتك" : "ثوانٍ قليلة وتبدأ"}</p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-silver bg-snow p-5 shadow-soft">
        <div className="relative flex rounded-full bg-mist p-1">
          {(["in", "up"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setErr(""); }} className="relative z-10 min-h-10 flex-1 rounded-full text-sm font-medium">
              {mode === m && <motion.span layoutId="auth-seg" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="absolute inset-0 -z-10 rounded-full bg-snow shadow-soft" />}
              {m === "in" ? "دخول" : "حساب جديد"}
            </button>))}
        </div>

        <button onClick={google} disabled={!!busy} className="flex min-h-12 items-center justify-center gap-3 rounded-full border border-silver bg-snow text-sm font-medium disabled:text-ash">
          {busy === "google" ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-silver border-t-brand" /> : (
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>)}
          المتابعة عبر Google
        </button>

        <div className="flex items-center gap-3 text-caption text-smoke"><span className="h-px flex-1 bg-silver" />أو بالبريد<span className="h-px flex-1 bg-silver" /></div>

        <div className="relative"><Mail size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-smoke" />
          <input dir="ltr" type="email" autoComplete="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className={`${field} text-start`} /></div>
        <div className="relative"><Lock size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-smoke" />
          <input dir="ltr" type={show ? "text" : "password"} autoComplete={mode === "in" ? "current-password" : "new-password"} placeholder="كلمة المرور" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} className={`${field} text-start`} />
          <button type="button" onClick={() => setShow(!show)} aria-label="إظهار" className="absolute end-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-smoke">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>

        {err && <p role="alert" className="rounded-xl bg-brand/5 px-3 py-2 text-caption text-charcoal">{err}</p>}
        <button onClick={submit} disabled={!!busy || !email || pw.length < 6} className="flex min-h-12 items-center justify-center rounded-full bg-brand text-sm font-medium text-snow shadow-pop active:opacity-80 disabled:bg-mist disabled:text-ash disabled:shadow-none">
          {busy === "email" ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-snow/40 border-t-snow" /> : mode === "in" ? "دخول" : "إنشاء الحساب"}
        </button>
        {mode === "in" && <button onClick={forgot} className="btn btn-soft self-center">نسيت كلمة المرور؟</button>}
      </div>
    </main>
  );
}
