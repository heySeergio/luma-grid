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
        bricolage: ['"bricolage-grotesque-36"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
