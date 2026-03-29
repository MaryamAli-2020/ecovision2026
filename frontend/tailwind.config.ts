import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(56,189,248,0.18), 0 18px 60px rgba(15,23,42,0.48)",
        ember: "0 0 0 1px rgba(251,146,60,0.2), 0 18px 60px rgba(15,23,42,0.55)"
      },
      backgroundImage: {
        "dashboard-radial":
          "radial-gradient(circle at top left, rgba(45,212,191,0.16), transparent 34%), radial-gradient(circle at 85% 12%, rgba(56,189,248,0.18), transparent 24%), radial-gradient(circle at 50% 100%, rgba(249,115,22,0.12), transparent 26%)"
      }
    }
  },
  plugins: []
} satisfies Config;
