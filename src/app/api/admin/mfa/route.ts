import { NextRequest, NextResponse } from "next/server";
import { verifyAdminMfa } from "@/lib/admin-mfa";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    if (cookieStore.get("khiyal_admin")?.value !== "1") {
      return NextResponse.json({ error: "جلسة غير صالحة" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code || !verifyAdminMfa(String(code))) {
      return NextResponse.json({ error: "رمز التحقق غير صحيح" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("khiyal_admin_mfa", "1", {
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
