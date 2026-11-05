import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { activeModels, buildMessages, completeText, getSettings, logError, rateHit } from "@/lib/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const store = cookies();
  const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => store.getAll(), setAll: () => {} } });
  const { data: { user } } = await auth.auth.getUser();
  const key = user?.id ?? ((req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim() || "local");
  const gate = await rateHit(`compare:${key}`, user ? 3 : 1, 3600);
  if (gate.durable && !gate.ok) return Response.json({ error: "rate_limited" }, { status: 429 });
  const cfg = await getSettings();
  if (cfg.flags?.enhancer === false) return Response.json({ error: "disabled" }, { status: 503 });
  const b = await req.json().catch(() => null);
  if (!b?.text || String(b.text).length > 8000) return Response.json({ error: "bad_input" }, { status: 400 });
  try {
    const models = await activeModels();
    const messages = buildMessages({ text: String(b.text), category: b.category ?? "عام", lang: b.lang ?? "عربي", tone: b.tone ?? "ودّي", detail: b.detail ?? "متوازن" });
    const [a, z] = await Promise.all([completeText(messages, 900, models[0]), completeText(messages, 900, models[1] ?? models[0])]);
    return Response.json({ first: a.text, second: z.text });
  } catch (e: any) {
    await logError("compare-free", String(e?.message ?? e));
    return Response.json({ error: "compare_failed" }, { status: 503 });
  }
}
