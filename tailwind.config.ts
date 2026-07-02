import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#030504",
        surface: "#090C0A",
        raised: "#101512",
        acid: "#A8FF2A",
        aqua: "#35D9F5",
        paper: "#F5F7F5",
        muted: "#8A938D",
        danger: "#FF6262",
        warning: "#FFCA58"
      },
      fontFamily: {
        sans: ["var(--font-geist)", "Inter", "sans-serif"],
        display: ["var(--font-space)", "var(--font-geist)", "sans-serif"],
        serif: ["var(--font-instrument)", "Georgia", "serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
