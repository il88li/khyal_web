"use client";

export type OpsEvent = {
  id: string;
  op: string;
  status: "ok" | "error" | "info";
  detail?: string;
  time: string;
};

const KEY = "khiyal_ops_log";
const MAX = 150;

export function opsLog(op: string, status: OpsEvent["status"], detail?: string) {
  if (typeof window === "undefined") return;
  try {
    const entry: OpsEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      op,
      status,
      detail: detail?.slice(0, 400),
      time: new Date().toISOString(),
    };
    const prev: OpsEvent[] = JSON.parse(localStorage.getItem(KEY) || "[]");
    prev.unshift(entry);
    localStorage.setItem(KEY, JSON.stringify(prev.slice(0, MAX)));
    fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `[${status}] ${op}`,
        stack: detail,
        source: "api",
        time: entry.time,
      }),
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export function getOpsLog(): OpsEvent[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
