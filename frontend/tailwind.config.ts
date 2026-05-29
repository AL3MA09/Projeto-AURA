import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        aura: {
          50:  "#f0f4ff",
          100: "#e0eaff",
          200: "#c7d7fd",
          300: "#a5bafb",
          400: "#8195f8",
          500: "#6171f3",
          600: "#4a52e8",
          700: "#3c42d0",
          800: "#3237a8",
          900: "#2d3285",
          950: "#1c1f52",
        },
        aurora: {
          purple: "#7c3aed",
          blue:   "#2563eb",
          cyan:   "#06b6d4",
          glow:   "#818cf8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      animation: {
        "pulse-slow":    "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "wave":          "wave 1.5s ease-in-out infinite",
        "wave-delay-1":  "wave 1.5s ease-in-out 0.1s infinite",
        "wave-delay-2":  "wave 1.5s ease-in-out 0.2s infinite",
        "wave-delay-3":  "wave 1.5s ease-in-out 0.3s infinite",
        "wave-delay-4":  "wave 1.5s ease-in-out 0.4s infinite",
        "glow":          "glow 2s ease-in-out infinite alternate",
        "float":         "float 3s ease-in-out infinite",
        "typing":        "typing 1s steps(3) infinite",
        "gradient-x":    "gradient-x 4s ease infinite",
        "slide-up":      "slideUp 0.3s ease-out",
        "fade-in":       "fadeIn 0.4s ease-out",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%":       { transform: "scaleY(1.0)" },
        },
        glow: {
          "0%":   { boxShadow: "0 0 20px #6171f340" },
          "100%": { boxShadow: "0 0 40px #6171f380, 0 0 80px #6171f330" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%":      { backgroundPosition: "100% 50%" },
        },
        slideUp: {
          from: { transform: "translateY(20px)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
