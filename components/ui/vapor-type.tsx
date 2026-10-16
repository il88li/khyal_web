"use client";
// components/ui/vapor-type.tsx — تأثير vapor-type (مكافئ reactbits-starter/vapor-type-tw):
// كل كلمة تتكثّف من ضباب (تمويه + شفافية + إزاحة) إلى حروف صافية بالتدريج،
// ثم تتبخّر العبارة للأعلى لتفسح للعبارة التالية.
// الحركة على مستوى الكلمة لا الحرف، حتى لا ينقطع اتصال الحروف العربية.
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const LINE = { hidden: {}, show: { transition: { staggerChildren: 0.055 } } };
const WORD = {
  hidden: { opacity: 0, y: 14, filter: "blur(14px)", scale: 0.96 },
  show: {
    opacity: 1, y: 0, filter: "blur(0px)", scale: 1,
    transition: { duration: 0.62, ease: [0.2, 0, 0, 1] as const },
  },
};

export function VaporType({
  words,
  hold = 2600,
  className = "",
}: {
  words: string[];
  hold?: number;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || words.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), hold + 1600);
    return () => clearInterval(t);
  }, [words.length, hold, reduce]);

  const phrase = words[i] ?? "";

  if (reduce)
    return (
      <span className={`vapor-type ${className}`} aria-label={phrase}>
        <span className="vapor-type-line">{phrase}</span>
      </span>
    );

  return (
    <span className={`vapor-type ${className}`} aria-label={phrase} aria-live="off">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={i}
          className="vapor-type-line"
          variants={LINE}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: -16, filter: "blur(16px)", transition: { duration: 0.5, ease: [0.2, 0, 0, 1] } }}
        >
          {phrase.split(" ").map((w, k) => (
            <motion.span key={`${k}-${w}`} variants={WORD} className="vapor-type-word">
              {w}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default VaporType;
