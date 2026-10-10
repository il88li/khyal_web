"use client";
import { MotionConfig, motion, useScroll } from "framer-motion";
import { BarChart3, Bell, BookMarked, ChevronRight, Compass, Download, FlaskConical, Home, Plus, Settings, ShieldCheck, Sparkles, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DailyCard } from "./ui";
import { isBare, refreshWebToken, registerToken, sb, uid } from "@/lib/supabase";

// components/TopBar.tsx — شريط علوي عائم ثابت صغير (لا يختفي بالتمرير): شعار/رجوع + عنوان + إشعارات

const TITLES: [string, string][] = [["/enhance", "التحسين"], ["/lab", "المختبر"], ["/community", "المجتمع"], ["/safety", "الأمان"], ["/new", "منشور جديد"], ["/notifications", "الإشعارات"], ["/requests", "طلبات المتابعة"], ["/settings", "الإعدادات"], ["/search", "بحث"], ["/library", "مكتبتي"], ["/stats", "إحصاءاتي"], ["/profile", "الحساب"], ["/p/", "برومبت"]];

export function TopBar() {
  const r = useRouter(), path = usePathname(), [can, setCan] = useState(false), [unread, setUnread] = useState(0);
  const { scrollYProgress } = useScroll();
  useEffect(() => { // عدّاد غير المقروء (جوال فقط: الشريط العلوي)
    if (path.startsWith("/auth") || path.startsWith("/admin")) return;
    let ch: ReturnType<typeof sb.channel> | undefined, dead = false;
    uid().then((id) => {
      if (!id || dead) return;
      const q = async () => { const { count } = await sb.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", id).eq("read", false); setUnread(count ?? 0); };
      q(); ch = sb.channel("topbar-notif").on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${id}` }, q).subscribe();
    });
    return () => { dead = true; if (ch) sb.removeChannel(ch); };
  }, [path]);
  useEffect(() => {
    const w = window as any, h = () => setCan(!!w.__installPrompt);
    h(); window.addEventListener("khiyal:installable", h); return () => window.removeEventListener("khiyal:installable", h);
  }, []);
  const nested = path.startsWith("/p/") || path.startsWith("/settings") || path.startsWith("/requests") || path.startsWith("/search") || path.startsWith("/library") || path.startsWith("/stats") || (path.startsWith("/profile/") && path !== "/profile/me");
  const title = TITLES.find(([k]) => path.startsWith(k))?.[1] ?? "خيال";
  async function install() { const w = window as any, e = w.__installPrompt; if (!e) return; e.prompt(); await e.userChoice; w.__installPrompt = null; setCan(false); }
  return (
    <header className="fixed inset-x-0 z-40 flex justify-center px-3 md:hidden" style={{ top: "calc(6px + env(safe-area-inset-top))" }}>
      <div className="flex h-10 w-full max-w-md items-center gap-1.5 rounded-full border border-silver bg-snow px-1.5 shadow-soft relative">
        <motion.span style={{ scaleX: scrollYProgress, transformOrigin: "right" }} className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-brand" />
        {nested
          ? <button onClick={() => r.back()} aria-label="رجوع" className="flex h-8 w-8 items-center justify-center rounded-full active:bg-mist"><ChevronRight size={18} /></button>
          : <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-snow"><Sparkles size={15} /></span>}
        <span className="flex-1 truncate px-1 text-caption font-semibold">{title}</span>
        {!path.startsWith("/notifications") && <Link href="/notifications" aria-label="الإشعارات" className="relative flex h-8 w-8 items-center justify-center rounded-full bg-mist text-charcoal active:scale-95"><Bell size={15} />{unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" />}</Link>}
        {can && <button onClick={install} className="flex min-h-7 items-center gap-1 rounded-full bg-brand/10 px-2 text-caption font-medium text-brand"><Download size={13} />تثبيت</button>}
      </div>
    </header>
  );
}

// components/BottomNav.tsx — شريط سفلي عائم:4 أزرار (الرئيسية · استكشف · التحسين · ملفي) + زر «أنشئ» العائم =5

const items = [
  { href: "/", icon: Home, label: "الرئيسية" },
  { href: "/search", icon: Compass, label: "استكشف" },
  { href: "/enhance", icon: Sparkles, label: "التحسين" },
  { href: "/profile/me", icon: User, label: "ملفي" },
];

export function BottomNav() {
  const path = usePathname(), hidden = path.startsWith("/auth") || path.startsWith("/admin") || path.startsWith("/welcome");
  if (hidden) return null;
  const cell = (i: (typeof items)[number]) => {
    const active = i.href === "/" ? path === "/" : path.startsWith(i.href);
    return (
      <li key={i.href} className="relative">
        <Link href={i.href} aria-label={i.label} className={`relative flex h-9 items-center justify-center gap-1 rounded-full ${active ? "px-2 text-brand" : "w-9 text-smoke"}`}>
          {active && <motion.span layoutId="nav-ind" transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-full bg-brand/10" />}
          <i.icon size={18} className="relative" />
          {active && <span className="relative text-[10px] font-semibold">{i.label}</span>}
        </Link>
      </li>
    );
  };
  return (
    <nav className="fixed inset-x-0 z-40 flex justify-center px-3 md:hidden" style={{ bottom: "calc(10px + env(safe-area-inset-bottom))" }}>
      <ul className="relative flex h-12 w-full max-w-md items-center justify-around rounded-full border border-silver bg-snow px-2 shadow-soft">
        {items.slice(0, 2).map(cell)}
        <li className="relative w-14">
          <Link href="/new" aria-label="أنشئ برومبت" className="absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-snow bg-brand text-snow shadow-pop active:scale-95"><Plus size={22} /></Link>
          <span className="block pt-1 text-center text-[10px] font-semibold text-brand">أنشئ</span>
        </li>
        {items.slice(2).map(cell)}
      </ul>
    </nav>
  );
}

// components/Sidebar.tsx — قائمة جانبية مدمجة لشاشات الويب (≥768px)

const LINKS = [["/", "الرئيسية", Home], ["/search", "استكشف", Compass], ["/enhance", "التحسين", Sparkles], ["/lab", "المختبر", FlaskConical], ["/community", "المجتمع", Users], ["/library", "مكتبتي", BookMarked], ["/stats", "إحصاءاتي", BarChart3], ["/notifications", "الإشعارات", Bell], ["/profile/me", "حسابي", User], ["/settings", "الإعدادات", Settings], ["/safety", "الأمان", ShieldCheck]] as const;

export function Sidebar() {
  const path = usePathname();
  return (
    <nav className="sticky top-4 hidden h-[calc(100dvh-2rem)] flex-col gap-0.5 self-start overflow-y-auto py-4 [scrollbar-width:none] md:flex">
      <Link href="/" className="mb-3 flex items-center gap-2 px-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-snow shadow-pop"><Sparkles size={16} /></span><span className="text-lg font-bold">خيال</span>
      </Link>
      {LINKS.map(([href, label, Icon]) => {
        const on = href === "/" ? path === "/" : path.startsWith(href);
        return <Link key={href} href={href} className={`flex min-h-9 items-center gap-2.5 rounded-full px-3 text-caption transition-colors ${on ? "bg-brand/10 font-semibold text-brand" : "text-graphite hover:bg-mist"}`}><Icon size={17} />{label}</Link>;
      })}
      <Link href="/new" className="btn btn-primary mt-2 !min-h-9"><Plus size={15} />منشور جديد</Link>
    </nav>
  );
}

// components/Shell.tsx — إطار التطبيق: جوال (شريطان عائمان صغيران) + ويب (قائمة جانبية + عمود ضيّق + عمود جانبي)

export function Shell({ children }: { children: React.ReactNode }) {
  const bare = isBare(usePathname());
  if (bare) return <div className="mx-auto max-w-[1120px] px-4 md:px-6" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>{children}</div>;
  return (
    <>
      <TopBar />
      <div className="mx-auto md:grid md:max-w-[1040px] md:grid-cols-[190px_minmax(0,560px)] md:justify-center md:gap-5 md:px-5 lg:grid-cols-[190px_minmax(0,560px)_250px]">
        <Sidebar />
        <div className="min-w-0 px-4 md:px-0" style={{ paddingTop: "calc(var(--top) + env(safe-area-inset-top))", paddingBottom: "calc(var(--bottom) + env(safe-area-inset-bottom))" }}>{children}</div>
        <aside className="sticky top-4 hidden h-fit flex-col gap-3 self-start py-4 lg:flex">
          <DailyCard />
          <p className="px-2 text-caption text-smoke">خيال — حسّن برومبتاتك، شاركها، وتابع المبدعين.</p>
        </aside>
      </div>
      <BottomNav />
    </>
  );
}

// components/Providers.tsx — تخفيف الحركة + لون التطبيق + تهيئة ذاتية لقاعدة البيانات (تظهر شاشة تقدّم عند اللزوم)

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
          <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-silver bg-snow p-5 shadow-soft">
            {phase === "working" || phase === "done" ? (<>
              <span className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-silver border-t-brand" />
              <h2 className="text-center text-base font-bold">{phase === "done" ? "اكتملت التهيئة ✓" : "جارٍ تهيئة قاعدة البيانات تلقائياً…"}</h2>
              <p className="text-center text-caption text-graphite">لحظات ثم يُعاد تحميل التطبيق.</p>
            </>) : (<>
              <h2 className="text-lg font-bold">التطبيق قيد الإعداد</h2>
              {msg && <p dir="auto" className="whitespace-pre-wrap rounded-xl bg-brand/5 p-2.5 text-caption text-charcoal">{msg}</p>}
              {phase === "nourl" || phase === "idle" ? (
                <p className="text-caption text-graphite">للتهيئة التلقائية بلا لصق SQL: أضف <b dir="ltr">SUPABASE_DB_URL</b> في Vercel ثم Redeploy، وسيهيّئ التطبيق قاعدة بياناته عند فتحه.</p>
              ) : <p className="text-caption text-graphite">تعذّرت التهيئة التلقائية. اضغط إعادة المحاولة أو راجع سجلات المشروع.</p>}
              <button onClick={() => { setPhase("working"); bootstrap(true); }} className="btn btn-primary">إعادة المحاولة</button>
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
    w.khiyalRegisterToken = (t: string) => registerToken(t, "android"); // تستدعيها تطبيق أندرويد بالتوكن
    w.khiyalOpen = (p: string) => r.push(p);                              // رابط عميق من إشعار أصلي
    w.KhiyalNative?.requestToken?.();                                      // عند التشغيل
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => { if (s) w.KhiyalNative?.requestToken?.(); }); // وبعد تسجيل الدخول
    return () => { sub.subscription.unsubscribe(); evs.forEach((n) => document.removeEventListener(n, block)); window.removeEventListener("beforeinstallprompt", bip); };
  }, []); // eslint-disable-line
  return null;
}
