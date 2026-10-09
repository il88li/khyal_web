// app/api/compare/route.ts — المختبر: يشغّل 2–4 نماذج على نفس البرومبت في طلب واحد ويبثّ نتائجها متوازية (SSE)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { activeModels, buildMessages, getSettings, logError, openRouterStream, svc } from "@/lib/server";

export const runtime = "nodejs";
const hits = new Map<string, number[]>(); // حد الطلبات نفسه: 10 مقارنات/دقيقة (استبدله بـ Upstash عند التوسع)
const MAX = 4, MIN = 2;

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
  try { ({ data: allowed, error: rlErr } = await svc().rpc("rate_hit", { p_user: user.id, p_limit: limit })); } catch (e) { rlErr = e; }
  if (rlErr) { // احتياطي إن لم يُنفَّذ SQL بعد: ذاكرة المثيل
    const now = Date.now(), recent = (hits.get(user.id) ?? []).filter((t) => now - t < 60_000);
    if (recent.length >= limit) return Response.json({ error: "rate_limited" }, { status: 429 });
    hits.set(user.id, [...recent, now]);
  } else if (!allowed) return Response.json({ error: "rate_limited" }, { status: 429 });

  const b = await req.json().catch(() => ({}));
  const text = String(b?.text ?? "");
  if (!text.trim() || text.length > 8000) return Response.json({ error: "bad_input" }, { status: 400 });
  // لا يقبل إلا نموذجاً مجانياً من القائمة الفعّالة (حماية من تكليف مفاتيح مدفوعة)
  const pool = await activeModels();
  const requested: string[] = (Array.isArray(b?.models) ? b.models : []).map((m: unknown) => String(m));
  const models = Array.from(new Set(requested)).filter((m) => pool.includes(m) || m === "openrouter/free");
  if (models.length < MIN || models.length > MAX) return Response.json({ error: "bad_models", detail: `اختر من ${MIN} نماذج إلى ${MAX}` }, { status: 400 });

  const messages = buildMessages({ text, category: b?.category ?? "عام", lang: b?.lang ?? "عربي", tone: b?.tone ?? "ودّي", detail: b?.detail ?? "متوازن" });
  const ac = new AbortController(); // يُلغى كل البث إن غادر المستخدم الصفحة
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => { try { controller.enqueue(enc.encode(`data: ${JSON.stringify(o)}\n\n`)); } catch { /* المغلق */ } };
      const run = async (model: string) => {
        try {
          const body = await openRouterStream(model, messages, ac.signal);
          send({ model, started: true });
          const reader = body.getReader(), dec = new TextDecoder();
          let buf = "";
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n"); buf = lines.pop() ?? "";
            for (const l of lines) {
              if (!l.startsWith("data: ") || l.includes("[DONE]")) continue;
              let j: any; try { j = JSON.parse(l.slice(6)); } catch { continue; }
              const d = j.choices?.[0]?.delta?.content;
              if (d) send({ model, delta: d });
            }
          }
          send({ model, done: true });
        } catch (e: any) {
          if (!ac.signal.aborted) { logError("compare", String(e?.message ?? e).slice(0, 300)); send({ model, error: "تعذّر التوليد بهذا النموذج الآن" }); }
        }
      };
      await Promise.allSettled(models.map(run));
      send({ all_done: true });
      try { controller.close(); } catch { /* المغلق */ }
    },
    cancel() { ac.abort(); },
  });
  try { svc().from("usage").insert({ user_id: user.id, model: models.join(",") }).then(() => {}, () => {}); } catch {}
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
}
