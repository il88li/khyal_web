"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { DiffView } from "@/components/enhancer/DiffView";
import { Toast } from "@/components/shared/Toast";
import { ImageUpload } from "@/components/shared/ImageUpload";
import {
  CATEGORIES,
  TONES,
  DETAIL_LEVELS,
  LANGUAGES,
  Category,
  Tone,
  DetailLevel,
  Language,
} from "@/types";
import { cn } from "@/lib/utils";
import { Copy, RefreshCw, Send } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { publishPrompt } from "@/app/actions/prompts";
import { useRouter } from "next/navigation";
import { opsLog } from "@/lib/ops-log";
import { getDemoUser } from "@/lib/demo-auth";

function localEnhance(
  text: string,
  opts: { category: string; tone: string; detail: string; language: string }
): string {
  const toneMap: Record<string, string> = {
    formal: "بأسلوب رسمي واحترافي",
    casual: "بأسلوب ودي وبسيط",
    technical: "بدقة تقنية واضحة",
    creative: "بأسلوب إبداعي غني بالصور",
    friendly: "بنبرة ودودة ومشجّعة",
  };
  const detailMap: Record<string, string> = {
    brief: "مختصر ومباشر",
    balanced: "متوازن بين الإيجاز والتفصيل",
    detailed: "مفصّل مع أمثلة ومعايير نجاح",
  };
  const lang = opts.language === "en" ? "English" : opts.language === "both" ? "Arabic and English" : "العربية الفصحى";
  return (
    `المهمة: ${text.trim()}\n\n` +
    `السياق: فئة «${opts.category}»، ${toneMap[opts.tone] || ""}، مستوى تفصيل ${detailMap[opts.detail] || ""}، اللغة: ${lang}.\n\n` +
    `التعليمات:\n` +
    `1) حدّد الهدف النهائي بوضوح في جملة واحدة.\n` +
    `2) اذكر القيود (الطول، الأسلوب، الجمهور).\n` +
    `3) أدرج خطوات أو أقساماً مرتبة إن لزم.\n` +
    `4) أضف معيار نجاح قابل للقياس.\n` +
    `5) تجنّب الغموض والعبارات العامة.\n\n` +
    `الناتج المتوقع: برومبت جاهز للنسخ والاستخدام مباشرة.`
  );
}

export function EnhancerForm() {
  const router = useRouter();
  const { lastCategory, setCategory, draftPrompt, setDraft } = useAppStore();
  const [prompt, setPrompt] = useState(draftPrompt || "");
  const [category, setCat] = useState<Category>(lastCategory);
  const [tone, setTone] = useState<Tone>("formal");
  const [detail, setDetail] = useState<DetailLevel>("balanced");
  const [language, setLanguage] = useState<Language>("ar");
  const [enhanced, setEnhanced] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quota, setQuota] = useState(50);
  const [toast, setToast] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const [publishing, startPublish] = useTransition();

  const runEnhance = async () => {
    if (!prompt.trim()) {
      setError("اكتب برومبت أولاً");
      return;
    }
    setLoading(true);
    setError("");
    setEnhanced("");
    setShowDiff(false);
    setDraft(prompt);
    opsLog("enhance.start", "info", prompt.slice(0, 80));

    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          category,
          tone,
          detail_level: detail,
          language,
        }),
      });

      if (!res.ok || !res.body) {
        // fallback محلي دائماً حتى يعمل بدون مفتاح
        const text = localEnhance(prompt, { category, tone, detail, language });
        for (let i = 0; i < text.length; i += 12) {
          setEnhanced(text.slice(0, i + 12));
          await new Promise((r) => setTimeout(r, 12));
        }
        setEnhanced(text);
        setShowDiff(true);
        opsLog("enhance.local", "ok", "fallback");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.content) {
              acc += data.content;
              setEnhanced(acc);
            }
            if (data.done) {
              if (typeof data.remaining_quota === "number") setQuota(data.remaining_quota);
              setShowDiff(true);
              opsLog("enhance.stream", "ok");
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
      if (!acc) {
        const text = localEnhance(prompt, { category, tone, detail, language });
        setEnhanced(text);
        setShowDiff(true);
        opsLog("enhance.local", "ok", "empty stream");
      }
    } catch (e) {
      const text = localEnhance(prompt, { category, tone, detail, language });
      setEnhanced(text);
      setShowDiff(true);
      opsLog("enhance.error", "error", e instanceof Error ? e.message : "fail");
      setToast("تم التحسين محلياً (الخادم غير متاح)");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = () => {
    if (!enhanced) return;
    startPublish(async () => {
      opsLog("publish.start", "info");
      const res = await publishPrompt({
        original: prompt,
        enhanced,
        category,
        tone,
        detail_level: detail,
        language,
        images,
      });

      if (res.error && (res.error.includes("قاعدة") || res.error.includes("تسجيل") || res.error.includes("مضبوطة"))) {
        // نشر تجريبي محلي
        const user = getDemoUser();
        const id = `local-${Date.now()}`;
        const item = {
          id,
          user_id: user?.id || "guest",
          original: prompt,
          enhanced,
          category,
          tone,
          detail_level: detail,
          language,
          likes_count: 0,
          comments_count: 0,
          saves_count: 0,
          images,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: user?.id || "guest",
            username: user?.username || "guest",
            display_name: user?.display_name || "زائر",
          },
        };
        try {
          const prev = JSON.parse(localStorage.getItem("khiyal_local_prompts") || "[]");
          prev.unshift(item);
          localStorage.setItem("khiyal_local_prompts", JSON.stringify(prev.slice(0, 50)));
          opsLog("publish.local", "ok", id);
          setToast("نُشر محلياً — سيظهر في الرئيسية");
          setTimeout(() => router.push("/"), 600);
          return;
        } catch {
          setError("تعذّر النشر المحلي");
          opsLog("publish.local", "error");
          return;
        }
      }

      if (res.error) {
        setError(res.error);
        opsLog("publish", "error", res.error);
        return;
      }
      opsLog("publish", "ok", res.id);
      setToast("تم النشر بنجاح");
      setTimeout(() => router.push(res.id ? `/p/${res.id}` : "/"), 500);
    });
  };

  const Chip = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "pill whitespace-nowrap min-h-[36px] px-3 transition-colors",
        active ? "bg-[#1a1a1a] text-white" : "bg-[#f0f0f2] text-[#5a5a5a]"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="card p-4 space-y-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        <textarea
          className="input-field min-h-[120px] resize-none allow-select"
          placeholder="اكتب برومبتك هنا..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={8000}
        />
        <p className="text-13 text-[#8a8a8a] text-left" dir="ltr">
          {prompt.length}/8000 · متبقي {quota}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-13 text-[#8a8a8a] px-1">الفئة</p>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              active={category === c.id}
              onClick={() => {
                setCat(c.id);
                setCategory(c.id);
              }}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-13 text-[#8a8a8a] px-1">النبرة</p>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {TONES.map((t) => (
            <Chip key={t.id} active={tone === t.id} onClick={() => setTone(t.id)}>
              {t.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-13 text-[#8a8a8a] px-1">التفصيل</p>
          <div className="flex flex-wrap gap-2">
            {DETAIL_LEVELS.map((d) => (
              <Chip key={d.id} active={detail === d.id} onClick={() => setDetail(d.id)}>
                {d.label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-13 text-[#8a8a8a] px-1">اللغة</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <Chip key={l.id} active={language === l.id} onClick={() => setLanguage(l.id)}>
                {l.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <ImageUpload value={images} onChange={setImages} />

      <Button onClick={runEnhance} loading={loading} className="w-full" size="lg">
        {loading ? "جارٍ التحسين..." : "حسّن البرومبت"}
      </Button>

      {error && (
        <p className="text-14 bg-[#f5f5f5] border border-[#ececec] rounded-[14px] p-3">{error}</p>
      )}

      <AnimatePresence>
        {enhanced && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4 space-y-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-16 font-semibold">النتيجة</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="min-h-[44px] px-2 text-[#8a8a8a]"
                  onClick={async () => {
                    await navigator.clipboard.writeText(enhanced);
                    setToast("تم النسخ");
                    opsLog("copy.result", "ok");
                  }}
                >
                  <Copy size={18} />
                </button>
                <button type="button" className="min-h-[44px] px-2 text-[#8a8a8a]" onClick={runEnhance}>
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
            <p className="text-15 leading-relaxed whitespace-pre-wrap allow-select">{enhanced}</p>
            {showDiff && <DiffView original={prompt} enhanced={enhanced} />}
            <Button onClick={handlePublish} loading={publishing} className="w-full" variant="ink">
              <Send size={16} className="ml-1" />
              نشر البرومبت
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast} visible={!!toast} onClose={() => setToast("")} />
    </div>
  );
}
