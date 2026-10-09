// tailwind.config.ts — رموز DESIGN.md فقط: لا ظلال، لا تدرجات
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
    fontSize: { // حد أدنى16px للنص الأساسي و13px للتسمية (وصولية)
      caption: ["13px", "1.55"], sm: ["14px", "1.65"], base: ["16px", "1.7"], lg: ["17px", "1.6"],
      xl: ["18px", "1.5"], "2xl": ["20px", "1.45"], "3xl": ["28px", "1.35"], "4xl": ["32px", "1.3"], "5xl": ["40px", "1.15"],
    },
    borderRadius: { none: "0", link: "6px", xl: "12px", full: "9999px" },
    boxShadow: { none: "none", soft: "0 1px 2px rgb(0 0 0 / .04), 0 6px 20px rgb(0 0 0 / .06)", pop: "0 8px 24px rgb(var(--brand) / .35)" },
    extend: { fontFamily: { sans: ["var(--font-sans)", "Tajawal", "system-ui", "sans-serif"] } },
  },
  corePlugins: { backdropBlur: false, backdropFilter: false, backgroundImage: false },
} satisfies Config;
