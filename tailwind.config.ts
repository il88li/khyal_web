// tailwind.config.ts — رموز DESIGN.md: واجهة مضغوطة، حواف مشدّدة، لا تدرجات
import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    colors: { // كل لون عبر متغيّر ليدعم الوضع الليلي (html.dark في globals.css)
      transparent: "transparent", current: "currentColor",
      snow: "rgb(var(--c-snow) / <alpha-value>)", fog: "rgb(var(--c-fog) / <alpha-value>)", mist: "rgb(var(--c-mist) / <alpha-value>)", silver: "rgb(var(--c-line) / <alpha-value>)",
      charcoal: "rgb(var(--c-ink) / <alpha-value>)", graphite: "rgb(var(--c-ink-2) / <alpha-value>)", smoke: "rgb(var(--c-ink-3) / <alpha-value>)", ash: "rgb(var(--c-ash) / <alpha-value>)",
      brand: "rgb(var(--brand) / <alpha-value>)", emerald: "rgb(var(--brand) / <alpha-value>)", cobalt: "rgb(var(--brand) / <alpha-value>)",
    },
    fontSize: { // أحجام صغيرة متراصة (النص الأساسي 13.5px، التسمية 11px)
      caption: ["11px", "1.5"], sm: ["12px", "1.6"], base: ["13.5px", "1.65"], lg: ["15px", "1.55"],
      xl: ["16px", "1.45"], "2xl": ["18px", "1.4"], "3xl": ["24px", "1.3"], "4xl": ["28px", "1.25"], "5xl": ["34px", "1.15"],
    },
    borderRadius: { none: "0", link: "4px", xl: "9px", full: "9999px" },
    boxShadow: { none: "none", soft: "0 1px 2px rgb(0 0 0 / .04), 0 4px 14px rgb(0 0 0 / .05)", pop: "0 6px 18px rgb(var(--brand) / .35)" },
    extend: {
      fontFamily: { sans: ["var(--font-sans)", "Tajawal", "system-ui", "sans-serif"] },
      transitionTimingFunction: { out: "cubic-bezier(.2,.8,.3,1)" },
    },
  },
  corePlugins: { backdropBlur: false, backdropFilter: false, backgroundImage: false },
} satisfies Config;
