"use client";

import { ReactNode, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { NetworkGuard } from "@/components/shared/NetworkGuard";
import { logClientError } from "@/lib/error-log";

export function Providers({ children }: { children: ReactNode }) {
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);

    const onErr = (ev: ErrorEvent) => {
      logClientError(ev.message || "window.error", {
        stack: ev.error?.stack,
        source: "ui",
      });
    };
    const onRej = (ev: PromiseRejectionEvent) => {
      logClientError(String(ev.reason || "unhandledrejection"), { source: "ui" });
    };
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);

    return () => {
      mq.removeEventListener("change", handler);
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, [setReducedMotion]);

  return (
    <>
      <NetworkGuard />
      {children}
    </>
  );
}
