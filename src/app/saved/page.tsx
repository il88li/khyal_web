"use client";

import { useEffect, useState } from "react";
import { fetchSavedPrompts } from "@/app/actions/prompts";
import { PromptCard } from "@/components/feed/PromptCard";
import { PromptCardSkeleton } from "@/components/shared/Skeleton";
import { Prompt } from "@/types";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function SavedPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSavedPrompts().then((res) => {
      if (res.error === "auth_required") setError("سجّل دخولك لعرض المحفوظات");
      else if (res.error && res.error !== "supabase_not_configured") setError(res.error);
      setPrompts((res.prompts as Prompt[]) || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-page mx-auto">
      <header className="sticky top-0 z-20 bg-canvas border-b border-gridline px-5 h-14 flex items-center gap-3 pt-safe">
        <Link href="/profile" className="min-h-touch min-w-[44px] flex items-center justify-center">
          <ChevronLeft size={22} className="rotate-180" />
        </Link>
        <h1 className="text-19 font-semibold text-ink">المحفوظات</h1>
      </header>

      <div className="px-5 py-4 space-y-3">
        {loading && <PromptCardSkeleton />}
        {error && (
          <div className="card p-4 text-center space-y-2">
            <p className="text-15 text-graphite">{error}</p>
            <Link href="/auth" className="text-15 text-ink underline">
              تسجيل الدخول
            </Link>
          </div>
        )}
        {!loading && !error && prompts.length === 0 && (
          <p className="text-center text-13 text-ash py-12">لا توجد برومبتات محفوظة</p>
        )}
        {prompts.map((p) => (
          <Link key={p.id} href={`/p/${p.id}`} className="block">
            <PromptCard prompt={p} />
          </Link>
        ))}
      </div>
    </div>
  );
}
