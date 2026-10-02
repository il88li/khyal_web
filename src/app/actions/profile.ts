"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateSchema = z.object({
  display_name: z.string().min(2).max(40).optional(),
  bio: z.string().max(300).optional(),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
});

export async function getProfile(userId?: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { profile: null, prompts: [], isOwn: false };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const id = userId || user?.id;
  if (!id) return { profile: null, prompts: [], isOwn: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  const { data: prompts } = await supabase
    .from("prompts")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(30);

  return {
    profile,
    prompts: prompts || [],
    isOwn: user?.id === id,
  };
}

export async function updateProfile(formData: FormData) {
  const raw = {
    display_name: (formData.get("display_name") as string) || undefined,
    bio: (formData.get("bio") as string) || undefined,
    username: (formData.get("username") as string) || undefined,
  };

  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { error: "بيانات غير صالحة" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const { error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { success: true };
}
