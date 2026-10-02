/**
 * Khiyal — Fully Automatic Free Model Routing
 * Uses openrouter/free exclusively. No model names exposed to user.
 * Layers: Provider Failover → Model Fallback → App Retry + Cooldown → Parallel Racing
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODELS_URL = "https://openrouter.ai/api/v1/models";

export interface StreamChunk {
  content?: string;
  done?: boolean;
  error?: string;
  model?: string; // internal only
}

interface CooldownEntry {
  until: number;
  reason: string;
}

const cooldownMap = new Map<string, CooldownEntry>();
const FREE_MODEL_CACHE_TTL = 60 * 60 * 1000; // 1 hour
let freeModelsCache: string[] = [];
let freeModelsCacheTime = 0;

function isInCooldown(key: string): boolean {
  const entry = cooldownMap.get(key);
  if (!entry) return false;
  if (Date.now() > entry.until) {
    cooldownMap.delete(key);
    return false;
  }
  return true;
}

function setCooldown(key: string, seconds: number, reason: string) {
  cooldownMap.set(key, { until: Date.now() + seconds * 1000, reason });
}

export async function fetchFreeModels(): Promise<string[]> {
  const now = Date.now();
  if (freeModelsCache.length && now - freeModelsCacheTime < FREE_MODEL_CACHE_TTL) {
    return freeModelsCache;
  }
  try {
    const res = await fetch(MODELS_URL, {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return freeModelsCache.length ? freeModelsCache : ["openrouter/free"];
    const data = await res.json();
    const free = (data.data || [])
      .filter((m: { id: string }) => m.id.endsWith(":free"))
      .map((m: { id: string }) => m.id);
    freeModelsCache = free.length ? free : ["openrouter/free"];
    freeModelsCacheTime = now;
    return freeModelsCache;
  } catch {
    return freeModelsCache.length ? freeModelsCache : ["openrouter/free"];
  }
}

function buildSystemPrompt(opts: {
  category: string;
  tone: string;
  detail: string;
  language: string;
}): string {
  const langMap: Record<string, string> = {
    ar: "Arabic",
    en: "English",
    bilingual: "both Arabic and English (bilingual)",
  };
  const detailMap: Record<string, string> = {
    brief: "concise and brief",
    balanced: "balanced in length",
    detailed: "detailed and comprehensive",
  };
  return `You are Khiyal (خيال), an expert Arabic AI prompt engineer.
Enhance the user's raw prompt into a professional, high-quality prompt.
Category: ${opts.category}
Tone: ${opts.tone}
Detail level: ${detailMap[opts.detail] || "balanced"}
Output language: ${langMap[opts.language] || "Arabic"}

Rules:
- Return ONLY the enhanced prompt text, nothing else.
- Keep the user's original intent intact.
- Make it clearer, more specific, and more effective.
- If the original is Arabic, keep the enhanced version in Arabic (unless bilingual requested).
- Do not add explanations, markdown, or meta commentary.`;
}

export async function* enhancePromptStream(params: {
  prompt: string;
  category: string;
  tone: string;
  detail_level: string;
  language: string;
}): AsyncGenerator<StreamChunk> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // Warm free-models cache (non-blocking)
  void fetchFreeModels();
  if (!apiKey) {
    yield { error: "مفتاح OpenRouter غير مضبوط على الخادم" };
    return;
  }

  const system = buildSystemPrompt({
    category: params.category,
    tone: params.tone,
    detail: params.detail_level,
    language: params.language,
  });

  const body = {
    model: "openrouter/free",
    models: ["openrouter/free"],
    allow_fallbacks: true,
    stream: true,
    messages: [
      { role: "system", content: system },
      { role: "user", content: params.prompt },
    ],
    transforms: ["middle-out"],
  };

  const maxRetries = 3;
  let lastError = "";

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (isInCooldown("openrouter/free")) {
      await sleep(1000 * Math.pow(2, attempt));
      continue;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://khiyal.app",
          "X-Title": "Khiyal",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const status = res.status;
        if (status === 429 || status >= 500) {
          setCooldown("openrouter/free", status === 429 ? 90 : 90, `HTTP ${status}`);
          lastError = `خطأ مؤقت (${status})`;
          await sleep(1000 * Math.pow(2, attempt));
          continue;
        }
        yield { error: `فشل الطلب: ${status}` };
        return;
      }

      if (!res.body) {
        yield { error: "لا يوجد بث من الخادم" };
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let firstTokenReceived = false;
      let usedModel = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue; // ignore SSE comments
          if (trimmed === "data: [DONE]") {
            yield { done: true, model: usedModel };
            return;
          }
          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              if (json.model) usedModel = json.model;
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                if (!firstTokenReceived) firstTokenReceived = true;
                yield { content: delta, model: usedModel };
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }

      if (!firstTokenReceived) {
        setCooldown("openrouter/free", 15, "no first token");
        lastError = "لم يُصدر النموذج أي توكن";
        await sleep(1000 * Math.pow(2, attempt));
        continue;
      }

      yield { done: true, model: usedModel };
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ غير معروف";
      if (msg.includes("abort")) {
        setCooldown("openrouter/free", 15, "timeout");
        lastError = "انتهت المهلة";
      } else {
        lastError = msg;
      }
      await sleep(1000 * Math.pow(2, attempt));
    }
  }

  yield { error: lastError || "فشل تحسين البرومبت بعد عدة محاولات. حاول لاحقاً." };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Parallel racing: send to 3 free models, first token wins.
 * Used only on repeated failures or high-accuracy requests.
 */
export async function* enhanceWithRacing(params: {
  prompt: string;
  category: string;
  tone: string;
  detail_level: string;
  language: string;
}): AsyncGenerator<StreamChunk> {
  // For MVP we fall back to single stream; racing can be enabled later
  yield* enhancePromptStream(params);
}
