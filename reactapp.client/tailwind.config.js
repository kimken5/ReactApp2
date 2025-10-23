/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Gradients
    'bg-gradient-to-br',
    'bg-gradient-to-r',
    'from-blue-50',
    'via-indigo-50',
    'to-purple-50',
    'from-blue-600',
    'via-purple-600',
    'to-indigo-600',
    'from-slate-800',
    'to-slate-600',
    // Shadows and effects
    'backdrop-blur-sm',
    'backdrop-blur-md',
    'shadow-xl',
    'shadow-2xl',
    // Transforms
    'hover:scale-110',
    'hover:-translate-y-2',
    'group-hover:scale-110',
    'group-hover:-translate-y-2',
    'group-hover:translate-x-2',
    // Transitions
    'transition-all',
    'duration-200',
    'duration-300',
    // Layout
    'rounded-2xl',
    'rounded-3xl',
    // Borders
    'border-2',
    'border-slate-200',
    'hover:border-slate-300',
    // Colors with opacity
    'bg-white/80',
    'bg-white/95',
    'border-slate-100/50',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        accent: {
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}