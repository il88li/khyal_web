"use client";
// components/badges.tsx — محفظة الإنجازات: شارات تُحتسب من نشاط المستخدم مباشرة (بلا جداول جديدة)
import Link from "next/link";
import { Award, Copy, Flame, Heart, MessageCircle, Rocket, Star, Users, ChevronLeft } from "lucide-react";
import { sb, fmt } from "@/lib/supabase";

export type BStats = {
  prompts: number; likes: number; comments: number; copies: number; forks: number;
  followers: number; taught: number; streak: number; best: number;
};
const score = (s: BStats) => s.likes + s.copies * 2 + s.forks * 3 + s.taught * 2;

type Badge = { k: string; name: string; hint: string; goal: number; icon: typeof Rocket; val: (s: BStats) => number };
export const BADGES: Badge[] = [
  { k: "first", name: "بداية أولى", hint: "انشر أول برومبت", goal: 1, icon: Rocket, val: (s) => s.prompts },
  { k: "streak", name: "صاحب موعد", hint: "سلسلة 5 أيام متتالية", goal: 5, icon: Flame, val: (s) => s.best },
  { k: "beloved", name: "مُلهم", hint: "25 إعجاباً على منشوراتك", goal: 25, icon: Heart, val: (s) => s.likes },
  { k: "impact", name: "صاحب تأثير", hint: "50 نسخة من برومبتاتك", goal: 50, icon: Copy, val: (s) => s.copies },
  { k: "audience", name: "له جمهور", hint: "10 متابعين", goal: 10, icon: Users, val: (s) => s.followers },
  { k: "teacher", name: "معلّم", hint: "10 تعليقات تساعد غيرك", goal: 10, icon: MessageCircle, val: (s) => s.taught },
  { k: "star", name: "نجم خيال", hint: "500 نقطة تأثير", goal: 500, icon: Star, val: score },
  { k: "legacy", name: "صنّاع الأثر", hint: "1000 نسخة من برومبتاتك", goal: 1000, icon: Award, val: (s) => s.copies },
];

/** يجمع أرقام الشارات في استعلامات قليلة — يعيد null عند فشلها (ولا تسقط الصفحة) */
export async function badgeStats(pid: string): Promise<BStats | null> {
  try {
    const [pr, fl, pf, cm] = await Promise.all([
      sb.from("prompts").select("like_count,comment_count,copy_count,fork_count").eq("author_id", pid).limit(500),
      sb.from("follows").select("*", { count: "exact", head: true }).eq("following_id", pid).eq("status", "accepted"),
      sb.from("profiles").select("streak,best_streak").eq("id", pid).maybeSingle(),
      sb.from("comments").select("*", { count: "exact", head: true }).eq("author_id", pid),
    ]);
    let rows: Record<string, unknown>[] = (pr.data as Record<string, unknown>[]) ?? [];
    if (pr.error) { // قبل تهيئة أعمدة النسخ
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

/** المستوى: كل100 نقطة تأثير مستوى (بحد أقصى9) — يظهر في بطاقة الهوية */
export const levelOf = (s: BStats) => Math.min(9, 1 + Math.floor(score(s) / 100));

/** الخطوة التالية الشخصية: أقصر مسار لإنجاز جديد (تُعرض في الملف الشخصي) */
export function nextStep(s: BStats): string {
  if (!s.prompts) return "خطوتك التالية: انشر أول برومبت — يستغرق دقيقة واحدة";
  if (!s.best) return "خطوتك التالية: عُد غدًا وابدأ سلسلتك الأولى";
  if (s.best < 5) return `خطوتك التالية: وصّل السلسلة إلى5 أيام (${s.best}/5)`;
  if (s.likes < 25) return `خطوتك التالية: اجمع25 إعجاباً (${s.likes}/25)`;
  if (s.followers < 10) return `خطوتك التالية: ادعُ10 متابعين لصفحتك (${s.followers}/10)`;
  if (s.taught < 10) return `خطوتك التالية: ساعد10 مبتدئين بالتعليقات (${s.taught}/10)`;
  return "خطوتك التالية: شارك في تحدي الأسبوع واعثر على جمهورك";
}

/** محفظة كاملة مع تقدّم كل شارة (صفحة الإحصاءات) */
export function BadgeGrid({ s }: { s: BStats }) {
  const won = BADGES.filter((b) => b.val(s) >= b.goal).length;
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-silver bg-snow p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">محفظة الإنجازات</h2>
        <span className="rounded-full bg-brand/10 px-3 py-1 text-caption font-medium text-brand">{won} من {BADGES.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BADGES.map((b) => {
          const v = b.val(s), got = v >= b.goal, pct = Math.min(100, Math.round((v / b.goal) * 100));
          const Icon = b.icon;
          return (
            <div key={b.k} className={`flex flex-col gap-2 rounded-xl border p-3 ${got ? "border-brand/40 bg-brand/5" : "border-silver bg-fog"}`}>
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${got ? "bg-brand text-snow shadow-pop" : "bg-mist text-ash"}`}><Icon size={18} /></span>
              <p className={`text-sm font-semibold ${got ? "text-charcoal" : "text-smoke"}`}>{b.name}</p>
              <p className="text-caption text-smoke">{b.hint}</p>
              <span className="h-1.5 overflow-hidden rounded-full bg-mist"><span className={`block h-full rounded-full ${got ? "bg-brand" : "bg-ash"}`} style={{ width: `${got ? 100 : pct}%` }} /></span>
              <p dir="ltr" className="text-start text-caption tabular-nums text-smoke">{fmt(Math.min(v, b.goal))} / {fmt(b.goal)}</p>
            </div>);
        })}
      </div>
    </section>
  );
}

/** شريط مختصر للملف الشخصي: الشارات المكتسبة فقط + رابط المحفظة لصاحب الحساب */
export function BadgeStrip({ s, own }: { s: BStats; own?: boolean }) {
  const got = BADGES.filter((b) => b.val(s) >= b.goal);
  if (!got.length) {
    return own ? (
      <Link href="/stats" className="btn btn-soft self-start !min-h-9 !text-caption">أكمل شارتك الأولى — ابدأ من هنا<ChevronLeft size={14} /></Link>
    ) : null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {got.map((b) => {
        const Icon = b.icon;
        return <span key={b.k} title={`${b.name} — ${b.hint}`} className="flex h-8 items-center gap-1.5 rounded-full border border-brand/40 bg-brand/5 px-3 text-caption font-medium text-brand"><Icon size={14} />{b.name}</span>;
      })}
      {own && <Link href="/stats" className="flex min-h-8 items-center gap-1 rounded-full bg-mist px-3 text-caption text-graphite">محفظتي<ChevronLeft size={13} /></Link>}
    </div>
  );
}
