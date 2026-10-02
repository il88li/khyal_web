"use client";

import Link from "next/link";
import { ChevronLeft, Bell, Info, LogOut, Moon, Bookmark } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { useTransition } from "react";
import { useAppStore } from "@/store/useAppStore";
import { setupNotifications } from "@/lib/fcm-client";
import { useState } from "react";

export default function SettingsPage() {
  const [pending, startTransition] = useTransition();
  const { reducedMotion, setReducedMotion } = useAppStore();
  const [notifMsg, setNotifMsg] = useState("");

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  return (
    <div className="max-w-page mx-auto">
      <header className="sticky top-0 z-20 bg-canvas border-b border-gridline px-5 h-14 flex items-center gap-3 pt-safe">
        <Link href="/profile" className="min-h-touch min-w-[44px] flex items-center justify-center">
          <ChevronLeft size={22} className="rotate-180" />
        </Link>
        <h1 className="text-19 font-semibold text-ink">الإعدادات</h1>
      </header>

      <div className="px-5 py-4 space-y-6">
        <div>
          <h2 className="text-13 text-slate font-medium mb-2 px-1">الحساب</h2>
          <div className="card overflow-hidden divide-y divide-silver">
            <Link
              href="/profile/edit"
              className="flex items-center justify-between px-4 min-h-[52px] text-15 text-ink active:bg-vellum"
            >
              <span>تعديل الملف الشخصي</span>
              <ChevronLeft size={18} className="text-ash rotate-180" />
            </Link>
            <Link
              href="/saved"
              className="flex items-center justify-between px-4 min-h-[52px] text-15 text-ink active:bg-vellum"
            >
              <span className="flex items-center gap-3">
                <Bookmark size={18} className="text-graphite" />
                المحفوظات
              </span>
              <ChevronLeft size={18} className="text-ash rotate-180" />
            </Link>
            <Link
              href="/auth"
              className="flex items-center justify-between px-4 min-h-[52px] text-15 text-ink active:bg-vellum"
            >
              <span>تسجيل الدخول / حساب جديد</span>
              <ChevronLeft size={18} className="text-ash rotate-180" />
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-13 text-slate font-medium mb-2 px-1">التطبيق</h2>
          <div className="card overflow-hidden divide-y divide-silver">
            <button
              type="button"
              onClick={async () => {
                const res = await setupNotifications();
                setNotifMsg(res.ok ? "تم تفعيل الإشعارات" : res.error || "تعذّر التفعيل");
              }}
              className="flex items-center justify-between w-full px-4 min-h-[52px] text-15 text-ink active:bg-vellum"
            >
              <span className="flex items-center gap-3">
                <Bell size={18} className="text-graphite" />
                الإشعارات
              </span>
              <span className="text-13 text-ash">{notifMsg || "تفعيل"}</span>
            </button>
            <button
              type="button"
              onClick={() => setReducedMotion(!reducedMotion)}
              className="flex items-center justify-between w-full px-4 min-h-[52px] text-15 text-ink active:bg-vellum"
            >
              <span className="flex items-center gap-3">
                <Moon size={18} className="text-graphite" />
                تخفيف الحركات
              </span>
              <span
                className={`w-10 h-6 rounded-pill border border-gridline transition-colors ${
                  reducedMotion ? "bg-charcoal" : "bg-vellum"
                }`}
              >
                <span
                  className={`block w-5 h-5 mt-0.5 rounded-full bg-canvas border border-gridline transition-transform ${
                    reducedMotion ? "translate-x-[-18px]" : "translate-x-[-2px]"
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 w-full px-4 min-h-[52px] text-15 text-ink">
            <Info size={18} className="text-graphite" />
            الإصدار
            <span className="mr-auto text-13 text-slate">v1.0.0</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={pending}
            className="flex items-center gap-3 w-full px-4 min-h-[52px] text-15 text-ink active:bg-vellum border-t border-gridline"
          >
            <LogOut size={18} />
            {pending ? "جارٍ الخروج..." : "تسجيل الخروج"}
          </button>
        </div>

        <p className="text-center text-13 text-ash py-4">خيال — منصة عربية لتحسين البرومبتات</p>
      </div>
    </div>
  );
}
