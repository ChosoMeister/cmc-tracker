/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./locales/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand-primary)',
          hover: 'var(--brand-primary-hover)',
          soft: 'var(--brand-soft)',
        },
        surface: {
          canvas: 'var(--app-bg)',
          card: 'var(--card-bg)',
          muted: 'var(--muted-surface)',
          pill: 'var(--pill-bg)',
        }
      },
      borderRadius: {
        tokenSm: '8px',
        tokenMd: '12px',
        tokenLg: '20px',
      }
    },
  },
  plugins: [],
};
