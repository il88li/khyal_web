"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  prompt_id: z.string().uuid(),
  body: z.string().min(1).max(1000),
});

export async function addComment(promptId: string, body: string) {
  const parsed = schema.safeParse({ prompt_id: promptId, body });
  if (!parsed.success) return { error: "تعليق غير صالح" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const { data, error } = await supabase
    .from("comments")
    .insert({
      prompt_id: parsed.data.prompt_id,
      user_id: user.id,
      body: parsed.data.body.trim(),
    })
    .select("*, user:profiles(id, username, display_name, avatar_url)")
    .single();

  if (error) return { error: error.message };

  try {
    await supabase.rpc("increment_comments", { prompt_id: promptId });
  } catch {
    // non-blocking
  }
  revalidatePath(`/p/${promptId}`);
  return { comment: data };
}

export async function fetchComments(promptId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, user:profiles(id, username, display_name, avatar_url)")
    .eq("prompt_id", promptId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) return { error: error.message, comments: [] };
  return { comments: data || [] };
}

export async function deleteComment(commentId: string, promptId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "يجب تسجيل الدخول" };

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/p/${promptId}`);
  return { success: true };
}
