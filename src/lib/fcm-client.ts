"use client";

import { registerFcmToken } from "@/app/actions/fcm";

/**
 * Request notification permission and register FCM token.
 * Call after user is authenticated, not on first visit.
 */
export async function setupNotifications(): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === "undefined") return { ok: false, error: "server" };
  if (!("Notification" in window)) return { ok: false, error: "غير مدعوم" };

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    return { ok: false, error: "تم رفض الإذن" };
  }

  // In production: get token from Firebase Messaging SDK
  // const token = await getToken(messaging, { vapidKey: "..." });
  // For now store a placeholder if running inside WebView that injects token
  const injected = (window as unknown as { __FCM_TOKEN__?: string }).__FCM_TOKEN__;
  if (injected) {
    const res = await registerFcmToken(injected, "android");
    if (res.error) return { ok: false, error: res.error };
    return { ok: true };
  }

  return { ok: true }; // permission granted, token pending WebView injection
}
