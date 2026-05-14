import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        canvas: "#FDF8EE",
        coral: "#E8583E",
        "accent-blue": "#3A7CEC",
        "cta-yellow": "#FFEC5C",
        forest: "#1C2B24",
      },
      fontFamily: {
        /** Cuerpo Bricolage (Regular 400); titulares vía `h1–h6` en `.luma-marketing-site` / `.luma-product-shell`. */
        bricolage: ['"bricolage-grotesque-extralig"', "sans-serif"],
        /** Misma familia que antes en titulares (`bricolage-grotesque-36`). */
        "bricolage-heading": ['"bricolage-grotesque-36"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
