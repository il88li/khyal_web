"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function NetworkGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const goOffline = () => {
      if (pathname !== "/offline") router.push("/offline");
    };
    const goOnline = () => {
      if (pathname === "/offline") router.replace("/");
    };
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    if (!navigator.onLine && pathname !== "/offline") {
      router.push("/offline");
    }
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, [router, pathname]);

  return null;
}
