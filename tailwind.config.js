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
        // ── X Minimal Light ─────────────────────────────────────
        primary: '#0F141A',      // near-black ink
        accent: '#1D9BF0',       // platform blue — focus/links ONLY
        secondary: '#5B6572',    // muted slate
        tertiary: '#D1D5DB',     // light gray outline
        muted: '#8892A0',
        border: '#E5E7EB',
        neutral: '#FFFFFF',
        surface: '#FFFFFF',
        canvas: '#FFFFFF',
        'surface-2': '#F7F9FA',
        'surface-3': '#F0F3F4',
        line: '#E5E7EB',
        'line-strong': '#D1D5DB',
        error: '#D93025',
        // Brand scale maps onto the ink ramp for focus/hover states.
        brand: {
          50: '#E8F5FD',
          100: '#C8E6FB',
          200: '#9BD4F7',
          300: '#6BBEF2',
          400: '#3FAAEE',
          500: '#1D9BF0',
          600: '#1687D6',
          700: '#1273B5',
          800: '#0F5F94',
          900: '#0C4A73',
        },
        success: '#00BA7C',
        warning: '#F4A261',
        danger: '#D93025',
        'text-primary': '#0F141A',
        'text-secondary': '#5B6572',
        'text-muted': '#8892A0',
        'text-micro': '#8892A0',
      },
      fontFamily: {
        // TwitterChirp is proprietary; Inter is the closest freely
        // available substitute with near-identical metrics.
        sans: ['Inter', 'Chirp', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Spec: display / headline / body / label scales, 500-600 weight.
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-lg': ['64px', { lineHeight: '77px', letterSpacing: '-1px' }],
        'headline-lg': ['24px', { lineHeight: '29px', letterSpacing: '0px' }],
        'headline-md': ['20px', { lineHeight: '24px', letterSpacing: '0px' }],
        'headline-sm': ['18px', { lineHeight: '22px', letterSpacing: '0px' }],
        'body-lg': ['16px', { lineHeight: '24px', letterSpacing: '0px' }],
        'body-md': ['15px', { lineHeight: '23px', letterSpacing: '0px' }],
        'body-sm': ['14px', { lineHeight: '20px', letterSpacing: '0px' }],
        'label-lg': ['15px', { lineHeight: '23px', letterSpacing: '0px' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0px' }],
        display: ['2.5rem', { lineHeight: '1.08', letterSpacing: '-0.022em' }],
        hero: ['3.25rem', { lineHeight: '1.04', letterSpacing: '-0.022em' }],
      },
      boxShadow: {
        // Spec: mostly flat. Depth from contrast and thin borders only.
        control: 'none',
        card: 'none',
        glow: 'none',
      },
      borderRadius: {
        // Spec: none 0 / sm 4 / md 8 / lg 12 / xl 24 / full 9999
        none: '0px',
        sm: '4px',
        control: '4px',
        md: '8px',
        xl2: '8px',
        panel: '8px',
        lg: '12px',
        xl: '24px',
        full: '9999px',
      },
      spacing: {
        // Spec: xs 4 / sm 12 / md 24 / lg 32 / xl 40 / gutter 24 / section 80
        xs: '4px',
        sm: '12px',
        md: '24px',
        lg: '32px',
        xl: '40px',
        gutter: '24px',
        section: '80px',
      },
      letterSpacing: {
        micro: '0px',
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
