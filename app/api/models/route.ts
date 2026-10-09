// app/api/models/route.ts — قائمة النماذج المجانية الحالية من OpenRouter
import { activeModels } from "@/lib/server";
export async function GET() {
  return Response.json({ models: await activeModels() }, { headers: { "Cache-Control": "public, max-age=600" } });
}
