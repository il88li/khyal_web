"use client";

import { useCallback, useState } from "react";
import { copyText, sb, toast, uid } from "@/lib/supabase";

type PromptLike = { id: string; body: string; enhanced?: string | null; liked?: boolean; saved?: boolean; like_count: number };

export function usePromptActions(prompt: PromptLike) {
  const [liked, setLiked] = useState(!!prompt.liked);
  const [saved, setSaved] = useState(!!prompt.saved);
  const [likes, setLikes] = useState(prompt.like_count);
  const [busy, setBusy] = useState<"like" | "save" | null>(null);
  const text = prompt.enhanced || prompt.body;

  const toggle = useCallback(async (kind: "likes" | "saves") => {
    const id = await uid();
    if (!id) return toast("سجّل الدخول أولاً");
    const isLike = kind === "likes";
    const current = isLike ? liked : saved;
    const next = !current;
    setBusy(isLike ? "like" : "save");
    if (isLike) { setLiked(next); setLikes((n) => Math.max(0, n + (next ? 1 : -1))); }
    else setSaved(next);
    const key = { user_id: id, prompt_id: prompt.id };
    const { error } = next ? await sb.from(kind).insert(key) : await sb.from(kind).delete().match(key);
    setBusy(null);
    if (error && error.code !== "23505") {
      if (isLike) { setLiked(current); setLikes((n) => Math.max(0, n + (next ? -1 : 1))); }
      else setSaved(current);
      toast("تعذّر تنفيذ الإجراء");
      return;
    }
    toast(isLike ? (next ? "أُعجبك البرومبت" : "أُلغي الإعجاب") : (next ? "حُفظ" : "أُزيل من المحفوظات"));
  }, [liked, prompt.id, saved]);

  const copy = useCallback(async () => {
    await copyText(text);
    if (prompt.id !== "preview") sb.rpc("bump_copy", { p_id: prompt.id }).then(() => {}, () => {});
  }, [prompt.id, text]);

  const share = useCallback(async () => {
    const url = `${location.origin}/p/${prompt.id}`;
    try {
      if (navigator.share) await navigator.share({ title: "خيال", text: text.slice(0, 120), url });
      else { await navigator.clipboard.writeText(url); toast("نُسخ الرابط"); }
    } catch {}
  }, [prompt.id, text]);

  return { liked, saved, likes, busy, toggle, copy, share };
}
