"use client";
// components/chrome.tsx — تخطيط خيال Luminous Minimalism، RTL ومتجاوب
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  BarChart3, Bell, BookMarked, Compass, Home, Info, MoreHorizontal,
  LogIn, LogOut, Plus, Settings, ShieldCheck, Sparkles, UserRound, Users,
} from "@/components/icons";
import type { LucideIcon } from "@/components/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthProvider, useAuth } from "./auth";
import { Skeleton } from "./states";
import { AdSlot } from "./AdSlot";
import { BottomSheet } from "./ui";
import { VaporType } from "./ui/vapor-type";
import { isBare, refreshWebToken, registerToken, sb, uid } from "@/lib/supabase";

export const haptic = (ms = 8) => { try { navigator.vibrate?.(ms); } catch {} };
const LOGO = "/icons/khiyal-mark-192-v5.png";

type NavItem = { href: string; label: string; icon: LucideIcon };
const TOP_LINKS: NavItem[] = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/search", label: "استكشف", icon: Compass },
  { href: "/community", label: "المجتمع", icon: Users },
  { href: "/enhance", label: "تحسين البرومبت", icon: Sparkles },
  { href: "/library", label: "مكتبتي", icon: BookMarked },
];
const EXTRA_LINKS: NavItem[] = [
  { href: "/stats", label: "إحصاءاتي", icon: BarChart3 },
  { href: "/requests", label: "طلبات المتابعة", icon: Users },
  { href: "/safety", label: "الأمان والثقة", icon: ShieldCheck },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];
const MOBILE_LINKS: NavItem[] = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/search", label: "استكشف", icon: Compass },
  { href: "/profile/me", label: "ملفي", icon: UserRound },
];
const TITLES: [string, string][] = [
  ["/enhance", "تحسين البرومبت"], ["/community", "المجتمع"],
  ["/safety", "الأمان والثقة"], ["/new", "برومبت جديد"], ["/notifications", "الإشعارات"],
  ["/requests", "طلبات المتابعة"], ["/settings", "الإعدادات"], ["/search", "استكشف"],
  ["/library", "مكتبتي"], ["/stats", "إحصاءاتي"], ["/profile/me", "ملفي"],
  ["/profile/", "الملف الشخصي"], ["/p/", "البرومبت"],
];
const PAGE_HEADINGS: [string, string, string][] = [
  ["/", "الرئيسية", "أفكار جديدة تستحق أن تتحول إلى برومبتات أوضح."],
  ["/search", "استكشف", "ابحث عن فكرة أو برومبت أو مبدع."],
  ["/community", "المجتمع", "مساحة عربية لتبادل ما تتعلمه وتكتبه."],
  ["/enhance", "ورشة التحسين", "ابدأ بفكرة أولية، واضبط النتيجة على طريقتك."],
  ["/library", "مكتبتي", "مكان واحد للبرومبتات التي تريد الرجوع إليها."],
  ["/new", "برومبت جديد", "رتّب فكرتك، ثم انشرها ليستفيد منها الآخرون."],
  ["/notifications", "الإشعارات", "آخر ما حدث على حسابك ومنشوراتك."],
  ["/requests", "طلبات المتابعة", "أدر طلبات الانضمام إلى دائرتك."],
  ["/settings", "الإعدادات", "اجعل خيال أقرب إلى طريقتك في العمل."],
  ["/stats", "إحصاءاتي", "تابع ما تنشره وما يلقى صدى."],
  ["/profile/", "الملف الشخصي", "منشوراتك ونشاطك في خيال."],
  ["/p/", "البرومبت", "اقرأه، جرّبه، أو احفظه للعودة إليه."],
  ["/safety", "الأمان والثقة", "أدوات الحماية وإرشادات المجتمع."],
];
const isActive = (path: string, href: string) => href === "/" ? path === "/" : path.startsWith(href);

/** حالة الحساب: صورة + خروج عند الدخول، وزر دخول عند الخروج، وهيكل أثناء التحقق. */
function AccountMenu({ compact }: { compact?: boolean }) {
  const { status, me, signOut } = useAuth();
  if (status === "loading") return <span className="skel h-8 w-8 !rounded-full" role="status" aria-label="جارٍ التحقق من الجلسة" />;
  if (status === "out")
    return <Link href="/login" className="btn btn-primary btn-sm"><LogIn size={16} />{compact ? "دخول" : "تسجيل الدخول"}</Link>;
  const name = me?.display_name || me?.username || "حسابي";
  return (
    <div className="flex items-center gap-2">
      <Link href="/profile/me" aria-label={name} className="flex min-w-0 items-center gap-2">
        <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-mist">{me?.avatar_url && <img src={me.avatar_url} alt="" className="h-full w-full object-cover" />}</span>
        {!compact && <span className="truncate text-sm font-medium text-charcoal">{name}</span>}
      </Link>
      <button onClick={signOut} aria-label="تسجيل الخروج" title="تسجيل الخروج" className="icon-btn"><LogOut size={16} /></button>
    </div>
  );
}

function MenuLinks({ path }: { path: string }) {
  return <>{EXTRA_LINKS.map(({ href, label, icon: Icon }) => (
    <Link key={href} href={href} className="app-menu-link" aria-current={isActive(path, href) ? "page" : undefined}>
      <Icon size={20} />{label}
    </Link>
  ))}</>;
}

/** القائمة الأساسية المخصصة للويب — ثابتة على يمين مساحة RTL. */
export function Sidebar({ path: givenPath }: { path?: string }) {
  const current = usePathname();
  const path = givenPath ?? current;
  return (
    <aside className="app-sidebar" aria-label="القائمة الرئيسية">
      <Link href="/" className="sidebar-brand" aria-label="خيال — الرئيسية">
        <span className="brand-mark"><img src={LOGO} alt="" /></span>
        <span className="brand-word"><strong>خيال</strong><small>مساحة لصنّاع الأفكار</small></span>
      </Link>

      <Link href="/new" className="sidebar-create btn btn-primary">
        <Plus size={20} /> <span>برومبت جديد</span>
      </Link>

      <div className="sidebar-scroll">
        <p className="sidebar-section-label">مساحتك</p>
        <nav className="sidebar-nav" aria-label="مساحتك">
          {TOP_LINKS.slice(0, 3).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="sidebar-link" aria-current={isActive(path, href) ? "page" : undefined}>
              <Icon size={24} /><span>{label}</span>
            </Link>
          ))}
        </nav>

        <p className="sidebar-section-label">أدوات خيال</p>
        <nav className="sidebar-nav" aria-label="أدوات خيال">
          {TOP_LINKS.slice(3).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="sidebar-link" aria-current={isActive(path, href) ? "page" : undefined}>
              <Icon size={24} /><span>{label}</span>
            </Link>
          ))}
        </nav>

        <p className="sidebar-section-label">حسابك</p>
        <nav className="sidebar-nav" aria-label="حسابك">
          <Link href="/profile/me" className="sidebar-link" aria-current={path.startsWith("/profile/") ? "page" : undefined}>
            <UserRound size={19} strokeWidth={1.8} /><span>ملفي الشخصي</span>
          </Link>
          <Link href="/notifications" className="sidebar-link" aria-current={isActive(path, "/notifications") ? "page" : undefined}>
            <Bell size={19} strokeWidth={1.8} /><span>الإشعارات</span>
          </Link>
          {EXTRA_LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="sidebar-link" aria-current={isActive(path, href) ? "page" : undefined}>
              <Icon size={24} /><span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer"><AccountMenu /></div>
    </aside>
  );
}

/** رأس مختصر لعرض الهاتف؛ البحث والجرس والقائمة في متناول الإبهام. */
// كلمات الخيال التي تتكثّف وتتبخّر في رأس التطبيق — تعبير واحد في كل مرة.
const VAPOR_WORDS = ["خيال", "حوّل الفكرة إلى صورة", "اكتب ما تتخيّله", "اصنع برومبتاً يشبه حلمك", "أطلق خيالك"];

export function TopBar() {
  const path = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [path]);

  useEffect(() => {
    if (path.startsWith("/auth") || path.startsWith("/admin")) return;
    let channel: ReturnType<typeof sb.channel> | undefined;
    let dead = false;
    uid().then((id) => {
      if (!id || dead) return;
      const refresh = async () => {
        const { count } = await sb.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", id).eq("read", false);
        if (!dead) setUnread(count ?? 0);
      };
      refresh();
      channel = sb.channel("topbar-notif").on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${id}` }, refresh).subscribe();
    });
    return () => { dead = true; if (channel) sb.removeChannel(channel); };
  }, [path]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || el?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName ?? "")) return;
      e.preventDefault();
      router.push("/search");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <header className="app-topbar">
      <div className="app-topbar-inner">
        <Link href="/" aria-label="خيال — الرئيسية" className="min-w-0 flex-1 text-lg font-bold text-charcoal">
          <VaporType words={VAPOR_WORDS} />
        </Link>
        <button onClick={() => { haptic(8); setMore(true); }} aria-label="المزيد" aria-haspopup="dialog" title="المزيد" className="icon-btn app-more shrink-0">
          <MoreHorizontal size={24} />
        </button>
        <Link href="/notifications" aria-label="الإشعارات" className="icon-btn app-notification shrink-0" title="الإشعارات">
          <Bell size={24} />{unread > 0 && <span className="app-notification-dot" />}
        </Link>
      </div>
      <MoreSheet open={more} onClose={() => setMore(false)} path={path} />
    </header>
  );
}

function NavLink({ l: { href, label, icon: Icon }, path }: { l: NavItem; path: string }) {
  const active = href === "/profile/me" ? path.startsWith("/profile/") : isActive(path, href);
  return (
    <li>
      <Link href={href} onClick={() => haptic(8)} aria-label={label} aria-current={active ? "page" : undefined} className="relative">
        {active && <motion.span layoutId="nav-pill" className="absolute inset-x-1 top-1 -z-10 h-8 bg-brand-tint" style={{ borderRadius: 16 }} transition={{ type: "spring", stiffness: 420, damping: 28 }} />}
        <motion.span animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 26 }} className="flex">
          <Icon size={24} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.18 : 0} />
        </motion.span>
        <span>{label}</span>
      </Link>
    </li>
  );
}

/** تنقل الهاتف: شريط عائم يحافظ على الوجهات اليومية ويبرز الإنشاء والتحسين. */
/** قائمة «المزيد»: كل الصفحات الثانوية في مكان واحد (من الهيدر الثابت) */
function MoreSheet({ open, onClose, path }: { open: boolean; onClose: () => void; path: string }) {
  const primary = ["/", "/search", "/enhance", "/library"]; // الرئيسية وأهم الأقسام لها مدخل مباشر في التنقل
  const groups: [string, NavItem[]][] = [
    ["استكشاف وأدوات", TOP_LINKS.slice(2).filter((l) => !primary.includes(l.href))],
    ["حسابي", EXTRA_LINKS],
  ];
  return (
    <BottomSheet open={open} onClose={onClose} title="المزيد">
      <div className="flex flex-col gap-4">
        {groups.map(([title, links]) => (
          <section key={title} className="flex flex-col gap-1">
            <h3 className="px-2 text-caption font-semibold text-smoke">{title}</h3>
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={onClose} aria-current={isActive(path, href) ? "page" : undefined}
                className="flex min-h-11 items-center gap-4 rounded-xl px-2 text-base text-charcoal transition-all active:scale-95 aria-[current=page]:bg-brand-tint aria-[current=page]:text-brand-ink">
                <Icon size={24} />{label}
              </Link>))}
          </section>))}
        <div className="px-2 pt-2"><AccountMenu /></div>
      </div>
    </BottomSheet>
  );
}

const ENHANCE_LINK: NavItem = { href: "/enhance", label: "تحسين", icon: Sparkles };

export function BottomNav() {
  const path = usePathname();
  if (path.startsWith("/auth") || path.startsWith("/admin") || path.startsWith("/welcome") || path.startsWith("/setup") || path.startsWith("/offline")) return null;
  return (
    <nav className="mobile-bottomnav" aria-label="التنقل السفلي">
      <motion.ul className="h-16" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 350, damping: 30 }}>
        {MOBILE_LINKS.slice(0, 2).map((l) => <NavLink key={l.href} l={l} path={path} />)}
        <li className="create-slot"><Link href="/new" onClick={() => haptic(14)} className="create-link transition-all active:scale-95" aria-label="أنشئ برومبتًا"><Plus size={24} /><span>أنشئ</span></Link></li>
        <NavLink l={ENHANCE_LINK} path={path} />
        {MOBILE_LINKS.slice(2).map((l) => <NavLink key={l.href} l={l} path={path} />)}
      </motion.ul>
    </nav>
  );
}

/** غلاف موحّد: SideBar على الويب، عمود تنقل مختصر على الهاتف، وتحدّي عند اتساع الشاشة. */
const PROTECTED = ["/new", "/library", "/settings", "/notifications", "/stats", "/requests", "/profile/me"];

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { status } = useAuth();
  const guarded = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));
  useEffect(() => { if (guarded && status === "out") router.replace("/login"); }, [guarded, status, router]);
  const bare = isBare(path);
  const heading = PAGE_HEADINGS.find(([prefix]) => prefix === "/" ? path === "/" : path.startsWith(prefix));
  const hasRail = ["/", "/search", "/community", "/library"].some((route) => route === "/" ? path === "/" : path.startsWith(route));
  if (bare) return <div className="mx-auto w-full max-w-[1380px] px-3 md:px-6" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>{children}</div>;

  return <>
    <Sidebar path={path} />
    <TopBar />
    <div className="workspace-shell">
      <div className={`workspace-grid${hasRail ? " has-rail" : ""}`}>
        <main className="workspace-column">
          {heading && <header className="workspace-header">
            <div className="min-w-0">
              <h1 className="workspace-header-title">{heading[1]}</h1>
              <p className="workspace-header-caption">{heading[2]}</p>
            </div>
          </header>}
          {guarded && status !== "in" ? <Skeleton variant="card" count={2} /> : children}
        </main>
        {hasRail && <aside className="workspace-rail" aria-label="مساحة إعلانية">
          <AdSlot slot="home" />
        </aside>}
      </div>
    </div>
    <BottomNav />
  </>;
}

/* ── شريط عدم الاتصال: يظهر أسفل الشاشة عند انقطاع الشبكة ── */
export function OfflineBar() {
  const [off, setOff] = useState(false);
  useEffect(() => {
    const sync = () => setOff(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);
  return (
    <AnimatePresence>
      {off && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ y: 56, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 56, opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="offline-bar"
        >
          <Info size={16} />
          <span>لا يوجد اتصال بالإنترنت — سيُستأنف التحميل تلقائياً عند عودته</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Providers: إعدادات + تهيئة قاعدة البيانات ── */
const MISSING = /schema cache|Could not find the (table|function)|relation .* does not exist/i;
type Phase = "idle" | "working" | "done" | "nourl" | "failed";

export function Providers({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [r, setR] = useState<"user" | "always">("user");
  const [missing, setMissing] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [msg, setMsg] = useState("");
  const booted = useRef(false);

  async function bootstrap(force = false) {
    if (booted.current && !force) return;
    booted.current = true;
    try {
      const res = await fetch("/api/bootstrap", { method: "POST" });
      const j = await res.json();
      if (j.status === "ready" || j.status === "partial") {
        setMissing(false);
        setPhase("idle");
        try { sessionStorage.setItem("khiyal:boot", "1"); } catch {}
        return;
      }
      setMissing(true);
      setMsg(j.msg ?? "");
      if (j.status === "ran") {
        setPhase("done");
        setTimeout(() => location.reload(), 1000);
      } else {
        setPhase(j.status === "no_db_url" || j.status === "no_service_key" ? "nourl" : "failed");
      }
    } catch {}
  }

  useEffect(() => {
    const read = () => setR(localStorage.getItem("khiyal:reduce") === "1" ? "always" : "user");
    read();
    window.addEventListener("khiyal:reduce", read);

    const on = () => { setMissing(true); setPhase("working"); bootstrap(true); };
    window.addEventListener("khiyal:dbmissing", on);

    sb.from("profiles").select("id", { head: true, count: "exact" }).limit(1).then(({ error }) => {
      if (error && MISSING.test(error.message)) on();
    });
    try {
      if (!sessionStorage.getItem("khiyal:boot")) bootstrap();
    } catch { bootstrap(); }

    return () => {
      window.removeEventListener("khiyal:reduce", read);
      window.removeEventListener("khiyal:dbmissing", on);
    };
  }, []); // eslint-disable-line

  const show = missing && !path.startsWith("/admin");
  return (
    <MotionConfig reducedMotion={r}>
      <AuthProvider>{children}</AuthProvider>
      <OfflineBar />
      {show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-fog px-5" role="alert">
          <div className="flex w-full max-w-sm flex-col gap-4 card p-4 shadow-soft">
            {phase === "working" || phase === "done" ? (
              <>
                <span className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-silver border-t-brand" />
                <h2 className="text-center text-base font-bold">{phase === "done" ? "اكتملت التهيئة ✓" : "جارٍ تهيئة قاعدة البيانات تلقائياً…"}</h2>
                <p className="text-center text-caption text-graphite">لحظات ثم يُعاد تحميل التطبيق.</p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold">التطبيق قيد الإعداد</h2>
                {msg && <p dir="auto" className="whitespace-pre-wrap rounded-xl bg-brand-tint p-2.5 text-caption text-charcoal">{msg}</p>}
                {phase === "nourl" || phase === "idle" ? (
                  <p className="text-caption text-graphite">للتهيئة التلقائية بلا لصق SQL: أضف <b dir="ltr">SUPABASE_DB_URL</b> في Vercel ثم Redeploy، وسيهيّئ التطبيق قاعدة بياناته عند فتحه.</p>
                ) : <p className="text-caption text-graphite">تعذّرت التهيئة التلقائية. اضغط إعادة المحاولة أو راجع سجلات المشروع.</p>}
                <button onClick={() => { setPhase("working"); bootstrap(true); }} className="btn btn-primary">إعادة المحاولة</button>
              </>
            )}
          </div>
        </div>
      )}
    </MotionConfig>
  );
}

/* ── PwaBoot ── */
export function PwaBoot() {
  const r = useRouter();
  useEffect(() => {
    const w = window as any;
    let st: ReturnType<typeof setTimeout>;
    const root = document.documentElement;
    const sc = () => {
      root.classList.add("is-scrolling");
      clearTimeout(st);
      st = setTimeout(() => root.classList.remove("is-scrolling"), 900);
    };
    window.addEventListener("scroll", sc, { passive: true, capture: true });

    const tap = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("button:not(:disabled),a")) navigator.vibrate?.(6);
    };
    document.addEventListener("pointerdown", tap, { passive: true });

    const bip = (e: Event) => {
      e.preventDefault();
      w.__installPrompt = e;
      window.dispatchEvent(new Event("khiyal:installable"));
    };
    window.addEventListener("beforeinstallprompt", bip);

    const vib = navigator.vibrate?.bind(navigator);
    if (vib)
      (navigator as any).vibrate = (p: any) =>
        localStorage.getItem("khiyal:haptics") === "0" ? false : vib(p);

    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").then(() => {
        if (localStorage.getItem("khiyal:push") === "1" && Notification.permission === "granted") refreshWebToken().catch(() => {});
      }).catch(() => {});

    w.khiyalRegisterToken = (t: string) => registerToken(t, "android");
    w.khiyalOpen = (p: string) => r.push(p);
    w.KhiyalNative?.requestToken?.();
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => { if (s) w.KhiyalNative?.requestToken?.(); });

    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("beforeinstallprompt", bip);
      window.removeEventListener("scroll", sc, true);
      document.removeEventListener("pointerdown", tap);
      clearTimeout(st);
    };
  }, []); // eslint-disable-line
  return null;
}
