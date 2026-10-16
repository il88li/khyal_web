"use client";
// app/page.tsx — Feed: تبويبات، لا نهائي، Pull-to-refresh، Realtime، حفظ الموضع
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { AdSlot } from "@/components/AdSlot";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "@/components/icons";
import PromptCard from "@/components/PromptCard";
import { sb, uid, explain, withMeta } from "@/lib/supabase";
import Link from "next/link";
import type { PromptRow } from "@/types";

const TABS = [["foryou", "مختار لك"], ["following", "أتابعه"], ["trending", "رائج"], ["cats", "الفئات"]] as const;
type Tab = (typeof TABS)[number][0];
const PAGE = 10;
const SEL = "id,body,enhanced,model,images,like_count,comment_count,created_at,category_id,author:profiles!author_id(id,username,display_name,avatar_url)";
type PageOut = { rows: PromptRow[]; note?: string };
const cache: Record<string, { items: PromptRow[]; page: number; done: boolean; y: number; note?: string }> = {};

/** اهتماماتي: فئات ما أحبّه وحفظته — تُحسب مرة كل نصف ساعة */
let prefCache: { userId: string; ids: number[]; names: string; at: number } | null = null;
async function interests(me: string | null) {
  if (!me) return null;
  if (prefCache && prefCache.userId === me && Date.now() - prefCache.at < 1_800_000) return prefCache;
  try {
    const [lk, sv] = await Promise.all([
      sb.from("likes").select("prompt_id").eq("user_id", me).limit(60),
      sb.from("saves").select("prompt_id").eq("user_id", me).limit(60),
    ]);
    const ids = Array.from(new Set([...(lk.data ?? []), ...(sv.data ?? [])].map((x: any) => x.prompt_id as string))).slice(0, 120);
    const top: number[] = [];
    let names = "";
    if (ids.length) {
      const { data: ps } = await sb.from("prompts").select("category_id").in("id", ids).not("category_id", "is", null);
      const cnt = new Map<number, number>();
      for (const p of (ps ?? []) as any[]) if (p.category_id != null) cnt.set(p.category_id, (cnt.get(p.category_id) ?? 0) + 1);
      top.push(...[...cnt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id));
      if (top.length) {
        const { data: cn } = await sb.from("categories").select("id,name_ar").in("id", top);
        names = (cn ?? []).map((c: any) => c.name_ar).join("، ");
      }
    }
    prefCache = { userId: me, ids: top, names, at: Date.now() };
    return prefCache;
  } catch {
    return null;
  }
}

async function fetchPage(tab: Tab, cat: number | null, page: number): Promise<PageOut> {
  const me = await uid();
  const p = tab === "foryou" ? await interests(me ?? null) : null;
  const usePref = !!p?.ids.length;

  const build = async (applyPref: boolean): Promise<PromptRow[] | null> => {
    let q = sb.from("prompts").select(SEL).range(page * PAGE, page * PAGE + PAGE - 1);
    q = tab === "trending"
      ? q.order("like_count", { ascending: false }).order("created_at", { ascending: false })
      : q.order("pinned", { ascending: false }).order("created_at", { ascending: false });
    if (tab === "following") {
      const { data: f } = await sb.from("follows").select("following_id").eq("follower_id", me ?? "").eq("status", "accepted");
      if (!f?.length) return [];
      q = q.in("author_id", f.map((x) => x.following_id));
    }
    if (tab === "cats" && cat) q = q.eq("category_id", cat);
    if (applyPref && usePref) q = q.in("category_id", p!.ids);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as unknown as PromptRow[];
  };

  let rows = await build(true);
  let note = rows?.length && page === 0 && usePref ? `مُختارة لك حسب اهتمامك بـ${p!.names || "مجالاتك"}` : undefined;
  if (!rows?.length && page === 0 && usePref && tab === "foryou") {
    rows = await build(false);
    note = undefined;
  }
  const list = rows ?? [];
  if (me && list.length) {
    const ids = list.map((r) => r.id);
    const [l, s] = await Promise.all([
      sb.from("likes").select("prompt_id").eq("user_id", me).in("prompt_id", ids),
      sb.from("saves").select("prompt_id").eq("user_id", me).in("prompt_id", ids),
    ]);
    const L = new Set(l.data?.map((x) => x.prompt_id));
    const S = new Set(s.data?.map((x) => x.prompt_id));
    list.forEach((r) => { r.liked = L.has(r.id); r.saved = S.has(r.id); });
  }
  if (list.length) {
    const x = await sb.from("prompts").select("id,forked_from,copy_count,fork_count").in("id", list.map((r) => r.id));
    if (!x.error) {
      const M = new Map((x.data ?? []).map((r: any) => [r.id, r]));
      list.forEach((r) => Object.assign(r, M.get(r.id) ?? {}));
    }
  }
  await withMeta(list);
  return { rows: list, note };
}

const Skeleton = () => (
  <div className="card flex h-[170px] animate-pulse flex-col gap-2.5 p-4.5">
    <div className="h-7 w-32 rounded-full bg-mist" />
    <div className="h-3.5 w-full rounded-full bg-mist" />
    <div className="h-3.5 w-2/3 rounded-full bg-mist" />
  </div>
);

export default function Feed() {
  const router = useRouter();
  useEffect(() => {
    uid().then(async (id) => {
      if (!id) return;
      const { data, error } = await sb.from("profiles").select("onboarded").eq("id", id).maybeSingle();
      if (!error && !data?.onboarded) router.replace("/setup");
    });
  }, []); // eslint-disable-line

  const [tab, setTab] = useState<Tab>("foryou");
  const [cat, setCat] = useState<number | null>(null);
  const [cats, setCats] = useState<{ id: number; name_ar: string }[]>([]);
  const [items, setItems] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [note, setNote] = useState("");
  const page = useRef(0);
  const busy = useRef(false);
  const end = useRef<HTMLDivElement>(null);
  const key = `${tab}:${cat}`;

  const load = useCallback(async (reset = false) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    if (reset) { page.current = 0; setDone(false); }
    let out: PageOut = { rows: [] };
    try {
      out = await fetchPage(tab, cat, page.current);
      setErr("");
    } catch (e: any) {
      setErr(explain(e));
      setLoading(false);
      busy.current = false;
      return;
    }
    if (reset) setNote(out.note ?? "");
    const rows = out.rows;
    page.current++;
    const fin = rows.length < PAGE;
    setDone(fin);
    setItems((p) => (reset ? rows : [...p, ...rows]));
    setLoading(false);
    busy.current = false;
  }, [tab, cat]);

  const itemsRef = useRef(items), doneRef = useRef(done), noteRef = useRef(note);
  itemsRef.current = items;
  doneRef.current = done;
  noteRef.current = note;

  useEffect(() => {
    if ((window as any).__feedDirty) {
      Object.keys(cache).forEach((k) => delete cache[k]);
      (window as any).__feedDirty = false;
    }
    const c = cache[key];
    if (c) {
      setItems(c.items);
      page.current = c.page;
      setDone(c.done);
      setNote(c.note ?? "");
      setLoading(false);
      requestAnimationFrame(() => window.scrollTo(0, c.y));
    } else {
      setItems([]);
      load(true);
    }
    return () => {
      cache[key] = { items: itemsRef.current, page: page.current, done: doneRef.current, y: window.scrollY, note: noteRef.current };
    };
  }, [key]); // eslint-disable-line

  useEffect(() => {
    sb.from("categories").select("id,name_ar").eq("active", true).order("sort").then(({ data }) => data && setCats(data));
  }, []);

  useEffect(() => {
    const el = end.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && !done && !busy.current && items.length && load(),
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [done, items.length, load]);

  useEffect(() => {
    const ch = sb
      .channel("prompts-live")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "prompts" }, (p: any) =>
        setItems((it) => it.map((x) => (x.id === p.new.id ? { ...x, like_count: p.new.like_count, comment_count: p.new.comment_count } : x))),
      )
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, []);

  useEffect(() => {
    let y0 = 0, d = 0;
    const s = (e: TouchEvent) => { y0 = window.scrollY <= 0 ? e.touches[0].clientY : -1; d = 0; };
    const m = (e: TouchEvent) => { if (y0 < 0) return; d = Math.max(0, (e.touches[0].clientY - y0) * 0.5); setPull(Math.min(d, 90)); };
    const en = async () => {
      if (d > 70) {
        setRefreshing(true);
        delete cache[key];
        busy.current = false;
        await load(true);
        navigator.vibrate?.(10);
        setRefreshing(false);
      }
      setPull(0);
      y0 = -1;
    };
    window.addEventListener("touchstart", s, { passive: true });
    window.addEventListener("touchmove", m, { passive: true });
    window.addEventListener("touchend", en);
    return () => {
      window.removeEventListener("touchstart", s);
      window.removeEventListener("touchmove", m);
      window.removeEventListener("touchend", en);
    };
  }, [key, load]);

  const go = (d: number) => {
    const i = TABS.findIndex((t) => t[0] === tab) + d;
    if (TABS[i]) setTab(TABS[i][0]);
  };

  return (
    <main className="feed-main flex flex-col gap-4">
      <div className="xl:hidden mb-1"><AdSlot slot="home" /></div>

      <header
        className="feed-sticky-header sticky z-30 -mx-3 flex flex-col border-b border-silver bg-fog px-3 pb-2 pt-2 md:mx-0 md:px-0"
      >
        <nav className="seg">
          {TABS.map(([k, l]) => (
            <button key={k} data-on={tab === k ? "1" : undefined} onClick={() => setTab(k)} className="relative">
              {tab === k && (
                <motion.span
                  layoutId="feed-tab"
                  transition={{ type: "spring", stiffness: 450, damping: 36 }}
                  className="absolute inset-0 rounded-lg bg-snow shadow-soft"
                />
              )}
              <span className="relative">{l}</span>
            </button>
          ))}
        </nav>
      </header>

      {tab === "foryou" && note && (
        <p className="self-start rounded-xl bg-brand-tint px-3 py-2 text-caption font-medium text-brand-ink">
          {note}
        </p>
      )}

      {tab === "cats" && (
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 md:mx-0 md:px-0 [scrollbar-width:none]">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id === cat ? null : c.id)}
              className={`chip !h-8 shrink-0 px-3 text-caption font-semibold ${cat === c.id ? "chip-ink" : "bg-snow text-graphite"}`}
            >
              {c.name_ar}
            </button>
          ))}
        </div>
      )}

      <div
        style={{ height: refreshing ? 40 : pull }}
        className="flex items-center justify-center overflow-hidden text-smoke transition-[height] duration-150"
      >
        {(pull > 20 || refreshing) && (
          <Loader2 size={22} className={refreshing ? "animate-spin" : ""} style={{ transform: `rotate(${pull * 4}deg)` }} />
        )}
      </div>

      <motion.div
        style={{ touchAction: "pan-y" }}
        className="feed-stream flex flex-col gap-4 pb-4"
        onPanEnd={(_, i) => {
          if (Math.abs(i.offset.x) > 80 && Math.abs(i.velocity.x) > 200 && Math.abs(i.offset.y) < 60) {
            go(i.offset.x < 0 ? 1 : -1);
          }
        }}
      >
        {items.map((p, i) => (
          <Fragment key={p.id}>
            <PromptCard p={p} i={i} />
            {(i + 1) % 5 === 0 && <AdSlot slot="feed" />}
          </Fragment>
        ))}
        {loading && Array.from({ length: items.length ? 1 : 3 }).map((_, i) => <Skeleton key={i} />)}

        {!loading && err && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="max-w-[30ch] text-graphite">{err}</p>
            <button className="btn btn-primary" onClick={() => load(true)}>إعادة المحاولة</button>
          </div>
        )}

        {!loading && !err && !items.length && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-tint text-brand-ink">
              <Sparkles size={26} />
            </span>
            <p className="max-w-[30ch] text-graphite">
              {tab === "following" ? "تابع بعض المبدعين لتظهر منشوراتهم هنا." : "لا توجد برومبتات بعد. كن الأول!"}
            </p>
            <Link href="/new" className="btn btn-primary">انشر أول برومبت</Link>
          </div>
        )}

        <div ref={end} className="h-px" />
      </motion.div>
    </main>
  );
}
