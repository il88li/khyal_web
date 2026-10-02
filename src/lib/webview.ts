"use client";

export function isAndroidWebView(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /wv|WebView/i.test(ua) || !!(window as unknown as { Android?: unknown }).Android;
}

export function onFcmReady(callback: (token: string) => void) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __FCM_TOKEN__?: string };
  if (w.__FCM_TOKEN__) {
    callback(w.__FCM_TOKEN__);
    return;
  }
  window.addEventListener("fcmready", () => {
    if (w.__FCM_TOKEN__) callback(w.__FCM_TOKEN__);
  });
}
