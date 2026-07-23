/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "navy" se mantiene como nombre de clase (para no tener que tocar
        // decenas de archivos), pero ahora es un ciruela/negro profundo
        // acorde a una marca de belleza en vez del azul de supermercado.
        navy: {
          DEFAULT: '#241220',
          light: '#341A2E',
        },
        brand: {
          50: '#FDF2F6',
          100: '#FCE4ED',
          200: '#F9C4D9',
          400: '#E8639F',
          500: '#D6417F',
          600: '#B22F67',
          700: '#8C2451',
        },
        fresh: {
          500: '#C9A227',
          600: '#A8871F',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(36, 18, 32, 0.08)',
        cardHover: '0 8px 24px rgba(36, 18, 32, 0.16)',
      },
    },
  },
  plugins: [],
}
