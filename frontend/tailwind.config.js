/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ethereal color palette
        ethereal: {
          cyan: '#4FFFEF',
          purple: '#B794F6',
          rose: '#FFB7C5',
          gold: '#FFD700',
          navy: '#0F1419',
          'navy-light': '#1A1F2E',
          'navy-lighter': '#252B3B',
        },
        primary: '#4FFFEF',
        secondary: '#B794F6',
        accent: '#FFB7C5',
      },
      backgroundImage: {
        'gradient-ethereal': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-game': 'radial-gradient(ellipse at top, #1e3a5f 0%, #0F1419 50%, #000000 100%)',
        'glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(79, 255, 239, 0.3), 0 0 40px rgba(79, 255, 239, 0.1)',
        'glow-purple': '0 0 20px rgba(183, 148, 246, 0.3), 0 0 40px rgba(183, 148, 246, 0.1)',
        'glow-rose': '0 0 20px rgba(255, 183, 197, 0.3), 0 0 40px rgba(255, 183, 197, 0.1)',
        'inner-glow': 'inset 0 0 20px rgba(79, 255, 239, 0.1)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
        },
      },
    },
  },
  plugins: [],
}
