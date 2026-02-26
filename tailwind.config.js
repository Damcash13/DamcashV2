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
        // Checkers Theme - Warm & Wood Tones
        checkers: {
          bg: '#2d1b0f',
          surface: '#3d2b1f',
          card: '#4a3728',
          element: '#e8dcc6',
          accent: '#c9b037',
          gold: '#d4af37',
          light: '#f5e6c8',
          dark: '#1a0f08',
        },
        // Chess Theme - Cool & Modern
        chess: {
          bg: '#0c1e3f',
          surface: '#142850',
          card: '#1e3a5f',
          element: '#ecf0ff',
          accent: '#3d7ddb',
          blue: '#4a90e2',
          light: '#f0f4ff',
          dark: '#061224',
        },
        // Shared
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'body': ['Lora', 'serif'],
        'modern': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'piece-move': 'pieceMove 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor' },
          '100%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
        pieceMove: {
          '0%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 10px 0 rgb(0 0 0 / 0.3)',
        'board': '0 10px 40px rgb(0 0 0 / 0.4)',
        'piece': '0 4px 8px rgb(0 0 0 / 0.3)',
        'card': '0 4px 20px rgb(0 0 0 / 0.15)',
        'glow-gold': '0 0 20px rgba(201, 176, 55, 0.4)',
        'glow-blue': '0 0 20px rgba(61, 125, 219, 0.4)',
      },
    },
  },
  plugins: [],
}
