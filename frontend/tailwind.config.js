/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00f0ff',
          pink: '#ff00ff',
          green: '#00ff00',
          red: '#ff0040',
        },
        cyber: {
          dark: '#0a0a0f',
          darker: '#05050a',
          light: '#1a1a2e',
        }
      },
      boxShadow: {
        'neon-blue': '0 0 20px rgba(0, 240, 255, 0.5)',
        'neon-pink': '0 0 20px rgba(255, 0, 255, 0.5)',
        'neon-green': '0 0 20px rgba(0, 255, 0, 0.5)',
        'neon-red': '0 0 20px rgba(255, 0, 64, 0.5)',
      },
      animation: {
        'glow-pulse': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        }
      }
    },
  },
  plugins: [],
}
