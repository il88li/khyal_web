"use client";
// app/lab/page.tsx — المختبر: قارن مخرجات 2–4 نماذج على نفس البرومبت جنبًا إلى جنب، واعتمد الفائز
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bookmark, Copy, FlaskConical, RotateCcw, Send, Trophy } from "lucide-react";
import { explain, sb, toast, uid } from "@/lib/supabase";

type Cat = { id: number; name_ar: string };
type Res = { model: string; out: string; status: "wait" | "run" | "done" | "error"; err?: string; at: number };
const EXAMPLES = ["اكتب وصفة منتج جذاباً لقهوة مختصة", "ولّد خمسة أسماء لمشروع تعليمي", "صمّم خطة محتوى لحساب تسويقي لمدة أسبوع"];
const FALLBACK = ["openrouter/free", "deepseek/deepseek-chat-v3-0324:free", "meta-llama/llama-3.3-70b-instruct:free", "qwen/qwen-2.5-72b-instruct:free"];
const name = (m: string) => (m === "openrouter/free" ? "تلقائي" : m.replace(":free", "").split("/").pop() ?? m);
const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

function Lab() {
  const qs = useSearchParams();
  const [text, setText] = useState(""), [cats, setCats] = useState<Cat[]>([]), [cat, setCat] = useState<Cat | null>(null);
  const [pool, setPool] = useState<string[]>(FALLBACK), [picked, setPicked] = useState<string[]>(FALLBACK.slice(1, 4));
  const [results, setResults] = useState<Res[] | null>(null), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  const [winner, setWinner] = useState<string | null>(null), [saving, setSaving] = useState(""), [, tick] = useState(0);
  const ctl = useRef<AbortController | null>(null);

  useEffect(() => {
    if (qs.get("text")) setText(qs.get("text")!);
    else { try { const d = localStorage.getItem("khiyal:draft"); if (d) setText(d); } catch {} }
    sb.from("categories").select("id,name_ar").eq("active", true).order("sort").then(({ data }) => { if (data?.length) { setCats(data); setCat(data[0]); } });
    fetch("/api/models").then((r) => r.json()).then((j) => {
      const list: string[] = j.models ?? [];
      if (list.length) { setPool(list.slice(0, 12)); setPicked(list.slice(0, 3)); }
    }).catch(() => {}); // عند الفشل تبقى القائمة الافتراضية
  }, []); // eslint-disable-line
  useEffect(() => { if (!busy) return; const i = setInterval(() => tick((x) => x + 1), 500); return () => clearInterval(i); }, [busy]);

  const toggle = (m: string) => setPicked((p) => (p.includes(m) ? p.filter((x) => x !== m) : p.length >= 4 ? p : [...p, m]));
  const secs = (r: Res) => ((Date.now() - r.at) / 1000).toFixed(1);

  async function run() {
    if (busy || !text.trim() || picked.length < 2) return;
    const sel = picked;
    setBusy(true); setErr(""); setWinner(null); setResults(sel.map((m) => ({ model: m, out: "", status: "wait", at: Date.now() })));
    ctl.current = new AbortController();
    const patch = (m: string, u: Partial<Res>) => setResults((rs) => (rs ?? []).map((r) => (r.model === m ? { ...r, ...u } : r)));
    try {
      const res = await fetch("/api/compare", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.current.signal, body: JSON.stringify({ text, models: sel, category: cat?.name_ar }) });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        const m = res.status === 401 ? "سجّل الدخول أولاً" : res.status === 429 ? "طلبات كثيرة، انتظر قليلاً" : j.error === "disabled" ? "المختبر متوقف مؤقتاً" : j.detail ?? "تعذّر بدء المقارنة";
        setErr(m); setResults(null); setBusy(false); return;
      }
      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() ?? "";
        for (const l of lines) {
          if (!l.startsWith("data: ")) continue;
          let j: any; try { j = JSON.parse(l.slice(6)); } catch { continue; }
          if (j.model) {
            if (j.started) patch(j.model, { status: "run" });
            if (j.delta) setResults((rs) => (rs ?? []).map((r) => (r.model === j.model ? { ...r, status: "run", out: r.out + j.delta } : r)));
            if (j.done) patch(j.model, { status: "done" });
            if (j.error) patch(j.model, { status: "error", err: j.error });
          }
        }
      }
    } catch (e: any) { if (e?.name !== "AbortError") { setErr("تعذّر الاتصال بالخادم"); setResults(null); } }
    setBusy(false);
  }

  const copy = async (t: string) => { await navigator.clipboard.writeText(t); navigator.vibrate?.(10); toast("نُسخ البرومبت"); };
  async function save(m: string) {
    const out = results?.find((r) => r.model === m)?.out; if (!out) return;
    const id = await uid(); if (!id) return toast("سجّل الدخول أولاً");
    setSaving(m);
    const { error } = await sb.from("library").insert({ user_id: id, body: text, enhanced: out, category_id: cat?.id, model: m });
    setSaving(""); toast(error ? explain(error) : "حُفظ في مكتبتك");
  }
  async function publish() {
    const out = results?.find((r) => r.model === winner)?.out; if (!out || !winner) return;
    const id = await uid(); if (!id) return toast("سجّل الدخول أولاً");
    setSaving(winner);
    const { error } = await sb.from("prompts").insert({ author_id: id, body: text, enhanced: out, category_id: cat?.id, model: winner });
    setSaving(""); if (error) return toast(explain(error));
    (window as any).__feedDirty = true; toast("نُشر على حسابك ✓");
  }

  const chip = (on: boolean) => `min-h-10 shrink-0 rounded-full border px-4 text-sm transition-colors ${on ? "border-brand bg-brand text-snow" : "border-silver bg-snow text-graphite"}`;
  const act = "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-silver bg-snow text-caption active:opacity-70 disabled:text-ash";

  return (
    <main className="flex flex-col gap-3 pb-5">
      <header className="flex items-start gap-3 rounded-xl border border-silver bg-fog p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"><FlaskConical size={20} /></span>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold">المختبر</h1>
          <p className="text-caption text-graphite">برومبت واحد… نماذج متعددة، ونتائج جنبًا إلى جنب. اختر الأفضل واعتمده.</p>
        </div>
      </header>

      {!results ? (
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب أو الصق البرومبت الذي تريد مقارنة نتائجه…"
          className="min-h-[130px] resize-none rounded-xl border border-silver bg-snow px-4 py-3 text-base outline-none transition-colors focus:border-brand" />
      ) : (
        <button onClick={() => { setResults(null); setErr(""); }} className="flex shrink-0 items-center gap-3 rounded-xl border border-silver bg-snow p-3 text-start shadow-soft">
          <span className="min-w-0 flex-1"><span className="block text-caption text-smoke">البرومبت المُختبَر</span><span className="line-clamp-1 text-sm">{text}</span></span>
          <span className="btn btn-soft !min-h-8 !px-3">تعديل</span>
        </button>
      )}
      {!results && !text && <div className="flex flex-wrap gap-2">{EXAMPLES.map((x) => <button key={x} onClick={() => setText(x)} className="btn btn-soft !min-h-9 !px-3 !text-caption">{x}</button>)}</div>}

      {!results && !!cats.length && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0 [scrollbar-width:none]">
          {cats.map((c) => <button key={c.id} onClick={() => setCat(c)} className={`${chip(cat?.id === c.id)} !min-h-9 !px-3 !text-caption`}>{c.name_ar}</button>)}
        </div>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-caption text-smoke">اختر النماذج <span className="text-brand">{picked.length}/4</span></p>
          {picked.length < 2 && <p className="text-caption text-brand">اختر نموذجين على الأقل</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {pool.map((m) => (
            <button key={m} onClick={() => !busy && toggle(m)} title={m} className={`${chip(picked.includes(m))} !min-h-9 !px-3 !text-caption`} dir="ltr">{name(m)}</button>
          ))}
        </div>
      </section>

      {err && <p className="rounded-xl bg-fog p-3 text-caption text-graphite">{err}</p>}

      <button onClick={() => (busy ? ctl.current?.abort() : run())} disabled={!busy && (!text.trim() || picked.length < 2)}
        className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand text-sm font-medium text-snow shadow-pop active:opacity-80 disabled:bg-mist disabled:text-ash disabled:shadow-none">
        {busy ? "إيقاف المقارنة" : results ? "إعادة المقارنة" : "قارن النتائج"}
      </button>

      {results && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-caption text-smoke">اسحب جانبياً للمقارنة</p>
            {busy && <p className="text-caption text-brand">جارٍ التوليد…</p>}
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 [scrollbar-width:none]">
            {results.map((r) => (
              <article key={r.model} className={`flex w-[85vw] max-w-[360px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border bg-snow shadow-soft md:w-[340px] ${winner === r.model ? "border-brand" : "border-silver"}`}>
                <header className="flex items-center gap-2 border-b border-silver px-3 py-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${r.status === "run" ? "animate-pulse bg-brand" : r.status === "error" ? "bg-charcoal" : r.status === "done" ? "bg-brand" : "bg-ash"}`} />
                  <span dir="ltr" className="min-w-0 flex-1 truncate text-sm font-semibold">{name(r.model)}</span>
                  {winner === r.model ? <span className="rounded-full bg-brand/10 px-2 py-0.5 text-caption text-brand">الأفضل</span>
                    : <span className="text-caption text-smoke">{r.out ? `${words(r.out)} كلمة · ${secs(r)}ث` : r.status === "error" ? "خطأ" : "…"}</span>}
                </header>
                <div className="min-h-[200px] max-h-[46vh] flex-1 overflow-y-auto whitespace-pre-wrap p-3 text-sm">
                  {r.status === "error" ? <span className="text-graphite">{r.err}</span>
                    : r.out || <span className="text-smoke">{r.status === "wait" ? "بانتظار النموذج…" : "جارٍ التوليد…"}</span>}
                </div>
                <footer className="flex gap-2 border-t border-silver p-2">
                  <button onClick={() => copy(r.out)} disabled={!r.out} className={act}><Copy size={14} />نسخ</button>
                  <button onClick={() => save(r.model)} disabled={!r.out || !!saving} className={act}><Bookmark size={14} />{saving === r.model ? "…" : "حفظ"}</button>
                  <button onClick={() => setWinner(winner === r.model ? null : r.model)} disabled={!r.out}
                    className={`${act} ${winner === r.model ? "!border-brand bg-brand/10 font-medium text-brand" : ""}`}><Trophy size={14} />الأفضل</button>
                </footer>
              </article>
            ))}
          </div>
          {!busy && (
            winner ? (
              <div className="flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/5 p-2">
                <span className="min-w-0 flex-1 truncate px-1 text-caption text-graphite">الفائز: <b dir="ltr">{name(winner)}</b></span>
                <button onClick={() => save(winner)} disabled={!!saving} className="btn !min-h-9 !px-3 !text-caption"><Bookmark size={14} />حفظ</button>
                <button onClick={publish} disabled={!!saving} className="btn btn-primary !min-h-9 !px-3 !text-caption"><Send size={14} />{saving === winner ? "…" : "انشر"}</button>
              </div>
            ) : <p className="rounded-xl bg-fog p-3 text-center text-caption text-smoke">رأيت الأفضل؟ اضغط «الأفضل» على النتيجة الأقوى ثم احفظها أو انشرها.</p>
          )}
          <button onClick={() => setResults(null)} className="btn mx-auto !min-h-10 text-smoke"><RotateCcw size={16} />مقارنة جديدة</button>
        </section>
      )}
    </main>
  );
}

export default function Page() { return <Suspense fallback={null}><Lab /></Suspense>; }
