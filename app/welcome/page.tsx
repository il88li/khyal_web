"use client";
// app/welcome/page.tsx — واجهة ترحيبية: 3 شرائح (سحب/تلقائي) ثم ابدأ
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Heart, Smartphone } from "lucide-react";

const S = [
  { icon: Sparkles, t: "حسّن برومبتاتك بنقرة", d: "اكتب فكرتك الخام ودع خيال يحوّلها إلى برومبت احترافي بنماذج ذكاء اصطناعي مجانية." },
  { icon: Heart, t: "شارك إبداعك", d: "انشر برومبتاتك بصور متعددة، وتابع المبدعين، واحفظ ما يعجبك." },
  { icon: Smartphone, t: "تطبيق على هاتفك", d: "ثبّت خيال على شاشتك الرئيسية لتجربة أسرع وإشعارات فورية." },
];
export default function Welcome() {
  const [i, setI] = useState(0), n = S.length, Ic = S[i].icon;
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % n), 4500); return () => clearInterval(t); }, [n]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-between py-8">
      <div className="flex items-center justify-center gap-2 pt-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-snow shadow-pop"><Sparkles size={18} /></span><span className="text-xl font-bold">خيال</span>
      </div>
      <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.3} style={{ touchAction: "pan-y" }}
        onDragEnd={(_, d) => { if (d.offset.x < -50) setI((x) => (x + 1) % n); else if (d.offset.x > 50) setI((x) => (x + n - 1) % n); }}
        className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex flex-col items-center gap-5 px-2">
            <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }} className="flex h-28 w-28 items-center justify-center rounded-full bg-brand text-snow shadow-pop"><Ic size={52} /></motion.span>
            <h1 className="text-3xl font-bold">{S[i].t}</h1>
            <p className="max-w-[32ch] text-base text-graphite">{S[i].d}</p>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-1.5">{S.map((_, k) => <button key={k} onClick={() => setI(k)} aria-label={`شريحة ${k + 1}`} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-brand" : "w-1.5 bg-silver"}`} />)}</div>
      </motion.div>
      <div className="flex flex-col gap-3">
        <Link href="/auth?mode=up" className="flex min-h-12 items-center justify-center rounded-full bg-brand text-base font-medium text-snow shadow-pop">ابدأ الآن</Link>
        <Link href="/auth" className="flex min-h-12 items-center justify-center rounded-full border border-silver bg-snow text-base">لديّ حساب</Link>
      </div>
    </main>
  );
}
