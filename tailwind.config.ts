import type { Config } from "tailwindcss";

// "Kutcheri" design tokens (§8 of the spec was lost in transmission; these are
// reconstructed from its forward references — see docs/BUILD_NOTES.md).
// Named for the Carnatic concert: silk, ink, and the five mentor colors —
// peacock (Priya), madder (Meera), marigold (Arjun), slate (Dev), plum (Anaya).
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces: Apple-style neutral system — near-white canvas, pure
        // white cards, hairline borders. The Kutcheri identity lives in the
        // five mentor accents + gold, not in tinted backgrounds.
        silk: {
          50: "#FFFFFF",
          100: "#F5F5F7",
          200: "#E8E8ED",
          300: "#D2D2D7",
        },
        ink: {
          DEFAULT: "#1D1D1F",
          soft: "#6E6E73",
          faint: "#86868B",
        },
        gold: {
          DEFAULT: "#BF8A00",
          soft: "#E3C566",
        },
        peacock: {
          50: "#EAF4F4",
          100: "#CFE6E6",
          200: "#9FCCCC",
          400: "#2E7F85",
          500: "#116466",
          600: "#0D5052",
          700: "#0A3D3F",
          900: "#062627",
          DEFAULT: "#116466",
        },
        madder: {
          50: "#FBEDEA",
          100: "#F5D3CC",
          200: "#E9A699",
          400: "#B84A33",
          500: "#A03123",
          600: "#84271C",
          700: "#671E16",
          900: "#40120D",
          DEFAULT: "#A03123",
        },
        marigold: {
          50: "#FEF6E7",
          100: "#FCE9C2",
          200: "#F8D385",
          400: "#E8A317",
          500: "#D98E04",
          600: "#B37303",
          700: "#8C5A02",
          900: "#573801",
          DEFAULT: "#D98E04",
        },
        slate: {
          50: "#EEF1F4",
          100: "#D8DEE5",
          200: "#B1BDCB",
          400: "#5B7086",
          500: "#465A6E",
          600: "#384858",
          700: "#2B3743",
          900: "#1A222A",
          DEFAULT: "#465A6E",
        },
        plum: {
          50: "#F5EDF4",
          100: "#E6D2E3",
          200: "#CCA5C7",
          400: "#8E4B85",
          500: "#722F68",
          600: "#5C2653",
          700: "#471D40",
          900: "#2C1228",
          DEFAULT: "#722F68",
        },
      },
      fontFamily: {
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "'Segoe UI'",
          "Roboto",
          "Helvetica",
          "sans-serif",
        ],
        body: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Text'",
          "'Segoe UI'",
          "Roboto",
          "Helvetica",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.05)",
        pop: "0 2px 8px rgba(0, 0, 0, 0.06), 0 16px 40px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
