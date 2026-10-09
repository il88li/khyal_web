"use client";
// app/new/page.tsx — نشر برومبت: صور متعددة (ترتيب/حذف)، ضغط، تقدّم الرفع، معاينة
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X, ChevronRight, ChevronLeft } from "lucide-react";
import { dims, explain, sb, toast, uid, uploadImage } from "@/lib/supabase";
import PromptCard from "@/components/PromptCard";
import type { Img, PromptRow } from "@/types";

type Item = { file: File; url: string; w: number; h: number; p: number };
const MAX = 10;

export default function NewPrompt() {
  const router = useRouter(), input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(""), [items, setItems] = useState<Item[]>([]), [cats, setCats] = useState<{ id: number; name_ar: string }[]>([]);
  const [cat, setCat] = useState<number | null>(null), [busy, setBusy] = useState(false), [preview, setPreview] = useState(false);
  const [forkOf, setForkOf] = useState<string | null>(null);
  useEffect(() => { // تفريع: املأ النموذج بنص الأصل وانسبه عند النشر
    const f = new URLSearchParams(location.search).get("fork"); if (!f) return;
    sb.from("prompts").select("id,body,enhanced,category_id").eq("id", f).maybeSingle().then(({ data }) => { if (data) { setForkOf(data.id); setText(data.enhanced ?? data.body); if (data.category_id) setCat(data.category_id); } });
  }, []);
  useEffect(() => { sb.from("categories").select("id,name_ar").eq("active", true).order("sort").then(({ data }) => data && setCats(data)); }, []);

  async function pick(files: FileList | null) {
    if (!files) return;
    const room = MAX - items.length; if (files.length > room) toast(`الحد الأقصى ${MAX} صور`);
    const add = await Promise.all(Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, room).map(async (file) => ({ file, url: URL.createObjectURL(file), ...(await dims(file)), p: 0 })));
    setItems((a) => [...a, ...add]);
  }
  const move = (i: number, d: number) => setItems((a) => { const b = [...a], j = i + d; if (j < 0 || j >= b.length) return a; [b[i], b[j]] = [b[j], b[i]]; return b; });

  async function publish() {
    const id = await uid(); if (!id || !text.trim() || busy) return;
    setBusy(true);
    try {
      const imgs: Img[] = [];
      for (let i = 0; i < items.length; i++) imgs.push(await uploadImage(items[i].file, id, (p) => setItems((a) => a.map((x, j) => (j === i ? { ...x, p } : x)))));
      const row: any = { author_id: id, body: text.trim(), category_id: cat, images: imgs }; if (forkOf) row.forked_from = forkOf;
      let { error } = await sb.from("prompts").insert(row);
      if (error && forkOf && /forked_from|schema cache|column/i.test(error.message)) { delete row.forked_from; ({ error } = await sb.from("prompts").insert(row)); }
      if (error) throw error;
      (window as any).__feedDirty = true; toast("تم النشر"); router.push("/");
    } catch (e: any) { toast(explain(e)); setBusy(false); }
  }

  const row: PromptRow = { id: "preview", body: text, enhanced: null, model: null, like_count: 0, comment_count: 0, created_at: new Date().toISOString(), category_id: cat, images: items.map((i) => ({ url: i.url, w: i.w, h: i.h })), author: { id: "", username: "", display_name: "معاينة", avatar_url: null } };
  const ib = "flex h-8 w-8 items-center justify-center rounded-full bg-snow text-charcoal border border-silver";

  return (
    <main className="flex flex-col gap-5 pt-4">
      <header className="flex h-14 items-center justify-between"><h1 className="hidden text-2xl font-semibold md:block">برومبت جديد</h1>
        <button onClick={() => setPreview(!preview)} className="btn btn-soft ms-auto">{preview ? "تحرير" : "معاينة"}</button></header>
      {preview ? <PromptCard p={row} /> : (<>
        {forkOf && <p className="rounded-xl bg-brand/10 p-3 text-caption text-brand">مفرّع من برومبت آخر — سيُنسب الأصل تلقائياً، عدّل كما تشاء.</p>}
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="اكتب البرومبت…" className="min-h-[160px] w-full resize-none rounded-xl border border-silver bg-snow px-4 py-3 text-base outline-none focus:border-brand" />
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0 [scrollbar-width:none]">
          {cats.map((c) => <button key={c.id} onClick={() => setCat(c.id === cat ? null : c.id)} className={`min-h-10 shrink-0 rounded-full border px-4 text-sm ${cat === c.id ? "border-brand bg-brand text-snow" : "border-silver text-graphite"}`}>{c.name_ar}</button>)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {items.map((it, i) => (
            <div key={it.url} className="relative aspect-square overflow-hidden rounded-xl bg-mist">
              <img src={it.url} alt="" className="h-full w-full object-cover" />
              {busy ? <span className="absolute inset-x-0 bottom-0 h-1 bg-brand" style={{ width: `${it.p}%` }} /> : <>
                <button onClick={() => setItems((a) => a.filter((_, j) => j !== i))} aria-label="حذف" className={`${ib} absolute right-1 top-1`}><X size={16} /></button>
                <div className="absolute inset-x-1 bottom-1 flex justify-between">
                  <button onClick={() => move(i, 1)} aria-label="تأخير" className={ib}><ChevronLeft size={16} /></button>
                  <button onClick={() => move(i, -1)} aria-label="تقديم" className={ib}><ChevronRight size={16} /></button>
                </div></>}
            </div>
          ))}
          {items.length < MAX && <button onClick={() => input.current?.click()} aria-label="إضافة صور" className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-silver text-smoke active:opacity-60"><ImagePlus size={24} /></button>}
        </div>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
      </>)}
      <button onClick={publish} disabled={busy || !text.trim()} className="flex min-h-12 items-center justify-center rounded-full bg-brand px-5 text-sm font-medium text-snow active:opacity-80 disabled:bg-mist disabled:text-ash">
        {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-snow/40 border-t-snow" /> : "نشر"}
      </button>
    </main>
  );
}
