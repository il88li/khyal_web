"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Sparkles, User, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const left = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/enhance", label: "تحسين", icon: Sparkles },
];
const right = [
  { href: "/profile", label: "حسابي", icon: User },
  { href: "/settings", label: "إعدادات", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/offline" || pathname?.startsWith("/admin")) return null;

  const Item = ({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: typeof Home;
  }) => {
    const active =
      pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <Link href={href} className={cn("nav-item", active && "active")}>
        <Icon size={22} strokeWidth={active ? 2.25 : 1.6} absoluteStrokeWidth={false} />
        <span>{label}</span>
        {active && (
          <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-[#ff4d00]" />
        )}
      </Link>
    );
  };

  return (
    <nav className="bottom-nav" aria-label="التنقل">
      {left.map((i) => (
        <div key={i.href} className="relative flex-1 flex justify-center">
          <Item {...i} />
        </div>
      ))}

      <motion.button
        type="button"
        className="nav-center"
        aria-label="برومبت جديد"
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        onClick={() => router.push("/enhance")}
      >
        <Plus size={26} strokeWidth={2.5} />
      </motion.button>

      {right.map((i) => (
        <div key={i.href} className="relative flex-1 flex justify-center">
          <Item {...i} />
        </div>
      ))}
    </nav>
  );
}
