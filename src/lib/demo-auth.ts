/** وضع تجريبي يعمل بدون Supabase — للتجربة على Vercel قبل ضبط المفاتيح */

export type DemoUser = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  bio?: string;
};

const USER_KEY = "khiyal_demo_user";
const SESSION_KEY = "khiyal_demo_session";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") {
    return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    localStorage.getItem("khiyal_force_demo") === "1"
  );
}

export function getDemoUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  try {
    if (!localStorage.getItem(SESSION_KEY)) return null;
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as DemoUser) : null;
  } catch {
    return null;
  }
}

export function setDemoSession(user: DemoUser) {
  localStorage.setItem(SESSION_KEY, "1");
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearDemoSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_KEY);
}

export function updateDemoUser(patch: Partial<DemoUser>) {
  const u = getDemoUser();
  if (!u) return null;
  const next = { ...u, ...patch };
  localStorage.setItem(USER_KEY, JSON.stringify(next));
  return next;
}
