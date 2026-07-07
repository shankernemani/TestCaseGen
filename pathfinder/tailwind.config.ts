import type { Config } from "tailwindcss";

// §8 "Kutcheri" design system — palette from her world, not a template.
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jasmine: "#FBF9F3", // background
        ink: "#232B36", // text
        peacock: {
          DEFAULT: "#0E6E6B", // primary
          dark: "#0A5451",
          light: "#E0EEED",
        },
        marigold: {
          DEFAULT: "#E8A020", // accent / active
          light: "#FCF0DA",
        },
        madder: {
          DEFAULT: "#B3402E", // music, sparing
          light: "#F6E4E0",
        },
        plum: {
          DEFAULT: "#6B4A7C",
          light: "#EEE7F2",
        },
        slate: {
          DEFAULT: "#3E5C76",
          light: "#E6EBF0",
        },
        mist: "#E9E3D6", // borders
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      keyframes: {
        "swara-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(232, 160, 32, 0.45)" },
          "50%": { boxShadow: "0 0 0 10px rgba(232, 160, 32, 0)" },
        },
      },
      animation: {
        "swara-pulse": "swara-pulse 2.2s ease-in-out 3",
      },
    },
  },
  plugins: [],
};
export default config;
