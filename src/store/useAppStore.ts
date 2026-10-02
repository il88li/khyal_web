import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category } from "@/types";

interface AppState {
  lastFeedTab: string;
  lastCategory: Category;
  draftPrompt: string;
  reducedMotion: boolean;
  setFeedTab: (tab: string) => void;
  setCategory: (c: Category) => void;
  setDraft: (d: string) => void;
  setReducedMotion: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lastFeedTab: "for-you",
      lastCategory: "writing",
      draftPrompt: "",
      reducedMotion: false,
      setFeedTab: (tab) => set({ lastFeedTab: tab }),
      setCategory: (c) => set({ lastCategory: c }),
      setDraft: (d) => set({ draftPrompt: d }),
      setReducedMotion: (v) => set({ reducedMotion: v }),
    }),
    { name: "khiyal-app" }
  )
);
