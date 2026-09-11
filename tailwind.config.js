/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        canvas: '#0B0E11',
        surface: '#151A20',
        'surface-2': '#1B212B',
        'surface-3': '#222A35',
        line: 'rgba(255,255,255,0.08)',
        'line-strong': 'rgba(255,255,255,0.12)',
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6D5EF3',
          600: '#6366f1',
          700: '#4f46e5',
          800: '#3B82F6',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          400: '#2DD4BF',
          500: '#14b8a6',
          600: '#0d9488',
        },
        text: {
          primary: '#E6EAF0',
          secondary: '#9AA4B2',
          muted: '#6B7280',
          micro: '#8A94A6',
        },
        success: '#34D399',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,0.35)',
        glow: '0 0 24px rgba(109,94,243,0.35)',
      },
      borderRadius: {
        xl2: '14px',
      },
      letterSpacing: {
        micro: '.08em',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg,#6D5EF3,#3B82F6 45%,#2DD4BF)',
        'card-grid': 'radial-gradient(circle at 20% 20%,rgba(109,94,243,0.10),transparent 40%), radial-gradient(circle at 80% 80%,rgba(45,212,191,0.10),transparent 40%)',
        'hero-gradient': 'linear-gradient(135deg,#6D5EF3 0%,#3B82F6 45%,#2DD4BF 100%)',
      },
    },
  },
  plugins: [],
};
