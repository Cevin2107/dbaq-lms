import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0f172a",
          light: "#1e293b"
        },
        accent: "#22c55e"
      },
      boxShadow: {
        'glass': '0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.10)',
        'glass-hover': '0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.10), 0 24px 60px rgba(0,0,0,0.08)',
      },
      transitionTimingFunction: {
        'liquid': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'spring': 'cubic-bezier(0.25, 0.8, 0.25, 1)',
      }
    }
  },
  plugins: []
};

export default config;
