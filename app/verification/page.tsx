"use client";
// app/verification/page.tsx — مركز التوثيق الشامل: نظام ثلاثي المراحل (Tier 1: درع سماوي · Tier 2: نجمة ذهبية · Tier 3: تاج ألماسي)
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  FileText,
  Heart,
  History,
  Info,
  Loader2,
  Lock,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  Users,
  Award,
} from "@/components/icons";
import { uid, explain, burst } from "@/lib/supabase";
import { verificationStats, requestVerification } from "@/lib/verification";
import { Skeleton, ErrorState } from "@/components/states";
import { Tier1ShieldIcon, Tier2StarIcon, Tier3DiamondIcon, VerifiedBadge } from "@/components/badges";
import type { VerificationStats, VerificationTier, TierDefinition } from "@/types";

const ICONS: Record<string, any> = {
  profile: UserCheck,
  prompts: FileText,
  followers: Users,
  likes: Heart,
  days: History,
  comments: MessageCircle,
  copies: Award,
};

export default function VerificationPage() {
  const [s, setS] = useState<VerificationStats | null>(null);
  const [selectedTier, setSelectedTier] = useState<VerificationTier>(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      const id = await uid();
      if (!id) {
        setLoading(false);
        return;
      }
      const r = await verificationStats(id);
      if (!r) {
        setErr("تعذّر تحميل بيانات التوثيق، تأكد من اتصالك وحاول مجدداً.");
        setLoading(false);
        return;
      }
      setS(r);
      // الافتراضي هو المرحلة التالية أو المرحلة الحالية
      if (r.nextTier) setSelectedTier(r.nextTier);
      else if (r.currentTier > 0) setSelectedTier(r.currentTier as VerificationTier);
      setLoading(false);
    })();
  }, [tick]);

  async function handleSubmit(tier: VerificationTier, e: React.MouseEvent) {
    if (navigator.vibrate) navigator.vibrate(12);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 14);

    setBusy(true);
    const res = await requestVerification(tier, note);
    if (res.ok) {
      setNote("");
      setTick((t) => t + 1);
    }
    setBusy(false);
  }

  if (err) return <ErrorState message={err} onRetry={() => { setErr(""); setLoading(true); setTick((t) => t + 1); }} />;
  if (loading || !s) return <Skeleton variant="card" count={3} className="pt-2" />;

  const activeTierData = s.tiers.find((t) => t.tier === selectedTier) ?? s.tiers[0];
  const currentLevelName =
    s.currentTier === 3
      ? "شريك خيال النخبة (المرحلة 3)"
      : s.currentTier === 2
      ? "مبدع معتمد (المرحلة 2)"
      : s.currentTier === 1
      ? "منشئ موثق (المرحلة 1)"
      : "حساب غير موثق بعد";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-5 pt-3 pb-8">
      {/* ═══ الرأس: بطاقة حالة الحساب التفاعلية ═══ */}
      <section className="relative overflow-hidden rounded-2xl border border-silver bg-snow p-5 shadow-soft">
        <div className="absolute -start-10 -top-10 h-36 w-36 rounded-full bg-brand/5 blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start">
          {/* المعاينة الحية للشارة */}
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-fog border border-silver/80 shadow-sm">
            {s.currentTier === 3 ? (
              <Tier3DiamondIcon size={46} />
            ) : s.currentTier === 2 ? (
              <Tier2StarIcon size={44} />
            ) : s.currentTier === 1 ? (
              <Tier1ShieldIcon size={42} />
            ) : (
              <ShieldCheck size={38} className="text-smoke" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl font-bold text-charcoal">نظام التوثيق المتدرّج</h1>
              {s.currentTier > 0 ? (
                <VerifiedBadge tier={s.currentTier} size={18} label />
              ) : (
                <span className="chip !h-6 px-2 text-micro font-semibold bg-mist text-smoke">غير موثق</span>
              )}
            </div>
            <p className="mt-1 text-sm text-graphite leading-relaxed">
              {s.currentTier > 0
                ? `حسابك معتمد حالياً برتبة «${currentLevelName}». استكمل متطلبات المراحل التالية للارتقاء وتوسيع نطاق ظهورك.`
                : "يمر التوثيق في خيال عبر 3 مراحل متدرجة من الأشكال والمزايا، تبدأ من تأكيد الهوية ثم جودة المحتوى وحتى رتبة الشريك."}
            </p>
          </div>
        </div>

        {/* مؤشر المراحل الثلاث السريع */}
        <div className="mt-4 pt-4 border-t border-silver/60 grid grid-cols-3 gap-2">
          {s.tiers.map((t) => {
            const isAttained = s.currentTier >= t.tier;
            const isSelected = selectedTier === t.tier;
            return (
              <button
                key={t.tier}
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(6);
                  setSelectedTier(t.tier);
                }}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all active:scale-95 ${
                  isSelected
                    ? "border-brand bg-brand-tint/30 shadow-soft"
                    : "border-transparent bg-fog/70 hover:bg-mist"
                }`}
              >
                <div className="transform scale-90">
                  {t.tier === 1 ? <Tier1ShieldIcon size={20} /> : t.tier === 2 ? <Tier2StarIcon size={22} /> : <Tier3DiamondIcon size={24} />}
                </div>
                <span className="text-xs font-bold text-charcoal truncate max-w-full">{t.name}</span>
                <span className={`text-[10px] font-semibold ${isAttained ? "text-ok-ink" : t.eligible ? "text-brand" : "text-smoke"}`}>
                  {isAttained ? "مُحققة ✓" : t.eligible ? "مؤهل الآن ★" : `${t.progressPct}٪`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══ التبويبات الثلاثة المستقلة مع شاراتها وتصميمها المخصص ═══ */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-charcoal">اختر المرحلة للاطلاع على شروطها</h2>
          <span className="text-caption text-smoke">المرحلة {selectedTier} من 3</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {s.tiers.map((t) => {
            const isAttained = s.currentTier >= t.tier;
            const isSelected = selectedTier === t.tier;
            return (
              <button
                key={t.tier}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(8);
                  setSelectedTier(t.tier);
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all ${
                  isSelected
                    ? "border-brand bg-snow shadow-pop ring-2 ring-brand/20 -translate-y-0.5"
                    : "border-silver bg-fog hover:bg-snow opacity-80"
                }`}
              >
                <span className="text-[11px] font-semibold text-smoke">المرحلة {t.tier}</span>
                <div className="h-9 w-9 flex items-center justify-center">
                  {t.tier === 1 ? <Tier1ShieldIcon size={28} /> : t.tier === 2 ? <Tier2StarIcon size={30} /> : <Tier3DiamondIcon size={32} />}
                </div>
                <span className="text-xs font-bold text-charcoal">{t.badgeTitle}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══ بطاقة تفاصيل المرحلة النشطة ═══ */}
      <AnimatePresence mode="wait">
        <motion.section
          key={activeTierData.tier}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="card flex flex-col gap-5 p-5 shadow-soft border-silver"
        >
          {/* عنوان المرحلة والشارة الكبيرة */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-silver/70">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fog border border-silver">
                {activeTierData.tier === 1 ? (
                  <Tier1ShieldIcon size={30} />
                ) : activeTierData.tier === 2 ? (
                  <Tier2StarIcon size={32} />
                ) : (
                  <Tier3DiamondIcon size={34} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-charcoal">{activeTierData.name}</h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${activeTierData.themeClass}`}>
                    {activeTierData.badgeTitle}
                  </span>
                </div>
                <p className="text-xs text-smoke mt-0.5">{activeTierData.subtitle}</p>
              </div>
            </div>

            {/* حالة الإنجاز */}
            <div className="text-end shrink-0">
              {activeTierData.attained ? (
                <span className="chip !h-8 px-3 text-xs font-bold bg-ok-tint text-ok-ink">
                  مكتمل ومفعّل ✓
                </span>
              ) : (
                <span className="chip !h-8 px-3 text-xs font-bold bg-brand-tint text-brand-ink">
                  {activeTierData.progressPct}٪ مكتمل
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-graphite leading-relaxed">{activeTierData.description}</p>

          {/* قائمة الشروط والمتطلبات مع أشرطة تقدّم ذكية */}
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-charcoal">
              <span>شروط ومعايير {activeTierData.name}</span>
              <span className="text-smoke">
                {activeTierData.requirements.filter((r) => r.done).length} من {activeTierData.requirements.length} مستوفاة
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {activeTierData.requirements.map((req) => {
                const Icon = ICONS[req.key] || Check;
                const pct = req.goal > 0 ? Math.min(100, Math.round((Number(req.current) / Number(req.goal)) * 100)) : (req.done ? 100 : 0);

                return (
                  <div
                    key={req.key}
                    className={`flex flex-col gap-1.5 p-3 rounded-xl border transition-all ${
                      req.done ? "border-ok/30 bg-ok-tint/30" : "border-silver bg-fog/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                            req.done ? "bg-ok text-snow" : "bg-mist text-smoke"
                          }`}
                        >
                          {req.done ? <Check size={14} /> : <Icon size={14} />}
                        </span>
                        <span className={`text-xs font-semibold truncate ${req.done ? "text-charcoal" : "text-graphite"}`}>
                          {req.label}
                        </span>
                      </div>

                      <span dir="ltr" className={`text-xs tabular-nums font-mono font-semibold ${req.done ? "text-ok-ink" : "text-smoke"}`}>
                        {req.current} / {req.goal} {req.unit || ""}
                      </span>
                    </div>

                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-mist mt-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          req.done ? "bg-ok" : "bg-brand"
                        }`}
                        style={{ width: `${req.done ? 100 : pct}%` }}
                      />
                    </div>

                    {!req.done && <p className="text-[11px] text-smoke mt-0.5">{req.hint}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* مزايا المرحلة المحددة */}
          <div className="flex flex-col gap-2 rounded-xl bg-fog p-4 border border-silver/80">
            <h4 className="flex items-center gap-1.5 text-xs font-bold text-charcoal">
              <Sparkles size={15} className="text-brand-ink" />
              مزايا تحصل عليها عند اعتماد {activeTierData.name}:
            </h4>
            <ul className="flex flex-col gap-1.5 mt-1">
              {activeTierData.perks.map((p, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-graphite">
                  <span className="text-ok font-bold mt-0.5">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* زر تقديم الطلب أو حالة التفعيل */}
          <div className="pt-2 border-t border-silver/70">
            {activeTierData.attained ? (
              <div className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-ok-tint text-ok-ink text-sm font-bold">
                <Check size={18} />
                <span>أنت حاصل على هذه المرحلة بالفعل وتظهر شارتها على حسابك!</span>
              </div>
            ) : activeTierData.eligible ? (
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold text-charcoal" htmlFor="t_note">
                  ملاحظة للمراجعة والاعتماد (اختياري)
                </label>
                <textarea
                  id="t_note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={400}
                  rows={2}
                  placeholder="أخبرنا بالمجالات أو المنصات التي تنشر فيها أعمالك…"
                  className="field !min-h-16 resize-none py-2 text-xs"
                />
                <button
                  onClick={(e) => handleSubmit(activeTierData.tier, e)}
                  disabled={busy}
                  className="btn btn-primary btn-lg w-full gap-2 font-bold shadow-pop"
                >
                  {busy ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>جارٍ التقديم والاعتماد…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>قدّم طلب اعتماد {activeTierData.name} الآن</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-mist text-graphite">
                <div className="flex items-center gap-2 text-xs">
                  <Lock size={16} className="text-smoke shrink-0" />
                  <span>
                    يتبقى استيفاء{" "}
                    <b>{activeTierData.requirements.filter((r) => !r.done).length}</b> متطلبات لفتح التقديم على هذه المرحلة.
                  </span>
                </div>
                <Link href="/new" className="btn btn-soft !min-h-9 !px-3 text-xs shrink-0">
                  انشر برومبت جديد
                </Link>
              </div>
            )}
          </div>
        </motion.section>
      </AnimatePresence>

      {/* ═══ بطاقة مقارنة المراحل الثلاث ═══ */}
      <section className="card flex flex-col gap-3 p-5 shadow-soft border-silver">
        <h2 className="flex items-center gap-2 text-base font-bold text-charcoal">
          <Award size={18} className="text-brand-ink" />
          مقارنة مراتب التوثيق في خيال
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-silver text-smoke">
                <th className="py-2 pe-3 text-start font-semibold">المرحلة</th>
                <th className="py-2 px-2 text-center font-semibold">الشارة</th>
                <th className="py-2 px-2 text-center font-semibold">المنشورات</th>
                <th className="py-2 px-2 text-center font-semibold">المتابعون</th>
                <th className="py-2 px-2 text-center font-semibold">الإعجابات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver/60">
              <tr className={s.currentTier === 1 ? "bg-sky-50/50 font-bold" : ""}>
                <td className="py-3 pe-3 text-charcoal">المرحلة 1: منشئ موثق</td>
                <td className="py-3 px-2 text-center">
                  <Tier1ShieldIcon size={18} />
                </td>
                <td className="py-3 px-2 text-center tabular-nums">5</td>
                <td className="py-3 px-2 text-center tabular-nums">10</td>
                <td className="py-3 px-2 text-center tabular-nums">30</td>
              </tr>
              <tr className={s.currentTier === 2 ? "bg-amber-50/50 font-bold" : ""}>
                <td className="py-3 pe-3 text-charcoal">المرحلة 2: مبدع معتمد</td>
                <td className="py-3 px-2 text-center">
                  <Tier2StarIcon size={19} />
                </td>
                <td className="py-3 px-2 text-center tabular-nums">25</td>
                <td className="py-3 px-2 text-center tabular-nums">75</td>
                <td className="py-3 px-2 text-center tabular-nums">250</td>
              </tr>
              <tr className={s.currentTier === 3 ? "bg-purple-50/50 font-bold" : ""}>
                <td className="py-3 pe-3 text-charcoal">المرحلة 3: شريك خيال</td>
                <td className="py-3 px-2 text-center">
                  <Tier3DiamondIcon size={20} />
                </td>
                <td className="py-3 px-2 text-center tabular-nums">75</td>
                <td className="py-3 px-2 text-center tabular-nums">300</td>
                <td className="py-3 px-2 text-center tabular-nums">1,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
