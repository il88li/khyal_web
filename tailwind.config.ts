import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ember: "#ff4d00",
        "ember-glow": "#fcddcc",
        "ember-wash": "#febec2",
        gridline: "#e5e7eb",
        ink: "#262626",
        vellum: "#f9f9f9",
        slate: "#727272",
        graphite: "#616161",
        ash: "#949494",
        stone: "#c7c7c7",
        mist: "#b5b5b5",
        pebble: "#838383",
        canvas: "#ffffff",
        // legacy aliases used in components
        snow: "#ffffff",
        fog: "#f9f9f9",
        charcoal: "#262626",
        silver: "#e5e7eb",
        smoke: "#727272",
        emerald: "#24b26d",
        cobalt: "#2c70dd",
      },
      fontFamily: {
        arabic: [
          "IBM Plex Sans Arabic",
          "Tajawal",
          "Cairo",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "Geist Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        "13": ["13px", { lineHeight: "1.75" }],
        "14": ["14px", { lineHeight: "1.5" }],
        "15": ["15px", { lineHeight: "1.75" }],
        "16": ["16px", { lineHeight: "1.5" }],
        "17": ["17px", { lineHeight: "1.5" }],
        "19": ["19px", { lineHeight: "1.5" }],
        "20": ["20px", { lineHeight: "1.33" }],
        "22": ["22px", { lineHeight: "1.4" }],
        "24": ["24px", { lineHeight: "1.2" }],
        "36": ["36px", { lineHeight: "1.15" }],
        "40": ["40px", { lineHeight: "1.1" }],
        "44": ["44px", { lineHeight: "1.15" }],
        "52": ["52px", { lineHeight: "1.07" }],
        "56": ["56px", { lineHeight: "1.07" }],
      },
      borderRadius: {
        pill: "9999px",
        card: "16px",
        input: "8px",
        link: "6px",
      },
      boxShadow: {
        subtle: "rgb(249, 249, 249) 0px 0px 0px 6px",
        "ember-glow": "0 0 0 6px #fcddcc",
        soft: "rgba(0, 0, 0, 0.02) 0px 16px 24px -12px, rgba(0, 0, 0, 0.03) 0px 0px 0px 1px",
      },
      maxWidth: {
        content: "65ch",
        page: "1200px",
      },
      minHeight: {
        touch: "44px",
        input: "48px",
        button: "48px",
      },
      screens: {
        xs: "360px",
        sm: "480px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
