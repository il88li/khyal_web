"use client";
// app/settings/page.tsx — إعدادات الحساب والخصوصية والتطبيق
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VERSION, disablePush, enablePush, explain, sb, thumb, toast, uid, uploadImage } from "@/lib/supabase";
import { ShieldCheck } from "lucide-react";

const field = "min-h-12 w-full rounded-xl border border-silver bg-snow px-4 py-3 text-sm outline-none focus:border-brand";
function Switch({ on, set, label, hint }: { on: boolean; set: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => set(!on)} className="flex min-h-12 w-full items-center justify-between gap-4 text-start">
      <span><span className="block text-sm">{label}</span>{hint && <span className="block text-caption text-smoke">{hint}</span>}</span>
      <span className={`flex h-7 w-12 shrink-0 items-center rounded-full border px-0.5 transition-colors ${on ? "border-brand bg-brand" : "border-silver bg-mist"}`} dir="ltr">
        <span className={`h-5 w-5 rounded-full bg-snow transition-transform ${on ? "translate-x-5" : ""}`} /></span>
    </button>
  );
}

export default function Settings() {
  const router = useRouter(), file = useRef<HTMLInputElement>(null), cov = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({ display_name: "", username: "", bio: "", avatar_url: "", cover_url: "", links: "", is_private: false });
  const [email, setEmail] = useState(""), [busy, setBusy] = useState(false), [reduce, setReduce] = useState(false);
  const [push, setPush] = useState(false);
  useEffect(() => setPush(localStorage.getItem("khiyal:push") === "1"), []);
  const togglePush = async (v: boolean) => { if (!v) { await disablePush(); return setPush(false); } const r = await enablePush(); toast(r === "ok" ? "فُعّلت الإشعارات" : r === "denied" ? "الإذن مرفوض من المتصفح" : "غير مدعوم على هذا الجهاز"); setPush(r === "ok"); };
  useEffect(() => {
    setReduce(localStorage.getItem("khiyal:reduce") === "1");
    uid().then(async (id) => {
      if (!id) return; setEmail((await sb.auth.getUser()).data.user?.email ?? "");
      const { data } = await sb.from("profiles").select("display_name,username,bio,avatar_url,cover_url,links,is_private").eq("id", id).single();
      if (data) setF({ display_name: data.display_name ?? "", username: data.username ?? "", bio: data.bio ?? "", avatar_url: data.avatar_url ?? "", cover_url: data.cover_url ?? "", links: ((data.links as string[]) ?? []).join("\n"), is_private: data.is_private });
    });
  }, []);

  async function avatar(fl?: File) {
    const id = await uid(); if (!fl || !id) return;
    try { const im = await uploadImage(fl, id); setF((x) => ({ ...x, avatar_url: thumb(im.url, 400) })); } catch (e: any) { toast(explain(e)); }
  }
  async function cover(fl?: File) {
    const id = await uid(); if (!fl || !id) return;
    try { const im = await uploadImage(fl, id); setF((x) => ({ ...x, cover_url: thumb(im.url, 800) })); } catch (e: any) { toast(explain(e)); }
  }
  async function save() {
    const id = await uid(); if (!id) return; setBusy(true);
    const { error } = await sb.from("profiles").update({ ...f, links: f.links.split("\n").map((x) => x.trim()).filter((x) => /^https?:\/\//.test(x)).slice(0, 3), username: f.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "") }).eq("id", id);
    setBusy(false); toast(error ? (error.code === "23505" ? "المعرّف مستخدم" : "تعذّر الحفظ") : "تم الحفظ");
  }
  const setR = (v: boolean) => { setReduce(v); localStorage.setItem("khiyal:reduce", v ? "1" : "0"); window.dispatchEvent(new Event("khiyal:reduce")); };
  const out = async () => { await sb.auth.signOut(); router.replace("/auth"); router.refresh(); };
  const ACC: [string, string][] = [["برتقالي", "255 79 0"], ["أزرق", "44 112 221"], ["أخضر", "36 178 109"], ["بنفسجي", "124 58 237"], ["وردي", "236 72 153"], ["فحمي", "34 34 34"]];
  const [acc, setAcc] = useState("255 79 0"), [hap, setHap] = useState(true), [pw, setPw] = useState("");
  useEffect(() => { setAcc(localStorage.getItem("khiyal:accent") || "255 79 0"); setHap(localStorage.getItem("khiyal:haptics") !== "0"); }, []);
  const pickAcc = (v: string) => { setAcc(v); localStorage.setItem("khiyal:accent", v); document.documentElement.style.setProperty("--brand", v); };
  const [blocks, setBlocks] = useState<{ blocked_id: string; profile: { display_name: string | null; username: string | null } | null }[]>([]);
  useEffect(() => { uid().then(async (id) => { if (!id) return; const { data } = await sb.from("blocks").select("blocked_id,profile:profiles!blocked_id(display_name,username)").eq("blocker_id", id); setBlocks((data as any) ?? []); }); }, []);
  async function unblock(b: string) { const id = await uid(); setBlocks((a) => a.filter((x) => x.blocked_id !== b)); await sb.from("blocks").delete().match({ blocker_id: id!, blocked_id: b }); toast("أُلغي الحظر"); }
  const pickHap = (v: boolean) => { setHap(v); localStorage.setItem("khiyal:haptics", v ? "1" : "0"); };
  async function changePw() { const { error } = await sb.auth.updateUser({ password: pw }); toast(error ? "تعذّر التغيير" : "تم تغيير كلمة المرور"); if (!error) setPw(""); }
  async function exportMine() {
    const id = await uid(); if (!id) return;
    const [a, b] = await Promise.all([sb.from("prompts").select("*").eq("author_id", id), sb.from("library").select("*").eq("user_id", id)]);
    const l = document.createElement("a"); l.href = URL.createObjectURL(new Blob([JSON.stringify({ prompts: a.data, library: b.data }, null, 2)], { type: "application/json" })); l.download = "khiyal-data.json"; l.click();
  }
  async function deleteAccount() {
    if (!confirm("حذف الحساب نهائياً مع كل منشوراتك؟ لا يمكن التراجع.")) return;
    const r = await fetch("/api/account", { method: "DELETE" });
    if (r.ok) { await sb.auth.signOut(); router.replace("/auth"); } else toast("تعذّر حذف الحساب");
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 pt-4">
      <header className="hidden h-14 items-center md:flex"><h1 className="text-2xl font-semibold">الإعدادات</h1></header>
      <section className="flex flex-col gap-3 rounded-xl border border-silver bg-snow p-4 shadow-soft">
        <h2 className="text-lg font-semibold">الحساب</h2>
        <button onClick={() => file.current?.click()} className="flex min-h-12 items-center gap-3 text-sm text-cobalt">
          <span className="h-14 w-14 overflow-hidden rounded-full bg-mist">{f.avatar_url && <img src={f.avatar_url} alt="" className="h-full w-full object-cover" />}</span>تغيير الصورة</button>
        <input ref={file} type="file" accept="image/*" hidden onChange={(e) => avatar(e.target.files?.[0])} />
        <button onClick={() => cov.current?.click()} className="flex min-h-12 items-center gap-3 text-sm text-cobalt"><span className="h-14 w-24 overflow-hidden rounded-xl bg-mist">{f.cover_url && <img src={f.cover_url} alt="" className="h-full w-full object-cover" />}</span>تغيير الغلاف</button>
        <input ref={cov} type="file" accept="image/*" hidden onChange={(e) => cover(e.target.files?.[0])} />
        <input value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} placeholder="الاسم" className={field} />
        <input dir="ltr" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} placeholder="username" className={field} />
        <textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} rows={3} placeholder="نبذة" className={`${field} resize-none`} />
        <textarea dir="ltr" value={f.links} onChange={(e) => setF({ ...f, links: e.target.value })} rows={3} placeholder={"https://… (رابط في كل سطر، حتى 3)"} className={`${field} resize-none`} />
        <input dir="ltr" value={email} readOnly className={`${field} bg-fog text-smoke`} />
        <button onClick={save} disabled={busy} className="flex min-h-12 items-center justify-center rounded-full bg-brand text-sm font-medium text-snow active:opacity-80 disabled:bg-mist disabled:text-ash">
          {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-snow/40 border-t-snow" /> : "حفظ التغييرات"}</button>
      </section>
      <section className="flex flex-col rounded-xl border border-silver bg-snow p-4 shadow-soft">
        <h2 className="pb-2 text-lg font-semibold">الخصوصية</h2>
        <Link href="/safety" className="mb-2 flex min-h-12 items-center justify-between rounded-xl bg-fog px-4 text-sm">
          <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-brand" />مركز الأمان والثقة</span><span className="text-caption text-brand">افتح ←</span>
        </Link>
        <Switch on={f.is_private} set={async (v) => { setF({ ...f, is_private: v }); const id = await uid(); await sb.from("profiles").update({ is_private: v }).eq("id", id!); }} label="حساب خاص" hint="لا يرى منشوراتك إلا متابعوك" />
      </section>
      <section className="flex flex-col rounded-xl border border-silver bg-snow p-4 shadow-soft">
        <h2 className="pb-2 text-lg font-semibold">التطبيق</h2>
        <Switch on={push} set={togglePush} label="الإشعارات الفورية" hint="تنبيهات الإعجاب والمتابعة والتعليقات" />
        <Switch on={reduce} set={setR} label="تخفيف الحركة" hint="يقلل الحركات والانتقالات" />
        <p className="py-3 text-caption text-smoke" dir="ltr">Khiyal {VERSION}</p>
      </section>
      <section className="flex flex-col gap-3 rounded-xl border border-silver bg-snow p-4 shadow-soft">
        <h2 className="text-lg font-semibold">الحسابات المحظورة</h2>
        {!blocks.length ? <p className="text-sm text-smoke">لا أحد محظور.</p> : blocks.map((b) => (
          <div key={b.blocked_id} className="flex min-h-12 items-center justify-between gap-3"><span className="truncate text-sm">{b.profile?.display_name ?? b.profile?.username ?? "مستخدم"}</span>
            <button onClick={() => unblock(b.blocked_id)} className="min-h-10 rounded-full border border-silver px-4 text-sm">إلغاء الحظر</button></div>))}
      </section>
      <section className="flex flex-col gap-3 rounded-xl border border-silver bg-snow p-4 shadow-soft">
        <h2 className="text-lg font-semibold">المظهر والتفاعل</h2>
        <p className="text-caption text-smoke">لون التطبيق</p>
        <div className="flex gap-3 overflow-x-auto p-1 [scrollbar-width:none]">{ACC.map(([n, v]) => <button key={v} onClick={() => pickAcc(v)} aria-label={n} className={`h-10 w-10 shrink-0 rounded-full border-2 shadow-soft ${acc === v ? "border-charcoal" : "border-snow"}`} style={{ background: `rgb(${v})` }} />)}</div>
        <Switch on={hap} set={pickHap} label="الاهتزاز عند التفاعل" />
      </section>
      <section className="flex flex-col gap-3 rounded-xl border border-silver bg-snow p-4 shadow-soft">
        <h2 className="text-lg font-semibold">الأمان</h2>
        <input type="password" dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="كلمة مرور جديدة (6 أحرف+)" autoComplete="new-password" className={field} />
        <button onClick={changePw} disabled={pw.length < 6} className="min-h-12 rounded-full border border-silver text-sm active:opacity-70 disabled:text-ash">تغيير كلمة المرور</button>
      </section>
      <section className="flex flex-col gap-3 rounded-xl border border-silver bg-snow p-4 shadow-soft">
        <h2 className="text-lg font-semibold">بياناتي</h2>
        <button onClick={exportMine} className="min-h-12 rounded-full border border-silver text-sm active:opacity-70">تنزيل بياناتي (JSON)</button>
        <button onClick={out} className="min-h-12 rounded-full bg-brand text-sm font-medium text-snow active:opacity-80">تسجيل الخروج</button>
        <button onClick={deleteAccount} className="btn !min-h-12 text-smoke">حذف الحساب نهائياً</button>
      </section>
    </main>
  );
}
