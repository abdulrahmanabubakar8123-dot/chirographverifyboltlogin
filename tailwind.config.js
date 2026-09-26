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
        // ── Surfaces (light developer-console scale) ──────────────
        canvas: '#FFFFFF',
        surface: '#FFFFFF',
        'surface-2': '#F7F8FA',
        'surface-3': '#EFF1F4',
        // Hairline borders: the primary structural device in this system.
        line: '#E4E6EB',
        'line-strong': '#D2D6DD',
        // ── Brand (restrained indigo) ────────────────────────────
        brand: {
          50: '#EEF1FB',
          100: '#DFE4F7',
          200: '#C3CBEF',
          300: '#A3ADE8',
          400: '#737FD9',
          500: '#4F58C9',
          600: '#4149AE',
          700: '#333A8C',
          800: '#272D6E',
          900: '#1E2340',
        },
        // ── Accent: status/trust only, never a second CTA colour ─
        accent: {
          50: '#EAF7F1',
          100: '#D3EFE2',
          200: '#A7DFC8',
          300: '#6FC9A8',
          400: '#3FAE87',
          500: '#0E8A5F',
          600: '#0B7450',
          700: '#095E42',
        },
        // ── Text: four steps, no pure black ─────────────────────
        text: {
          primary: '#0F1115',
          secondary: '#4A5159',
          muted: '#6E7681',
          micro: '#8B939E',
        },
        // ── Status (muted, AA on white) ─────────────────────────
        success: '#0E8A5F',
        warning: '#B45309',
        danger: '#C4362F',
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
        // Near-zero radius: a console, not a card deck. 2px controls, 3px
        // panels. `xl2` is retained as an alias for existing call sites.
        none: '0px',
        xs: '2px',
        control: '2px',
        xl2: '3px',
        panel: '3px',
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
