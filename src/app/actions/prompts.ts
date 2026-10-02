"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function hasSupabase() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const publishSchema = z.object({
  original: z.string().min(1).max(8000),
  enhanced: z.string().min(1).max(16000),
  category: z.string(),
  tone: z.string(),
  detail_level: z.string(),
  language: z.string(),
  images: z.array(z.string()).optional(),
});

export async function toggleLike(promptId: string) {
  if (!hasSupabase()) return { error: "قاعدة البيانات غير مضبوطة" };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const { data: existing } = await supabase
    .from("likes")
    .select("*")
    .eq("user_id", user.id)
    .eq("prompt_id", promptId)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("user_id", user.id).eq("prompt_id", promptId);
    try {
      await supabase.rpc("decrement_likes", { prompt_id: promptId });
    } catch {
      /* non-blocking */
    }
    revalidatePath("/");
    revalidatePath(`/p/${promptId}`);
    return { liked: false };
  }

  await supabase.from("likes").insert({ user_id: user.id, prompt_id: promptId });
  try {
    await supabase.rpc("increment_likes", { prompt_id: promptId });
  } catch {
    /* non-blocking */
  }
  revalidatePath("/");
  revalidatePath(`/p/${promptId}`);
  return { liked: true };
}

export async function toggleSave(promptId: string) {
  if (!hasSupabase()) return { error: "قاعدة البيانات غير مضبوطة" };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const { data: existing } = await supabase
    .from("saves")
    .select("*")
    .eq("user_id", user.id)
    .eq("prompt_id", promptId)
    .maybeSingle();

  if (existing) {
    await supabase.from("saves").delete().eq("user_id", user.id).eq("prompt_id", promptId);
    revalidatePath("/");
    return { saved: false };
  }

  await supabase.from("saves").insert({ user_id: user.id, prompt_id: promptId });
  revalidatePath("/");
  return { saved: true };
}

export async function publishPrompt(data: z.infer<typeof publishSchema>) {
  const parsed = publishSchema.safeParse(data);
  if (!parsed.success) return { error: "بيانات غير صالحة" };
  if (!hasSupabase()) return { error: "قاعدة البيانات غير مضبوطة — اضبط Supabase أولاً" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "يجب تسجيل الدخول للنشر" };

  const { data: prompt, error } = await supabase
    .from("prompts")
    .insert({
      user_id: user.id,
      original: parsed.data.original,
      enhanced: parsed.data.enhanced,
      category: parsed.data.category,
      tone: parsed.data.tone,
      detail_level: parsed.data.detail_level,
      language: parsed.data.language,
      images: parsed.data.images || [],
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/profile");
  return { success: true, id: prompt.id };
}

export async function fetchPrompts(page = 0, limit = 10, tab = "for-you") {
  if (!hasSupabase()) {
    return { prompts: [], error: "supabase_not_configured" };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("prompts")
    .select("*, user:profiles(id, username, display_name, avatar_url)")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (tab === "trending") {
    query = supabase
      .from("prompts")
      .select("*, user:profiles(id, username, display_name, avatar_url)")
      .eq("is_public", true)
      .order("likes_count", { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);
  }

  if (tab === "categories") {
    // same public feed; client filters by category chips
  }

  const { data, error } = await query;
  if (error) return { error: error.message, prompts: [] };

  let prompts = data || [];

  // Attach is_liked / is_saved for current user
  if (user && prompts.length) {
    const ids = prompts.map((p: { id: string }) => p.id);
    const [{ data: likes }, { data: saves }] = await Promise.all([
      supabase.from("likes").select("prompt_id").eq("user_id", user.id).in("prompt_id", ids),
      supabase.from("saves").select("prompt_id").eq("user_id", user.id).in("prompt_id", ids),
    ]);
    const likedSet = new Set((likes || []).map((l: { prompt_id: string }) => l.prompt_id));
    const savedSet = new Set((saves || []).map((s: { prompt_id: string }) => s.prompt_id));
    prompts = prompts.map((p: { id: string }) => ({
      ...p,
      is_liked: likedSet.has(p.id),
      is_saved: savedSet.has(p.id),
    }));
  }

  return { prompts };
}

export async function fetchPromptById(id: string) {
  if (!hasSupabase()) return { prompt: null, error: "supabase_not_configured" };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("prompts")
    .select("*, user:profiles(id, username, display_name, avatar_url)")
    .eq("id", id)
    .maybeSingle();

  if (error) return { prompt: null, error: error.message };
  if (!data) return { prompt: null, error: "not_found" };

  let prompt = data;
  if (user) {
    const [{ data: like }, { data: save }] = await Promise.all([
      supabase
        .from("likes")
        .select("prompt_id")
        .eq("user_id", user.id)
        .eq("prompt_id", id)
        .maybeSingle(),
      supabase
        .from("saves")
        .select("prompt_id")
        .eq("user_id", user.id)
        .eq("prompt_id", id)
        .maybeSingle(),
    ]);
    prompt = {
      ...prompt,
      is_liked: Boolean(like),
      is_saved: Boolean(save),
    };
  }

  return { prompt, currentUserId: user?.id };
}

export async function fetchSavedPrompts() {
  if (!hasSupabase()) return { prompts: [], error: "supabase_not_configured" };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { prompts: [], error: "auth_required" };

  const { data: saves } = await supabase
    .from("saves")
    .select("prompt_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const ids = (saves || []).map((s: { prompt_id: string }) => s.prompt_id);
  if (!ids.length) return { prompts: [] };

  const { data, error } = await supabase
    .from("prompts")
    .select("*, user:profiles(id, username, display_name, avatar_url)")
    .in("id", ids);

  if (error) return { prompts: [], error: error.message };
  return {
    prompts: (data || []).map((p: { id: string }) => ({
      ...p,
      is_saved: true,
    })),
  };
}

export async function deletePrompt(promptId: string) {
  if (!hasSupabase()) return { error: "غير متاح" };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const { error } = await supabase
    .from("prompts")
    .delete()
    .eq("id", promptId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/profile");
  return { success: true };
}
