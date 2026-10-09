"use client";
// app/profile/[id]/page.tsx — بروفايل: غلاف، إحصائيات، شبكة 3 أعمدة، متابعة فورية، ⚙️ + إصدار (6 نقرات → /admin)
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, BookMarked, Camera, Flame, Settings, Share2 } from "lucide-react";
import { VERSION, explain, sb, thumb, toast, uid, uploadImage } from "@/lib/supabase";
import { BadgeStrip, badgeStats, type BStats } from "@/components/badges";

type Prof = { id: string; username: string | null; display_name: string | null; avatar_url: string | null; cover_url: string | null; bio: string | null; is_private: boolean; links: string[] | null; streak: number | null };
type Cell = { id: string; body: string; enhanced: string | null; images: { url: string }[] };
const SEL = "id,body,enhanced,images";

export default function Profile() {
  const { id } = useParams<{ id: string }>(), router = useRouter();
  const [me, setMe] = useState<string | undefined>(), [p, setP] = useState<Prof | null>(null), [cells, setCells] = useState<Cell[]>([]), [saved, setSaved] = useState<Cell[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, prompts: 0 }), [fol, setFol] = useState(false), [pend, setPend] = useState(false), [tab, setTab] = useState<"posts" | "saved">("posts"), [ready, setReady] = useState(false);
  const [taps, setTaps] = useState(0), timer = useRef<any>(), [up, setUp] = useState(""), [badges, setBadges] = useState<BStats | null>(null);
  async function change(kind: "cover_url" | "avatar_url", f?: File) {
    if (!f || !me) return; setUp(kind);
    try {
      const im = await uploadImage(f, me), url = thumb(im.url, kind === "cover_url" ? 800 : 400);
      const { error } = await sb.from("profiles").update({ [kind]: url }).eq("id", me); if (error) throw error;
      setP((x) => (x ? ({ ...x, [kind]: url } as Prof) : x)); toast("تم التحديث");
    } catch (e: any) { toast(explain(e)); }
    setUp("");
  }
  const pid = id === "me" ? me : id, own = !!me && me === pid;
  useEffect(() => { // حسابي بلا صف في profiles: أنشئه تلقائياً مرة واحدة ثم أعد التحميل
    if (!(ready && !p && own)) return;
    try { if (sessionStorage.getItem("khiyal:repaired")) return; sessionStorage.setItem("khiyal:repaired", "1"); } catch {}
    (async () => {
      const u = (await sb.auth.getUser()).data.user; if (!u) return;
      const base = (u.email ?? "user").split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase();
      const { error } = await sb.from("profiles").upsert({ id: u.id, username: base + u.id.slice(0, 4), display_name: (u.user_metadata?.full_name as string) || base }, { onConflict: "id", ignoreDuplicates: true });
      if (error) toast(explain(error)); else location.reload();
    })();
  }, [ready, p, own]); // eslint-disable-line
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    if (!me || !pid || me === pid) return;
    sb.from("blocks").select("blocked_id").match({ blocker_id: me, blocked_id: pid }).maybeSingle().then(({ data }) => setBlocked(!!data));
  }, [me, pid]);
  async function block() {
    if (!me || !pid) return;
    if (!blocked && !confirm("حظر هذا المستخدم؟ لن ترى منشوراته ولن يرى منشوراتك.")) return;
    const next = !blocked; setBlocked(next);
    const key = { blocker_id: me, blocked_id: pid };
    const { error } = next ? await sb.from("blocks").insert(key) : await sb.from("blocks").delete().match(key);
    if (error) { setBlocked(!next); toast("تعذّر التنفيذ"); } else { toast(next ? "تم الحظر" : "أُلغي الحظر"); if (next) setFol(false); }
  }

  useEffect(() => { uid().then(setMe); }, []);
  useEffect(() => { if (pid) badgeStats(pid).then(setBadges); }, [pid]); // محفظة الإنجازات (null لا تسقط الصفحة)
  useEffect(() => {
    if (!pid) return;
    const count = (t: string, col: string) => { const q = sb.from(t).select("*", { count: "exact", head: true }).eq(col, pid); return t === "follows" ? q.eq("status", "accepted") : q; };
    Promise.all([sb.from("profiles").select("id,username,display_name,avatar_url,cover_url,bio,is_private,links").eq("id", pid).maybeSingle(), count("follows", "following_id"), count("follows", "follower_id"), count("prompts", "author_id"),
      sb.from("prompts").select(SEL).eq("author_id", pid).order("created_at", { ascending: false }).limit(60),
      me ? sb.from("follows").select("status").match({ follower_id: me, following_id: pid }).maybeSingle() : Promise.resolve({ data: null }), sb.from("profiles").select("streak").eq("id", pid).maybeSingle()]).then(([pr, a, b, c, ps, f, st]: any) => {
      setP(pr.data ? { ...pr.data, streak: st?.data?.streak ?? null } : null); setStats({ followers: a.count ?? 0, following: b.count ?? 0, prompts: c.count ?? 0 }); setCells(ps.data ?? []); setFol(f.data?.status === "accepted"); setPend(f.data?.status === "pending"); setReady(true);
    });
  }, [pid, me]);
  useEffect(() => { // المحفوظات (لصاحب الحساب فقط)
    if (!own || tab !== "saved" || saved.length) return;
    sb.from("saves").select("prompt_id").eq("user_id", me!).limit(60).then(async ({ data }) => {
      const ids = data?.map((x) => x.prompt_id) ?? []; if (!ids.length) return;
      const r = await sb.from("prompts").select(SEL).in("id", ids); setSaved((r.data as Cell[]) ?? []);
    });
  }, [own, tab]); // eslint-disable-line

  async function follow() {
    if (!me || !pid) return toast("سجّل الدخول أولاً");
    const key = { follower_id: me, following_id: pid }; navigator.vibrate?.(8);
    if (fol || pend) { // إلغاء المتابعة أو سحب الطلب
      const was = fol; setFol(false); setPend(false); if (was) setStats((s) => ({ ...s, followers: s.followers - 1 }));
      const { error } = await sb.from("follows").delete().match(key);
      if (error) { setFol(was); setPend(!was); if (was) setStats((s) => ({ ...s, followers: s.followers + 1 })); toast("تعذّر التنفيذ"); }
      return;
    }
    const priv = !!p?.is_private;
    if (priv) setPend(true); else { setFol(true); setStats((s) => ({ ...s, followers: s.followers + 1 })); }
    const { error } = await sb.from("follows").insert(key); // الخادم يحدد الحالة (pending للحساب الخاص)
    if (error) { setPend(false); setFol(false); if (!priv) setStats((s) => ({ ...s, followers: s.followers - 1 })); toast("تعذّرت المتابعة"); }
    else if (priv) toast("أُرسل طلب المتابعة");
  }
  function tapVersion() {
    clearTimeout(timer.current); const n = taps + 1; navigator.vibrate?.(6);
    if (n >= 6) { setTaps(0); router.push("/admin"); return; }
    setTaps(n); timer.current = setTimeout(() => setTaps(0), 2000);
  }

  if (ready && !p) return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-graphite">{own ? "لم يكتمل إعداد حسابك بعد." : "الحساب غير موجود"}</p>
      {own && <Link href="/setup" className="btn btn-primary">إكمال الإعداد</Link>}
    </div>
  );
  const hidden = !!p?.is_private && !own && !fol, list = tab === "saved" ? saved : cells;
  return (
    <main className="flex flex-col gap-5 pt-4">
      <header className="relative flex flex-col gap-3">
        <div className="relative h-28 overflow-hidden rounded-xl bg-brand/10">{p?.cover_url && <img src={p.cover_url} alt="" className="h-full w-full object-cover" />}
          {own && <label className="absolute right-2 top-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-snow text-charcoal shadow-soft active:scale-95">{up === "cover_url" ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-silver border-t-charcoal" /> : <Camera size={18} />}<input type="file" accept="image/*" hidden onChange={(e) => change("cover_url", e.target.files?.[0])} /></label>}</div>
        {own && (
          <div className="absolute left-2 top-2 flex flex-col items-center gap-1">
            <Link href="/settings" aria-label="الإعدادات" className="flex h-10 w-10 items-center justify-center rounded-full border border-silver bg-snow text-charcoal"><Settings size={20} /></Link>
            <button onClick={tapVersion} className="relative flex items-center gap-1 rounded-full bg-snow px-2 text-[11px] text-smoke" dir="ltr">
              <svg width="14" height="14" viewBox="0 0 20 20" style={{ opacity: taps ? 0.4 + taps * 0.1 : 0 }} className="-rotate-90"><circle cx="10" cy="10" r="8" fill="none" stroke="#e5e7eb" strokeWidth="2" /><circle cx="10" cy="10" r="8" fill="none" stroke="#333" strokeWidth="2" strokeDasharray={50.3} strokeDashoffset={50.3 * (1 - taps / 6)} /></svg>
              {taps > 0 && <motion.span key={taps} initial={{ scale: 1.6, opacity: 0.6 }} animate={{ scale: 1, opacity: 0 }} className="absolute left-1 h-3.5 w-3.5 rounded-full border border-charcoal" />}
              {VERSION}
            </button>
          </div>)}
        <div className="relative z-10 -mt-12 flex items-end justify-between px-1">
          <div className="relative h-20 w-20"><div className="h-full w-full overflow-hidden rounded-full border-2 border-snow bg-mist shadow-soft">{p?.avatar_url && <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />}</div>
            {own && <label className="absolute -bottom-1 -left-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-brand text-snow shadow-pop active:scale-95">{up === "avatar_url" ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-snow/40 border-t-snow" /> : <Camera size={14} />}<input type="file" accept="image/*" hidden onChange={(e) => change("avatar_url", e.target.files?.[0])} /></label>}</div>
          <div className="flex items-center gap-1"><button aria-label="مشاركة الحساب" className="btn !px-3" onClick={async () => { const url = `${location.origin}/profile/${pid}`; try { if (navigator.share) await navigator.share({ title: p?.display_name ?? "خيال", url }); else { await navigator.clipboard.writeText(url); toast("نُسخ رابط الحساب"); } } catch {} }}><Share2 size={16} /></button>{!own && <button onClick={block} className="btn">{blocked ? "إلغاء الحظر" : "حظر"}</button>}
          {own ? <><Link href="/library" className="btn whitespace-nowrap"><BookMarked size={16} />مكتبتي</Link><Link href="/settings" className="btn btn-primary whitespace-nowrap">تعديل</Link></>
            : <button onClick={follow} className={`min-h-10 rounded-full px-5 text-sm font-medium active:opacity-70 ${fol || pend ? "border border-silver text-charcoal" : "bg-brand text-snow"}`}>{fol ? "أتابعه" : pend ? "تم الطلب" : "متابعة"}</button>}</div>
        </div>
        <div><h1 className="text-xl font-semibold">{p?.display_name ?? <span className="inline-block h-6 w-32 animate-pulse rounded-full bg-mist" />}</h1><p className="text-caption text-smoke">{p ? <bdi dir="ltr">@{p.username}</bdi> : ""}</p>{!!p?.streak && p.streak > 1 && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-caption font-medium text-brand"><Flame size={13} />{p.streak} أيام متتالية</span>}</div>
        {p?.bio && <p className="max-w-[65ch] text-sm text-graphite">{p.bio}</p>}
        {!!p?.links?.length && <div className="flex flex-wrap gap-x-4">{p.links.map((l) => <a key={l} href={l} target="_blank" rel="noopener noreferrer nofollow" dir="ltr" className="flex min-h-10 items-center rounded-link text-sm text-cobalt">{l.replace(/^https?:\/\//, "")}</a>)}</div>}
        <dl className="flex gap-8 text-center">{([["prompts", "برومبت"], ["followers", "متابِع"], ["following", "يتابع"]] as const).map(([k, l]) => <div key={k}><dt className="text-lg font-semibold tabular-nums">{stats[k]}</dt><dd className="text-caption text-smoke">{l}</dd></div>)}</dl>
        {!hidden && badges && <BadgeStrip s={badges} own={own} />}
        {own && <Link href="/stats" className="btn btn-soft self-start"><BarChart3 size={16} />إحصاءاتي</Link>}
      </header>

      {own && <div className="flex gap-1 rounded-full bg-mist p-1">{(["posts", "saved"] as const).map((t) => (
        <button key={t} onClick={() => setTab(t)} className="relative min-h-10 flex-1 rounded-full text-sm font-medium">
          {tab === t && <motion.span layoutId="prof-tab" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="absolute inset-0 rounded-full bg-snow shadow-soft" />}
          <span className={`relative ${tab === t ? "text-brand" : "text-smoke"}`}>{t === "posts" ? "منشوراتي" : "المحفوظة"}</span>
        </button>))}</div>}

      {hidden ? <p className="py-12 text-center text-graphite">هذا الحساب خاص. تابعه لترى منشوراته.</p>
        : !ready ? <div className="grid grid-cols-3 gap-1">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-link bg-mist" />)}</div>
        : !list.length ? <p className="py-12 text-center text-graphite">لا شيء هنا بعد.</p>
        : <div className="grid grid-cols-3 gap-1">{list.map((c) => (
          <Link key={c.id} href={`/p/${c.id}`} className="aspect-square overflow-hidden rounded-link border border-silver bg-fog">
            {c.images?.[0] ? <img src={thumb(c.images[0].url, 400)} alt="" loading="lazy" className="h-full w-full object-cover" /> : <p className="line-clamp-5 p-2 text-caption text-graphite">{c.enhanced ?? c.body}</p>}
          </Link>))}</div>}
    </main>
  );
}
