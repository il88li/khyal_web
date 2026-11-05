"use client";

import { Bookmark, Copy, Heart, MessageCircle, Share2 } from "@/components/icons";
import { fmt } from "@/lib/supabase";

export function PromptActions({ liked, saved, likes, comments, onLike, onSave, onShare, onCopy, onComments }: {
  liked: boolean;
  saved: boolean;
  likes: number;
  comments: number;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onCopy: () => void;
  onComments: () => void;
}) {
  return (
    <div className="prompt-actions" aria-label="إجراءات البرومبت">
      <button className={liked ? "is-active" : ""} onClick={onLike} aria-label={liked ? "إلغاء الإعجاب" : "إعجاب"} aria-pressed={liked}><Heart size={17} fill={liked ? "currentColor" : "none"} /><span>{fmt(likes)}</span></button>
      <button onClick={onSave} className={saved ? "is-active" : ""} aria-label={saved ? "إلغاء الحفظ" : "حفظ"} aria-pressed={saved}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /></button>
      <button onClick={onComments} aria-label="التعليقات"><MessageCircle size={17} /><span>{fmt(comments)}</span></button>
      <button onClick={onShare} aria-label="مشاركة"><Share2 size={17} /></button>
      <button onClick={onCopy} aria-label="نسخ البرومبت"><Copy size={17} /></button>
    </div>
  );
}
