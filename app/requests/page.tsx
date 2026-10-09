"use client";
// app/requests/page.tsx — طلبات المتابعة المعلّقة (للحسابات الخاصة): قبول/رفض فوري
import { useEffect, useState } from "react";
import Link from "next/link";
import { sb, toast, uid } from "@/lib/supabase";

type R = { follower_id: string; profile: { display_name: string | null; username: string | null; avatar_url: string | null } | null };
export default function Requests() {
  const [items, setItems] = useState<R[] | null>(null), [me, setMe] = useState<string>();
  useEffect(() => {
    uid().then(async (id) => {
      setMe(id); if (!id) return;
      const { data } = await sb.from("follows").select("follower_id,profile:profiles!follower_id(display_name,username,avatar_url)").eq("following_id", id).eq("status", "pending");
      setItems((data as any) ?? []);
    });
  }, []);
  async function act(fid: string, accept: boolean) {
    const prev = items; setItems((a) => a && a.filter((x) => x.follower_id !== fid)); navigator.vibrate?.(8);
    const key = { follower_id: fid, following_id: me! };
    const { error } = accept ? await sb.from("follows").update({ status: "accepted" }).match(key) : await sb.from("follows").delete().match(key);
    if (error) { setItems(prev); toast("تعذّر التنفيذ"); } else toast(accept ? "تم القبول" : "تم الرفض");
  }
  return (
    <main className="flex flex-col gap-3 pt-4">
      <header className="hidden h-14 items-center md:flex"><h1 className="text-2xl font-semibold">طلبات المتابعة</h1></header>
      {!items ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-mist" />)
        : !items.length ? <p className="py-16 text-center text-graphite">لا توجد طلبات.</p>
        : items.map((r) => (
          <div key={r.follower_id} className="flex items-center gap-3 rounded-xl border border-silver bg-snow p-3 shadow-soft">
            <Link href={`/profile/${r.follower_id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-mist">{r.profile?.avatar_url && <img src={r.profile.avatar_url} alt="" className="h-full w-full object-cover" />}</span>
              <span className="truncate text-sm font-medium">{r.profile?.display_name ?? r.profile?.username ?? "مستخدم"}</span></Link>
            <button onClick={() => act(r.follower_id, true)} className="min-h-10 rounded-full bg-brand px-4 text-sm font-medium text-snow">قبول</button>
            <button onClick={() => act(r.follower_id, false)} className="min-h-10 rounded-full border border-silver px-4 text-sm">رفض</button>
          </div>))}
    </main>
  );
}
