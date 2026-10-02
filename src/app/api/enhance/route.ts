import { NextRequest } from "next/server";
import { enhancePromptStream } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { checkAndIncrementQuota } from "@/lib/quota";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(1).max(8000),
  category: z.string(),
  tone: z.string(),
  detail_level: z.string(),
  language: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "مدخلات غير صالحة" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const hasSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    let user: { id: string } | null = null;
    let supabase: ReturnType<typeof createClient> | null = null;

    if (hasSupabase) {
      supabase = createClient();
      const auth = await supabase.auth.getUser();
      user = auth.data.user;
    }

    let remainingQuota = 50;

    if (user && supabase) {
      const quota = await checkAndIncrementQuota(user.id);
      if (!quota.allowed) {
        return new Response(
          JSON.stringify({
            error: `انتهت حصتك اليومية (${quota.limit} طلب). عد غداً أو رقِّ حسابك.`,
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
      remainingQuota = quota.remaining;
    } else {
      remainingQuota = 50;
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of enhancePromptStream(parsed.data)) {
            if (chunk.error) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: chunk.error })}\n\n`)
              );
              break;
            }
            if (chunk.content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`)
              );
            }
            if (chunk.done) {
              // Store model for admin analytics only
              if (user && chunk.model && supabase) {
                const today = new Date().toISOString().slice(0, 10);
                try {
                  await supabase
                    .from("usage")
                    .update({ model_used: chunk.model })
                    .eq("user_id", user.id)
                    .eq("date", today);
                } catch {
                  // non-blocking analytics
                }
              }
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    done: true,
                    remaining_quota: remainingQuota,
                  })}\n\n`
                )
              );
            }
          }
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "خطأ داخلي في الخادم" })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "طلب غير صالح" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
