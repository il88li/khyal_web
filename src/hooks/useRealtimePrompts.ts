"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Prompt } from "@/types";

export function useRealtimePrompts(
  onInsert: (prompt: Prompt) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;

    const supabase = createClient();
    const channel = supabase
      .channel("prompts-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "prompts" },
        (payload) => {
          onInsert(payload.new as Prompt);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onInsert, enabled]);
}
