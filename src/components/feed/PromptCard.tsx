"use client";

import { Heart, MessageCircle, Bookmark, Share2 } from "lucide-react";
import { Prompt } from "@/types";
import { cn } from "@/lib/utils";
import { useState, useTransition } from "react";
import { toggleLike, toggleSave } from "@/app/actions/prompts";
import { motion } from "framer-motion";

interface Props {
  prompt: Prompt;
}

export function PromptCard({ prompt }: Props) {
  const [liked, setLiked] = useState(prompt.is_liked || false);
  const [saved, setSaved] = useState(prompt.is_saved || false);
  const [likes, setLikes] = useState(prompt.likes_count);
  const [pending, startTransition] = useTransition();

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    setLikes((c) => (next ? c + 1 : Math.max(0, c - 1)));
    startTransition(async () => {
      const res = await toggleLike(prompt.id);
      if (res.error) {
        setLiked(!next);
        setLikes((c) => (next ? Math.max(0, c - 1) : c + 1));
      } else if (res.liked !== undefined) setLiked(res.liked);
    });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const res = await toggleSave(prompt.id);
      if (res.error) setSaved(!next);
      else if (res.saved !== undefined) setSaved(res.saved);
    });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/p/${prompt.id}`;
    if (navigator.share) {
      await navigator.share({ title: "خيال", text: prompt.enhanced.slice(0, 80), url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <article className="card-elevated p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#f0f0f2] to-[#e8e8ea] flex items-center justify-center text-[15px] font-semibold text-[#111] ring-2 ring-white">
          {prompt.user?.display_name?.[0] || "خ"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-[#111] truncate leading-tight">
            {prompt.user?.display_name || prompt.user?.username || "مستخدم"}
          </p>
          <p className="text-[12px] text-[#8b8b8b] mt-0.5">
            {new Date(prompt.created_at).toLocaleDateString("ar-SA", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
        <span className="pill bg-[#f4f4f5] text-[#5a5a5a] text-[12px] font-medium">
          {prompt.category}
        </span>
      </div>

      <p className="text-[14px] text-[#5a5a5a] leading-[1.7] line-clamp-2">{prompt.original}</p>

      <div className="bg-[#fafafa] border border-[#ebebeb] rounded-[14px] p-3.5">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d00]" />
          <span className="text-[12px] font-medium text-[#8b8b8b]">المحسّن</span>
        </div>
        <p className="text-[14px] text-[#111] leading-[1.75] line-clamp-5">{prompt.enhanced}</p>
      </div>

      <div className="flex items-center justify-between pt-0.5 border-t border-[#f0f0f0]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleLike}
            disabled={pending}
            className={cn(
              "flex items-center gap-1.5 min-h-[44px] px-2 text-[13px] font-medium transition-colors",
              liked ? "text-[#ff4d00]" : "text-[#8b8b8b]"
            )}
          >
            <motion.span
              animate={liked ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.28 }}
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} strokeWidth={1.75} />
            </motion.span>
            {likes}
          </button>
          <span className="flex items-center gap-1.5 min-h-[44px] px-2 text-[13px] text-[#8b8b8b]">
            <MessageCircle size={18} strokeWidth={1.75} />
            {prompt.comments_count}
          </span>
          <button
            type="button"
            onClick={handleSave}
            className={cn(
              "min-h-[44px] px-2 transition-colors",
              saved ? "text-[#111]" : "text-[#8b8b8b]"
            )}
          >
            <Bookmark size={18} fill={saved ? "currentColor" : "none"} strokeWidth={1.75} />
          </button>
        </div>
        <button type="button" onClick={handleShare} className="min-h-[44px] px-2 text-[#8b8b8b]">
          <Share2 size={18} strokeWidth={1.75} />
        </button>
      </div>
    </article>
  );
}
