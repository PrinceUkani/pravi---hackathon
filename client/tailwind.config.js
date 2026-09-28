/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Emerald Ink primary palette
        emeraldInk: {
          50: '#f0fdf7',
          100: '#dbfceb',
          200: '#bbf7d6',
          300: '#83eeb5',
          400: '#46dc8e',
          500: '#1ec36d',
          600: '#11a055',
          700: '#0f7d44',
          800: '#106338',
          900: '#0d4f2e',
          950: '#042716', // Deep emerald ink
          darkest: '#02180e',
        },
        // Champagne secondary accent palette
        champagne: {
          50: '#fdfbf5',
          100: '#faf5e6',
          200: '#f4e8c6',
          300: '#edd59d',
          400: '#e3be6f',
          500: '#d4a347', // Classic champagne gold
          600: '#bc8636',
          700: '#9b662d',
          800: '#7e5129',
          900: '#674225',
          950: '#3c2311',
        },
        // Enterprise surface tokens
        surface: {
          light: '#f8faf9',
          card: '#ffffff',
          dark: '#081711',
          darkCard: '#0d221a',
          darkHover: '#132e24',
          darkBorder: '#183b2e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(4, 39, 22, 0.05), 0 1px 2px rgba(4, 39, 22, 0.03)',
        'premium': '0 4px 20px -2px rgba(4, 39, 22, 0.08), 0 2px 6px -1px rgba(4, 39, 22, 0.04)',
        'champagne-glow': '0 0 15px rgba(212, 163, 71, 0.25)',
        'emerald-glow': '0 0 20px rgba(16, 160, 85, 0.2)',
      }
    },
  },
  plugins: [],
}
