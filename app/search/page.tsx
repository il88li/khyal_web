"use client";
// app/search/page.tsx — Explore: بحث + Trending Tags + Bento Categories + Remix
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, X, TrendingUp, Sparkles, Users, Image as ImageIcon, Code2, PenTool, Zap } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { sb, explain, thumb, withMeta } from "@/lib/supabase";
import { Lightbox, Skeleton } from "@/components/ui";
import { PromptCover } from "@/components/PromptCover";
import { VerifiedBadge } from "@/components/badges";
import type { PromptRow } from "@/types";

/* ── الأقسام الأربعة ── */
type ExploreSection = 
  | { type: "search" }
  | { type: "trending-tags"; tags: Tag[] }
  | { type: "categories"; categories: Category[] }
  | { type: "remix"; items: PromptRow[] };

interface Tag {
  id: string;
  name: string;
  count: number;
  trending?: boolean;
}

interface Category {
  id: number;
  name_ar: string;
  icon: React.ReactNode;
  color: "warm" | "mint" | "brand" | "gold";
  count?: number;
}

/* ── بيانات وهمية للتصميم (تُستبدل ببيانات فعلية من Supabase) ── */
const MOCK_TRENDING_TAGS: Tag[] = [
  { id: "1", name: "تصميم UI", count: 234, trending: true },
  { id: "2", name: "برومبتات صور", count: 189, trending: true },
  { id: "3", name: "كود بايثون", count: 156 },
  { id: "4", name: "تسويق رقمي", count: 134, trending: true },
  { id: "5", name: "كتابة إبداعية", count: 98 },
  { id: "6", name: "تحليل بيانات", count: 87 },
];

const MOCK_CATEGORIES: Category[] = [
  { id: 1, name_ar: "صور وتصميم", icon: <ImageIcon size={24} />, color: "warm", count: 456 },
  { id: 2, name_ar: "كتابة ومحتوى", icon: <PenTool size={24} />, color: "mint", count: 234 },
  { id: 3, name_ar: "برمجة وتطوير", icon: <Code2 size={24} />, color: "brand", count: 189 },
  { id: 4, name_ar: "تسويق وأعمال", icon: <TrendingUp size={24} />, color: "gold", count: 167 },
];

const MOCK_REMIX: PromptRow[] = [
  // ... بيانات برومبتات مفرعة
];

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const [activeSection, setActiveSection] = useState<string>("all");
  const input = useRef<HTMLInputElement>(null);
  
  useEffect(() => { 
    if (matchMedia("(pointer: fine)").matches) input.current?.focus(); 
  }, []);

  return (
    <main className="explore-page flex flex-col min-h-screen">
      {/* ══════════════ 1. حقل البحث Sticky ══════════════ */}
      <div className="sticky top-[var(--top)] z-40 bg-c-bg/95 backdrop-blur-md border-b border-c-line-soft -mx-3 px-3 md:mx-0 md:px-0 py-3">
        <div className="relative max-w-2xl mx-auto">
          <SearchIcon size={20} className="absolute start-4 top-1/2 -translate-y-1/2 text-smoke" />
          <input 
            ref={input} 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="ابحث في البرومبتات والأشخاص…" 
            enterKeyHint="search"
            className="field !min-h-12 ps-11 pe-12 w-full rounded-full bg-c-snow border-c-line shadow-[var(--sh-1)] focus:shadow-[var(--sh-2)] transition-shadow" 
          />
          {q && (
            <button 
              onClick={() => { setQ(""); input.current?.focus(); }} 
              aria-label="مسح" 
              className="absolute end-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-smoke hover:text-c-ink"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8 py-6 px-3 md:px-0">
        {/* ══════════════ 2. الوسوم الرائجة (Trending Tags) ══════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-accent-warm" />
            <h2 className="font-display text-lg font-bold text-c-ink">الوسوم الرائجة</h2>
          </div>
          
          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-3 px-3 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MOCK_TRENDING_TAGS.map((tag, i) => (
              <motion.button
                key={tag.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`
                  flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium
                  transition-all hover:scale-105 active:scale-95
                  ${tag.trending 
                    ? "bg-accent-warm/10 text-accent-warm border border-accent-warm/20" 
                    : "bg-c-snow text-c-ink-2 border border-c-line"
                  }
                `}
              >
                {tag.trending && <Zap size={14} />}
                #{tag.name}
                <span className="text-caption opacity-70">({tag.count})</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ══════════════ 3. Bento Grid للتصنيفات ══════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} className="text-brand" />
            <h2 className="font-display text-lg font-bold text-c-ink">استكشف حسب المجال</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MOCK_CATEGORIES.map((cat, i) => {
              const colorStyles = {
                warm: "bg-accent-warm/10 text-accent-warm border-accent-warm/20",
                mint: "bg-accent-mint/10 text-accent-mint-ink border-accent-mint/20",
                brand: "bg-brand-tint text-brand-ink border-brand/20",
                gold: "bg-gold-tint text-gold-ink border-gold/20",
              };
              
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative overflow-hidden rounded-2xl border p-4 text-start
                    transition-shadow hover:shadow-[var(--sh-2)]
                    ${colorStyles[cat.color]}
                  `}
                >
                  <div className="flex flex-col h-full min-h-[100px]">
                    <span className="mb-auto">{cat.icon}</span>
                    <div>
                      <h3 className="font-bold text-base mb-1">{cat.name_ar}</h3>
                      <p className="text-caption opacity-80">{cat.count} برومبت</p>
                    </div>
                  </div>
                  
                  {/* زخرفة خلفية */}
                  <div className="absolute -end-4 -bottom-4 opacity-10">
                    {cat.icon}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ══════════════ 4. الأكثر تفريعًا (Remix) ══════════════ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-accent-mint" />
              <h2 className="font-display text-lg font-bold text-c-ink">الأكثر تفريعًا هذا الأسبوع</h2>
            </div>
            <Link href="/trending" className="text-sm font-medium text-brand hover:text-brand-ink">
              عرض الكل ←
            </Link>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-3 px-3 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
            {MOCK_REMIX.map((prompt, i) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="snap-start shrink-0 w-[280px] md:w-[320px]"
              >
                <Link href={`/p/${prompt.id}`}>
                  <div className="card overflow-hidden hover:shadow-[var(--sh-2)] transition-shadow">
                    {prompt.images?.[0] ? (
                      <div className="aspect-video relative">
                        <img 
                          src={thumb(prompt.images[0].url, 400)} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 start-3 end-3">
                          <p className="text-on-media font-medium line-clamp-1 text-sm">
                            {prompt.title || "برومبت بدون عنوان"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-c-mist flex items-center justify-center">
                        <PromptCover variant="mini" />
                      </div>
                    )}
                    
                    <div className="p-3">
                      <div className="flex items-center gap-2 text-caption text-smoke">
                        <img 
                          src={prompt.author?.avatar_url || "/default-avatar.png"} 
                          alt="" 
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="truncate">{prompt.author?.display_name}</span>
                        <span className="ms-auto flex items-center gap-1">
                          <Zap size={12} />
                          {prompt.fork_count || 0} تفريعة
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* نتائج البحث (تظهر عند الكتابة) */}
        <AnimatePresence>
          {q.trim().length >= 2 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="min-h-[400px]"
            >
              {/* ... نتائج البحث الأصلية */}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
