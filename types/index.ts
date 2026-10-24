// types/index.ts — أنواع مشتركة
export type Img = { url: string; w: number; h: number };
export type VerificationTier = 1 | 2 | 3;

export type Author = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  verified?: boolean;
  verification_tier?: VerificationTier | number | null;
  card_fx?: unknown;
};

export type TierRequirement = {
  key: string;
  label: string;
  current: number;
  goal: number;
  unit?: string;
  done: boolean;
  hint: string;
};

export type TierDefinition = {
  tier: VerificationTier;
  id: "creator" | "pro" | "elite";
  name: string;
  badgeTitle: string;
  subtitle: string;
  description: string;
  badgeType: "shield" | "star" | "diamond";
  accentColor: string;
  themeClass: string;
  requirements: TierRequirement[];
  perks: string[];
  eligible: boolean;
  attained: boolean;
  progressPct: number;
};

export type VerificationStats = {
  ok: boolean;
  reason?: string;
  verified: boolean;
  currentTier: 0 | 1 | 2 | 3;
  status: string | null;
  prompts: number;
  likes: number;
  followers: number;
  days: number;
  comments: number;
  copies: number;
  profileComplete: boolean;
  hasAvatar: boolean;
  hasBio: boolean;
  hasLinks: boolean;
  tiers: TierDefinition[];
  eligible: boolean;
  nextTier: VerificationTier | null;
};
export type PromptRow = {
  id: string; body: string; enhanced: string | null; model: string | null; images: Img[];
  like_count: number; comment_count: number; created_at: string; category_id: number | null;
  title?: string | null; tags?: string[] | null; author: Author; liked?: boolean; saved?: boolean; forked_from?: string | null; copy_count?: number; fork_count?: number;
  /** مقصوص من جهة الخادم (RPC prompt_gated): true إن كان باقي النص مخفياً بحسب المستوى */
  locked?: boolean; hidden?: number;
};

/** تحديات اليوم: تدور حسب رقم اليوم (بطاقة التحدي + الإشعار اليومي) */
export const CHALLENGES = [
  "لخّص مقالاً علمياً في ثلاث نقاط بسيطة", "ابتكر شخصية لقصة خيال علمي", "اطلب خطة تمرين منزلي لمدة أسبوع",
  "ولّد خمسة أسماء لمشروع ناشئ في مجال التعليم", "اكتب رسالة اعتذار مهذبة لعميل تأخر طلبه", "اشرح مفهوم الاستثمار لمراهق في دقيقة",
  "صمّم وصفة عشاء سريعة من مكونات متوفرة في أي بيت", "حوّل فكرة تطبيق إلى قائمة ميزات مرتبة بالأولوية", "اكتب وصف منتج جذاباً لقهوة مختصة",
  "ابنِ جدول مذاكرة لامتحان بعد أسبوعين", "اطلب نصائح لتحسين السيرة الذاتية لمطوّر مبتدئ", "اكتب مقدمة بودكاست عن التقنية",
  "ولّد أفكار محتوى لحساب تسويقي لمدة شهر", "ترجم فقرة تقنية إلى عربية سهلة"] as const;
export const challengeOf = (d: Date): string => CHALLENGES[Math.floor(d.getTime() / 86400000) % CHALLENGES.length];
