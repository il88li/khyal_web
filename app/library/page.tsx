"use client";
// app/library/page.tsx — مكتبتي: النسخ المحسّنة المحفوظة (خاصة بي): بحث، فلترة بالفئة، نسخ، إعادة تحسين، نشر، حذف
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Send, Sparkles, Trash2, BookMarked, Search } from "lucide-react";
import { sb, toast, uid, ago, explain } from "@/lib/supabase";

type Item = { id: string; body: string; enhanced: string; model: string | null; category_id: number | null; created_at: string };

export default function Library() {
  const [items, setItems] = useState<Item[] | null>(null), [cats, setCats] = useState<Record<number, string>>({});
  const [cat, setCat] = useState<number | null>(null), [q, setQ] = useState(""), [open, setOpen] = useState<string | null>(null), [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const id = await uid(); if (!id) return;
      const [l, c] = await Promise.all([
        sb.from("library").select("id,body,enhanced,model,category_id,created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(200),
        sb.from("categories").select("id,name_ar"),
      ]);
      if (l.error) { setErr(explain(l.error)); setItems([]); return; }
      setItems((l.data as Item[]) ?? []); setCats(Object.fromEntries((c.data ?? []).map((x: any) => [x.id, x.name_ar])));
    })();
  }, []);

  const usedCats = useMemo(() => Array.from(new Set((items ?? []).map((i) => i.category_id).filter((x): x is number => x != null))), [items]);
  const list = useMemo(() => (items ?? []).filter((i) => (cat == null || i.category_id === cat) && (!q.trim() || (i.body + " " + i.enhanced).toLowerCase().includes(q.trim().toLowerCase()))), [items, cat, q]);

  const copy = async (t: string) => { await navigator.clipboard.writeText(t); navigator.vibrate?.(10); toast("نُسخ البرومبت"); };
  async function publish(i: Item) {
    const id = await uid(); if (!id) return;
    const { error } = await sb.from("prompts").insert({ author_id: id, body: i.body, enhanced: i.enhanced, category_id: i.category_id, model: i.model });
    if (error) return toast(explain(error));
    (window as any).__feedDirty = true; toast("تم النشر على حسابك");
  }
  async function remove(i: Item) {
    if (!confirm("حذف هذا العنصر من مكتبتك؟")) return;
    const prev = items; setItems((a) => a && a.filter((x) => x.id !== i.id));
    const { error } = await sb.from("library").delete().eq("id", i.id);
    if (error) { setItems(prev); toast(explain(error)); } else toast("تم الحذف");
  }

  const chip = (on: boolean) => `min-h-10 shrink-0 rounded-full border px-4 text-sm ${on ? "border-brand bg-brand text-snow" : "border-silver bg-snow text-graphite"}`;
  return (
    <main className="flex flex-col gap-3 pt-2">
      <div className="relative">
        <Search size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-smoke" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في مكتبتك…" className="min-h-12 w-full rounded-full border border-silver bg-snow ps-11 pe-4 text-sm shadow-soft outline-none transition-colors focus:border-brand" />
      </div>
      {usedCats.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0 [scrollbar-width:none]">
          <button onClick={() => setCat(null)} className={chip(cat == null)}>الكل</button>
          {usedCats.map((c) => <button key={c} onClick={() => setCat(c)} className={chip(cat === c)}>{cats[c] ?? "عام"}</button>)}
        </div>)}

      {!items ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-mist" />)
        : err ? <p className="py-16 text-center text-graphite">{err}</p>
        : !items.length ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand"><BookMarked size={28} /></span>
            <p className="max-w-[30ch] text-graphite">مكتبتك فارغة. حسّن برومبتاً واضغط «حفظ» ليظهر هنا.</p>
            <Link href="/enhance" className="btn btn-primary">ابدأ التحسين</Link>
          </div>)
        : !list.length ? <p className="py-16 text-center text-graphite">لا نتائج مطابقة.</p>
        : (
          <div className="flex flex-col gap-3 pb-4">
            <AnimatePresence initial={false}>
              {list.map((i) => (
                <motion.article key={i.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="flex flex-col gap-3 rounded-xl border border-silver bg-snow p-4 shadow-soft">
                  <header className="flex items-center justify-between">
                    <span className="rounded-full bg-brand/10 px-3 text-caption text-brand">{cats[i.category_id ?? -1] ?? "عام"}</span>
                    <span className="text-caption text-smoke">{ago(i.created_at)}</span>
                  </header>
                  <p onClick={() => setOpen(open === i.id ? null : i.id)} className={`cursor-pointer whitespace-pre-wrap text-base ${open === i.id ? "" : "line-clamp-5"}`}>{i.enhanced}</p>
                  {open === i.id && <div className="rounded-xl bg-mist p-3"><p className="text-caption text-smoke">النص الأصلي</p><p className="whitespace-pre-wrap text-sm text-graphite">{i.body}</p></div>}
                  <footer className="flex flex-wrap gap-2">
                    <button onClick={() => copy(i.enhanced)} className="btn"><Copy size={16} />نسخ</button>
                    <Link href={`/enhance?text=${encodeURIComponent(i.body)}`} className="btn"><Sparkles size={16} />حسّن</Link>
                    <button onClick={() => publish(i)} className="btn btn-soft"><Send size={16} />نشر</button>
                    <button onClick={() => remove(i)} aria-label="حذف" className="btn !px-3 text-smoke"><Trash2 size={16} /></button>
                  </footer>
                </motion.article>))}
            </AnimatePresence>
          </div>)}
    </main>
  );
}
