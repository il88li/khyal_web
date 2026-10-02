"use client";

import { useEffect, useState, useTransition } from "react";
import { getProfile, updateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { getDemoUser, updateDemoUser } from "@/lib/demo-auth";
import { opsLog } from "@/lib/ops-log";

export default function EditProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const demo = getDemoUser();
    if (demo) {
      setDisplayName(demo.display_name || "");
      setUsername(demo.username || "");
      setBio(demo.bio || "");
      setLoaded(true);
      return;
    }
    getProfile().then((res) => {
      if (res.profile) {
        setDisplayName(res.profile.display_name || "");
        setUsername(res.profile.username || "");
        setBio(res.profile.bio || "");
      }
      setLoaded(true);
    });
  }, []);

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      const demo = getDemoUser();
      if (demo) {
        updateDemoUser({
          display_name: displayName.slice(0, 40),
          username: username.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 24) || demo.username,
          bio: bio.slice(0, 300),
        });
        opsLog("profile.edit.demo", "ok");
        router.push("/profile");
        return;
      }
      const fd = new FormData();
      fd.set("display_name", displayName);
      fd.set("username", username);
      fd.set("bio", bio);
      const res = await updateProfile(fd);
      if (res.error) {
        setError(res.error);
        opsLog("profile.edit", "error", res.error);
      } else {
        opsLog("profile.edit", "ok");
        router.push("/profile");
      }
    });
  };

  if (!loaded) {
    return <div className="px-5 py-12 text-center text-13 text-[#8a8a8a]">جارٍ التحميل...</div>;
  }

  return (
    <div className="max-w-page mx-auto">
      <header className="page-header pt-safe gap-3 justify-start">
        <Link href="/profile" className="min-h-touch min-w-[44px] flex items-center justify-center">
          <ChevronLeft size={22} className="rotate-180" />
        </Link>
        <h1 className="text-19 font-semibold">تعديل الملف</h1>
      </header>

      <div className="px-5 py-6 space-y-4">
        <div className="card p-5 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div>
            <label className="text-13 text-[#8a8a8a] mb-1.5 block">الاسم المعروض</label>
            <input className="input-field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} />
          </div>
          <div>
            <label className="text-13 text-[#8a8a8a] mb-1.5 block">اسم المستخدم</label>
            <input className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} dir="ltr" maxLength={24} />
          </div>
          <div>
            <label className="text-13 text-[#8a8a8a] mb-1.5 block">نبذة</label>
            <textarea className="input-field min-h-[100px] resize-none" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={4} />
          </div>
        </div>
        {error && <p className="text-14 p-3 rounded-[14px] bg-[#f5f5f5] border border-[#ececec]">{error}</p>}
        <Button onClick={handleSave} loading={pending} className="w-full" size="lg">
          حفظ
        </Button>
      </div>
    </div>
  );
}
