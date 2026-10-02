"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { signIn, signUp } from "@/app/actions/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isDemoMode, setDemoSession } from "@/lib/demo-auth";
import { opsLog } from "@/lib/ops-log";
import { motion } from "framer-motion";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const username = String(formData.get("username") || email.split("@")[0] || "user");
    const display_name = String(formData.get("display_name") || username);

    startTransition(async () => {
      if (isDemoMode() || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        if (password.length < 6) {
          setError("كلمة المرور 6 أحرف على الأقل");
          opsLog("auth.demo", "error", "password too short");
          return;
        }
        setDemoSession({
          id: `demo-${Date.now()}`,
          email,
          username: username.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24) || "user",
          display_name: display_name.slice(0, 40) || "مستخدم خيال",
          bio: "",
        });
        opsLog("auth.demo", "ok", mode);
        setSuccess("تم الدخول");
        setTimeout(() => router.push("/profile"), 350);
        return;
      }

      if (mode === "login") {
        const result = await signIn(formData);
        if (result?.error) {
          setError(result.error);
          opsLog("auth.login", "error", result.error);
        } else {
          opsLog("auth.login", "ok");
          router.push("/profile");
        }
      } else {
        const result = await signUp(formData);
        if (result?.error) {
          setError(result.error);
          opsLog("auth.signup", "error", result.error);
        } else if (result?.success) {
          opsLog("auth.signup", "ok");
          setSuccess(result.message || "تم التسجيل");
        }
      }
    });
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center px-5 max-w-[420px] mx-auto pb-nav">
      <motion.div
        className="w-full space-y-7"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#111] flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-bold">خ</span>
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight">خيال</h1>
          <p className="text-[15px] text-[#8b8b8b] leading-relaxed">
            {mode === "login" ? "مرحباً بعودتك" : "أنشئ حسابك وابدأ التحسين"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-elevated p-6 space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="section-label mb-1.5 block">اسم المستخدم</label>
                <input name="username" className="input-field" placeholder="username" dir="ltr" minLength={3} />
              </div>
              <div>
                <label className="section-label mb-1.5 block">الاسم المعروض</label>
                <input name="display_name" className="input-field" placeholder="اسمك" />
              </div>
            </>
          )}
          <div>
            <label className="section-label mb-1.5 block">البريد الإلكتروني</label>
            <input name="email" type="email" required className="input-field" placeholder="you@email.com" dir="ltr" />
          </div>
          <div>
            <label className="section-label mb-1.5 block">كلمة المرور</label>
            <input name="password" type="password" required minLength={6} className="input-field" dir="ltr" placeholder="••••••••" />
          </div>

          {error && (
            <p className="text-[13px] text-[#111] bg-[#f6f6f7] border border-[#ebebeb] rounded-[12px] px-3 py-2.5">
              {error}
            </p>
          )}
          {success && (
            <p className="text-[13px] text-[#111] bg-[#fff3ee] border border-[#ffd9c8] rounded-[12px] px-3 py-2.5">
              {success}
            </p>
          )}

          <Button type="submit" loading={pending} className="w-full" size="lg">
            {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
          </Button>
        </form>

        <div className="text-center space-y-3">
          <button
            type="button"
            className="text-[14px] font-medium text-[#3d3d3d] min-h-[44px]"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
              setSuccess("");
            }}
          >
            {mode === "login" ? "ليس لديك حساب؟ سجّل الآن" : "لديك حساب؟ ادخل"}
          </button>
          <Link href="/" className="block text-[13px] text-[#b0b0b0]">
            المتابعة كزائر
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
