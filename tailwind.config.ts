// tailwind.config.ts — رموز DESIGN.md فقط: لا ظلال، لا تدرجات
import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent", current: "currentColor",
      snow: "#ffffff", fog: "#fafafa", mist: "#eff0f6", silver: "#e5e7eb",
      charcoal: "#333333", graphite: "#545454", smoke: "#767676", ash: "#808080",
      brand: "rgb(var(--brand) / <alpha-value>)", emerald: "rgb(var(--brand) / <alpha-value>)", cobalt: "rgb(var(--brand) / <alpha-value>)",
    },
    fontSize: {
      caption: ["12px", "1.6"], sm: ["13.5px", "1.65"], base: ["15px", "1.7"], lg: ["16px", "1.6"],
      xl: ["17px", "1.5"], "2xl": ["19px", "1.5"], "3xl": ["26px", "1.4"], "4xl": ["32px", "1.3"], "5xl": ["40px", "1.15"],
    },
    borderRadius: { none: "0", link: "6px", xl: "12px", full: "9999px" },
    boxShadow: { none: "none", soft: "0 1px 2px rgb(0 0 0 / .04), 0 6px 20px rgb(0 0 0 / .06)", pop: "0 8px 24px rgb(var(--brand) / .35)" },
    extend: { fontFamily: { sans: ["var(--font-sans)", "Tajawal", "system-ui", "sans-serif"] } },
  },
  corePlugins: { backdropBlur: false, backdropFilter: false, backgroundImage: false },
} satisfies Config;
