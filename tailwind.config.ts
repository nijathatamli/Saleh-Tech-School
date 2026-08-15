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
        // App brand (parent / teacher / student / admin dashboards)
        navy: {
          50: "#EEF2FA",
          100: "#DCE4F4",
          400: "#3D537C",
          600: "#1E2E4F",
          800: "#101A30",
          900: "#0A1224",
          950: "#060B16",
        },
        electric: {
          400: "#5B8CFF",
          500: "#3366FF",
          600: "#254DDB",
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
        app: ["var(--font-manrope)", "sans-serif"],
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
      },
      animation: {
        scroll: "scroll 20s linear infinite",
        float: "float 6s ease-in-out infinite",
        "count-up": "count-up 0.5s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
