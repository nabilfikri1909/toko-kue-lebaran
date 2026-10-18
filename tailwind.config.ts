import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FFFDF7",
        cocoa: "#2C1A12",
        honey: "#D48B38",
        palm: "#1E593E",
      },
      fontFamily: {
        playfair: ["var(--font-playfair)", "serif"],
        jakarta: ["var(--font-jakarta)", "sans-serif"],
      },
      borderRadius: {
        card: "8px",
        button: "6px",
        modal: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
