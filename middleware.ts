// middleware.ts — حماية المسارات: غير المسجّل → /auth
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/welcome", "/splash", "/.well-known", "/offline", "/auth", "/p/", "/manifest", "/icons", "/sw.js", "/robots", "/safety"];
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();
  const p = req.nextUrl.pathname;
  // واجهة الإدارة: مدخلها كلمة مرور الخادم فقط — لا رابط ولا إيماء داخل التطبيق، ولا فهرسة في محركات البحث
  if (p.startsWith("/admin")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.headers.set("Referrer-Policy", "no-referrer");
    res.headers.set("Cache-Control", "no-store");
  }
  const isPublic = PUBLIC.some((x) => p.startsWith(x));
  if (!user && !isPublic) return NextResponse.redirect(new URL("/welcome", req.url));
  if (user && (p === "/auth" || p === "/welcome")) return NextResponse.redirect(new URL("/", req.url));
  return res;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"] };
