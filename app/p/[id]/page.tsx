// app/p/[id]/page.tsx — صفحة برومبت عامة: معرض صور + تعليقات + Open Graph
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Comments, Gallery } from "@/components/ui";
import { GatedPrompt } from "@/components/GatedPrompt";

async function get(id: string) {
  const store = cookies();
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => store.getAll(), setAll: () => {} } });
  const { data } = await sb.from("prompts").select("id,body,enhanced,images,model,author:profiles!author_id(id,display_name,username)").eq("id", id).maybeSingle();
  return data as any;
}
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await get(params.id); if (!p) return {};
  const d = (p.enhanced ?? p.body).slice(0, 90);
  return { title: `${p.author?.display_name ?? "خيال"} على خيال`, description: d, openGraph: { title: "برومبت على خيال", description: d, images: p.images?.[0]?.url ? [p.images[0].url] : undefined } };
}
export default async function Page({ params }: { params: { id: string } }) {
  const p = await get(params.id); if (!p) notFound();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 pt-5">
      <Link href="/" className="btn btn-ghost self-start !min-h-9">← خيال</Link>
      <p className="text-lg font-bold text-charcoal">{p.author?.display_name ?? p.author?.username}</p>
      <Gallery images={p.images ?? []} />
      <GatedPrompt text={p.enhanced ?? p.body} ownerId={p.author?.id} />
      <h2 className="pt-1 text-lg font-bold">التعليقات</h2>
      <div className="flex h-[420px] flex-col"><Comments promptId={p.id} /></div>
    </main>
  );
}
