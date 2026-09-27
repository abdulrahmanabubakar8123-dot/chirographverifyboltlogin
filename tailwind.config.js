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
        // ── Chirograph Verify console — X Developer Platform system ──
        // True-black canvas; depth from hairlines and near-black surface
        // steps. `primary` is the text/ink token, so it resolves to white.
        primary: '#FFFFFF',      // headings & strong text
        neutral: '#FFFFFF',
        secondary: '#A3A3A3',    // secondary body text
        tertiary: '#262626',     // legacy alias for a hairline border
        muted: '#8C8C8C',        // muted body text
        canvas: '#000000',       // page background
        surface: '#0A0A0A',      // raised surface
        'surface-2': '#161616',   // X panel fill (cards, tables, menus)
        'surface-3': '#1F1F1F',   // hovered / inset rows
        line: '#1F1F1F',         // hairline border
        'line-strong': '#2E2E2E',
        // Accent = white, matching the reference's white focus ring.
        accent: '#FFFFFF',
        // The numeric accent steps exist for success/positive states
        // (verified calls, active webhooks, sent notices) and resolve to
        // the single green chromatic accent used across the console.
        'accent-50': '#04140E',
        'accent-100': '#06251A',
        'accent-200': '#0B3D2A',
        'accent-300': '#10B981',
        'accent-400': '#34D399',
        'accent-500': '#10B981',
        'accent-600': '#059669',
        'accent-700': '#047857',
        // Green is the single chromatic accent, reserved for positive
        // figures and success states.
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        error: '#EF4444',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A3A3A3',
        'text-muted': '#8C8C8C',
        'text-micro': '#737980',
        // Legacy brand ramp retained for components that still reference it;
        // it now resolves to greys so nothing renders in the old blue.
        brand: {
          50: '#141414',
          100: '#1F1F1F',
          200: '#2E2E2E',
          300: '#B8B8B8',
          400: '#D4D4D4',
          500: '#E0E0E0',
          600: '#FFFFFF',
          700: '#A3A3A3',
          800: '#8C8C8C',
          900: '#737980',
        },
      },
      fontFamily: {
        // X uses Inter for sans and Geist Mono for code.
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Spec: display / headline / body / label scales, 500-600 weight.
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-lg': ['64px', { lineHeight: '1.06', letterSpacing: '-0.022em' }],
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
        // X console: 16px panels/cards, 8px inputs, full pills.
        none: '0px',
        sm: '4px',
        md: '8px',
        xl2: '8px',
        panel: '16px',
        lg: '12px',
        xl: '16px',
        '2xl': '16px',
        '3xl': '24px',
        control: '9999px',
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
        // Elevation is expressed through hairlines, not shadows. The only
        // glow is the soft white halo on the primary action.
        none: 'none',
        control: 'none',
        card: 'none',
        glow: '0 0 34px 2px rgb(255 255 255 / 0.20)',
        'glow-sm': '0 0 18px 0 rgb(255 255 255 / 0.12)',
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
