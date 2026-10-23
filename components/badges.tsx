"use client";
// components/badges.tsx — نظام علامة التوثيق ثلاثية المراحل + محفظة الإنجازات
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Copy, Flame, Heart, MessageCircle, Rocket, Star, Users, ChevronLeft, Check, Sparkles, X, ExternalLink } from "@/components/icons";
import { sb, fmt, burst } from "@/lib/supabase";
import { BottomSheet } from "@/components/ui";

export type BStats = {
  prompts: number; likes: number; comments: number; copies: number; forks: number;
  followers: number; taught: number; streak: number; best: number;
};
const score = (s: BStats) => s.likes + s.copies * 2 + s.forks * 3 + s.taught * 2;

export const BADGES = [
  { k: "first", name: "بداية أولى", hint: "انشر أول برومبت", goal: 1, icon: Rocket, val: (s: BStats) => s.prompts },
  { k: "beloved", name: "مُلهم", hint: "25 إعجاباً على منشوراتك", goal: 25, icon: Heart, val: (s: BStats) => s.likes },
  { k: "impact", name: "صاحب تأثير", hint: "50 نسخة من برومبتاتك", goal: 50, icon: Copy, val: (s: BStats) => s.copies },
  { k: "audience", name: "له جمهور", hint: "10 متابعين", goal: 10, icon: Users, val: (s: BStats) => s.followers },
  { k: "teacher", name: "معلّم", hint: "10 تعليقات تساعد غيرك", goal: 10, icon: MessageCircle, val: (s: BStats) => s.taught },
  { k: "star", name: "نجم خيال", hint: "500 نقطة تأثير", goal: 500, icon: Star, val: score },
  { k: "legacy", name: "صنّاع الأثر", hint: "1000 نسخة من برومبتاتك", goal: 1000, icon: Award, val: (s: BStats) => s.copies },
];

/* ════════════════════════════════════════════════════════════════
   أشكال علامة التوثيق للمراحل الثلاث:
   المرحلة 1: الدرع السماوي اللامع (Cyan Shield)
   المرحلة 2: النجمة الذهبية المتلألئة (Gold Starburst)
   المرحلة 3: التاج الألماسي البنفسجي المشع (Royal Violet Diamond)
   ════════════════════════════════════════════════════════════════ */

export function Tier1ShieldIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`inline-block drop-shadow-sm ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id="kh_t1_grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      {/* درع انسيابي مصقول */}
      <path
        d="M12 2.5C7 4.2 3.8 5 3 5.5v6.2c0 5.4 3.8 10 9 11.3 5.2-1.3 9-5.9 9-11.3V5.5c-.8-.5-4-1.3-9-3z"
        fill="url(#kh_t1_grad)"
      />
      {/* لمعان خفيف في الجزء العلوي */}
      <path
        d="M12 4c-3.5 1.2-5.7 1.8-6.5 2.1v4c0 3.8 2.5 7.4 6.5 8.7 4-1.3 6.5-4.9 6.5-8.7v-4C17.7 5.8 15.5 5.2 12 4z"
        fill="white"
        fillOpacity="0.16"
      />
      {/* علامة التحقق */}
      <path
        d="M8.2 12.3l2.6 2.6 5.4-5.4"
        stroke="#ffffff"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Tier2StarIcon({ size = 19, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`inline-block drop-shadow-sm ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id="kh_t2_grad" x1="1" y1="1" x2="23" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="kh_t2_sheen" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* نجمة ذهبية ذات 8 أطراف مسننة فاخرة */}
      <path
        d="M12 1.5l2.6 3.7 4.5-.4 1.2 4.4 3.9 2.3-1.6 4.2 2.7 3.6-3.8 2.4-.3 4.5-4.5.6-2.7 3.6-3.7-2.6-4.4.3-1.2-4.4-3.9-2.3 1.6-4.2-2.7-3.6 3.8-2.4.3-4.5 4.5-.6L12 1.5z"
        fill="url(#kh_t2_grad)"
      />
      {/* لمعان داخلي */}
      <circle cx="12" cy="12" r="8" fill="url(#kh_t2_sheen)" fillOpacity="0.25" />
      {/* علامة التحقق البارزة */}
      <path
        d="M8.3 12.2l2.6 2.6 5.3-5.3"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Tier3DiamondIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* هالة إشعاعية متوهجة للمرحلة الماسية */}
      <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 opacity-40 blur-[2px] animate-pulse" />
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="relative drop-shadow-md" aria-hidden="true">
        <defs>
          <linearGradient id="kh_t3_grad" x1="1" y1="1" x2="23" y2="23" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e879f9" />
            <stop offset="45%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="kh_t3_facet" x1="3" y1="3" x2="21" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* معين ماسي ملكي سداسي الحواف مع تاج إشعاعي */}
        <path
          d="M12 1.5l6.5 3.8 3.5 6.7-3.5 6.7L12 22.5l-6.5-3.8L2 12l3.5-6.7L12 1.5z"
          fill="url(#kh_t3_grad)"
        />
        {/* سطح بلوري عاكس للضوء */}
        <path
          d="M12 3l4.8 2.8L12 12l-4.8-6.2L12 3z"
          fill="url(#kh_t3_facet)"
        />
        {/* علامة التحقق الماسية مع نجمة إشعاع */}
        <path
          d="M8.2 12.3l2.6 2.6 5.4-5.4"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="4.5" r="1" fill="#ffffff" />
      </svg>
    </div>
  );
}

/* تفاصيل المراحل لبطاقة التعريف المنبثقة */
const TIER_DETAILS = {
  1: {
    title: "منشئ موثّق · المرحلة الأولى",
    badgeLabel: "الدرع السماوي",
    icon: Tier1ShieldIcon,
    color: "text-sky-700 bg-sky-50 border-sky-200",
    glow: "from-sky-500 to-cyan-500",
    desc: "تم التحقق من هوية هذا المنشئ واكتمال بياناته الأساسية وتفاعله النشط في مجتمع خيال.",
    perks: ["شارة الدرع السماوي الرسمية", "أولوية الظهور في نتائج البحث", "علامة موثوقة في التعليقات"],
  },
  2: {
    title: "مبدع معتمد · المرحلة الثانية",
    badgeLabel: "النجمة الذهبية",
    icon: Tier2StarIcon,
    color: "text-amber-800 bg-amber-50 border-amber-200",
    glow: "from-amber-500 to-yellow-500",
    desc: "مبدع معتمد ذو حضور مميّز وأثر مستمر، تحظى برومبتاته بإعجاب واسع ومتابعة حقيقية.",
    perks: ["الشارة النجمية الذهبية المتلألئة", "ترشيح البرومبتات في تبويب «رائج»", "بطاقة مبدع تفاعلية في المجتمع"],
  },
  3: {
    title: "شريك خيال النخبة · المرحلة الثالثة",
    badgeLabel: "التاج الألماسي",
    icon: Tier3DiamondIcon,
    color: "text-purple-900 bg-purple-50 border-purple-200",
    glow: "from-purple-600 via-fuchsia-600 to-pink-500",
    desc: "أعلى مراتب التوثيق في خيال: شريك رسمي ونخبة المبدعين الذين يثرون المنصة بأفكار استثنائية.",
    perks: ["الشارة الماسية الملكية المتوهجة", "وصول حصري لنماذج الذكاء الاصطناعي الحديثة", "إمكانية تثبيت المنشورات وتخصيص البروفايل"],
  },
};

/** شارة «موثّق» متعددة المراحل — تدعم المراحل 1 و 2 و 3 مع تفاعل عند النقر يفتح بطاقة معلومات الشارة */
export function VerifiedBadge({
  tier = 1,
  size = 17,
  label = false,
  interactive = true,
  className = "",
}: {
  tier?: number | null;
  size?: number;
  label?: boolean;
  interactive?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const cleanTier = Math.min(3, Math.max(1, Number(tier) || 1)) as 1 | 2 | 3;
  const info = TIER_DETAILS[cleanTier];
  const Icon = info.icon;

  const handleClick = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    e.preventDefault();
    if (navigator.vibrate) navigator.vibrate(8);
    setOpen(true);
  };

  return (
    <>
      <span
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (interactive && (e.key === "Enter" || e.key === " ")) {
            e.stopPropagation();
            setOpen(true);
          }
        }}
        title={`${info.title} (${info.badgeLabel})`}
        aria-label={info.title}
        className={`inline-flex shrink-0 items-center gap-1 align-middle transition-transform active:scale-90 hover:scale-105 ${
          interactive ? "cursor-pointer" : ""
        } ${className}`}
      >
        <Icon size={size} />
        {label && (
          <span className={`text-caption font-semibold rounded-full px-2 py-0.5 border ${info.color}`}>
            {info.badgeLabel}
          </span>
        )}
      </span>

      {/* نافذة تفاصيل مستوى التوثيق */}
      {interactive && (
        <BottomSheet open={open} onClose={() => setOpen(false)} title="شارة التوثيق في خيال">
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            {/* عرض مجسّم للشارة مع نبض ضوئي */}
            <div className="relative flex h-24 w-24 items-center justify-center">
              <span className={`absolute inset-0 rounded-full bg-gradient-to-tr ${info.glow} opacity-20 blur-xl animate-pulse`} />
              <div className="transform scale-[2.2]">
                <Icon size={32} />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className={`inline-block mx-auto rounded-full px-3 py-1 text-xs font-bold border ${info.color}`}>
                {info.badgeLabel}
              </span>
              <h3 className="text-xl font-bold text-charcoal">{info.title}</h3>
              <p className="max-w-xs text-sm text-graphite mx-auto leading-relaxed mt-1">
                {info.desc}
              </p>
            </div>

            {/* مزايا المرحلة المعتمدة */}
            <div className="w-full rounded-2xl bg-fog border border-silver p-4 text-start mt-2">
              <p className="text-xs font-bold text-smoke mb-2.5 flex items-center gap-1.5">
                <Sparkles size={14} className="text-brand" />مزايا هذه المرحلة
              </p>
              <ul className="flex flex-col gap-2">
                {info.perks.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs font-medium text-charcoal">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ok text-snow text-[10px] mt-0.5">
                      ✓
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex w-full gap-2 mt-2">
              <Link
                href="/verification"
                onClick={() => setOpen(false)}
                className="btn btn-primary flex-1 !min-h-11 gap-1.5"
              >
                <span>دليل ومراحل التوثيق</span>
                <ChevronLeft size={16} />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-ghost !min-h-11 !px-4"
              >
                إغلاق
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}

/** يجمع أرقام الشارات في استعلامات قليلة — يعيد null عند فشلها */
export async function badgeStats(pid: string): Promise<BStats | null> {
  try {
    const [pr, fl, pf, cm] = await Promise.all([
      sb.from("prompts").select("like_count,comment_count,copy_count,fork_count").eq("author_id", pid).limit(500),
      sb.from("follows").select("*", { count: "exact", head: true }).eq("following_id", pid).eq("status", "accepted"),
      sb.from("profiles").select("streak,best_streak").eq("id", pid).maybeSingle(),
      sb.from("comments").select("*", { count: "exact", head: true }).eq("author_id", pid),
    ]);
    let rows: Record<string, unknown>[] = (pr.data as Record<string, unknown>[]) ?? [];
    if (pr.error) {
      const r2 = await sb.from("prompts").select("like_count,comment_count").eq("author_id", pid).limit(500);
      if (r2.error) return null;
      rows = (r2.data as Record<string, unknown>[]) ?? [];
    }
    const sum = (k: string) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
    return {
      prompts: rows.length, likes: sum("like_count"), comments: sum("comment_count"),
      copies: sum("copy_count"), forks: sum("fork_count"),
      followers: fl.count ?? 0, taught: cm.count ?? 0,
      streak: pf.data?.streak ?? 0, best: pf.data?.best_streak ?? 0,
    };
  } catch { return null; }
}

/** المستوى: كل 100 نقطة تأثير مستوى (بحد أقصى 9) */
export const levelOf = (s: BStats) => Math.min(9, 1 + Math.floor(score(s) / 100));

/** الخطوة التالية الشخصية: أقصر مسار لإنجاز جديد */
export function nextStep(s: BStats): string {
  if (!s.prompts) return "خطوتك التالية: انشر أول برومبت — يستغرق دقيقة واحدة";
  if (!s.best) return "خطوتك التالية: عُد غدًا وابدأ سلسلتك الأولى";
  if (s.best < 5) return `خطوتك التالية: وصّل السلسلة إلى 5 أيام (${s.best}/5)`;
  if (s.likes < 25) return `خطوتك التالية: اجمع 25 إعجاباً (${s.likes}/25)`;
  if (s.followers < 10) return `خطوتك التالية: ادعُ 10 متابعين لصفحتك (${s.followers}/10)`;
  if (s.taught < 10) return `خطوتك التالية: ساعد 10 مبتدئين بالتعليقات (${s.taught}/10)`;
  return "خطوتك التالية: شارك في تحدي الأسبوع واعثر على جمهورك";
}

/** محفظة كاملة مع تقدّم كل شارة (صفحة الإحصاءات) */
export function BadgeGrid({ s }: { s: BStats }) {
  const won = BADGES.filter((b) => b.val(s) >= b.goal).length;
  return (
    <section className="card flex flex-col gap-4.5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-charcoal">محفظة الإنجازات</h2>
        <span className="chip chip-gold !h-9 px-2.5">{won} من {BADGES.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {BADGES.map((b) => {
          const v = b.val(s), got = v >= b.goal, pct = Math.min(100, Math.round((v / b.goal) * 100));
          const Icon = b.icon;
          return (
            <motion.div
              key={b.k}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className={`flex flex-col gap-2 rounded-xl border p-4 transition-all shadow-sm ${got ? "border-gold/35 bg-gold-tint" : "border-silver bg-fog"}`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${got ? "bg-gold text-snow shadow-pop" : "bg-mist text-ash"}`}>
                <Icon size={21} />
              </span>
              <p className={`text-sm font-semibold ${got ? "text-charcoal" : "text-smoke"}`}>{b.name}</p>
              <p className="text-caption text-smoke">{b.hint}</p>
              <span className="h-1.5 overflow-hidden rounded-full bg-mist">
                <span className={`block h-full rounded-full transition-all duration-500 ${got ? "bg-gold" : "bg-ash"}`} style={{ width: `${got ? 100 : pct}%` }} />
              </span>
              <p dir="ltr" className="text-start text-caption tabular-nums text-smoke">{fmt(Math.min(v, b.goal))} / {fmt(b.goal)}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/** شريط مختصر للملف الشخصي: الشارات المكتسبة فقط */
export function BadgeStrip({ s, own }: { s: BStats; own?: boolean }) {
  const got = BADGES.filter((b) => b.val(s) >= b.goal);
  if (!got.length) {
    return own ? (
      <Link href="/stats" className="btn btn-soft self-start !min-h-10">أكمل شارتك الأولى — ابدأ من هنا<ChevronLeft size={18} /></Link>
    ) : null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {got.map((b) => {
        const Icon = b.icon;
        return (
          <span key={b.k} title={`${b.name} — ${b.hint}`} className="chip chip-gold !h-9 px-2.5 text-caption font-semibold transition-transform active:scale-95">
            <Icon size={18} />
            {b.name}
          </span>
        );
      })}
      {own && <Link href="/stats" className="chip !h-9 px-2.5">محفظتي<ChevronLeft size={17} /></Link>}
    </div>
  );
}
