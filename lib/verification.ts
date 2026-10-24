"use client";
// lib/verification.ts — نظام التوثيق المتدرّج ثلاثي المراحل (Tier 1: الدرع السماوي · Tier 2: النجمة الذهبية · Tier 3: التاج الألماسي)
import { sb, toast, explain, uid } from "@/lib/supabase";
import type { TierDefinition, VerificationStats, VerificationTier } from "@/types";

export const TIERS_META = [
  {
    tier: 1 as const,
    id: "creator" as const,
    name: "المنشئ الموثّق",
    badgeTitle: "شارة التوثيق السماوية",
    subtitle: "المرحلة الأولى · إثبات الهوية والنشاط الأولي",
    description: "شارة الدرع السماوي اللامع تؤكد هوية المنشئ واكتمال ملفه الشخصي وبدء مساهمته الفاعلة في مجتمع خيال.",
    badgeType: "shield" as const,
    accentColor: "#0284c7",
    themeClass: "from-sky-500 to-cyan-600 text-sky-700 bg-sky-50 border-sky-200",
    goals: {
      profilePct: 100,
      prompts: 5,
      followers: 10,
      likes: 30,
      days: 3,
      comments: 0,
      copies: 0,
    },
    perks: [
      "شارة الدرع السماوي بجانب اسمك في كافة منشوراتك وملفك الشخصي.",
      "علامة توثيق واضحة في التعليقات وقوائم المتابعة.",
      "أولوية الظهور في نتائج البحث والاستكشاف السريع.",
      "حماية اسم الحساب والمحتوى من انتحال الشخصية.",
    ],
  },
  {
    tier: 2 as const,
    id: "pro" as const,
    name: "المبدع المعتمد",
    badgeTitle: "النجمة الذهبية المتلألئة",
    subtitle: "المرحلة الثانية · الجودة والتأثير المستمر",
    description: "شارة النجمة الذهبية الفاخرة تُمنح لصنّاع المحتوى الذين حققوا تفاعلاً عالياً ومحتوى متجدداً يحظى بثقة واسعة.",
    badgeType: "star" as const,
    accentColor: "#d97706",
    themeClass: "from-amber-500 to-yellow-600 text-amber-800 bg-amber-50 border-amber-200",
    goals: {
      profilePct: 100,
      prompts: 25,
      followers: 75,
      likes: 250,
      days: 14,
      comments: 10,
      copies: 30,
    },
    perks: [
      "الشارة النجمية الذهبية المتلألئة ذات التأثير الضوئي المعدني المميّز.",
      "ترشيح تلقائي لبرومبتاتك للظهور في تبويب «رائج» والخلاصات المقترحة.",
      "بطاقة مبدع تفاعلية تُعرض لزوّار صفحتك وفي المجتمع.",
      "أولوية في مراجعة التحديثات وفحص البلاغات وحماية المحتوى.",
    ],
  },
  {
    tier: 3 as const,
    id: "elite" as const,
    name: "شريك خيال النخبة",
    badgeTitle: "التاج الألماسي البنفسجي",
    subtitle: "المرحلة الثالثة · أعلى درجات الموثوقية والشراكة",
    description: "الشارة الماسية الملكية المتوهجة بتدرجات بنفسجي خيال، تُمثل نخبة المبدعين والشركاء الأساسيين الذين يقودون الإبداع في المنصة.",
    badgeType: "diamond" as const,
    accentColor: "#7c3aed",
    themeClass: "from-purple-600 via-fuchsia-600 to-pink-500 text-purple-900 bg-purple-50 border-purple-200",
    goals: {
      profilePct: 100,
      prompts: 75,
      followers: 300,
      likes: 1000,
      days: 30,
      comments: 25,
      copies: 150,
    },
    perks: [
      "الشارة الماسية الملكية المتوهجة بتأثير ضوئي بلوري هائل وتدرج لوني ساحر.",
      "صفة الشريك الرسمي المعتمد في مبادرات وفعاليات خيال.",
      "وصول حصري ومبكر لأحدث نماذج الذكاء الاصطناعي وأدوات التحسين المتقدمة.",
      "إمكانية تثبيت المنشورات وتخصيص غلاف الملف الشخصي المتقدم.",
      "قناة تواصل وتنسيق مباشرة مع فريق تطوير وإشراف خيال.",
    ],
  },
] as const;

/** يجلب شروط التوثيق الشاملة للمراحل الثلاث وحالة التقدّم الحالية للمستخدم */
export async function verificationStats(targetUserId?: string): Promise<VerificationStats | null> {
  const userId = targetUserId || (await uid());
  if (!userId) return null;

  try {
    // 1. جلب بيانات البروفايل
    const { data: profile } = await sb
      .from("profiles")
      .select("id,created_at,display_name,username,avatar_url,bio,links,verified,verification_tier")
      .eq("id", userId)
      .maybeSingle();

    const p = profile as any;
    const isVerified = !!p?.verified;
    const storedTier = Number(p?.verification_tier) || (isVerified ? 1 : 0);

    // فحص اكتمال الملف الشخصي
    const hasName = !!p?.display_name && p.display_name.trim().length >= 2;
    const hasUsername = !!p?.username && p.username.trim().length >= 3;
    const hasAvatar = !!p?.avatar_url && p.avatar_url.trim().length > 5;
    const hasBio = !!p?.bio && p.bio.trim().length >= 10;
    const hasLinks = Array.isArray(p?.links) && p.links.length > 0;

    let profileScore = 0;
    if (hasName) profileScore += 25;
    if (hasUsername) profileScore += 25;
    if (hasAvatar) profileScore += 25;
    if (hasBio) profileScore += 25;
    const profileComplete = profileScore >= 100;

    // 2. إحصاءات المنشورات والتفاعلات
    const { data: prompts } = await sb
      .from("prompts")
      .select("id,like_count,comment_count,copy_count,fork_count")
      .eq("author_id", userId);

    const promptList = (prompts ?? []) as any[];
    const promptsCount = promptList.length;
    const likesSum = promptList.reduce((acc, r) => acc + (Number(r.like_count) || 0), 0);
    const copiesSum = promptList.reduce((acc, r) => acc + (Number(r.copy_count) || 0) + (Number(r.fork_count) || 0), 0);

    // 3. عدد المتابعين الفعليين
    const { count: followersCount } = await sb
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId)
      .eq("status", "accepted");

    // 4. تعليقات المستخدم لمساعدة المجتمع
    const { count: commentsCount } = await sb
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("author_id", userId);

    // 5. عمر الحساب بالأيام
    const createdAt = p?.created_at ? new Date(p.created_at).getTime() : Date.now();
    const daysSinceCreation = Math.max(1, Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));

    // فحص طلبات التوثيق المعلقة
    let status: string | null = null;
    try {
      const { data: req } = await sb
        .from("verification_requests")
        .select("status,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (req) status = req.status;
    } catch {
      // قد لا يكون جدول الطلبات موجوداً بعد في بعض النسخ
    }

    // بناء بيانات المراحل الثلاث
    const tiers: TierDefinition[] = TIERS_META.map((meta) => {
      const g = meta.goals;
      const attained = storedTier >= meta.tier;

      const reqs = [
        {
          key: "profile",
          label: meta.tier === 1 ? "اكتمال الملف الشخصي (اسم وصورة ونبذة)" : "ملف شخصي مكتمل مع روابط المنصات",
          current: meta.tier === 1 ? profileScore : Math.min(100, profileScore + (hasLinks ? 20 : 0)),
          goal: 100,
          unit: "٪",
          done: meta.tier === 1 ? profileComplete : profileComplete && hasLinks,
          hint: meta.tier === 1 ? "أضف صورة واسماً ونبذة تعريفية في ملفك" : "أضف رابط حسابك أو موقعك في الإعدادات",
        },
        {
          key: "prompts",
          label: "برومبتات منشورة",
          current: promptsCount,
          goal: g.prompts,
          done: promptsCount >= g.prompts,
          hint: `انشر ${Math.max(0, g.prompts - promptsCount)} برومبتات إضافية`,
        },
        {
          key: "followers",
          label: "متابعون حقيقيون",
          current: followersCount ?? 0,
          goal: g.followers,
          done: (followersCount ?? 0) >= g.followers,
          hint: `تحتاج ${Math.max(0, g.followers - (followersCount ?? 0))} متابعاً إضافياً`,
        },
        {
          key: "likes",
          label: "إعجابات وتفاعلات مستلمة",
          current: likesSum,
          goal: g.likes,
          done: likesSum >= g.likes,
          hint: `اجمع ${Math.max(0, g.likes - likesSum)} إعجاباً وتفاعلاً`,
        },
        {
          key: "days",
          label: "أيام منذ إنشاء الحساب",
          current: daysSinceCreation,
          goal: g.days,
          unit: "يوم",
          done: daysSinceCreation >= g.days,
          hint: `عمر حسابك ${daysSinceCreation} يوماً (المطلوب ${g.days})`,
        },
      ];

      if (g.comments > 0) {
        reqs.push({
          key: "comments",
          label: "مشاركات ومساعدة بالتعليقات",
          current: commentsCount ?? 0,
          goal: g.comments,
          unit: "تعليق",
          done: (commentsCount ?? 0) >= g.comments,
          hint: `شارك في نقاشات مجتمع خيال (${commentsCount ?? 0}/${g.comments})`,
        });
      }

      if (g.copies > 0) {
        reqs.push({
          key: "copies",
          label: "مرات نسخ وتفريع لبرومبتاتك",
          current: copiesSum,
          goal: g.copies,
          unit: "مرة",
          done: copiesSum >= g.copies,
          hint: `معدل فائدة المحتوى للآخرين (${copiesSum}/${g.copies})`,
        });
      }

      const doneCount = reqs.filter((r) => r.done).length;
      const progressPct = Math.round((doneCount / reqs.length) * 100);
      const eligible = reqs.every((r) => r.done);

      return {
        tier: meta.tier,
        id: meta.id,
        name: meta.name,
        badgeTitle: meta.badgeTitle,
        subtitle: meta.subtitle,
        description: meta.description,
        badgeType: meta.badgeType,
        accentColor: meta.accentColor,
        themeClass: meta.themeClass,
        requirements: reqs,
        perks: [...meta.perks],
        eligible,
        attained,
        progressPct,
      };
    });

    // أعلى مرحلة يستحقها المستخدم
    let calculatedTier: 0 | 1 | 2 | 3 = storedTier as any;
    if (storedTier === 0) {
      if (tiers[2].eligible) calculatedTier = 3;
      else if (tiers[1].eligible) calculatedTier = 2;
      else if (tiers[0].eligible) calculatedTier = 1;
    }

    const nextTier = (calculatedTier < 3 ? (calculatedTier + 1) as VerificationTier : null);

    return {
      ok: true,
      verified: isVerified || calculatedTier > 0,
      currentTier: calculatedTier,
      status: status || (calculatedTier > 0 ? "approved" : "none"),
      prompts: promptsCount,
      likes: likesSum,
      followers: followersCount ?? 0,
      days: daysSinceCreation,
      comments: commentsCount ?? 0,
      copies: copiesSum,
      profileComplete,
      hasAvatar,
      hasBio,
      hasLinks,
      tiers,
      eligible: tiers.some((t) => t.eligible && !t.attained),
      nextTier,
    };
  } catch (err) {
    console.error("[verificationStats]", err);
    return null;
  }
}

/** تقديم طلب ترقية أو توثيق لمرحلة معينة */
export async function requestVerification(tier: VerificationTier = 1, note?: string): Promise<{ ok: boolean; message: string }> {
  const user = (await sb.auth.getSession()).data.session?.user;
  if (!user) {
    toast("سجّل الدخول أولاً للمتابعة", "error");
    return { ok: false, message: "auth_required" };
  }

  try {
    const stats = await verificationStats(user.id);
    if (!stats) throw new Error("تعذّر قراءة إحصاءات الحساب.");

    const targetTierInfo = stats.tiers.find((t) => t.tier === tier);
    if (!targetTierInfo) throw new Error("المرحلة المحددة غير صحيحة.");

    if (stats.currentTier >= tier) {
      toast(`أنت حاصل بالفعل على ${targetTierInfo.name} ✓`, "info");
      return { ok: true, message: "already_attained" };
    }

    if (!targetTierInfo.eligible) {
      const missing = targetTierInfo.requirements.filter((r) => !r.done).map((r) => r.label).join("، ");
      toast(`لم تكتمل جميع شروط ${targetTierInfo.name} بعد: ${missing}`, "error");
      return { ok: false, message: "not_eligible" };
    }

    // تُرسل الطلب للمراجعة فقط؛ الترقية الفعلية (verified/verification_tier) يعتمدها الأدمن من الخادم
    const { error: reqErr } = await sb.from("verification_requests").insert({
      user_id: user.id,
      kind: `tier_${tier}`,
      note: note?.trim() || null,
      status: "pending",
    });
    if (reqErr) {
      if ((reqErr as any).code === "23505") {
        toast("لديك طلب قيد المراجعة بالفعل", "info");
        return { ok: true, message: "pending" };
      }
      throw reqErr;
    }

    toast(`تم إرسال طلب ${targetTierInfo.name} للمراجعة ✓`, "success");
    return { ok: true, message: "submitted" };
  } catch (e: any) {
    const msg = explain(e);
    toast(msg, "error");
    return { ok: false, message: msg };
  }
}
