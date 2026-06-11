/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        panel: "#111111",
        line: "#262626",
        muted: "#A1A1A1",
        danger: "#E50914",
        dangerHot: "#FF1E1E",
        dangerDark: "#8B0000"
      },
      fontFamily: {
        sans: ["Satoshi", "Aptos", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      }
    }
  },
  plugins: []
};
