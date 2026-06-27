/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#080706",
        darkSurface: "rgba(20, 16, 14, 0.5)",
        accentPurple: "#ff6b00",
        accentBlue: "#ffaa00",
        success: "#10b981",
        warning: "#ff7a00",
        danger: "#ef4444",
        textPrimary: "#f8fafc",
        textMuted: "#94a3b8",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
