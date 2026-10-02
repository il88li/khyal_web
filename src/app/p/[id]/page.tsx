"use client";

import { useParams } from "next/navigation";
import { PromptCard } from "@/components/feed/PromptCard";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { Lightbox } from "@/components/lightbox/Lightbox";
import { Prompt } from "@/types";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchPromptById } from "@/app/actions/prompts";
import { PromptCardSkeleton } from "@/components/shared/Skeleton";

const DEMO: Record<string, Prompt> = {
  "1": {
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
    images: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user: { id: "u1", username: "sara_ai", display_name: "سارة" },
  },
};

export default function PromptDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchPromptById(id).then((res) => {
      if (res.prompt) {
        setPrompt(res.prompt as Prompt);
        setCurrentUserId(res.currentUserId);
      } else if (DEMO[id]) {
        setPrompt(DEMO[id]);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="px-5 py-8">
        <PromptCardSkeleton />
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="px-5 py-20 text-center">
        <p className="text-17 text-graphite mb-4">البرومبت غير موجود</p>
        <Link href="/" className="text-15 text-charcoal underline">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const images = prompt.images || [];

  return (
    <div className="max-w-page mx-auto">
      <header className="sticky top-0 z-20 bg-snow border-b border-silver px-5 h-14 flex items-center gap-3 pt-safe">
        <Link href="/" className="min-h-touch min-w-[44px] flex items-center justify-center">
          <ChevronLeft size={22} className="rotate-180" />
        </Link>
        <h1 className="text-17 font-medium text-charcoal">تفاصيل البرومبت</h1>
      </header>
      <div className="px-5 py-4 space-y-4">
        <PromptCard prompt={prompt} />

        {images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {images.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
                className="w-24 h-24 rounded-card overflow-hidden border border-silver shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <CommentsSection promptId={prompt.id} currentUserId={currentUserId} />
      </div>

      <Lightbox
        images={images}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
