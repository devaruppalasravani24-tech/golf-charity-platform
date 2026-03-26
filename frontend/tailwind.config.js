/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        fairway: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        turf: {
          900: '#0a1a0f',
          950: '#060d08',
        },
        gold: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease forwards',
        'fade-in':   'fadeIn 0.4s ease forwards',
        'pulse-slow':'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float':     'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      backgroundImage: {
        'fairway-grad': 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #0a1a0f 100%)',
        'card-grad':    'linear-gradient(145deg, rgba(22,163,74,0.08) 0%, rgba(5,46,22,0.4) 100%)',
        'gold-grad':    'linear-gradient(135deg, #f59e0b, #fcd34d)',
      },
    },
  },
  plugins: [],
}