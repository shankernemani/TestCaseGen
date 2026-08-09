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
        // Surfaces: warm silk/ivory, like a concert-hall sari border
        silk: {
          50: "#FDFBF5",
          100: "#F8F3E7",
          200: "#F1E7D0",
          300: "#E5D5B0",
        },
        ink: {
          DEFAULT: "#2B2118",
          soft: "#5C5044",
          faint: "#8C8072",
        },
        gold: {
          DEFAULT: "#C99700",
          soft: "#E7C55C",
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
        display: ["Georgia", "Cambria", "'Times New Roman'", "serif"],
        body: [
          "system-ui",
          "-apple-system",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "1rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(43, 33, 24, 0.08), 0 4px 16px rgba(43, 33, 24, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
