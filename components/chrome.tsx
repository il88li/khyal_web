"use client";
import { MotionConfig, motion, useScroll } from "framer-motion";
import { BarChart3, Bell, BookMarked, ChevronRight, Download, FlaskConical, Home, Plus, Search, Settings, ShieldCheck, Sparkles, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DailyCard } from "./ui";
import { isBare, refreshWebToken, registerToken, sb, uid } from "@/lib/supabase";

// components/TopBar.tsx — شريط علوي عائم ثابت (لا يختفي بالتمرير): شعار/رجوع + عنوان الصفحة + زر تثبيت التطبيق

const TITLES: [string, string][] = [["/enhance", "التحسين"], ["/lab", "المختبر"], ["/community", "المجتمع"], ["/safety", "الأمان"], ["/new", "منشور جديد"], ["/notifications", "الإشعارات"], ["/requests", "طلبات المتابعة"], ["/settings", "الإعدادات"], ["/search", "بحث"], ["/library", "مكتبتي"], ["/stats", "إحصاءاتي"], ["/profile", "الحساب"], ["/p/", "برومبت"]];

export function TopBar() {
  const r = useRouter(), path = usePathname(), [can, setCan] = useState(false);
  const { scrollYProgress } = useScroll();
  useEffect(() => {
    const w = window as any, h = () => setCan(!!w.__installPrompt);
    h(); window.addEventListener("khiyal:installable", h); return () => window.removeEventListener("khiyal:installable", h);
  }, []);
  const nested = path.startsWith("/p/") || path.startsWith("/settings") || path.startsWith("/requests") || path.startsWith("/search") || path.startsWith("/library") || path.startsWith("/stats") || (path.startsWith("/profile/") && path !== "/profile/me");
  const title = TITLES.find(([k]) => path.startsWith(k))?.[1] ?? "خيال";
  async function install() { const w = window as any, e = w.__installPrompt; if (!e) return; e.prompt(); await e.userChoice; w.__installPrompt = null; setCan(false); }
  return (
    <header className="fixed inset-x-0 z-40 flex justify-center px-4 md:hidden" style={{ top: "calc(8px + env(safe-area-inset-top))" }}>
      <div className="flex h-12 w-full max-w-md items-center gap-2 rounded-full border border-silver bg-snow px-2 shadow-soft relative">
        <motion.span style={{ scaleX: scrollYProgress, transformOrigin: "right" }} className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-brand" />
        {nested
          ? <button onClick={() => r.back()} aria-label="رجوع" className="flex h-10 w-10 items-center justify-center rounded-full active:bg-mist"><ChevronRight size={22} /></button>
          : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-snow"><Sparkles size={18} /></span>}
        <span className="flex-1 truncate px-1 text-base font-semibold">{title}</span>
        {!path.startsWith("/search") && <Link href="/search" aria-label="بحث" className="flex h-10 w-10 items-center justify-center rounded-full bg-mist text-charcoal active:scale-95"><Search size={18} /></Link>}
        {can && <button onClick={install} className="flex min-h-10 items-center gap-1 rounded-full bg-brand/10 px-3 text-sm font-medium text-brand"><Download size={16} />تثبيت</button>}
      </div>
    </header>
  );
}

// components/BottomNav.tsx — شريط سفلي عائم 64px + مؤشر متحرك layoutId + FAB + نقطة غير مقروء (Realtime)

const items = [
  { href: "/", icon: Home, label: "الرئيسية" },
  { href: "/enhance", icon: Sparkles, label: "تحسين" },
  { href: "/new", icon: Plus, label: "جديد", fab: true },
  { href: "/notifications", icon: Bell, label: "الإشعارات" },
  { href: "/profile/me", icon: User, label: "حسابي" },
];

export function BottomNav() {
  const path = usePathname(), [unread, setUnread] = useState(0), hidden = path.startsWith("/auth") || path.startsWith("/admin");
  useEffect(() => {
    if (hidden) return;
    let ch: ReturnType<typeof sb.channel> | undefined, dead = false;
    uid().then((id) => {
      if (!id || dead) return;
      const q = async () => { const { count } = await sb.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", id).eq("read", false); setUnread(count ?? 0); };
      q(); ch = sb.channel("nav-notif").on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${id}` }, q).subscribe();
    });
    return () => { dead = true; if (ch) sb.removeChannel(ch); };
  }, [hidden]);
  if (hidden) return null;
  return (
    <nav className="fixed inset-x-0 z-40 flex justify-center px-4 md:hidden" style={{ bottom: "calc(16px + env(safe-area-inset-bottom))" }}>
      <ul className="flex h-14 w-full max-w-md items-center justify-around rounded-full border border-silver bg-snow px-4 shadow-soft">
        {items.map(({ href, icon: Icon, label, fab }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href} className="relative">
              <Link href={href} aria-label={label} className={`relative flex h-10 items-center justify-center gap-1.5 rounded-full ${fab || !active ? "w-10" : "px-3"} ${fab ? "bg-brand text-snow shadow-pop" : active ? "text-brand" : "text-smoke"}`}>
                {active && !fab && <motion.span layoutId="nav-ind" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="absolute inset-0 rounded-full bg-brand/10" />}
                <Icon size={22} className="relative" />
                {active && !fab && <span className="relative text-caption font-semibold">{label}</span>}
                {href === "/notifications" && unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// components/Sidebar.tsx — قائمة جانبية لشاشات الويب (≥768px)

const LINKS = [["/", "الرئيسية", Home], ["/search", "بحث", Search], ["/enhance", "التحسين", Sparkles], ["/lab", "المختبر", FlaskConical], ["/community", "المجتمع", Users], ["/library", "مكتبتي", BookMarked], ["/stats", "إحصاءاتي", BarChart3], ["/notifications", "الإشعارات", Bell], ["/profile/me", "حسابي", User], ["/settings", "الإعدادات", Settings], ["/safety", "الأمان", ShieldCheck]] as const;

export function Sidebar() {
  const path = usePathname();
  return (
    <nav className="sticky top-4 hidden h-[calc(100dvh-2rem)] flex-col gap-1 self-start overflow-y-auto py-4 md:flex [scrollbar-width:none]">
      <Link href="/" className="mb-4 flex items-center gap-2 px-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-snow shadow-pop"><Sparkles size={20} /></span><span className="text-xl font-bold">خيال</span>
      </Link>
      {LINKS.map(([href, label, Icon]) => {
        const on = href === "/" ? path === "/" : path.startsWith(href);
        return <Link key={href} href={href} className={`flex min-h-12 items-center gap-3 rounded-full px-4 text-base transition-colors ${on ? "bg-brand/10 font-semibold text-brand" : "text-graphite hover:bg-mist"}`}><Icon size={22} />{label}</Link>;
      })}
      <Link href="/new" className="btn btn-primary mt-3 !min-h-12"><Plus size={18} />منشور جديد</Link>
    </nav>
  );
}

// components/Shell.tsx — إطار التطبيق: جوال (شريطان عائمان) + ويب (قائمة جانبية + عمود المحتوى + عمود التحدي)

export function Shell({ children }: { children: React.ReactNode }) {
  const bare = isBare(usePathname());
  if (bare) return <div className="mx-auto max-w-[1200px] px-5 md:px-8" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>{children}</div>;
  return (
    <>
      <TopBar />
      <div className="mx-auto md:grid md:max-w-[1180px] md:grid-cols-[230px_minmax(0,640px)] md:justify-center md:gap-6 md:px-6 lg:grid-cols-[230px_minmax(0,640px)_300px]">
        <Sidebar />
        <div className="px-5 md:px-0" style={{ paddingTop: "calc(var(--top) + env(safe-area-inset-top))", paddingBottom: "calc(var(--bottom) + env(safe-area-inset-bottom))" }}>{children}</div>
        <aside className="sticky top-4 hidden h-fit flex-col gap-4 self-start py-4 lg:flex">
          <DailyCard />
          <p className="px-2 text-caption text-smoke">خيال — حسّن برومبتاتك، شاركها، وتابع المبدعين.</p>
        </aside>
      </div>
      <BottomNav />
    </>
  );
}

// components/Providers.tsx — تخفيف الحركة + لون التطبيق + تهيئة ذاتية لقاعدة البيانات (تظهر شاشة تقدّم/إرشاد عند اللزوم)

const MISSING = /schema cache|Could not find the (table|function)|relation .* does not exist/i;
type Phase = "idle" | "working" | "done" | "nourl" | "failed";

export function Providers({ children }: { children: React.ReactNode }) {
  const path = usePathname(), [r, setR] = useState<"user" | "always">("user");
  const [missing, setMissing] = useState(false), [phase, setPhase] = useState<Phase>("idle"), [msg, setMsg] = useState("");
  const booted = useRef(false);

  async function bootstrap(force = false) {
    if (booted.current && !force) return; booted.current = true;
    try {
      const res = await fetch("/api/bootstrap", { method: "POST" }), j = await res.json();
      if (j.status === "ready" || j.status === "partial") { setMissing(false); setPhase("idle"); try { sessionStorage.setItem("khiyal:boot", "1"); } catch {} return; }
      setMissing(true); setMsg(j.msg ?? "");
      if (j.status === "ran") { setPhase("done"); setTimeout(() => location.reload(), 1000); }
      else setPhase(j.status === "no_db_url" || j.status === "no_service_key" ? "nourl" : "failed");
    } catch { /* لا اتصال: لا نزعج المستخدم */ }
  }

  useEffect(() => {
    const read = () => setR(localStorage.getItem("khiyal:reduce") === "1" ? "always" : "user");
    read(); window.addEventListener("khiyal:reduce", read);
    const a = localStorage.getItem("khiyal:accent"); if (a) document.documentElement.style.setProperty("--brand", a);
    const on = () => { setMissing(true); setPhase("working"); bootstrap(true); };
    window.addEventListener("khiyal:dbmissing", on);
    sb.from("profiles").select("id", { head: true, count: "exact" }).limit(1).then(({ error }) => { if (error && MISSING.test(error.message)) on(); });
    try { if (!sessionStorage.getItem("khiyal:boot")) bootstrap(); } catch { bootstrap(); } // فحص صامت مرة لكل جلسة
    return () => { window.removeEventListener("khiyal:reduce", read); window.removeEventListener("khiyal:dbmissing", on); };
  }, []); // eslint-disable-line

  const show = missing && !path.startsWith("/admin");
  return (
    <MotionConfig reducedMotion={r}>
      {children}
      {show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-fog px-5" role="alert">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-silver bg-snow p-6 shadow-soft">
            {phase === "working" || phase === "done" ? (<>
              <span className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-silver border-t-brand" />
              <h2 className="text-center text-xl font-bold">{phase === "done" ? "اكتملت التهيئة ✓" : "جارٍ تهيئة قاعدة البيانات تلقائياً…"}</h2>
              <p className="text-center text-sm text-graphite">لحظات ثم يُعاد تحميل التطبيق.</p>
            </>) : (<>
              <h2 className="text-2xl font-bold">التطبيق قيد الإعداد</h2>
              {msg && <p dir="auto" className="whitespace-pre-wrap rounded-xl bg-brand/5 p-3 text-caption text-charcoal">{msg}</p>}
              {phase === "nourl" || phase === "idle" ? (
                <p className="text-sm text-graphite">للتهيئة التلقائية بلا لصق SQL: أضف <b dir="ltr">SUPABASE_DB_URL</b> في Vercel (Supabase ← Connect ← Session pooler) ثم Redeploy، وسيهيّئ التطبيق قاعدة بياناته بنفسه عند فتحه.</p>
              ) : <p className="text-sm text-graphite">تعذّرت التهيئة التلقائية. راجع الرسالة أعلاه أو استخدم لوحة الفحص.</p>}
              <Link href="/admin" className="btn btn-primary">فتح لوحة الفحص (للمالك)</Link>
              <button onClick={() => { setPhase("working"); bootstrap(true); }} className="btn">إعادة المحاولة</button>
            </>)}
          </div>
        </div>
      )}
    </MotionConfig>
  );
}

// components/PwaBoot.tsx — تسجيل SW، تحديث توكن FCM بصمت، وجسر WebView (khiyalRegisterToken / khiyalOpen)
export function PwaBoot() {
  const r = useRouter();
  useEffect(() => {
    const w = window as any;
    // منع النسخ/التحديد/القائمة السياقية خارج الحقول (النسخ عبر الأزرار فقط) — ردع وليس حماية مطلقة
    const editable = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest("input,textarea,[contenteditable=true]");
    const block = (e: Event) => { if (!editable(e.target)) e.preventDefault(); };
    const evs = ["copy", "cut", "contextmenu", "selectstart", "dragstart"];
    evs.forEach((n) => document.addEventListener(n, block));
    const bip = (e: Event) => { e.preventDefault(); w.__installPrompt = e; window.dispatchEvent(new Event("khiyal:installable")); };
    window.addEventListener("beforeinstallprompt", bip);
    // احترام إعداد الاهتزاز
    const vib = navigator.vibrate?.bind(navigator);
    if (vib) (navigator as any).vibrate = (p: any) => (localStorage.getItem("khiyal:haptics") === "0" ? false : vib(p));
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").then(() => { if (localStorage.getItem("khiyal:push") === "1" && Notification.permission === "granted") refreshWebToken().catch(() => {}); }).catch(() => {});
    w.khiyalRegisterToken = (t: string) => registerToken(t, "android"); // يستدعيها تطبيق أندرويد بالتوكن
    w.khiyalOpen = (p: string) => r.push(p);                              // رابط عميق من إشعار أصلي
    w.KhiyalNative?.requestToken?.();                                      // عند التشغيل
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => { if (s) w.KhiyalNative?.requestToken?.(); }); // وبعد تسجيل الدخول
    return () => { sub.subscription.unsubscribe(); evs.forEach((n) => document.removeEventListener(n, block)); window.removeEventListener("beforeinstallprompt", bip); };
  }, []); // eslint-disable-line
  return null;
}
