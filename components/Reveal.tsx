"use client";
// components/Reveal.tsx — ظهور القسم عند دخوله الشاشة: تلاشٍ + صعود خفيف + تمويه يزول، مرة واحدة فقط (لا يُعاد عند الرجوع بالتمرير).
// التأخير delay لترتيب العناصر المتتابعة. يتحول إلى عنصر ثابت عند تخفيف الحركة (النظام أو خيار التطبيق).
import { motion } from "framer-motion";
import { useNoMotion } from "@/lib/motion";

export default function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const off = useNoMotion();
  if (off) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
