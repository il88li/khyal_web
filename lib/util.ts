// lib/util.ts — دوال مساعدة صغيرة مشتركة (بلا اعتماد على React أو Supabase)

/** يحصر القيمة بين حدّين (الافتراضي 0..1) */
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
