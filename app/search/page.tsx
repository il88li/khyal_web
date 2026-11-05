"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Code2, Image as ImageIcon, PenTool, Search as SearchIcon, Sparkles, TrendingUp, Users, X, Zap } from "@/components/icons";
import PromptCard from "@/components/PromptCard";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { explain, sb } from "@/lib/supabase";
import type { PromptRow } from "@/types";

const ARABIC_BANK = [
  { title: "كتابة محتوى عربي", hint: "منشورات، مقالات، ونصوص قريبة من صوتك", icon: PenTool },
  { title: "صور بهوية عربية", hint: "مشاهد وأفكار بمرجع بصري محلي", icon: ImageIcon },
  { title: "تسويق ومبيعات", hint: "رسائل واضحة لجمهورك ومنتجك", icon: TrendingUp },
  { title: "برمجة وتعلّم", hint: "شرح وأمثلة تناسب مستوى القارئ", icon: Code2 },
];

type Person = { id: string; display_name: string | null; username: string | null; avatar_url: string | null };

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PromptRow[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [err, setErr] = useState("");
  const [retry, setRetry] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => { if (matchMedia("(pointer: fine)").matches) input.current?.focus(); }, []);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { abort.current?.abort(); setResults([]); setPeople([]); setSearched(false); setErr(""); return; }
    const controller = new AbortController(); abort.current?.abort(); abort.current = controller;
    const timer = window.setTimeout(async () => {
      setLoading(true); setErr(""); setSearched(true);
      try {
        const like = `%${term.replace(/[%_]/g, "\\$&")} %`.replace(" %", "%");
        const [prompts, profiles] = await Promise.all([
          sb.from("prompts").select("id,body,enhanced,model,images,like_count,comment_count,created_at,category_id,title,tags,copy_count,fork_count,author:profiles!author_id(id,username,display_name,avatar_url,verified,verification_tier)").or(`title.ilike.${like},body.ilike.${like},enhanced.ilike.${like}`).order("created_at", { ascending: false }).limit(24),
          sb.from("profiles").select("id,display_name,username,avatar_url").or(`display_name.ilike.${like},username.ilike.${like}`).limit(8),
        ]);
        if (controller.signal.aborted) return;
        if (prompts.error) throw prompts.error;
        if (profiles.error) throw profiles.error;
        setResults((prompts.data ?? []) as unknown as PromptRow[]);
        setPeople((profiles.data ?? []) as Person[]);
      } catch (e) {
        if (!controller.signal.aborted) setErr(explain(e));
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 260);
    return () => window.clearTimeout(timer);
  }, [q, retry]);

  return (
    <main className="explore-page flex min-h-screen flex-col gap-6">
      <div className="sticky top-[var(--top)] z-40 -mx-3 border-b border-silver bg-fog px-3 py-3 md:mx-0 md:px-0">
        <div className="relative mx-auto max-w-2xl">
          <SearchIcon size={20} className="absolute start-4 top-1/2 -translate-y-1/2 text-smoke" />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن فكرة أو برومبت أو مبدع…" enterKeyHint="search" className="field w-full rounded-full pe-12 ps-11" />
          {q && <button onClick={() => { setQ(""); input.current?.focus(); }} aria-label="مسح" className="absolute end-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-smoke"><X size={20} /></button>}
        </div>
      </div>

      {!searched && <>
        <section className="card-flat flex flex-col gap-2 bg-brand-tint p-5">
          <span className="flex items-center gap-2 text-caption font-semibold text-brand-ink"><Sparkles size={16} /> بنك برومبتات بنكهة عربية</span>
          <h2 className="text-xl font-bold text-charcoal">ابدأ من مجال يشبه محتواك</h2>
          <p className="text-sm leading-7 text-graphite">تصفّح أفكاراً عملية ثم استخدم البرومبت مباشرة أو عدّلها بصوتك.</p>
        </section>
        <section className="grid gap-3 sm:grid-cols-2" aria-label="مجالات عربية">
          {ARABIC_BANK.map(({ title, hint, icon: Icon }) => <Link key={title} href={`/search?q=${encodeURIComponent(title)}`} className="card card-interactive flex min-h-32 flex-col gap-3 p-4"><Icon size={22} className="text-brand" /><span className="font-semibold text-charcoal">{title}</span><span className="text-sm text-graphite">{hint}</span></Link>)}
        </section>
      </>}

      {loading && <Skeleton variant="promptCard" count={3} />}
      {!loading && err && <ErrorState message={err} onRetry={() => setRetry((value) => value + 1)} />}
      {!loading && !err && searched && !results.length && !people.length && <EmptyState icon={SearchIcon} title="لم نجد ما يطابق بحثك" hint="جرّب كلمة أقصر أو ابحث عن مجال مثل كتابة أو تسويق." />}

      {!loading && !err && people.length > 0 && <section className="flex flex-col gap-3"><h2 className="flex items-center gap-2 text-lg font-bold"><Users size={20} className="text-brand" /> مبدعون</h2><div className="grid gap-2 sm:grid-cols-2">{people.map((person) => <Link key={person.id} href={`/profile/${person.id}`} className="card-flat flex items-center gap-3 p-3"><span className="avatar h-10 w-10" data-i={(person.display_name || person.username || "؟").slice(0, 1)}>{person.avatar_url && <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />}</span><span className="min-w-0"><strong className="block truncate">{person.display_name || person.username || "مبدع خيال"}</strong><span className="text-caption text-smoke">@{person.username || "khiyal"}</span></span></Link>)}</div></section>}
      {!loading && !err && results.length > 0 && <section className="flex flex-col gap-3"><h2 className="flex items-center gap-2 text-lg font-bold"><Zap size={20} className="text-brand" /> برومبتات مقترحة</h2><div className="flex flex-col gap-4">{results.map((prompt, i) => <PromptCard key={prompt.id} p={prompt} i={i} />)}</div></section>}
    </main>
  );
}
