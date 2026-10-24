// app/api/payment/webhook/route.ts — يستقبل إشعار مزوّد الدفع ويحدّث خطة المستخدم (free ⇄ pro).
// الجسم: { ref: "<user uuid>", status: "active" | "canceled" | "expired" } — ref هو ما يمرّره /api/plan إلى رابط الدفع.
// الأمان: ترويسة x-webhook-secret = PAYMENT_WEBHOOK_SECRET (مقارنة ثابتة الزمن). التحديث عبر service role فقط
// (مشغّل profiles_protect_privileged يمنع أي تغيير للخطة من جهة العميل).
import { createHash, timingSafeEqual } from "node:crypto";
import { audit, svc } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const same = (a: string, b: string) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

export async function POST(req: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || !same(req.headers.get("x-webhook-secret") ?? "", secret)) return new Response("unauthorized", { status: 401 });

  const b = await req.json().catch(() => null) as { ref?: unknown; status?: unknown } | null;
  const ref = typeof b?.ref === "string" ? b.ref : "";
  const status = typeof b?.status === "string" ? b.status : "";
  if (!UUID.test(ref)) return Response.json({ error: "bad_ref" }, { status: 400 });
  if (!["active", "canceled", "expired"].includes(status)) return Response.json({ error: "bad_status" }, { status: 400 });

  const plan = status === "active" ? "pro" : "free";
  const { error } = await svc().from("profiles").update({ plan }).eq("id", ref);
  if (error) return Response.json({ error: "failed" }, { status: 500 });
  await audit("payment", `plan:${plan}`, ref, { status });
  return Response.json({ ok: true, plan });
}
