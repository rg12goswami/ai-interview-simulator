/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0E1116",
        surface: "#161A21",
        surface2: "#1D222B",
        edge: "#262B35",
        mint: {
          DEFAULT: "#3DDC97",
          dim: "#2BB57D",
        },
        amber: "#F5A524",
        coral: "#F0546B",
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