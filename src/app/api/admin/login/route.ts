import { NextRequest, NextResponse } from "next/server";

// In-memory rate limit (use Redis in production)
const attempts = new Map<string, { count: number; lockedUntil: number }>();

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const now = Date.now();
    const entry = attempts.get(ip) || { count: 0, lockedUntil: 0 };

    if (entry.lockedUntil > now) {
      const mins = Math.ceil((entry.lockedUntil - now) / 60000);
      return NextResponse.json(
        { error: `محاولات كثيرة. حاول بعد ${mins} دقيقة` },
        { status: 429 }
      );
    }

    const { password } = await req.json();
    const expected = process.env.ADMIN_PASSWORD || "khiyal-admin-2026";

    if (!password || password !== expected) {
      entry.count += 1;
      if (entry.count >= 5) {
        entry.lockedUntil = now + 15 * 60 * 1000; // 15 min
        entry.count = 0;
      }
      attempts.set(ip, entry);
      return NextResponse.json({ error: "كلمة المرور غير صحيحة" }, { status: 401 });
    }

    attempts.delete(ip);

    const res = NextResponse.json({ ok: true });
    res.cookies.set("khiyal_admin", "1", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
}
