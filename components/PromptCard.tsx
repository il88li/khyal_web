"use client";
// components/PromptCard.tsx — بطاقة البرومبت: قبل/بعد، نسخ بنقرة، إعجاب بنقرتين مع قلوب متطايرة، تعليقات، حفظ، مشاركة، تعديل/حذف/إبلاغ
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, Braces, Copy, Flag, GitFork, Heart, MessageCircle, Pencil, Share2, Sparkles, Trash2 } from "lucide-react";
import { ago, burst, extractVars, fmt, sb, thumb, toast, uid, useCategories } from "@/lib/supabase";
import { BottomSheet, Comments, Lightbox, VarsSheet } from "./ui";
import type { PromptRow } from "@/types";

const REASONS = ["محتوى مسيء", "احتيال أو spam", "انتهاك حقوق", "أخرى"];
const iconBtn = "flex h-9 w-9 items-center justify-center rounded-full text-smoke active:bg-mist";
const act = "flex h-11 items-center gap-1.5 rounded-full px-3 text-sm text-graphite active:bg-mist";

export default function PromptCard({ p }: { p: PromptRow }) {
  const cats = useCategories();
  const [liked, setLiked] = useState(!!p.liked), [saved, setSaved] = useState(!!p.saved), [count, setCount] = useState(p.like_count);
  const [pulse, setPulse] = useState(0), [idx, setIdx] = useState(0), [sheet, setSheet] = useState(false), [lb, setLb] = useState<number | null>(null);
  const [mine, setMine] = useState(false), [gone, setGone] = useState(false), [rep, setRep] = useState(false);
  const [edit, setEdit] = useState(false), [draft, setDraft] = useState(""), [override, setOverride] = useState<string | null>(null);
  const [orig, setOrig] = useState(false), [more, setMore] = useState(false), [vsheet, setVsheet] = useState(false), [vers, setVers] = useState<any[]>([]);
  const lockLike = useRef(false), likeBtn = useRef<HTMLButtonElement>(null), lastTap = useRef(0), timer = useRef<any>();

  useEffect(() => setCount(p.like_count), [p.like_count]); // تحديث حي من Realtime
  useEffect(() => { uid().then((id) => setMine(!!id && id === p.author?.id)); }, [p.author?.id]);
  useEffect(() => { // إصدارات سابقة (تظهر عند فتح التعديل)
    if (!edit || p.id === "preview") return;
    sb.from("prompt_versions").select("id,body,enhanced,created_at").eq("prompt_id", p.id).order("created_at", { ascending: false }).limit(8).then(({ data, error }) => { if (!error) setVers(data ?? []); });
  }, [edit]); // eslint-disable-line

  async function toggle(table: "likes" | "saves") {
    const id = await uid(); if (!id) return toast("سجّل الدخول أولاً");
    const isLike = table === "likes", next = !(isLike ? liked : saved);
    if (isLike) {
      if (lockLike.current) return; lockLike.current = true;
      setLiked(next); setCount((c) => Math.max(0, c + (next ? 1 : -1))); setPulse((n) => n + 1);
      if (next && likeBtn.current) { const r = likeBtn.current.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 12); }
    } else setSaved(next);
    navigator.vibrate?.(8);
    const key = { user_id: id, prompt_id: p.id };
    const { error } = next ? await sb.from(table).insert(key) : await sb.from(table).delete().match(key);
    if (error && error.code !== "23505") { // Rollback
      if (isLike) { setLiked(!next); setCount((c) => Math.max(0, c + (next ? -1 : 1))); } else setSaved(!next);
      toast("تعذّر تنفيذ الإجراء");
    } else if (!isLike) toast(next ? "حُفظ" : "أُزيل من المحفوظات");
    if (isLike) lockLike.current = false;
  }
  const tapText = () => { const n = Date.now(); if (n - lastTap.current < 320 && !liked) toggle("likes"); lastTap.current = n; };
  function tapImg(i: number) { // نقرتان = إعجاب، نقرة = تكبير
    const n = Date.now();
    if (n - lastTap.current < 300) { clearTimeout(timer.current); if (!liked) toggle("likes"); lastTap.current = 0; return; }
    lastTap.current = n; timer.current = setTimeout(() => setLb(i), 300);
  }

  const hasBoth = !!p.enhanced && p.enhanced !== p.body;
  const shown = orig ? p.body : override ?? p.enhanced ?? p.body, long = shown.length > 220, vars = extractVars(shown);
  const copy = async () => { await navigator.clipboard.writeText(shown); navigator.vibrate?.(10); toast("نُسخ البرومبت"); if (p.id !== "preview") sb.rpc("bump_copy", { p_id: p.id }).then(() => {}, () => {}); };
  async function share() {
    const url = `${location.origin}/p/${p.id}`;
    try { if (navigator.share) await navigator.share({ title: "خيال", text: shown.slice(0, 120), url }); else { await navigator.clipboard.writeText(url); toast("نُسخ الرابط"); } } catch {}
  }
  async function saveEdit() {
    const v = draft.trim(); if (!v) return;
    const who = await uid(); if (who) await sb.from("prompt_versions").insert({ prompt_id: p.id, author_id: who, body: p.body, enhanced: override ?? p.enhanced }).then(() => {}, () => {}); // احفظ النسخة الحالية قبل التعديل
    const { error } = await sb.from("prompts").update({ [p.enhanced ? "enhanced" : "body"]: v }).eq("id", p.id);
    if (error) return toast("تعذّر حفظ التعديل");
    setOverride(v); setEdit(false); toast("تم التعديل");
  }
  async function del() {
    if (!confirm("حذف هذا البرومبت؟")) return;
    setGone(true); const { error } = await sb.from("prompts").delete().eq("id", p.id);
    if (error) { setGone(false); toast("تعذّر الحذف"); } else toast("تم الحذف");
  }
  async function report(reason: string) {
    const id = await uid(); if (!id) return toast("سجّل الدخول أولاً");
    const { error } = await sb.from("reports").insert({ prompt_id: p.id, reporter_id: id, reason }); setRep(false);
    toast(error ? (error.code === "23505" ? "أبلغتَ عن هذا المنشور سابقاً" : "تعذّر الإرسال") : "شكراً، سنراجع البلاغ");
  }

  if (gone) return null;
  const first = p.images?.[0], ratio = first ? Math.min(Math.max(first.w / first.h, 0.8), 1.91) : 1;
  const name = p.author?.display_name ?? p.author?.username ?? "مستخدم", cat = p.category_id != null ? cats[p.category_id] : null;

  return (
    <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="overflow-hidden rounded-xl border border-silver bg-snow shadow-soft">
      <header className="flex items-center gap-3 p-4 pb-3">
        <Link href={`/profile/${p.author?.id}`} className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-brand/10">
          {p.author?.avatar_url && <img src={p.author.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy" />}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="flex items-center gap-1.5 text-caption text-smoke"><span>{ago(p.created_at)}</span>{cat && <span className="rounded-full bg-brand/10 px-2 text-brand">{cat}</span>}</p>
        </div>
        {mine ? <><button onClick={() => { setDraft(shown); setEdit(true); }} aria-label="تعديل" className={iconBtn}><Pencil size={17} /></button><button onClick={del} aria-label="حذف" className={iconBtn}><Trash2 size={17} /></button></>
          : <button onClick={() => p.id !== "preview" && setRep(true)} aria-label="إبلاغ" className={iconBtn}><Flag size={17} /></button>}
      </header>

      {first && (
        <div className="relative overflow-hidden">
          <div onScroll={(e) => setIdx(Math.round(Math.abs(e.currentTarget.scrollLeft) / e.currentTarget.clientWidth))} className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]" style={{ aspectRatio: ratio }}>
            {p.images.map((im, i) => (
              <button key={i} onClick={() => tapImg(i)} className="relative h-full w-full shrink-0 snap-center">
                <img src={thumb(im.url, 800)} alt="" width={im.w} height={im.h} loading="lazy" decoding="async" className="h-full w-full bg-mist object-cover" />
                {im.url.endsWith(".gif") && <span className="absolute left-3 top-3 rounded-full bg-brand px-2 text-[11px] text-snow">GIF</span>}
              </button>))}
          </div>
          {p.images.length > 1 && <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1">{p.images.map((_, i) => <span key={i} className={`h-1.5 rounded-full bg-snow ${i === idx ? "w-4" : "w-1.5 opacity-60"}`} />)}</div>}
        </div>)}

      <div className="flex flex-col gap-2 px-4 pt-3">
        {hasBoth && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-full bg-mist p-0.5 text-caption">
              {([[false, "✨ محسّن"], [true, "الأصلي"]] as const).map(([v, l]) => (
                <button key={l} onClick={() => setOrig(v)} className={`min-h-8 rounded-full px-3 font-medium transition-colors ${orig === v ? "bg-snow text-brand shadow-soft" : "text-smoke"}`}>{l}</button>))}
            </div>
            {p.model && !orig && <span dir="ltr" className="min-w-0 truncate text-caption text-smoke">{p.model.replace(":free", "").split("/").pop()}</span>}
          </div>)}
        <p onClick={tapText} className={`whitespace-pre-wrap text-base leading-[1.75] text-charcoal ${long && !more ? "line-clamp-6" : ""}`}>{shown}</p>
        {long && <button onClick={() => setMore(!more)} className="self-start text-sm font-medium text-brand">{more ? "عرض أقل" : "المزيد"}</button>}
        {(!!p.copy_count || !!p.fork_count || !!p.forked_from) && <p className="flex flex-wrap items-center gap-x-3 text-caption text-smoke">{!!p.copy_count && <span>نُسخ {fmt(p.copy_count)} مرة</span>}{!!p.fork_count && <span>فُرّع {fmt(p.fork_count)}</span>}{p.forked_from && <Link href={`/p/${p.forked_from}`} className="text-brand">مفرّع من أصل ↗</Link>}</p>}
      </div>

      <div className="flex items-center justify-between px-2 pt-2">
        <button ref={likeBtn} onClick={() => toggle("likes")} aria-label="إعجاب" className={act}>
          <motion.span key={pulse} animate={pulse ? { scale: [1, 1.35, 1] } : {}} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Heart size={22} className={liked ? "text-brand" : ""} fill={liked ? "currentColor" : "none"} /></motion.span>
          <span className="tabular-nums">{fmt(count)}</span></button>
        <button onClick={() => p.id !== "preview" && setSheet(true)} aria-label="تعليقات" className={act}><MessageCircle size={22} /><span className="tabular-nums">{fmt(p.comment_count)}</span></button>
        <button onClick={share} aria-label="مشاركة" className={act}><Share2 size={22} /></button>
        <button onClick={() => toggle("saves")} aria-label="حفظ" className={act}><Bookmark size={22} className={saved ? "text-brand" : ""} fill={saved ? "currentColor" : "none"} /></button>
      </div>

      <div className="flex gap-2 p-4 pt-2">
        <button onClick={copy} className="btn btn-soft !min-h-11 flex-1"><Copy size={16} />نسخ البرومبت</button>
        {vars.length ? <button onClick={() => setVsheet(true)} className="btn !min-h-11"><Braces size={16} className="text-brand" />عبّئ</button> : <Link href={`/enhance?text=${encodeURIComponent(p.body)}`} className="btn !min-h-11"><Sparkles size={16} className="text-brand" />جرّبه</Link>}
        {!mine && p.id !== "preview" && <Link href={`/new?fork=${p.id}`} className="btn !min-h-11"><GitFork size={16} className="text-brand" />فرّع</Link>}
      </div>

      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="التعليقات">{sheet && <Comments promptId={p.id} />}</BottomSheet>
      {lb !== null && <Lightbox images={p.images} start={lb} onClose={() => setLb(null)} />}
      <BottomSheet compact open={edit} onClose={() => setEdit(false)} title="تعديل البرومبت">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} className="min-h-[140px] w-full resize-none rounded-xl border border-silver bg-snow px-4 py-3 text-base outline-none focus:border-brand" />
        {vers.length > 0 && (
          <div className="mt-3 flex flex-col gap-2"><p className="text-caption text-smoke">الإصدارات السابقة — اضغط للاسترجاع</p>
            {vers.map((x) => <button key={x.id} onClick={() => setDraft(x.enhanced ?? x.body)} className="flex flex-col gap-0.5 rounded-xl border border-silver bg-snow p-3 text-start"><span className="text-caption text-smoke">{ago(x.created_at)}</span><span className="line-clamp-2 text-sm">{x.enhanced ?? x.body}</span></button>)}</div>)}
        <button onClick={saveEdit} disabled={!draft.trim()} className="btn btn-primary mt-3 !min-h-12 w-full disabled:opacity-50">حفظ التعديل</button>
      </BottomSheet>
      <BottomSheet compact open={rep} onClose={() => setRep(false)} title="إبلاغ عن المنشور">
        {REASONS.map((r) => <button key={r} onClick={() => report(r)} className="mb-2 min-h-12 w-full rounded-xl border border-silver px-4 text-start text-sm">{r}</button>)}
      </BottomSheet>
      <VarsSheet text={shown} open={vsheet} onClose={() => setVsheet(false)} />
    </motion.article>
  );
}
