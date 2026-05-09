import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        gct: {
          navy: "#0f1b2e",
          navy2: "#162340",
          ink: "#071225",
          gold: "#c9a84c",
          pale: "#eef2f8",
          line: "#d5dbe6"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        sheet: "0 24px 80px rgba(7, 18, 37, 0.35)",
        lift: "0 12px 34px rgba(7, 18, 37, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
