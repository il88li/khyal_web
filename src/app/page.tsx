"use client";

import { useState, useCallback, useEffect } from "react";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { PromptCard } from "@/components/feed/PromptCard";
import { PromptCardSkeleton } from "@/components/shared/Skeleton";
import { Prompt, CATEGORIES, Category } from "@/types";
import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";
import Link from "next/link";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { fetchPrompts } from "@/app/actions/prompts";
import { useRealtimePrompts } from "@/hooks/useRealtimePrompts";
import { cn } from "@/lib/utils";

const DEMO_PROMPTS: Prompt[] = [
  {
    id: "1",
    user_id: "u1",
    original: "اكتب لي مقال عن الذكاء الاصطناعي",
    enhanced:
      "اكتب مقالاً احترافياً بالعربية الفصحى عن تطبيقات الذكاء الاصطناعي في التعليم العربي، بطول 800-1000 كلمة، مع أمثلة عملية من المنطقة العربية، وأدرج عناوين فرعية واضحة وخاتمة تتضمن توصيات للمستقبل.",
    category: "writing",
    tone: "formal",
    detail_level: "detailed",
    language: "ar",
    likes_count: 42,
    comments_count: 7,
    saves_count: 15,
    is_liked: false,
    is_saved: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    user: { id: "u1", username: "sara_ai", display_name: "سارة" },
  },
  {
    id: "2",
    user_id: "u2",
    original: "make a landing page for saas",
    enhanced:
      "Create a modern, conversion-focused landing page for a B2B SaaS product that helps teams manage remote work. Include: hero with clear value proposition, 3 feature cards, social proof section, pricing teaser, and a strong CTA. Use Tailwind CSS, mobile-first, and keep the design minimal with a single accent color.",
    category: "coding",
    tone: "technical",
    detail_level: "balanced",
    language: "en",
    likes_count: 128,
    comments_count: 23,
    saves_count: 56,
    is_liked: true,
    is_saved: false,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
    user: { id: "u2", username: "dev_ahmed", display_name: "أحمد المطور" },
  },
  {
    id: "3",
    user_id: "u3",
    original: "تصميم شعار لمقهى",
    enhanced:
      "صمم شعاراً عصرياً لمقهى عربي متخصص في القهوة المختصة اسمه «نَسمة». الأسلوب: بسيط، خطوط هندسية نظيفة، ألوان ترابية دافئة (بني داكن + كريمي)، قابل للتصغير بدون فقدان التفاصيل، مناسب للاستخدام على الأكواب واللافتات والتطبيق.",
    category: "design",
    tone: "friendly",
    detail_level: "detailed",
    language: "ar",
    likes_count: 89,
    comments_count: 12,
    saves_count: 34,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    user: { id: "u3", username: "design_layla", display_name: "ليلى" },
  },
];

export default function FeedPage() {
  const { lastFeedTab, setFeedTab, lastCategory, setCategory } = useAppStore();
  const [tab, setTab] = useState(lastFeedTab);
  const [category, setCat] = useState<Category | "all">(lastCategory || "all");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [useDemo, setUseDemo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadPage = useCallback(
    async (pageNum: number, tabId: string, replace = false) => {
      try {
        const res = await fetchPrompts(pageNum, 10, tabId);
        if (res.error || !res.prompts?.length) {
          if (pageNum === 0) {
            setUseDemo(true);
            setPrompts(DEMO_PROMPTS);
            setHasMore(false);
          } else {
            setHasMore(false);
          }
          return;
        }
        setUseDemo(false);
        const mapped = res.prompts as Prompt[];
        setPrompts((prev) => (replace ? mapped : [...prev, ...mapped]));
        setHasMore(mapped.length >= 10);
      } catch {
        if (pageNum === 0) {
          setUseDemo(true);
          setPrompts(DEMO_PROMPTS);
          setHasMore(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    setInitialLoading(true);
    loadPage(0, tab, true).finally(() => {
      try {
        const local = JSON.parse(localStorage.getItem("khiyal_local_prompts") || "[]");
        if (Array.isArray(local) && local.length) {
          setPrompts((prev) => {
            const ids = new Set(prev.map((x) => x.id));
            const extra = local.filter((x: { id: string }) => !ids.has(x.id));
            return extra.length ? [...extra, ...prev] : prev;
          });
          setUseDemo(false);
        }
      } catch { /* ignore */ }
      setInitialLoading(false);
    });
  }, [tab, loadPage]);

  const changeTab = (id: string) => {
    setTab(id);
    setFeedTab(id);
    setPage(0);
    setHasMore(true);
  };

  const loadMore = useCallback(async () => {
    if (useDemo) {
      setHasMore(false);
      return;
    }
    const next = page + 1;
    setPage(next);
    await loadPage(next, tab);
  }, [page, tab, loadPage, useDemo]);

  const { sentinelRef, loading: loadingMore } = useInfiniteScroll(
    loadMore,
    hasMore && !useDemo
  );

  useRealtimePrompts(
    useCallback((p: Prompt) => {
      setPrompts((prev) => {
        if (prev.some((x) => x.id === p.id)) return prev;
        return [p, ...prev];
      });
    }, []),
    !useDemo
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await loadPage(0, tab, true);
    setRefreshing(false);
  };

  const displayed =
    tab === "categories" && category !== "all"
      ? prompts.filter((p) => p.category === category)
      : prompts;

  return (
    <div className="max-w-page mx-auto">
      <header className="page-header pt-safe">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-[#111]">خيال</h1>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="text-[13px] font-medium text-[#8b8b8b] min-h-[44px] px-3 rounded-full border border-[#ebebeb] bg-white"
          disabled={refreshing}
        >
          {refreshing ? "..." : "تحديث"}
        </button>
      </header>

      <FeedTabs active={tab} onChange={changeTab} />

      {tab === "categories" && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar px-5 py-2">
          <button
            type="button"
            onClick={() => setCat("all")}
            className={cn(
              "pill whitespace-nowrap min-h-[36px] px-4 text-13",
              category === "all"
                ? "bg-charcoal text-snow"
                : "bg-vellum text-graphite border border-[#ececec]"
            )}
          >
            الكل
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setCat(c.id);
                setCategory(c.id);
              }}
              className={cn(
                "pill whitespace-nowrap min-h-[36px] px-4 text-13",
                category === c.id
                  ? "bg-charcoal text-snow"
                  : "bg-vellum text-graphite border border-[#ececec]"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="px-5 py-4 space-y-3">
        {initialLoading
          ? [1, 2, 3].map((i) => <PromptCardSkeleton key={i} />)
          : displayed.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  delay: Math.min(i * 0.04, 0.2),
                }}
              >
                <Link href={`/p/${p.id}`} className="block">
                  <PromptCard prompt={p} />
                </Link>
              </motion.div>
            ))}

        <div ref={sentinelRef} className="h-4" />
        {loadingMore && <PromptCardSkeleton />}
        {!hasMore && displayed.length > 0 && (
          <p className="text-center text-13 text-ash py-4">انتهت المنشورات</p>
        )}
        {!initialLoading && displayed.length === 0 && (
          <p className="text-center text-13 text-ash py-12">لا توجد منشورات في هذا القسم</p>
        )}
      </div>
    </div>
  );
}
