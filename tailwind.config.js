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
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb', // Primary light
          600: '#1d4ed8', // Primary hover light
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3a8a',
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          dark: '#3b82f6', // Primary dark
          'dark-hover': '#2563eb', // Primary hover dark
        },
        secondary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Secondary light
          600: '#059669', // Secondary hover light
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          DEFAULT: '#10b981',
          hover: '#059669',
          dark: '#34d399', // Secondary dark
          'dark-hover': '#10b981', // Secondary hover dark
        },
        surface: {
          light: '#ffffff',
          'light-secondary': '#f8fafc',
          'light-tertiary': '#f1f5f9',
          'light-border': '#e2e8f0',
          dark: '#0f172a',
          'dark-secondary': '#1e293b',
          'dark-tertiary': '#334155',
          'dark-border': '#475569',
        },
        text: {
          'light-primary': '#0f172a',
          'light-secondary': '#334155',
          'light-muted': '#64748b',
          'dark-primary': '#f8fafc',
          'dark-secondary': '#e2e8f0',
          'dark-muted': '#94a3b8',
        },
        accent: {
          error: '#f43f5e',
          'error-dark': '#f87171',
          warning: '#f59e0b',
          'warning-dark': '#fbbf24',
          success: '#10b981',
          'success-dark': '#4ade80',
        }
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'lift': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
