"use client";

import { useEffect } from "react";

/**
 * منع النسخ المباشر والنقر بالزر الأيمن وسحب الصور
 * (حماية واجهة — ليست حماية مطلقة ضد المطورين)
 */
export function AntiCopy() {
  useEffect(() => {
    const onContext = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, .allow-select")) return;
      e.preventDefault();
    };
    const onCopy = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, .allow-select")) return;
      e.preventDefault();
    };
    const onDrag = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === "IMG") e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["c", "C", "u", "U", "s", "S"].includes(e.key)) {
        const t = e.target as HTMLElement;
        if (t.closest("input, textarea, .allow-select")) return;
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", onContext);
    document.addEventListener("copy", onCopy);
    document.addEventListener("dragstart", onDrag);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("dragstart", onDrag);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
