"use client";

export type AppErrorLog = {
  id: string;
  message: string;
  stack?: string;
  path?: string;
  time: string;
  source: "ui" | "api" | "boundary";
};

const KEY = "khiyal_error_logs";
const MAX = 100;

export function logClientError(
  message: string,
  opts?: { stack?: string; source?: AppErrorLog["source"] }
) {
  if (typeof window === "undefined") return;
  try {
    const entry: AppErrorLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      message: String(message).slice(0, 500),
      stack: opts?.stack?.slice(0, 2000),
      path: window.location.pathname,
      time: new Date().toISOString(),
      source: opts?.source || "ui",
    };
    const prev: AppErrorLog[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    prev.unshift(entry);
    localStorage.setItem(KEY, JSON.stringify(prev.slice(0, MAX)));
    // إرسال اختياري لـ endpoint
    if (navigator.onLine) {
      fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
}

export function getClientErrorLogs(): AppErrorLog[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearClientErrorLogs() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
