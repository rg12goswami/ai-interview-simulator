/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // warm, muted "editorial" theme
        ink: "#FDF8F0",        // page background + text on filled accent buttons
        surface: "#FFFFFF",    // card background
        surface2: "#FBF1E4",   // secondary/stat card background
        edge: "#E8DCC8",       // borders
        accent: {
          DEFAULT: "#D85A30",  // primary action color (coral/rust)
          dim: "#B84A26",      // hover state
        },
        amber: "#C97D1D",      // secondary accent (medium warning, secondary stat)
        danger: "#B23B3B",     // weak areas / low score / urgent timer
        gray: {
          50: "#2A1F14",
          100: "#3A2C1E",
          200: "#4E3C29",
          300: "#6B5744",
          400: "#8A7460",
          500: "#9C8873",
          600: "#C9BCA9",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', "sans-serif"],
        sans: ['"Inter"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};