import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        alkaram: {
          50: '#fdfbf6',
          100: '#fbf5e6',
          200: '#f6e7c1',
          300: '#eed291',
          400: '#f3c053',
          500: '#dfa228', // Core metallic gold from logo
          600: '#c5861b',
          700: '#9e6316',
          800: '#804e19',
          900: '#6b4019',
          950: '#3f2109',
        },
        alkaramDark: {
          800: '#2d2e33',
          900: '#1c1d21',
          950: '#121316',
        },
        amber: {
          50: '#fdfbf6',
          100: '#fbf5e6',
          200: '#f6e7c1',
          300: '#eed291',
          400: '#f3c053',
          500: '#dfa228',
          600: '#c5861b',
          700: '#9e6316',
          800: '#804e19',
          900: '#6b4019',
          950: '#3f2109',
        },
        amberGold: {
          500: '#dfa228',
          600: '#c5861b',
        }
      },
    },
  },
  plugins: [],
};
export default config;
