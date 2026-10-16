"use client";
// components/GatedPrompt.tsx — نص البرومبت في صفحة البرومبت:
// غلاف مقتطع سخيّ للعرض السريع، وزر مخصّص واحد يكشف النص الكامل للجميع (بلا اشتراك).
import { useState } from "react";
import { Lock } from "@/components/icons";
import { useAuth } from "./auth";
import { TryButton } from "./tryButton";
import { CopyButton } from "./ui";
import { previewOf } from "@/lib/access";

export function GatedPrompt({ text, ownerId }: { text: string; ownerId?: string }) {
  const { tier, me } = useAuth();
  const [open, setOpen] = useState(false);
  const mine = !!ownerId && me?.id === ownerId; // صاحب البرومبت يرى نصه كاملاً دائماً
  const gate = previewOf(text, tier, mine);
  const showFull = mine || open || !gate.locked;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={text} />
        {showFull && <TryButton text={text} />}
      </div>
      <p className="max-w-[65ch] whitespace-pre-wrap rounded-xl bg-mist p-4 text-base leading-relaxed">
        {showFull ? text : gate.shown}
        {!showFull && gate.locked && "…"}
      </p>
      {gate.locked && !showFull && (
        <button onClick={() => setOpen(true)} className="btn btn-soft self-start">
          <Lock size={16} /> عرض البرومبت كاملاً
        </button>
      )}
    </>
  );
}
