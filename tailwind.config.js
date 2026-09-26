/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // X uses Inter for sans and Geist Mono for code.
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        // ── Surfaces — pure black canvas, per the X Developer Platform ──
        canvas: '#000000',
        surface: '#0E0E0E',
        'surface-2': '#141414',
        'surface-3': '#1C1C1C',
        // Hairline borders: 0 0% 14.9%
        line: '#262626',
        'line-strong': '#404040',
        // ── Brand ──────────────────────────────────────────────
        // X uses no brand hue: its accent is simply near-white.
        brand: {
          50: '#F7F7F7',
          100: '#E9E6E6',
          200: '#D4D4D4',
          300: '#B0B0B0',
          400: '#A3A3A3',
          500: '#8C8C8C',
          600: '#737980',
          700: '#525252',
          800: '#404040',
          900: '#262626',
        },
        // ── Accent: trust/verification status only ──────────────
        accent: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        // ── Text: white primary, grey body, dimmest micro ──────
        text: {
          primary: '#FFFFFF',
          secondary: '#B0B0B0',
          muted: '#A3A3A3',
          micro: '#737980',
        },
        // ── Status ─────────────────────────────────────────────
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        display: ['2.5rem', { lineHeight: '1.08', letterSpacing: '-0.022em' }],
        hero: ['3.25rem', { lineHeight: '1.04', letterSpacing: '-0.022em' }],
      },
      boxShadow: {
        // Flat, console-like elevation. No large diffuse dark shadows.
        control: '0 1px 2px rgba(15,17,21,0.06)',
        card: '0 1px 3px rgba(15,17,21,0.07), 0 1px 2px rgba(15,17,21,0.04)',
        glow: '0 0 0 3px rgba(79,88,201,0.18)',
      },
      borderRadius: {
        // X uses --radius: 0.5rem (8px), with 4px and 12px variants.
        none: '0px',
        xs: '4px',
        control: '4px',
        xl2: '8px',
        panel: '8px',
        lg: '12px',
      },
      letterSpacing: {
        micro: '.1em',
        wide: '.06em',
      },
      boxShadow: {
        // Elevation is expressed through hairlines, not shadows.
        none: 'none',
        control: 'none',
        card: 'none',
      },
      backgroundImage: {
        'brand-gradient': 'none',
        'card-grid': 'none',
        'hero-gradient': 'none',
      },
    },
  },
  plugins: [],
};
