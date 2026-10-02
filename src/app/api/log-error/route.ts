import { NextRequest, NextResponse } from "next/server";

// سجل بسيط في الذاكرة (للمعاينة) — في الإنتاج يُفضّل جدول audit_log
const buffer: Array<Record<string, unknown>> = [];
const MAX = 200;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    buffer.unshift({
      ...body,
      ip: req.headers.get("x-forwarded-for") || "unknown",
      receivedAt: new Date().toISOString(),
    });
    if (buffer.length > MAX) buffer.length = MAX;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ logs: buffer.slice(0, 50) });
}
