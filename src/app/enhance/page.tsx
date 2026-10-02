"use client";

import { EnhancerForm } from "@/components/enhancer/EnhancerForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function EnhancePage() {
  return (
    <div className="max-w-[640px] mx-auto">
      <header className="page-header pt-safe">
        <div className="flex items-center gap-2">
          <Link href="/" className="min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2">
            <ChevronLeft size={22} className="rotate-180 text-[#111]" />
          </Link>
          <div>
            <h1 className="text-[18px] font-semibold text-[#111] leading-tight">تحسين البرومبت</h1>
            <p className="text-[12px] text-[#8b8b8b]">أعد صياغة طلبك باحتراف</p>
          </div>
        </div>
      </header>
      <div className="px-5 py-5">
        <EnhancerForm />
      </div>
    </div>
  );
}
