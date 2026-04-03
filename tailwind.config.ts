import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary": "#00FFD1",
        "background": "#0B0C10",
        "surface": "#181A20",
        "surface-hover": "#242730",
        "text-main": "#E0E6ED",
        "muted": "#6B7280",
        "accent-error": "#FF007F",
        "accent-warning": "#FF8800",
        "accent-ai": "#B026FF",
      },
      fontFamily: {
        "display": ["Space Grotesk", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        "neon": "0 0 10px rgba(0, 255, 209, 0.3)",
        "neon-active": "0 0 15px rgba(0, 255, 209, 0.6)",
        "neon-ai": "0 0 10px rgba(176, 38, 255, 0.3)",
        "neon-warning": "0 0 10px rgba(255, 136, 0, 0.3)",
      },
      borderRadius: {
        "DEFAULT": "0px"
      }
    },
  },
  plugins: [],
};

export default config;
