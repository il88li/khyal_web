"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OfflinePage() {
  const router = useRouter();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => {
      setOnline(true);
      router.replace("/");
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, [router]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-[#f4f4f5]">
      <div className="card p-8 max-w-sm w-full space-y-5 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
        <div className="mx-auto w-16 h-16 rounded-full bg-[#f0f0f2] flex items-center justify-center">
          <WifiOff size={28} className="text-[#8a8a8a]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-22 font-semibold text-[#1a1a1a]">لا يوجد اتصال</h1>
          <p className="text-15 text-[#8a8a8a] leading-relaxed">
            تحقق من الشبكة ثم أعد المحاولة. يمكنك تصفح الصفحات المخزّنة إن وُجدت.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary w-full inline-flex items-center justify-center gap-2"
          onClick={() => {
            if (navigator.onLine) router.replace("/");
            else window.location.reload();
          }}
        >
          <RefreshCw size={18} />
          إعادة المحاولة
        </button>
        {!online && (
          <p className="text-13 text-[#b0b0b0]">ما زلت دون اتصال</p>
        )}
      </div>
    </div>
  );
}
