"use client";

import { useEffect, useState, useRef } from "react";
import { Settings, Share2, Grid3X3 } from "lucide-react";
import Link from "next/link";
import { getProfile } from "@/app/actions/profile";
import { PromptCard } from "@/components/feed/PromptCard";
import { Prompt } from "@/types";
import { getDemoUser, clearDemoSession } from "@/lib/demo-auth";
import { opsLog } from "@/lib/ops-log";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const [profile, setProfile] = useState<{
    display_name?: string;
    username?: string;
    bio?: string;
    avatar_url?: string;
  } | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwn, setIsOwn] = useState(false);
  const versionTaps = useRef(0);

  useEffect(() => {
    const demo = getDemoUser();
    if (demo) {
      setProfile({
        display_name: demo.display_name,
        username: demo.username,
        bio: demo.bio || "مستخدم خيال",
      });
      setIsOwn(true);
      try {
        const local = JSON.parse(localStorage.getItem("khiyal_local_prompts") || "[]") as Prompt[];
        setPrompts(local.filter((p) => p.user_id === demo.id || p.user?.username === demo.username));
      } catch {
        setPrompts([]);
      }
      setLoading(false);
      opsLog("profile.demo", "ok");
      return;
    }

    getProfile().then((res) => {
      if (res.profile) {
        setProfile(res.profile);
        setIsOwn(!!res.isOwn);
        setPrompts((res.prompts as Prompt[]) || []);
      }
      setLoading(false);
      opsLog("profile.load", res.profile ? "ok" : "info", "no profile");
    });
  }, []);

  const displayName = profile?.display_name || profile?.username || "زائر";

  return (
    <div className="max-w-page mx-auto">
      <header className="page-header pt-safe">
        <h1 className="text-19 font-semibold">حسابي</h1>
        <div className="flex items-center gap-1">
          {isOwn && (
            <Link href="/profile/edit" className="text-13 text-[#8a8a8a] min-h-touch px-2 flex items-center">
              تعديل
            </Link>
          )}
          <Link href="/settings" className="min-h-touch min-w-[44px] flex items-center justify-center">
            <Settings size={22} />
          </Link>
        </div>
      </header>

      <div className="px-5 py-6 space-y-5">
        {/* بطاقة بروفايل بأسلوب المرجع */}
        <div className="card p-6 text-center space-y-3 shadow-[0_12px_40px_rgba(0,0,0,0.05)]">
          <div className="mx-auto w-20 h-20 rounded-full bg-[#f0f0f2] flex items-center justify-center text-28 font-semibold border-2 border-white shadow-md">
            {displayName[0]}
          </div>
          <div>
            <h2 className="text-20 font-semibold">{displayName}</h2>
            {profile?.username && (
              <p className="text-14 text-[#8a8a8a]" dir="ltr">
                @{profile.username}
              </p>
            )}
            {profile?.bio && <p className="text-14 text-[#5a5a5a] mt-2">{profile.bio}</p>}
          </div>
          {isOwn ? (
            <Link
              href="/profile/edit"
              className="inline-flex items-center justify-center btn-primary px-6 min-h-[44px] text-14"
            >
              تعديل الملف
            </Link>
          ) : !loading && !profile ? (
            <Link href="/auth" className="inline-flex btn-primary px-6 min-h-[44px] text-14 items-center">
              تسجيل الدخول
            </Link>
          ) : null}
        </div>

        <div className="flex gap-3">
          <Link
            href="/enhance"
            className="btn-ink flex-1 text-15 text-center flex items-center justify-center min-h-[48px]"
          >
            {isOwn ? "مشاركة برومبت" : "حسّن برومبت"}
          </Link>
          <button
            type="button"
            className="min-w-[48px] min-h-[48px] rounded-full border border-[#ececec] bg-white flex items-center justify-center"
            onClick={async () => {
              const url = window.location.href;
              if (navigator.share) await navigator.share({ title: displayName, url }).catch(() => {});
              else await navigator.clipboard.writeText(url);
            }}
          >
            <Share2 size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-13 text-[#8a8a8a]">
          <Grid3X3 size={16} />
          <span>المنشورات</span>
        </div>

        {loading && <p className="text-center text-13 text-[#8a8a8a] py-8">جارٍ التحميل...</p>}
        {!loading && prompts.length === 0 && (
          <div className="card p-6 text-center space-y-3">
            <p className="text-14 text-[#8a8a8a]">لا منشورات بعد</p>
            <Link href="/enhance" className="text-14 text-[#ff4d00] font-medium">
              ابدأ بتحسين برومبت
            </Link>
          </div>
        )}
        <div className="space-y-3">
          {prompts.map((p) => (
            <Link key={p.id} href={`/p/${p.id}`} className="block">
              <PromptCard prompt={p} />
            </Link>
          ))}
        </div>

        <p
          className="text-center text-13 text-[#b0b0b0] py-4 select-none"
          onClick={() => {
            versionTaps.current += 1;
            if (versionTaps.current >= 6) {
              versionTaps.current = 0;
              window.location.href = "/admin";
            }
          }}
        >
          v1.2.0
        </p>

        {isOwn && getDemoUser() && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              clearDemoSession();
              opsLog("auth.logout.demo", "ok");
              window.location.href = "/auth";
            }}
          >
            خروج من الحساب التجريبي
          </Button>
        )}
      </div>
    </div>
  );
}
