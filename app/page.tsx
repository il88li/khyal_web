"use client";
// app/page.tsx — Bento Feed: Context Pills + شبكة غير متماثلة
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { AdSlot } from "@/components/AdSlot";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, TrendingUp, Users, Image as ImageIcon, Code2 } from "@/components/icons";
import PromptCard from "@/components/PromptCard";
import { sb, uid, explain, withMeta } from "@/lib/supabase";
import { rankForYou } from "@/lib/algorithm";
import { hasCardFx } from "@/lib/cardFx";
import CreatorCardSlot from "@/components/CreatorCardSlot";
import Link from "next/link";
import type { PromptRow } from "@/types";
import { Skeleton } from "@/components/states";

/* ── Context Pills: فلاتر سريعة أسفل الهيدر ── */
const CONTEXT_PILLS = [
  { id: "all", label: "الكل", icon: Sparkles },
  { id: "following", label: "متابَعون", icon: Users },
  { id: "marketing", label: "تسويق", icon: TrendingUp },
  { id: "images", label: "صور", icon: ImageIcon },
  { id: "code", label: "كود", icon: Code2 },
] as const;

type ContextPill = (typeof CONTEXT_PILLS)[number]["id"];

/* ── Bento Grid: توزيع البطاقات بنمط غير متماثل ── */
type BentoLayout = 
  | { type: "hero"; prompt: PromptRow }                    // بطاقة كبيرة (عمودان)
  | { type: "duo"; large: PromptRow; small: PromptRow }    // بطاقة كبيرة + صغيرة
  | { type: "trio"; items: [PromptRow, PromptRow, PromptRow] }; // 3 صغيرة

function buildBentoLayout(items: PromptRow[]): BentoLayout[] {
  const layouts: BentoLayout[] = [];
  let i = 0;
  
  while (i < items.length) {
    const remaining = items.length - i;
    
    // أول عنصر: Hero (أفضل برومبت)
    if (i === 0 && remaining >= 1) {
      layouts.push({ type: "hero", prompt: items[i] });
      i += 1;
      continue;
    }
    
    // نمط متناوب: duo أو trio
    const pattern = (layouts.length - 1) % 3; // 0,1,2 تتكرر
    
    if (pattern === 0 && remaining >= 2) {
      // duo: كبيرة + صغيرة
      layouts.push({ 
        type: "duo", 
        large: items[i], 
        small: items[i + 1] 
      });
      i += 2;
    } else if (pattern === 1 && remaining >= 3) {
      // trio: 3 صغيرة في صف
      layouts.push({ 
        type: "trio", 
        items: [items[i], items[i + 1], items[i + 2]] 
      });
      i += 3;
    } else {
      // fallback: ضع المتبقي في duo أو solo
      if (remaining >= 2) {
        layouts.push({ type: "duo", large: items[i], small: items[i + 1] });
        i += 2;
      } else {
        // عنصر أخير وحيد: اجعله بطاقة أفقية صغيرة
        layouts.push({ type: "duo", large: items[i], small: items[i] }); // duplicate for layout consistency
        i += 1;
      }
    }
  }
  
  return layouts;
}

/* ── مكونات الشبكة ── */
function BentoCard({ 
  prompt, 
  size, 
  index 
}: { 
  prompt: PromptRow; 
  size: "hero" | "large" | "small";
  index: number;
}) {
  const isHero = size === "hero";
  const isLarge = size === "large" || isHero;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.16, 1, 0.3, 1],
        delay: Math.min(index, 6) * 0.08 
      }}
      className={`
        bento-card group relative overflow-hidden rounded-2xl border border-c-line bg-c-snow
        transition-all duration-300 hover:shadow-[var(--sh-2)] hover:border-brand/20
        ${isHero ? "md:col-span-2 md:row-span-2 min-h-[320px]" : ""}
        ${isLarge ? "min-h-[240px]" : "min-h-[180px]"}
      `}
    >
      <PromptCard 
        p={prompt} 
        i={index} 
        variant={isHero ? "hero" : isLarge ? "featured" : "compact"}
      />
    </motion.div>
  );
}

function BentoGrid({ items }: { items: PromptRow[] }) {
  const layouts = buildBentoLayout(items);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 auto-rows-auto">
      {layouts.map((layout, idx) => {
        if (layout.type === "hero") {
          return (
            <BentoCard 
              key={layout.prompt.id} 
              prompt={layout.prompt} 
              size="hero" 
              index={idx * 3}
            />
          );
        }
        
        if (layout.type === "duo") {
          return (
            <Fragment key={`duo-${idx}`}>
              <BentoCard 
                prompt={layout.large} 
                size="large" 
                index={idx * 3 + 1}
              />
              <BentoCard 
                prompt={layout.small} 
                size="small" 
                index={idx * 3 + 2}
              />
            </Fragment>
          );
        }
        
        // trio
        return (
          <Fragment key={`trio-${idx}`}>
            {layout.items.map((p, i) => (
              <BentoCard 
                key={p.id} 
                prompt={p} 
                size="small" 
                index={idx * 3 + i}
              />
            ))}
          </Fragment>
        );
      })}
    </div>
  );
}

/* ── الشريط الأفقي للـ Context Pills ── */
function ContextPillsBar({ 
  active, 
  onChange 
}: { 
  active: ContextPill; 
  onChange: (pill: ContextPill) => void;
}) {
  return (
    <div className="sticky top-[var(--top)] z-30 -mx-3 px-3 md:mx-0 md:px-0 bg-c-bg/80 backdrop-blur-md border-b border-c-line-soft">
      <div className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CONTEXT_PILLS.map((pill) => {
          const Icon = pill.icon;
          const isActive = active === pill.id;
          
          return (
            <button
              key={pill.id}
              onClick={() => onChange(pill.id)}
              className={`
                flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium
                transition-all duration-200 whitespace-nowrap
                ${isActive 
                  ? "bg-brand text-on-brand shadow-[var(--sh-1)]" 
                  : "bg-c-snow text-c-ink-2 border border-c-line hover:border-brand/30 hover:text-brand"
                }
              `}
            >
              <Icon size={16} />
              {pill.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── بقية الكود الأصلي (fetchPage, gateRows, etc.) يبقى كما هو ── */
// ... [الكود الأصلي للـ fetchPage و gateRows والـ hooks]

export default function Feed() {
  const router = useRouter();
  const [contextPill, setContextPill] = useState<ContextPill>("all");
  // ... بقية الـ state الأصلية
  
  // تحويل context pill إلى tab/cat المناسب
  const effectiveTab = contextPill === "following" ? "following" : 
                       contextPill === "all" ? "foryou" : "cats";
  
  // ... بقية المنطق الأصلي

  return (
    <main className="flex min-h-screen flex-col">
      {/* الهيدر الأصلي يبقى */}
      
      {/* Context Pills الجديد */}
      <ContextPillsBar active={contextPill} onChange={setContextPill} />
      
      {/* ملاحظة "مختارة لك" */}
      {effectiveTab === "foryou" && note && (
        <p className="feed-note self-start rounded-full bg-brand-tint px-3.5 py-2 text-caption font-medium text-brand-ink">
          <Sparkles size={14} />
          {note}
        </p>
      )}

      {/* منطقة السحب للتحديث */}
      <div style={{ height: refreshing ? 40 : pull }} className="flex items-center justify-center overflow-hidden text-smoke transition-[height] duration-150">
        {(pull > 20 || refreshing) && (
          <Loader2 size={22} className={refreshing ? "animate-spin" : ""} style={{ transform: `rotate(${pull * 4}deg)` }} />
        )}
      </div>

      {/* Bento Grid بدل العمود الواحد */}
      <motion.div
        style={{ touchAction: "pan-y" }}
        className="feed-stream px-3 md:px-0 pb-4"
        onPanEnd={(_, i) => {
          if (Math.abs(i.offset.x) > 80 && Math.abs(i.velocity.x) > 200 && Math.abs(i.offset.y) < 60) {
            // swipe logic
          }
        }}
      >
        {items.length > 0 && <BentoGrid items={items} />}
        
        {loading && <Skeleton variant="promptCard" count={items.length ? 1 : 3} />}
        
        {!loading && err && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="max-w-[30ch] text-graphite">{err}</p>
            <button className="btn btn-primary" onClick={() => load(true)}>إعادة المحاولة</button>
          </div>
        )}

        {!loading && !err && !items.length && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-tint text-brand-ink">
              <Sparkles size={26} />
            </span>
            <p className="max-w-[30ch] text-graphite">
              {effectiveTab === "following" ? "تابع بعض المبدعين لتظهر منشوراتهم هنا." : "لا توجد برومبتات بعد. كن الأول!"}
            </p>
            <Link href="/new" className="btn btn-primary">انشر أول برومبت</Link>
          </div>
        )}

        <div ref={end} className="h-px" />
      </motion.div>
    </main>
  );
}
