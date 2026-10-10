"use client";
// app/profile/[id]/page.tsx — بروفايل مرتّب: غلاف ← أفاتار ← هوية ← إحصاءات ← أزرار ← شارات ← منشورات
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award, BarChart3, BookMarked, Camera, Flame, Settings, Share2 } from "lucide-react";
import { VERSION, explain, sb, thumb, toast, uid, uploadImage } from "@/lib/supabase";
import { BADGES, BadgeStrip, badgeStats, levelOf, nextStep, type BStats } from "@/components/badges";

type Prof = { id: string; username: string | null; display_name: string | null; avatar_url: string | null; cover_url: string | null; bio: string | null; is_private: boolean; links: string[] | null; streak: number | null };
type Cell = { id: string; body: string; enhanced: string | null; images: { url: string }[] };
const SEL = "id,body,enhanced,images";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [me, setMe] = useState<string | undefined>(), [p, setP] = useState<Prof | null>(null), [cells, setCells] = useState<Cell[]>([]), [saved, setSaved] = useState<Cell[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, prompts: 0 }), [fol, setFol] = useState(false), [pend, setPend] = useState(false), [tab, setTab] = useState<"posts" | "saved">("posts"), [ready, setReady] = useState(false);
  const [up, setUp] = useState(""), [badges, setBadges] = useState<BStats | null>(null);
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
  async function shareCard() { // صورة إنجاز أنيقة تُولَّد محلياً ثم تُشارك أو تُنزَّل
    if (!badges || !p) return;
    const W = 800, H = 800, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d"); if (!x) return;
    const css = getComputedStyle(document.documentElement), v = (k: string) => css.getPropertyValue(k).trim();
    const brand = `rgb(${v("--brand")})`, snow = `rgb(${v("--c-snow")})`, fog = `rgb(${v("--c-fog")})`, ink = `rgb(${v("--c-ink")})`, ink3 = `rgb(${v("--c-ink-3")})`;
    const fam = `"${v("--font-sans").replace(/"/g, "")}", sans-serif`;
    (x as CanvasRenderingContext2D).direction = "rtl"; x.textAlign = "center";
    x.fillStyle = fog; x.fillRect(0, 0, W, H);
    x.strokeStyle = brand; x.lineWidth = 6; x.strokeRect(20, 20, W - 40, H - 40);
    x.fillStyle = brand; x.beginPath(); x.arc(W / 2, 150, 62, 0, Math.PI * 2); x.fill();
    x.fillStyle = snow; x.font = `700 62px ${fam}`; x.fillText("✦", W / 2, 172);
    x.fillStyle = ink; x.font = `700 42px ${fam}`; x.fillText(p.display_name ?? "مبدع خيال", W / 2, 290);
    x.fillStyle = brand; x.font = `600 28px ${fam}`; x.fillText(`المستوى ${levelOf(badges)} في خيال`, W / 2, 336);
    const won = BADGES.filter((b) => b.val(badges) >= b.goal).length;
    x.fillStyle = ink3; x.font = `500 26px ${fam}`;
    [`برومبتات: ${badges.prompts}`, `إعجابات: ${badges.likes}`, `شارات: ${won} من ${BADGES.length}`].forEach((t, i) => x.fillText(t, W / 2, 420 + i * 48));
    x.fillStyle = ink; x.font = `700 28px ${fam}`; x.fillText("خيال — برومبتات عربية جاهزة", W / 2, 660);
    x.fillStyle = brand; x.font = `600 22px ${fam}`; x.fillText("khiyal", W / 2, 700);
    cv.toBlob(async (b) => {
      if (!b) return;
      const f = new File([b], "khiyal-achievement.png", { type: "image/png" });
      try {
        if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: "إنجازي في خيال" });
        else { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "khiyal-achievement.png"; a.click(); toast("نُزّلت صورة إنجازك — شاركها أينما شئت"); }
      } catch { /* أُلغيت المشاركة */ }
    }, "image/png");
  }
  async function shareProfile() {
    const url = `${location.origin}/profile/${pid}`;
    try { if (navigator.share) await navigator.share({ title: p?.display_name ?? "خيال", url }); else { await navigator.clipboard.writeText(url); toast("نُسخ رابط الحساب"); } } catch {}
  }

  if (ready && !p) return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-graphite">{own ? "لم يكتمل إعداد حسابك بعد." : "الحساب غير موجود"}</p>
      {own && <Link href="/setup" className="btn btn-primary">إكمال الإعداد</Link>}
    </div>
  );
  const hidden = !!p?.is_private && !own && !fol, list = tab === "saved" ? saved : cells;
  return (
    <main className="flex flex-col gap-3 pt-3">
      <header className="flex flex-col gap-2.5">
        {/*1 — الغلاف */}
        <div className="relative h-24 overflow-hidden rounded-xl bg-brand/10">
          {p?.cover_url && <img src={p.cover_url} alt="" className="h-full w-full object-cover" />}
          {own && <>
            <label className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-snow text-charcoal shadow-soft active:scale-95">{up === "cover_url" ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-silver border-t-charcoal" /> : <Camera size={15} />}<input type="file" accept="image/*" hidden onChange={(e) => change("cover_url", e.target.files?.[0])} /></label>
            <div className="absolute left-2 top-2 flex items-center gap-1">
              <Link href="/settings" aria-label="الإعدادات" className="flex h-8 w-8 items-center justify-center rounded-full border border-silver bg-snow text-charcoal shadow-soft active:scale-95"><Settings size={15} /></Link>
              <span dir="ltr" className="rounded-full bg-snow/90 px-2 py-0.5 text-[10px] text-smoke shadow-soft">{VERSION}</span>
            </div>
          </>}
        </div>

        {/*2 — الأفاتار + مشاركة سريعة */}
        <div className="relative -mt-8 flex items-end justify-between px-1">
          <div className="relative h-16 w-16">
            <div className="h-full w-full overflow-hidden rounded-full border-2 border-snow bg-mist shadow-soft">{p?.avatar_url && <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />}</div>
            {own && <label className="absolute -bottom-1 -left-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-brand text-snow shadow-pop active:scale-95">{up === "avatar_url" ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-snow/40 border-t-snow" /> : <Camera size={13} />}<input type="file" accept="image/*" hidden onChange={(e) => change("avatar_url", e.target.files?.[0])} /></label>}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={shareProfile} aria-label="مشاركة الحساب" className="icon-btn border border-silver bg-snow shadow-soft"><Share2 size={15} /></button>
            {own && badges && <button onClick={shareCard} aria-label="مشاركة صورة إنجاز" title="شارك صورة إنجازك" className="icon-btn border border-silver bg-snow shadow-soft"><Award size={15} className="text-brand" /></button>}
          </div>
        </div>

        {/*3 — الهوية */}
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <h1 className="text-base font-semibold">{p?.display_name ?? <span className="inline-block h-5 w-28 animate-pulse rounded-full bg-mist" />}</h1>
          {badges && <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">المستوى {levelOf(badges)}</span>}
          {!!p?.streak && p.streak > 1 && <span className="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-0.5 text-[10px] font-medium text-graphite"><Flame size={11} />{p.streak} يوم</span>}
        </div>
        <p className="px-1 text-caption text-smoke">{p ? <bdi dir="ltr">@{p.username}</bdi> : ""}</p>

        {/*4 — نبذة وروابط */}
        {p?.bio && <p className="max-w-[65ch] px-1 text-caption text-graphite">{p.bio}</p>}
        {!!p?.links?.length && <div className="flex flex-wrap gap-x-3 px-1">{p.links.map((l) => <a key={l} href={l} target="_blank" rel="noopener noreferrer nofollow" dir="ltr" className="flex min-h-7 items-center rounded-link text-caption text-cobalt">{l.replace(/^https?:\/\//, "")}</a>)}</div>}

        {/*5 — الإحصاءات */}
        <dl className="grid grid-cols-3 rounded-xl border border-silver bg-snow py-1.5 text-center shadow-soft">
          {([["prompts", "برومبت"], ["followers", "متابِع"], ["following", "يتابع"]] as const).map(([k, l], i) => (
            <div key={k} className={`flex flex-col ${i ? "border-e border-silver" : ""}`}>
              <dt className="text-base font-semibold tabular-nums">{stats[k]}</dt>
              <dd className="text-[10px] text-smoke">{l}</dd>
            </div>))}
        </dl>

        {/*6 — الأزرار (أقواس واضحة: إجراء أساسي + ثانوي) */}
        <div className="flex gap-1.5">
          {own ? (<>
            <Link href="/settings" className="btn btn-primary flex-1">تعديل الحساب</Link>
            <Link href="/library" className="btn"><BookMarked size={14} />مكتبتي</Link>
            <Link href="/stats" className="btn"><BarChart3 size={14} />إحصاءاتي</Link>
          </>) : (<>
            <button onClick={follow} className={`btn flex-1 ${fol || pend ? "btn-ghost" : "btn-primary"}`}>{fol ? "أتابعه" : pend ? "تم الطلب" : "متابعة"}</button>
            <button onClick={block} className="btn">{blocked ? "إلغاء الحظر" : "حظر"}</button>
          </>)}
        </div>

        {/*7 — الخطوة التالية + الشارات */}
        {own && badges && <p className="rounded-xl bg-brand/5 px-2.5 py-1.5 text-caption font-medium text-brand">{nextStep(badges)}</p>}
        {!hidden && badges && <BadgeStrip s={badges} own={own} />}
      </header>

      {own && <div className="flex gap-1 rounded-full bg-mist p-1">{(["posts", "saved"] as const).map((t) => (
        <button key={t} onClick={() => setTab(t)} className="relative min-h-8 flex-1 rounded-full text-caption font-medium">
          {tab === t && <motion.span layoutId="prof-tab" transition={{ type: "spring", stiffness: 420, damping: 34 }} className="absolute inset-0 rounded-full bg-snow shadow-soft" />}
          <span className={`relative ${tab === t ? "text-brand" : "text-smoke"}`}>{t === "posts" ? "منشوراتي" : "المحفوظة"}</span>
        </button>))}</div>}

      {hidden ? <p className="py-10 text-center text-graphite">هذا الحساب خاص. تابعه لترى منشوراته.</p>
        : !ready ? <div className="grid grid-cols-3 gap-1">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-link bg-mist" />)}</div>
        : !list.length ? <p className="py-10 text-center text-graphite">لا شيء هنا بعد.</p>
        : <div className="grid grid-cols-3 gap-1">{list.map((c) => (
          <Link key={c.id} href={`/p/${c.id}`} className="aspect-square overflow-hidden rounded-link border border-silver bg-fog">
            {c.images?.[0] ? <img src={thumb(c.images[0].url, 400)} alt="" loading="lazy" className="h-full w-full object-cover" /> : <p className="line-clamp-6 p-1.5 text-[10px] leading-snug text-graphite">{c.enhanced ?? c.body}</p>}
          </Link>))}</div>}
    </main>
  );
}
