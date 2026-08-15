import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Marketing brand (public site) — matches the existing landing page exactly
        primary: {
          DEFAULT: "#FF6B00",
          dark: "#E66000",
        },
        secondary: "#1A1A1A",
        grey: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          500: "#6B7280",
          800: "#1F2937",
        },
        // App brand (parent / teacher / student / admin dashboards) — same
        // black/orange identity as the public site, just given more shades
        // for UI surfaces (borders, muted text, dark sidebar).
        navy: {
          50: "#F9FAFB",
          100: "#E5E7EB",
          400: "#6B7280",
          600: "#4B5563",
          800: "#1F2937",
          900: "#1A1A1A",
          950: "#0A0A0A",
        },
        electric: {
          400: "#FF9142",
          500: "#FF6B00",
          600: "#E66000",
        },
        violet: {
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        cyan: {
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-unbounded)", "sans-serif"],
        app: ["var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        scroll: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        tagScroll: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        popIn: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        scroll: "scroll 20s linear infinite",
        float: "float 6s ease-in-out infinite",
        "count-up": "count-up 0.5s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "tag-scroll": "tagScroll 10s linear infinite",
        "pop-in": "popIn 0.25s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
