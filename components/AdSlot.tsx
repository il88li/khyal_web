"use client";
// components/AdSlot.tsx — مساحة إعلانية: إعلان فعّال إن وُجد، وإلا مخطط البطاقة مع دعوة للإعلان لدى خيال.
// الإعلان يُخزَّن في جدول settings بالمفتاح `ad:<slot>` والقيمة:
// { "title": "…", "body": "…", "cta": "اعرف المزيد", "href": "https://…", "image": "https://…", "active": true }
import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Megaphone } from "@/components/icons";
import { Skeleton } from "./states";
import { sb } from "@/lib/supabase";

type Ad = { title: string; body?: string; cta?: string; href: string; image?: string; active?: boolean };
const https = (u?: string) => !!u && /^https?:\/\//i.test(u);

export function AdSlot({ slot, className = "" }: { slot: string; className?: string }) {
  const [ad, setAd] = useState<Ad | null | undefined>(undefined);
  useEffect(() => {
    let dead = false;
    sb.from("settings").select("value").eq("key", `ad:${slot}`).maybeSingle().then(
      ({ data, error }) => {
        const v = data?.value as Ad | undefined;
        if (!dead) setAd(!error && v && v.active !== false && v.title && https(v.href) ? v : null);
      },
      () => !dead && setAd(null),
    );
    return () => { dead = true; };
  }, [slot]);

  if (ad === undefined) return <Skeleton variant="list" count={1} className={className} />;

  if (ad)
    return (
      <aside aria-label="إعلان" className={`card flex flex-col gap-4 p-4 ${className}`}>
        <span className="chip self-start text-micro text-smoke">إعلان</span>
        {https(ad.image) && <img src={ad.image} alt="" loading="lazy" className="aspect-video w-full rounded-xl object-cover" />}
        <div className="flex flex-col gap-1"><p className="text-lg font-bold text-charcoal">{ad.title}</p>{ad.body && <p className="text-sm text-graphite">{ad.body}</p>}</div>
        <a href={ad.href} target="_blank" rel="sponsored noopener noreferrer" className="btn btn-primary btn-md self-start"><ExternalLink size={16} />{ad.cta || "اعرف المزيد"}</a>
      </aside>
    );

  // لا إعلان: مخطط البطاقة + دعوة للإعلان
  return (
    <aside aria-label="مساحة إعلانية متاحة" className={`card flex flex-col gap-4 p-4 ${className}`}>
      <div className="flex items-center gap-2 text-brand-ink"><Megaphone size={24} /><span className="text-sm font-semibold">مساحة إعلانية</span></div>
      <div aria-hidden="true" className="flex flex-col gap-2">
        <div className="aspect-video w-full rounded-xl bg-mist" />
        <div className="h-3 w-2/3 rounded-full bg-mist" /><div className="h-3 w-full rounded-full bg-mist" /><div className="h-8 w-28 rounded-full bg-mist" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-lg font-bold text-charcoal">أعلن لدى خيال</p>
        <p className="text-sm text-graphite">اوصل إلى صنّاع المحتوى والمبدعين العرب في المكان الذي يبحثون فيه عن الإلهام كل يوم.</p>
      </div>
      <Link href="/advertise" className="btn btn-primary btn-md self-start">أعلن معنا</Link>
    </aside>
  );
}
