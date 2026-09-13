/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'IBM Plex Sans Arabic'", "'Inter'", "system-ui", "sans-serif"],
      },
      colors: {
        nebula: {
          bg: "#0a0618",
          deep: "#0e0a24",
          purple: "#7c3aed",
          violet: "#a78bfa",
          pink: "#ec4899",
          cyan: "#22d3ee",
          blue: "#3b82f6",
        },
      },
      backgroundImage: {
        "nebula-radial":
          "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(124,58,237,0.35), transparent 60%), radial-gradient(ellipse 70% 60% at 90% 20%, rgba(34,211,238,0.25), transparent 55%), radial-gradient(ellipse 70% 70% at 50% 100%, rgba(236,72,153,0.25), transparent 55%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(124,58,237,0.35)",
        "glow-cyan": "0 0 40px rgba(34,211,238,0.3)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin-slow 40s linear infinite",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};
