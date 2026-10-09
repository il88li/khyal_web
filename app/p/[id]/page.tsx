// app/p/[id]/page.tsx — صفحة برومبت عامة: معرض صور + تعليقات + Open Graph
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Comments, CopyButton, Gallery } from "@/components/ui";

async function get(id: string) {
  const store = cookies();
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => store.getAll(), setAll: () => {} } });
  const { data } = await sb.from("prompts").select("id,body,enhanced,images,model,author:profiles!author_id(display_name,username)").eq("id", id).maybeSingle();
  return data as any;
}
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await get(params.id); if (!p) return {};
  const d = (p.enhanced ?? p.body).slice(0, 160);
  return { title: `${p.author?.display_name ?? "خيال"} على خيال`, description: d, openGraph: { title: "برومبت على خيال", description: d, images: p.images?.[0]?.url ? [p.images[0].url] : undefined } };
}
export default async function Page({ params }: { params: { id: string } }) {
  const p = await get(params.id); if (!p) notFound();
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 pt-6">
      <Link href="/" className="btn btn-soft self-start">← خيال</Link>
      <p className="text-caption text-smoke">{p.author?.display_name ?? p.author?.username}</p>
      <Gallery images={p.images ?? []} />
      <p className="max-w-[65ch] whitespace-pre-wrap rounded-xl border border-silver bg-fog p-5 text-base">{p.enhanced ?? p.body}</p>
      <CopyButton text={p.enhanced ?? p.body} />
      <Link href={`/enhance?text=${encodeURIComponent(p.body)}`} className="flex min-h-12 items-center justify-center rounded-full bg-brand px-5 text-sm font-medium text-snow active:opacity-80">حسّن هذا البرومبت</Link>
      <h2 className="text-lg font-semibold">التعليقات</h2>
      <div className="flex h-[420px] flex-col"><Comments promptId={p.id} /></div>
    </main>
  );
}
