// app/api/enhance/route.ts — بث SSE للبرومبت المحسّن (نماذج مجانية + fallback)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { buildMessages, getSettings, logError, streamEnhance, svc } from "@/lib/server";

export const runtime = "nodejs";
const hits = new Map<string, number[]>(); // rate limit بسيط: 10 طلبات/دقيقة (استبدله بـ Upstash عند التوسع)

export async function POST(req: Request) {
  const store = cookies();
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => store.getAll(), setAll: () => {} },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const cfg = await getSettings();
  if (cfg.flags?.enhancer === false) return Response.json({ error: "disabled" }, { status: 503 });
  const limit = cfg.rate ?? 10;
  let allowed: any = true, rlErr: any = null;
  try { ({ data: allowed, error: rlErr } = await svc().rpc("rate_hit", { p_user: user.id, p_limit: limit })); } catch (e) { rlErr = e; } // دائم عبر Postgres
  if (rlErr) { // احتياطي إن لم يُنفَّذ SQL بعد: ذاكرة المثيل
    const now = Date.now(), recent = (hits.get(user.id) ?? []).filter((t) => now - t < 60_000);
    if (recent.length >= limit) return Response.json({ error: "rate_limited" }, { status: 429 });
    hits.set(user.id, [...recent, now]);
  } else if (!allowed) return Response.json({ error: "rate_limited" }, { status: 429 });

  const b = await req.json();
  if (!b?.text || String(b.text).length > 8000) return Response.json({ error: "bad_input" }, { status: 400 });

  try {
    const { body, model } = await streamEnhance(
      buildMessages({
        text: b.text,
        category: b.category ?? "عام",
        lang: b.lang ?? "عربي",
        tone: b.tone ?? "ودّي",
        detail: b.detail ?? "متوازن",
      }),
      b.model,
      b.onlyFree !== false
    );
    try { svc().from("usage").insert({ user_id: user.id, model }).then(() => {}, () => {}); } catch {}
    return new Response(body, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Model-Used": model },
    });
  } catch (e: any) {
    console.error("[enhance]", e.message);
    logError("enhance", e.message);
    return Response.json({ error: "all_models_failed", detail: String(e.message ?? "").slice(0, 240) }, { status: 503 });
  }
}
