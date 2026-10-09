"use client";
// app/search/page.tsx — بحث في البرومبتات والأشخاص (فوري مع تأخير 320ms)
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, X, UserRound } from "lucide-react";
import { sb, explain } from "@/lib/supabase";
import PromptCard from "@/components/PromptCard";
import type { PromptRow } from "@/types";

type Person = { id: string; username: string | null; display_name: string | null; avatar_url: string | null; bio: string | null };
const SEL = "id,body,enhanced,model,images,like_count,comment_count,created_at,category_id,author:profiles!author_id(id,username,display_name,avatar_url)";

export default function SearchPage() {
  const [q, setQ] = useState(""), [tab, setTab] = useState<"p" | "u">("p"), input = useRef<HTMLInputElement>(null);
  const [prompts, setPrompts] = useState<PromptRow[]>([]), [people, setPeople] = useState<Person[]>([]);
  const [busy, setBusy] = useState(false), [done, setDone] = useState(false), [err, setErr] = useState("");
  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    const term = q.trim().replace(/[%,()*]/g, " ").trim();
    if (term.length < 2) { setPrompts([]); setPeople([]); setDone(false); setErr(""); return; }
    let stale = false;
    const t = setTimeout(async () => {
      setBusy(true); setErr("");
      const [a, b] = await Promise.all([
        sb.from("prompts").select(SEL).or(`body.ilike.%${term}%,enhanced.ilike.%${term}%`).order("created_at", { ascending: false }).limit(20),
        sb.from("profiles").select("id,username,display_name,avatar_url,bio").or(`username.ilike.%${term}%,display_name.ilike.%${term}%`).eq("banned", false).limit(20),
      ]);
      if (stale) return;
      if (a.error || b.error) setErr(explain(a.error ?? b.error));
      setPrompts((a.data as unknown as PromptRow[]) ?? []); setPeople((b.data as Person[]) ?? []); setDone(true); setBusy(false);
    }, 320);
    return () => { stale = true; clearTimeout(t); };
  }, [q]);

  const empty = (t: string) => <p className="py-16 text-center text-graphite">{t}</p>;
  return (
    <main className="flex flex-col gap-3 pt-2">
      <div className="relative">
        <SearchIcon size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-smoke" />
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في البرومبتات والأشخاص…" enterKeyHint="search"
          className="min-h-12 w-full rounded-full border border-silver bg-snow ps-11 pe-12 text-sm shadow-soft outline-none transition-colors focus:border-brand" />
        {q && <button onClick={() => { setQ(""); input.current?.focus(); }} aria-label="مسح" className="absolute end-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-smoke"><X size={18} /></button>}
      </div>
      <div className="flex gap-1 rounded-full bg-mist p-1">
        {([["p", `برومبتات${done ? ` (${prompts.length})` : ""}`], ["u", `أشخاص${done ? ` (${people.length})` : ""}`]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`min-h-10 flex-1 rounded-full text-sm font-medium transition-colors ${tab === k ? "bg-snow text-brand shadow-soft" : "text-smoke"}`}>{l}</button>))}
      </div>
      {busy && <div className="flex justify-center py-6"><span className="h-6 w-6 animate-spin rounded-full border-2 border-silver border-t-brand" /></div>}
      {err && <p className="py-8 text-center text-graphite">{err}</p>}
      {!busy && !err && !done && empty("اكتب كلمتين على الأقل للبحث")}
      {!busy && !err && done && tab === "p" && (prompts.length ? <div className="flex flex-col gap-3 pb-4">{prompts.map((p) => <PromptCard key={p.id} p={p} />)}</div> : empty("لا توجد برومبتات مطابقة"))}
      {!busy && !err && done && tab === "u" && (people.length ? (
        <div className="flex flex-col gap-2 pb-4">{people.map((u) => (
          <Link key={u.id} href={`/profile/${u.id}`} className="flex items-center gap-3 rounded-xl border border-silver bg-snow p-3 shadow-soft">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 text-brand">{u.avatar_url ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" /> : <UserRound size={20} />}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{u.display_name ?? u.username}</span><span dir="ltr" className="block truncate text-start text-caption text-smoke">@{u.username}</span></span>
          </Link>))}</div>) : empty("لا يوجد أشخاص مطابقون"))}
    </main>
  );
}
