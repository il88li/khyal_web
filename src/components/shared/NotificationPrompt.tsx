"use client";

import { useEffect, useState } from "react";
import { setupNotifications } from "@/lib/fcm-client";
import { onFcmReady, isAndroidWebView } from "@/lib/webview";
import { registerFcmToken } from "@/app/actions/fcm";
import { Button } from "@/components/ui/Button";

export function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const visited = localStorage.getItem("khiyal_visits");
    const count = parseInt(visited || "0", 10) + 1;
    localStorage.setItem("khiyal_visits", String(count));
    if (count >= 3 && typeof Notification !== "undefined" && Notification.permission === "default") {
      setShow(true);
    }

    if (isAndroidWebView()) {
      onFcmReady(async (token) => {
        await registerFcmToken(token, "android");
        setDone(true);
      });
    }
  }, []);

  if (!show || done) return null;

  return (
    <div className="fixed bottom-[calc(90px+var(--safe-bottom))] left-4 right-4 z-40 card p-4 flex items-center gap-3">
      <p className="text-13 text-graphite flex-1 leading-relaxed">
        فعّل الإشعارات لتصلك تنبيهات الإعجابات والتعليقات
      </p>
      <Button
        size="sm"
        onClick={async () => {
          const res = await setupNotifications();
          if (res.ok) setDone(true);
          setShow(false);
        }}
      >
        تفعيل
      </Button>
      <button className="text-13 text-ash min-h-touch px-2" onClick={() => setShow(false)}>
        لاحقاً
      </button>
    </div>
  );
}
