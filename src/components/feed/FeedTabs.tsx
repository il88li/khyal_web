"use client";

import { cn } from "@/lib/utils";

const tabs = [
  { id: "for-you", label: "لك" },
  { id: "following", label: "المتابَعون" },
  { id: "trending", label: "الرائج" },
  { id: "categories", label: "الفئات" },
];

interface Props {
  active: string;
  onChange: (id: string) => void;
}

export function FeedTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar px-5 py-3 sticky top-14 z-10 bg-[#f6f6f7]/90 backdrop-blur-md border-b border-[#ebebeb]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "pill whitespace-nowrap min-h-[36px] text-[13px] font-medium",
            active === tab.id
              ? "bg-[#111] text-white shadow-sm"
              : "bg-white text-[#8b8b8b] border border-[#ebebeb]"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
