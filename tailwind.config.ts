// tailwind.config.ts — نظام خيال المسطح · اللون الأساسي أحمر الفرشاة (انظر design.md)
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      black: "rgb(0 0 0 / <alpha-value>)",
      white: "rgb(255 255 255 / <alpha-value>)",
      "on-brand": "rgb(var(--on-brand) / <alpha-value>)",
      secondary: "rgb(var(--secondary) / <alpha-value>)",
      "secondary-tint": "rgb(var(--secondary-tint) / <alpha-value>)",
      current: "currentColor",
      snow: "rgb(var(--c-snow) / <alpha-value>)",
      fog: "rgb(var(--c-fog) / <alpha-value>)",
      mist: "rgb(var(--c-mist) / <alpha-value>)",
      silver: "rgb(var(--c-line) / <alpha-value>)",
      charcoal: "rgb(var(--c-ink) / <alpha-value>)",
      graphite: "rgb(var(--c-ink-2) / <alpha-value>)",
      smoke: "rgb(var(--c-ink-3) / <alpha-value>)",
      ash: "rgb(var(--c-ash) / <alpha-value>)",
      brand: "rgb(var(--brand) / <alpha-value>)",
      "brand-ink": "rgb(var(--brand-ink) / <alpha-value>)",
      "brand-tint": "rgb(var(--brand-tint) / <alpha-value>)",
      ok: "rgb(var(--ok) / <alpha-value>)",
      "ok-ink": "rgb(var(--ok-ink) / <alpha-value>)",
      "ok-tint": "rgb(var(--ok-tint) / <alpha-value>)",
      gold: "rgb(var(--gold) / <alpha-value>)",
      "gold-ink": "rgb(var(--gold-ink) / <alpha-value>)",
      "gold-tint": "rgb(var(--gold-tint) / <alpha-value>)",
      info: "rgb(var(--info) / <alpha-value>)",
      "info-ink": "rgb(var(--info-ink) / <alpha-value>)",
      "info-tint": "rgb(var(--info-tint) / <alpha-value>)",
      danger: "rgb(var(--danger) / <alpha-value>)",
      "danger-tint": "rgb(var(--danger-tint) / <alpha-value>)",
    },

    // ── سلم الخطوط المعتمد: sm 12 · base 14 · lg 16 · xl 20 · 2xl 24 (لا 3xl+، السقف 32px) ──
    fontSize: {
      micro: ["11px", { lineHeight: "1.43" }],
      caption: ["12px", { lineHeight: "1.45" }],
      sm: ["12px", { lineHeight: "1.5" }],
      base: ["14px", { lineHeight: "1.5" }],
      lg: ["16px", { lineHeight: "1.4" }],
      xl: ["20px", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
      "2xl": ["24px", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
    },

    // ── زوايا: زر 24 / حقل 16 / بطاقة 20 / ورقة 28 ──
    borderRadius: {
      none: "0",
      xs: "6px",
      sm: "8px",
      DEFAULT: "var(--r)",    // 12px
      md: "12px",
      lg: "16px",
      link: "16px",
      xl: "20px",
      "2xl": "20px",
      "3xl": "28px",
      full: "9999px",
    },

    boxShadow: {
      none: "none",
      soft: "var(--sh-1)",
      card: "var(--sh-1)",
      lift: "var(--sh-2)",
      pop: "var(--sh-pop)",
    },

    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "IBM Plex Sans Arabic", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: { out: "cubic-bezier(.2,.8,.3,1)" },
    },
  },
} satisfies Config;
