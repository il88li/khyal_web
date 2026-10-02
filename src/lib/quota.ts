import { createClient } from "@/lib/supabase/server";

const FREE_DAILY = 50;
const PAID_DAILY = 1000;

function getDailyLimit(isPaid: boolean) {
  return isPaid ? PAID_DAILY : FREE_DAILY;
}

export async function checkAndIncrementQuota(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Check if user has paid tier (simple: usage with high limit flag later)
  // For now everyone is free tier unless marked
  const limit = getDailyLimit(false); // paid tier later via subscription flag

  const { data: row } = await supabase
    .from("usage")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  const current = row?.count ?? 0;
  if (current >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  if (row) {
    await supabase
      .from("usage")
      .update({ count: current + 1 })
      .eq("id", row.id);
  } else {
    await supabase.from("usage").insert({
      user_id: userId,
      date: today,
      count: 1,
    });
  }

  return { allowed: true, remaining: limit - current - 1, limit };
}

export async function getRemainingQuota(userId: string): Promise<number> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("usage")
    .select("count")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();
  const used = data?.count ?? 0;
  return Math.max(0, FREE_DAILY - used);
}
