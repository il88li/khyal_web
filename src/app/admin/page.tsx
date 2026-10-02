"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import {
  getAdminStats,
  getFeatureFlags,
  setFeatureFlag,
  getAuditLog,
} from "@/app/actions/admin";
import { getClientErrorLogs, clearClientErrorLogs } from "@/lib/error-log";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [step, setStep] = useState<"password" | "mfa" | "dashboard">("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ users: 0, prompts: 0, requestsToday: 0, errors: 0 });
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<Array<{ id: string; action: string; meta: unknown; created_at: string }>>([]);
  const [clientLogs, setClientLogs] = useState<ReturnType<typeof getClientErrorLogs>>([]);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handlePassword = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "كلمة المرور غير صحيحة");
      }
      setStep("mfa");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "فشل الدخول");
    } finally {
      setLoading(false);
    }
  };

  const handleMfa = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: mfaCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "رمز التحقق غير صحيح");
      }
      setStep("dashboard");
      loadDashboard();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "فشل التحقق");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = () => {
    startTransition(async () => {
      const [s, f, l] = await Promise.all([
        getAdminStats(),
        getFeatureFlags(),
        getAuditLog(30),
      ]);
      if (s && !("error" in s && s.error)) {
        setStats({
          users: (s as { users?: number }).users ?? 0,
          prompts: (s as { prompts?: number }).prompts ?? 0,
          requestsToday: (s as { requestsToday?: number }).requestsToday ?? 0,
          errors: (s as { errors?: number }).errors ?? 0,
        });
      }
      if (f.flags) setFlags(f.flags);
      if (l.logs) setLogs(l.logs as typeof logs);
      setClientLogs(getClientErrorLogs());
    });
  };

  const toggleFlag = (key: string) => {
    const next = !flags[key];
    setFlags((prev) => ({ ...prev, [key]: next }));
    startTransition(async () => {
      await setFeatureFlag(key, next);
    });
  };

  if (step === "password") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-5 max-w-sm mx-auto">
        <h1 className="text-22 font-semibold text-charcoal mb-6">لوحة الأدمن</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field mb-4"
          placeholder="كلمة المرور"
          dir="ltr"
          onKeyDown={(e) => e.key === "Enter" && handlePassword()}
        />
        {error && <p className="text-13 text-red-600 mb-3">{error}</p>}
        <Button onClick={handlePassword} loading={loading} className="w-full" size="lg">
          متابعة
        </Button>
        <button onClick={() => router.push("/")} className="mt-4 text-13 text-smoke">
          العودة
        </button>
      </div>
    );
  }

  if (step === "mfa") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-5 max-w-sm mx-auto">
        <h1 className="text-22 font-semibold text-charcoal mb-2">التحقق بخطوتين</h1>
        <p className="text-13 text-smoke mb-6 text-center">
          أدخل الرمز الزمني (30 ثانية) أو 000000 للتطوير
        </p>
        <input
          type="text"
          inputMode="numeric"
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="input-field mb-4 text-center tracking-[0.3em] text-19"
          placeholder="000000"
          dir="ltr"
          maxLength={6}
          onKeyDown={(e) => e.key === "Enter" && handleMfa()}
        />
        {error && <p className="text-13 text-red-600 mb-3">{error}</p>}
        <Button onClick={handleMfa} loading={loading} className="w-full" size="lg">
          دخول
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-page mx-auto px-5 py-6 space-y-6 pb-nav">
      <header className="flex items-center justify-between">
        <h1 className="text-22 font-semibold text-charcoal">لوحة الأدمن</h1>
        <span className="text-13 text-smoke">جلسة · MFA</span>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "المستخدمون", value: stats.users },
          { label: "البرومبتات", value: stats.prompts },
          { label: "طلبات اليوم", value: stats.requestsToday },
          { label: "أخطاء", value: stats.errors },
        ].map((m) => (
          <div key={m.label} className="card p-4 text-center">
            <p className="text-22 font-semibold text-charcoal">{m.value}</p>
            <p className="text-13 text-smoke">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="text-17 font-medium text-charcoal">Feature Flags</h2>
        {["enhancer_enabled", "realtime_feed", "image_upload", "comments"].map((key) => (
          <button
            key={key}
            onClick={() => toggleFlag(key)}
            disabled={pending}
            className="flex items-center justify-between w-full min-h-[44px] text-15 text-charcoal"
          >
            <span className="font-mono text-13">{key}</span>
            <span
              className={`w-10 h-6 rounded-pill border border-silver ${
                flags[key] ? "bg-charcoal" : "bg-fog"
              }`}
            >
              <span
                className={`block w-5 h-5 mt-0.5 rounded-full bg-snow border border-silver transition-transform ${
                  flags[key] ? "translate-x-[-18px]" : "translate-x-[-2px]"
                }`}
              />
            </span>
          </button>
        ))}
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="text-17 font-medium text-charcoal">التوجيه التلقائي</h2>
        <p className="text-13 text-smoke leading-relaxed">
          <code className="text-charcoal">openrouter/free</code> نشط · لا تُعرض أسماء النماذج للمستخدم
        </p>
      </div>

      <div className="card p-4 space-y-2">
        <h2 className="text-17 font-medium text-charcoal">Audit Log</h2>
        {logs.length === 0 ? (
          <p className="text-13 text-smoke">لا توجد سجلات بعد</p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {logs.map((l) => (
              <li key={l.id} className="text-13 text-graphite border-b border-silver pb-2">
                <span className="text-charcoal font-medium">{l.action}</span>
                <span className="text-ash mr-2">
                  {new Date(l.created_at).toLocaleString("ar-SA")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      
      <div className="card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-17 font-medium">أخطاء الواجهة (محلي)</h2>
          <button type="button" className="text-13 text-[#8a8a8a]" onClick={() => { clearClientErrorLogs(); setClientLogs([]); }}>مسح</button>
        </div>
        {clientLogs.length === 0 ? (
          <p className="text-13 text-[#8a8a8a]">لا أخطاء مسجّلة على هذا الجهاز</p>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {clientLogs.slice(0, 20).map((e) => (
              <li key={e.id} className="text-13 border-b border-[#ececec] pb-2">
                <span className="font-medium">{e.message}</span>
                <span className="text-[#8a8a8a] mr-2 block">{e.path} · {new Date(e.time).toLocaleString("ar-SA")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button variant="outline" className="w-full" onClick={() => setStep("password")}>
        تسجيل الخروج من الأدمن
      </Button>
    </div>
  );
}
