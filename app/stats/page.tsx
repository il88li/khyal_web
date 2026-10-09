"use client";
// app/stats/page.tsx — إحصاءات المنشئ: مجاميع الإعجاب/التعليق/النسخ/التفريع + أفضل برومبتاتك أداءً
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Copy, GitFork, FileText, Users, Flame } from "lucide-react";
import { sb, uid, fmt, explain } from "@/lib/supabase";
import { BadgeGrid, type BStats } from "@/components/badges";

type Row = { id: string; body: string; enhanced: string | null; like_count: number; comment_count: number; copy_count?: number; fork_count?: number };
const score = (r: Row) => r.like_count + r.comment_count * 2 + (r.copy_count ?? 0) * 2 + (r.fork_count ?? 0) * 3;

export default function Stats() {
  const [rows, setRows] = useState<Row[] | null>(null), [followers, setFollowers] = useState(0), [streak, setStreak] = useState<{ s: number; b: number } | null>(null), [err, setErr] = useState(""), [taught, setTaught] = useState(0);
  useEffect(() => {
    (async () => {
      const id = await uid(); if (!id) return;
      let r: any = await sb.from("prompts").select("id,body,enhanced,like_count,comment_count,copy_count,fork_count").eq("author_id", id).order("created_at", { ascending: false }).limit(200);
      if (r.error) r = await sb.from("prompts").select("id,body,enhanced,like_count,comment_count").eq("author_id", id).order("created_at", { ascending: false }).limit(200); // قبل تهيئة أعمدة النسخ
      if (r.error) { setErr(explain(r.error)); setRows([]); return; }
      setRows(r.data ?? []);
      const f = await sb.from("follows").select("*", { count: "exact", head: true }).eq("following_id", id).eq("status", "accepted"); setFollowers(f.count ?? 0);
      const c = await sb.from("comments").select("*", { count: "exact", head: true }).eq("author_id", id); setTaught(c.count ?? 0); // شارة «معلّم»
      const p = await sb.from("profiles").select("streak,best_streak").eq("id", id).maybeSingle(); if (!p.error && p.data) setStreak({ s: p.data.streak ?? 0, b: p.data.best_streak ?? 0 });
    })();
  }, []);

  const sum = (k: keyof Row) => (rows ?? []).reduce((a, r) => a + ((r[k] as number) ?? 0), 0);
  const top = [...(rows ?? [])].sort((a, b) => score(b) - score(a)).slice(0, 5), max = Math.max(1, ...top.map(score));
  const badges: BStats = { prompts: rows?.length ?? 0, likes: sum("like_count"), comments: sum("comment_count"), copies: sum("copy_count"), forks: sum("fork_count"), followers, taught, streak: streak?.s ?? 0, best: streak?.b ?? 0 };
  const tiles = [[FileText, "برومبتات", rows?.length ?? 0], [Users, "متابعون", followers], [Heart, "إعجابات", sum("like_count")], [MessageCircle, "تعليقات", sum("comment_count")], [Copy, "مرات النسخ", sum("copy_count")], [GitFork, "تفريعات", sum("fork_count")]] as const;

  if (!rows) return <div className="grid grid-cols-2 gap-3 pt-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-mist" />)}</div>;
  if (err) return <p className="py-16 text-center text-graphite">{err}</p>;
  if (!rows.length) return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand"><FileText size={28} /></span>
      <p className="max-w-[30ch] text-graphite">انشر أول برومبت لتظهر إحصاءاتك هنا.</p><Link href="/new" className="btn btn-primary">انشر الآن</Link>
      <div className="w-full"><BadgeGrid s={badges} /></div>
    </div>);
  return (
    <main className="flex flex-col gap-4 pt-2 pb-4">
      {streak && streak.s > 0 && <div className="flex items-center gap-3 rounded-xl border border-silver bg-snow p-4 shadow-soft"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand"><Flame size={20} /></span><div><p className="text-base font-bold">{streak.s} أيام متتالية</p><p className="text-caption text-smoke">أفضل سلسلة: {streak.b}</p></div></div>}
      <div className="grid grid-cols-2 gap-3">
        {tiles.map(([Icon, label, v]) => (
          <div key={label} className="flex flex-col gap-1 rounded-xl border border-silver bg-snow p-4 shadow-soft">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand"><Icon size={18} /></span>
            <p className="text-2xl font-bold tabular-nums">{fmt(v)}</p><p className="text-caption text-smoke">{label}</p>
          </div>))}
      </div>
      <BadgeGrid s={badges} />
      <section className="flex flex-col gap-3 rounded-xl border border-silver bg-snow p-4 shadow-soft">
        <h2 className="text-lg font-semibold">الأفضل أداءً</h2>
        {top.map((r) => (
          <Link key={r.id} href={`/p/${r.id}`} className="flex flex-col gap-1.5">
            <span className="line-clamp-1 text-sm">{r.enhanced ?? r.body}</span>
            <span className="h-2 overflow-hidden rounded-full bg-mist"><span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(6, (score(r) / max) * 100)}%` }} /></span>
            <span className="text-caption text-smoke">♥ {r.like_count} · 💬 {r.comment_count} · نسخ {r.copy_count ?? 0} · تفريع {r.fork_count ?? 0}</span>
          </Link>))}
      </section>
    </main>
  );
}
