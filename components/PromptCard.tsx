// components/PromptCard.tsx — إضافة variant للأحجام المختلفة
import { memo, useEffect, useRef, useState } from "react";
// ... imports أخرى

type PromptCardVariant = "default" | "hero" | "featured" | "compact";

interface PromptCardProps {
  p: PromptRow;
  i?: number;
  variant?: PromptCardVariant;
}

function PromptCard({ p, i = 0, variant = "default" }: PromptCardProps) {
  const isHero = variant === "hero";
  const isCompact = variant === "compact";
  const isFeatured = variant === "featured";
  
  // ... كل المنطق الأصلي يبقى (likes, saves, follow, etc.)
  
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`
        prompt-card relative flex flex-col h-full
        ${isHero ? "p-5 md:p-6" : isCompact ? "p-3" : "p-4"}
        bg-c-snow border border-c-line
        ${isHero ? "rounded-2xl" : "rounded-xl"}
        transition-shadow hover:shadow-[var(--sh-2)]
      `}
      {...tilt}
    >
      {/* الرأس: مبسط في compact */}
      <header className={`
        flex items-start gap-3 mb-3
        ${isCompact ? "mb-2" : ""}
      `}>
        <Link href={`/profile/${p.author?.id}`} className="avatar shrink-0">
          {/* ... avatar content */}
        </Link>
        
        {!isCompact && (
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <Link href={`/profile/${p.author?.id}`} className="truncate font-semibold text-charcoal">
                {name}
              </Link>
              {p.author?.verified && <VerifiedBadge />}
            </div>
            <p className="text-caption text-smoke">{ago(p.created_at)}</p>
          </div>
        )}
        
        {/* زر المتابعة يظهر فقط في hero/featured */}
        {(isHero || isFeatured) && !mine && following !== null && (
          <button onClick={follow} className="btn btn-soft !min-h-8 !px-2.5 !text-caption">
            {following ? <Check size={14} /> : <UserPlus size={14} />}
            {following ? "متابع" : "متابعة"}
          </button>
        )}
      </header>

      {/* العنوان: Display font في hero */}
      {p.title && (
        <h3 className={`
          font-display font-extrabold text-charcoal mb-2
          ${isHero ? "text-xl md:text-2xl leading-tight" : "text-base"}
          ${isCompact ? "text-sm line-clamp-1" : "line-clamp-2"}
        `}>
          {p.title}
        </h3>
      )}

      {/* المقتطف: سطران كحد أقصى */}
      <div className="flex-1 min-h-0">
        <p className={`
          text-graphite leading-relaxed
          ${isHero ? "text-base line-clamp-3" : "text-sm line-clamp-2"}
          ${isCompact ? "text-caption line-clamp-2" : ""}
        `}>
          {gate.shown}
        </p>
      </div>

      {/* الوسوم: pills صغيرة */}
      {(p.tags?.length || cat) && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {cat && (
            <span className="inline-flex items-center rounded-full bg-c-mist px-2 py-0.5 text-caption font-medium text-c-ink-2">
              {cat}
            </span>
          )}
          {p.tags?.slice(0, isCompact ? 1 : 3).map((tag) => (
            <span key={tag} className="inline-flex items-center rounded-full bg-brand-tint px-2 py-0.5 text-caption font-medium text-brand-ink">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* الصورة المصغرة في hero فقط */}
      {isHero && first && (
        <div className="relative mt-4 rounded-xl overflow-hidden aspect-video">
          <SafeImg {...imgSet(first.url)} className="w-full h-full object-cover" />
        </div>
      )}

      {/* التذييل: إحصاءات + نسخ */}
      <footer className={`
        flex items-center justify-between mt-auto pt-3
        ${isCompact ? "pt-2" : ""}
        border-t border-c-line-soft
      `}>
        <div className="flex items-center gap-3 text-caption text-smoke">
          <span className="flex items-center gap-1">
            <Heart size={isCompact ? 14 : 16} fill={liked ? "currentColor" : "none"} className={liked ? "text-brand" : ""} />
            {fmt(likes)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={isCompact ? 14 : 16} />
            {fmt(p.comment_count)}
          </span>
        </div>
        
        <button 
          onClick={copy} 
          className="flex items-center gap-1 text-caption font-medium text-brand hover:text-brand-ink transition-colors"
          aria-label="نسخ البرومبت"
        >
          <Copy size={isCompact ? 14 : 16} />
          {!isCompact && <span>نسخ</span>}
        </button>
      </footer>

      {/* ... بقية المكونات (BottomSheet, ImagePreview, etc.) */}
    </motion.article>
  );
}

export default memo(PromptCard);
