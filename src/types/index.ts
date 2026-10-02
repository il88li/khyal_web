export type Category =
  | "writing"
  | "coding"
  | "design"
  | "marketing"
  | "education"
  | "translation"
  | "image"
  | "video"
  | "audio"
  | "business"
  | "creative";

export type Tone = "formal" | "friendly" | "technical" | "marketing" | "academic";
export type DetailLevel = "brief" | "balanced" | "detailed";
export type Language = "ar" | "en" | "bilingual";

export interface Prompt {
  id: string;
  user_id: string;
  original: string;
  enhanced: string;
  category: Category;
  tone: Tone;
  detail_level: DetailLevel;
  language: Language;
  images?: string[];
  likes_count: number;
  comments_count: number;
  saves_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
    display_name?: string;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  prompts_count: number;
  followers_count: number;
  following_count: number;
  created_at: string;
}

export interface EnhanceRequest {
  prompt: string;
  category: Category;
  tone: Tone;
  detail_level: DetailLevel;
  language: Language;
}

export interface EnhanceResponse {
  enhanced: string;
  model_used?: string; // only for admin analytics
  tokens_used?: number;
  remaining_quota: number;
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "writing", label: "كتابة" },
  { id: "coding", label: "برمجة" },
  { id: "design", label: "تصميم" },
  { id: "marketing", label: "تسويق" },
  { id: "education", label: "تعليم" },
  { id: "translation", label: "ترجمة" },
  { id: "image", label: "صور" },
  { id: "video", label: "فيديو" },
  { id: "audio", label: "صوت" },
  { id: "business", label: "أعمال" },
  { id: "creative", label: "إبداع" },
];

export const TONES: { id: Tone; label: string }[] = [
  { id: "formal", label: "رسمي" },
  { id: "friendly", label: "ودّي" },
  { id: "technical", label: "تقني" },
  { id: "marketing", label: "تسويقي" },
  { id: "academic", label: "أكاديمي" },
];

export const DETAIL_LEVELS: { id: DetailLevel; label: string }[] = [
  { id: "brief", label: "موجز" },
  { id: "balanced", label: "متوازن" },
  { id: "detailed", label: "مفصّل" },
];

export const LANGUAGES: { id: Language; label: string }[] = [
  { id: "ar", label: "عربي" },
  { id: "en", label: "إنجليزي" },
  { id: "bilingual", label: "ثنائي" },
];
