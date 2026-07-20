import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          light: "#2FA0E4",
          DEFAULT: "#2FA0E4",
          dark: "#114EA9",
          navy: "#0B2C5E",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(17 78 169 / 0.08), 0 1px 2px -1px rgb(17 78 169 / 0.06)",
        cardhover: "0 6px 18px -4px rgb(17 78 169 / 0.14)",
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};

export default config;
