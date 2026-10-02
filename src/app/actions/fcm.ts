"use server";

import { createClient } from "@/lib/supabase/server";

export async function registerFcmToken(token: string, platform = "android") {
  if (!token || token.length < 20) return { error: "توكن غير صالح" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const { error } = await supabase.from("fcm_tokens").upsert(
    {
      user_id: user.id,
      token,
      platform,
    },
    { onConflict: "token" }
  );

  if (error) return { error: error.message };
  return { success: true };
}
