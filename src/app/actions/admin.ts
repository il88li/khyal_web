"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

function isAdminSession() {
  const cookieStore = cookies();
  return cookieStore.get("khiyal_admin")?.value === "1";
}

export async function getFeatureFlags() {
  if (!isAdminSession()) return { error: "غير مصرح", flags: {} };
  const supabase = createClient();
  const { data } = await supabase.from("feature_flags").select("*");
  const flags: Record<string, boolean> = {};
  (data || []).forEach((f: { key: string; enabled: boolean }) => {
    flags[f.key] = f.enabled;
  });
  return { flags };
}

export async function setFeatureFlag(key: string, enabled: boolean) {
  if (!isAdminSession()) return { error: "غير مصرح" };
  const supabase = createClient();
  const { error } = await supabase
    .from("feature_flags")
    .upsert({ key, enabled, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) return { error: error.message };

  await logAudit("feature_flag", { key, enabled });
  return { success: true };
}

export async function logAudit(action: string, meta: Record<string, unknown> = {}) {
  try {
    const supabase = createClient();
    await supabase.from("audit_log").insert({
      action,
      meta,
      created_at: new Date().toISOString(),
    });
  } catch {
    // non-blocking
  }
}

export async function getAuditLog(limit = 50) {
  if (!isAdminSession()) return { error: "غير مصرح", logs: [] };
  const supabase = createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { error: error.message, logs: [] };
  return { logs: data || [] };
}

export async function getAdminStats() {
  if (!isAdminSession()) return { error: "غير مصرح" };
  const supabase = createClient();

  const [users, prompts, usageToday, errors] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("prompts").select("id", { count: "exact", head: true }),
    supabase
      .from("usage")
      .select("count")
      .eq("date", new Date().toISOString().slice(0, 10)),
    supabase
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "error"),
  ]);

  const todayTotal = (usageToday.data || []).reduce(
    (s: number, r: { count: number }) => s + (r.count || 0),
    0
  );

  return {
    users: users.count ?? 0,
    prompts: prompts.count ?? 0,
    requestsToday: todayTotal,
    errors: errors.count ?? 0,
  };
}
