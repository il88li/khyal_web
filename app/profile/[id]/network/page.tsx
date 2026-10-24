"use client";
// app/profile/[id]/network/page.tsx — صفحة قائمة المتابعين والمتابعون المستقلة
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "@/components/icons";
import { NetworkSheet } from "@/components/NetworkSheet";
import { sb } from "@/lib/supabase";

export default function ProfileNetworkPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") === "following" ? "following" : "followers";
  const [profileName, setProfileName] = useState("المستخدم");

  useEffect(() => {
    if (!params.id) return;
    sb.from("profiles")
      .select("display_name,username")
      .eq("id", params.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfileName(data.display_name || data.username || "المستخدم");
      });
  }, [params.id]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 pt-4">
      <header className="flex items-center gap-2">
        <Link
          href={`/profile/${params.id}`}
          aria-label="الرجوع إلى الملف الشخصي"
          className="icon-btn border border-silver"
        >
          <ChevronRight size={22} />
        </Link>
        <h1 className="text-xl font-bold text-charcoal">
          {tabParam === "followers" ? `متابعو ${profileName}` : `الحسابات التي يتابعها ${profileName}`}
        </h1>
      </header>

      <NetworkSheet
        open={true}
        onClose={() => router.push(`/profile/${params.id}`)}
        targetUserId={params.id}
        targetUserName={profileName}
        initialTab={tabParam}
      />
    </main>
  );
}
